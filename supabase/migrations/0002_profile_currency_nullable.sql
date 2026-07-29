-- Currency is a required user choice, not a silent default. New profiles
-- start with currency = NULL until the user picks one in Settings; the app
-- treats a null currency as "needs onboarding" rather than defaulting to USD.
alter table profiles alter column currency drop default;
alter table profiles alter column currency drop not null;

-- profiles only had select/update policies. The Settings currency form uses
-- upsert (not update) so it also works for accounts that predate the
-- handle_new_user trigger and have no profile row yet — that needs insert.
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);
