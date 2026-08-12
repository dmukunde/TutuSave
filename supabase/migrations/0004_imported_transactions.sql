-- Staging table for transactions extracted by external automations (starting
-- with the Gmail bank-alert n8n workflow) before a human confirms them.
-- Deliberately separate from `transactions`: every existing query that sums
-- transactions (budgets, reports, dashboard) stays untouched — nothing here
-- counts as real financial data until it's approved and copied over.

create table imported_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),

  -- extracted transaction data
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null,
  kind text not null check (kind in ('income', 'expense')),
  description text not null,        -- raw merchant string, e.g. "CAPITAL SHOPPERS NTIND"
  occurred_at date not null,
  card_last4 text,

  -- provenance / dedup
  source text not null default 'gmail_import',
  source_message_id text not null,        -- Gmail message ID
  transaction_reference text,             -- bank-provided ref, when a bank gives one
  dedup_signature text not null,          -- normalized composite: card+amount+merchant+date
  possible_duplicate_of uuid references imported_transactions(id),

  raw_snippet text not null,              -- the exact matched line, for audit/debugging

  -- review outcome
  reviewed_transaction_id uuid references transactions(id),
  reviewed_at timestamptz,

  created_at timestamptz not null default now(),

  -- Belt-and-suspenders under the n8n-side within-email dedup logic: if the
  -- same email's repeated line ever slipped through as two insert attempts,
  -- the database itself refuses the second one rather than silently
  -- accepting a duplicate draft.
  unique (source_message_id, dedup_signature)
);

create index imported_transactions_user_status_idx on imported_transactions(user_id, status);

alter table imported_transactions enable row level security;

-- No INSERT policy for the `authenticated` role at all — on purpose. Only
-- n8n's service-role key (which bypasses RLS entirely) writes to this
-- table. A normal logged-in session can read and review its own drafts,
-- but can never fabricate one directly, even if the frontend had a bug.
create policy "imported_transactions_select_own" on imported_transactions
  for select using (auth.uid() = user_id);

create policy "imported_transactions_update_own" on imported_transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
