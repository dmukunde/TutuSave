-- Multi-user bank-email import, phase 1: separates "how to recognize and
-- parse one bank's alert email" from the n8n workflow itself, and gives
-- every user their own private import channel instead of one hardcoded
-- Gmail account + hardcoded user_id.

-- Global, read-only catalog of supported banks. Content-based (checked
-- against the email itself, not who owns the inbox), so it isn't per-user.
-- Seeded/maintained via migrations for now — no self-service bank
-- creation yet.
create table bank_rules (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null,
  -- Substring checked against BOTH the email body and the outer `from`
  -- header (OR'd together). When a user *forwards* an email in Gmail, the
  -- outer `from` on the new message is the forwarding user, not the bank
  -- — the bank's real sender only appears inside the forwarded body's
  -- quoted "Forwarded message" block. Checking both also future-proofs
  -- this for a later direct-Gmail-OAuth path where `from` really would
  -- be the bank.
  sender_pattern text not null,
  subject_pattern text,               -- optional extra substring check
  -- JS-flavored regex source (no delimiters/flags), with named capture
  -- groups: amount, card_last4 (optional), merchant, date, and optionally
  -- currency. One generic n8n Code node extracts from any bank's row —
  -- no bank-specific code needed as long as every rule uses these exact
  -- group names.
  body_regex text not null,
  default_currency text,              -- used when body_regex has no `currency` group
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table bank_rules enable row level security;

create policy "bank_rules_select_all" on bank_rules
  for select using (auth.uid() is not null);

-- Seed: the current Standard Chartered Uganda rule, migrated from the
-- hardcoded n8n Code-node regex into this generic, named-group form.
insert into bank_rules (bank_name, sender_pattern, body_regex, default_currency)
values (
  'Standard Chartered Uganda',
  'alerts.uganda@sc.com',
  'UGX\s(?<amount>[\d,]+\.\d{2})\stransaction was made on card ending (?<card_last4>\d{4}) at (?<merchant>.+?) on (?<date>\d{4}-\d{2}-\d{2})',
  'UGX'
);

-- One row per user: how TutuSave receives that user's bank alerts.
create table email_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  method text not null default 'forward_alias' check (method in ('forward_alias', 'gmail_oauth')),
  -- server-generated, never client-supplied — same pattern as
  -- shared_goal_members.invite_token. This is the only thing that ties an
  -- inbound email to a user; it is never a raw user_id.
  forward_token uuid not null unique default gen_random_uuid(),
  gmail_email text,                   -- populated by a future OAuth path
  status text not null default 'connected' check (status in ('connected', 'disconnected', 'error')),
  created_at timestamptz not null default now()
);

alter table email_connections enable row level security;

-- Unlike imported_transactions (service-role-only writes) this table is
-- written by the app itself, from the owning user's own authenticated
-- session, so it needs real insert/update policies.
create policy "email_connections_select_own" on email_connections
  for select using (auth.uid() = user_id);
create policy "email_connections_insert_own" on email_connections
  for insert with check (auth.uid() = user_id);
create policy "email_connections_update_own" on email_connections
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
