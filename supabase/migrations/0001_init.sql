-- TutuSave initial schema
-- Single-implicit-account MVP: transactions are not yet tied to an accounts table.

create extension if not exists "pgcrypto";

-- Generic helper: keep `updated_at` current on any row update.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  currency text not null default 'USD',
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  color text,
  kind text not null check (kind in ('income', 'expense')),
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index categories_user_id_idx on categories(user_id);

alter table categories enable row level security;

create policy "categories_all_own" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  kind text not null check (kind in ('income', 'expense')),
  description text,
  occurred_at date not null default current_date,
  receipt_url text,
  is_recurring boolean not null default false,
  recurrence_rule jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_user_occurred_idx on transactions(user_id, occurred_at desc);
create index transactions_category_idx on transactions(category_id);

alter table transactions enable row level security;

create policy "transactions_all_own" on transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger transactions_set_updated_at
  before update on transactions
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- budgets
-- ---------------------------------------------------------------------------
create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade, -- null = overall budget
  amount numeric(12, 2) not null check (amount > 0),
  period_type text not null check (period_type in ('monthly', 'yearly', 'custom')),
  start_date date not null,
  end_date date, -- null for recurring monthly/yearly budgets
  rollover boolean not null default false,
  alert_threshold_pct int not null default 80 check (alert_threshold_pct between 1 and 100),
  created_at timestamptz not null default now()
);

create index budgets_user_id_idx on budgets(user_id);
create index budgets_category_id_idx on budgets(category_id);

alter table budgets enable row level security;

create policy "budgets_all_own" on budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- savings_goals
-- ---------------------------------------------------------------------------
create table savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(12, 2) not null check (target_amount > 0),
  target_date date,
  icon text,
  color text,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz not null default now()
);

create index savings_goals_user_id_idx on savings_goals(user_id);

alter table savings_goals enable row level security;

create policy "savings_goals_all_own" on savings_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- goal_contributions
-- ---------------------------------------------------------------------------
create table goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references savings_goals(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  contributed_at date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create index goal_contributions_goal_id_idx on goal_contributions(goal_id);
create index goal_contributions_user_id_idx on goal_contributions(user_id);

alter table goal_contributions enable row level security;

create policy "goal_contributions_all_own" on goal_contributions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx on notifications(user_id, is_read);

alter table notifications enable row level security;

create policy "notifications_all_own" on notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- events — the outbox n8n consumes for automations
-- ---------------------------------------------------------------------------
create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

create index events_undelivered_idx on events(created_at) where delivered_at is null;
create index events_user_id_idx on events(user_id);

alter table events enable row level security;

create policy "events_all_own" on events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
