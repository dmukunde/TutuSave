-- Shared Goals: two or more people saving toward one target while keeping
-- their personal finances private. No table here references transactions,
-- budgets, savings_goals, or profiles beyond a read-only join for display —
-- that's deliberate. There is no query path through this feature that can
-- reach anyone's personal financial data.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table shared_goals (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(12,2) not null check (target_amount > 0),
  currency text not null,          -- the goal's own currency; contributions are entered
                                    -- directly in it, no conversion in MVP (see notify below)
  target_date date,
  split_type text not null check (split_type in ('equal', 'percentage', 'fixed')),
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  -- Which of 25/50/75/100 have already fired, so milestone detection is a
  -- simple "not already in this array" check instead of recomputing a
  -- before/after comparison on every contribution.
  milestones_reached integer[] not null default '{}',
  created_at timestamptz not null default now()
);

-- The owner is a member too (role='owner'), so member-listing queries don't
-- need a UNION between "the owner" and "everyone else".
create table shared_goal_members (
  id uuid primary key default gen_random_uuid(),
  shared_goal_id uuid not null references shared_goals(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,   -- null until invite accepted
  invited_email text,
  role text not null default 'member' check (role in ('owner', 'member')),
  status text not null default 'invited'
    check (status in ('invited', 'active', 'declined', 'removed')),
  split_value numeric(12,2),   -- % (0-100) if split_type='percentage', amount if 'fixed', null if 'equal'
  invite_token uuid not null default gen_random_uuid(),
  invited_at timestamptz not null default now(),
  expires_at timestamptz default (now() + interval '14 days'),
  joined_at timestamptz,
  unique (shared_goal_id, user_id),
  unique (shared_goal_id, invited_email),
  unique (invite_token)
);

create index shared_goal_members_goal_idx on shared_goal_members(shared_goal_id);
create index shared_goal_members_user_idx on shared_goal_members(user_id);

create table shared_goal_contributions (
  id uuid primary key default gen_random_uuid(),
  shared_goal_id uuid not null references shared_goals(id) on delete cascade,
  contributed_by uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  contributed_at date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create index shared_goal_contributions_goal_idx on shared_goal_contributions(shared_goal_id);
create index shared_goal_contributions_user_idx on shared_goal_contributions(contributed_by);

-- The in-app timeline. Distinct from the global `events` outbox (which is
-- per-user and n8n-facing) — this is one shared feed per goal, queried by
-- shared_goal_id for a UI timeline, not per-user automation.
create table shared_goal_activity (
  id uuid primary key default gen_random_uuid(),
  shared_goal_id uuid not null references shared_goals(id) on delete cascade,
  actor_id uuid references auth.users(id),   -- null for system-generated milestone entries
  activity_type text not null,   -- 'contribution_added' | 'milestone_reached' | 'goal_completed' | 'member_joined'
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index shared_goal_activity_goal_idx on shared_goal_activity(shared_goal_id, created_at desc);

-- ---------------------------------------------------------------------------
-- is_shared_goal_member — the function every RLS policy below builds on.
--
-- A plain policy on shared_goal_members that queries shared_goal_members to
-- check membership recurses infinitely. security definer breaks the cycle:
-- this function runs with elevated privilege *only inside itself*, so a
-- policy can call it without re-triggering RLS on the table it reads.
-- ---------------------------------------------------------------------------
create or replace function is_shared_goal_member(p_goal_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from shared_goal_members
    where shared_goal_id = p_goal_id
      and user_id = p_user_id
      and status = 'active'
  );
$$;

grant execute on function is_shared_goal_member(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table shared_goals enable row level security;

-- created_by = auth.uid() is not redundant with is_shared_goal_member: the
-- creator's own shared_goal_members row is inserted in a *separate*
-- statement right after this one. Supabase's .insert().select() compiles to
-- INSERT ... RETURNING, and Postgres re-checks the SELECT policy against
-- the just-inserted row for RETURNING to work — without this clause, the
-- creator can't see the row they just created until their membership row
-- exists, which creates a chicken-and-egg failure on every creation.
create policy "shared_goals_select" on shared_goals
  for select using (created_by = auth.uid() or is_shared_goal_member(id, auth.uid()));
create policy "shared_goals_insert" on shared_goals
  for insert with check (created_by = auth.uid());
create policy "shared_goals_update_owner" on shared_goals
  for update using (created_by = auth.uid());
create policy "shared_goals_delete_owner" on shared_goals
  for delete using (created_by = auth.uid());

alter table shared_goal_members enable row level security;

-- Any active member (not just the owner) can see the full member list —
-- that's the point of a shared goal: everyone sees who's in it and what
-- they've pledged, just not each other's unrelated personal finances.
create policy "shared_goal_members_select" on shared_goal_members
  for select using (is_shared_goal_member(shared_goal_id, auth.uid()));
create policy "shared_goal_members_insert_owner" on shared_goal_members
  for insert with check (
    exists (select 1 from shared_goals g where g.id = shared_goal_id and g.created_by = auth.uid())
  );
-- Covers both directions: the owner editing/removing any member, and a
-- member updating only their own row (e.g. leaving). Accepting an invite is
-- NOT covered here — see accept_shared_goal_invite below, since that has to
-- update a row where user_id is still null, which no USING clause can match.
create policy "shared_goal_members_update" on shared_goal_members
  for update using (
    user_id = auth.uid()
    or exists (select 1 from shared_goals g where g.id = shared_goal_id and g.created_by = auth.uid())
  );

alter table shared_goal_contributions enable row level security;

create policy "shared_goal_contributions_select" on shared_goal_contributions
  for select using (is_shared_goal_member(shared_goal_id, auth.uid()));
create policy "shared_goal_contributions_insert" on shared_goal_contributions
  for insert with check (
    is_shared_goal_member(shared_goal_id, auth.uid()) and contributed_by = auth.uid()
  );

alter table shared_goal_activity enable row level security;

create policy "shared_goal_activity_select" on shared_goal_activity
  for select using (is_shared_goal_member(shared_goal_id, auth.uid()));
create policy "shared_goal_activity_insert" on shared_goal_activity
  for insert with check (is_shared_goal_member(shared_goal_id, auth.uid()));

-- ---------------------------------------------------------------------------
-- get_shared_goal_invite — lets someone preview an invite (goal name, who
-- invited them) before they've accepted or even signed up. Granted to anon
-- too: a not-yet-registered invitee should see what they're being invited to
-- before being pushed through signup. Deliberately returns only the goal
-- name and inviter's name — never member lists, contributions, or amounts.
-- ---------------------------------------------------------------------------
create or replace function get_shared_goal_invite(p_token uuid)
returns table (
  shared_goal_id uuid,
  goal_name text,
  invited_by_name text,
  invited_email text,
  member_status text,
  expires_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    m.shared_goal_id,
    g.name,
    coalesce(p.full_name, 'A TutuSave user'),
    m.invited_email,
    m.status,
    m.expires_at
  from shared_goal_members m
  join shared_goals g on g.id = m.shared_goal_id
  left join profiles p on p.id = g.created_by
  where m.invite_token = p_token;
$$;

grant execute on function get_shared_goal_invite(uuid) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- accept_shared_goal_invite — links the calling (already authenticated)
-- user to a pending invite. The token itself is the authorization; for
-- email invites we additionally confirm the logged-in email matches.
-- ---------------------------------------------------------------------------
create or replace function accept_shared_goal_invite(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member shared_goal_members%rowtype;
  v_email text;
begin
  select * into v_member from shared_goal_members where invite_token = p_token;

  if not found then
    raise exception 'Invite not found';
  end if;

  if v_member.status <> 'invited' then
    raise exception 'This invite is no longer valid';
  end if;

  if v_member.expires_at is not null and v_member.expires_at < now() then
    raise exception 'This invite has expired';
  end if;

  select email into v_email from auth.users where id = auth.uid();

  if v_member.invited_email is not null and lower(v_member.invited_email) <> lower(v_email) then
    raise exception 'This invite was sent to a different email address';
  end if;

  if exists (
    select 1 from shared_goal_members
    where shared_goal_id = v_member.shared_goal_id and user_id = auth.uid()
  ) then
    raise exception 'You are already a member of this goal';
  end if;

  update shared_goal_members
  set user_id = auth.uid(), status = 'active', joined_at = now()
  where id = v_member.id;

  return v_member.shared_goal_id;
end;
$$;

grant execute on function accept_shared_goal_invite(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- advance_shared_goal_status — lets any active member (not just the owner)
-- update the goal's derived milestones/status fields after a contribution
-- pushes progress forward. The owner-only UPDATE policy on shared_goals
-- stays strict for the goal's real settings (name, target, currency) —
-- this function is a narrow, explicit exception for exactly these two
-- system-derived columns.
-- ---------------------------------------------------------------------------
create or replace function advance_shared_goal_status(
  p_goal_id uuid,
  p_milestones integer[],
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_shared_goal_member(p_goal_id, auth.uid()) then
    raise exception 'Not a member of this goal';
  end if;

  update shared_goals
  set milestones_reached = p_milestones,
      status = coalesce(p_status, status)
  where id = p_goal_id;
end;
$$;

grant execute on function advance_shared_goal_status(uuid, integer[], text) to authenticated;

-- ---------------------------------------------------------------------------
-- notify_shared_goal_members — writes one shared_goal_activity row (the
-- in-app feed) and fans out one events row per active member (for n8n).
-- The events table is user_id = auth.uid() scoped by design (Phase 0's
-- personal-automation model) — a single contributor's session can't insert
-- events on other members' behalf through the normal client, so this one
-- write needs the same security-definer escape hatch as the two above.
-- ---------------------------------------------------------------------------
create or replace function notify_shared_goal_members(
  p_goal_id uuid,
  p_event_type text,
  p_activity_type text,
  p_actor_id uuid,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member record;
begin
  if not is_shared_goal_member(p_goal_id, auth.uid()) then
    raise exception 'Not a member of this goal';
  end if;

  insert into shared_goal_activity (shared_goal_id, actor_id, activity_type, payload)
  values (p_goal_id, p_actor_id, p_activity_type, p_payload);

  for v_member in
    select user_id from shared_goal_members
    where shared_goal_id = p_goal_id and status = 'active' and user_id is not null
  loop
    insert into events (user_id, event_type, payload)
    values (v_member.user_id, p_event_type, p_payload || jsonb_build_object('shared_goal_id', p_goal_id));
  end loop;
end;
$$;

grant execute on function notify_shared_goal_members(uuid, text, text, uuid, jsonb) to authenticated;
