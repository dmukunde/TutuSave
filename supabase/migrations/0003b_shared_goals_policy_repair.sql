-- Idempotent re-assertion of every Shared Goals RLS policy. Safe to run
-- regardless of what already exists — each policy is dropped first if
-- present, then recreated. Diagnostic: shared_goals INSERT was being denied
-- even for a row whose created_by exactly matched auth.uid(), which only
-- happens when no matching INSERT policy actually exists on the table.

drop policy if exists "shared_goals_select" on shared_goals;
drop policy if exists "shared_goals_insert" on shared_goals;
drop policy if exists "shared_goals_update_owner" on shared_goals;
drop policy if exists "shared_goals_delete_owner" on shared_goals;

create policy "shared_goals_select" on shared_goals
  for select using (is_shared_goal_member(id, auth.uid()));
create policy "shared_goals_insert" on shared_goals
  for insert with check (created_by = auth.uid());
create policy "shared_goals_update_owner" on shared_goals
  for update using (created_by = auth.uid());
create policy "shared_goals_delete_owner" on shared_goals
  for delete using (created_by = auth.uid());

drop policy if exists "shared_goal_members_select" on shared_goal_members;
drop policy if exists "shared_goal_members_insert_owner" on shared_goal_members;
drop policy if exists "shared_goal_members_update" on shared_goal_members;

create policy "shared_goal_members_select" on shared_goal_members
  for select using (is_shared_goal_member(shared_goal_id, auth.uid()));
create policy "shared_goal_members_insert_owner" on shared_goal_members
  for insert with check (
    exists (select 1 from shared_goals g where g.id = shared_goal_id and g.created_by = auth.uid())
  );
create policy "shared_goal_members_update" on shared_goal_members
  for update using (
    user_id = auth.uid()
    or exists (select 1 from shared_goals g where g.id = shared_goal_id and g.created_by = auth.uid())
  );

drop policy if exists "shared_goal_contributions_select" on shared_goal_contributions;
drop policy if exists "shared_goal_contributions_insert" on shared_goal_contributions;

create policy "shared_goal_contributions_select" on shared_goal_contributions
  for select using (is_shared_goal_member(shared_goal_id, auth.uid()));
create policy "shared_goal_contributions_insert" on shared_goal_contributions
  for insert with check (
    is_shared_goal_member(shared_goal_id, auth.uid()) and contributed_by = auth.uid()
  );

drop policy if exists "shared_goal_activity_select" on shared_goal_activity;
drop policy if exists "shared_goal_activity_insert" on shared_goal_activity;

create policy "shared_goal_activity_select" on shared_goal_activity
  for select using (is_shared_goal_member(shared_goal_id, auth.uid()));
create policy "shared_goal_activity_insert" on shared_goal_activity
  for insert with check (is_shared_goal_member(shared_goal_id, auth.uid()));

-- Verify RLS is actually enabled on all four (enabling it twice is a no-op,
-- so this is safe even if it was already on).
alter table shared_goals enable row level security;
alter table shared_goal_members enable row level security;
alter table shared_goal_contributions enable row level security;
alter table shared_goal_activity enable row level security;
