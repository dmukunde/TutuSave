-- Live remediation: shared_goals_select originally only allowed
-- is_shared_goal_member(id, auth.uid()), which fails for a goal's creator
-- at the moment of creation — their shared_goal_members row is inserted in
-- the *next* statement, and Supabase's .insert().select() compiles to
-- INSERT ... RETURNING, which makes Postgres re-check the SELECT policy
-- against the new row. Diagnosed via: a plain INSERT with no RETURNING
-- succeeded when simulating the exact same auth context that a real
-- INSERT ... RETURNING (the API path) rejected — isolating the failure to
-- the RETURNING-triggered SELECT check specifically. 0003_shared_goals.sql
-- has been corrected in place with this same fix for future fresh installs;
-- this file is the historical record of what was actually run against the
-- live database to fix it.

drop policy if exists "shared_goals_select" on shared_goals;

create policy "shared_goals_select" on shared_goals
  for select using (created_by = auth.uid() or is_shared_goal_member(id, auth.uid()));
