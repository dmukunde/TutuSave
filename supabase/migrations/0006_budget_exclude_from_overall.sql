-- One-off budgets (e.g. a trip or event): a category budget flagged this way
-- keeps its own limit, and expenses in its category stop counting toward
-- any "Overall" budget. Existing budgets default to false, so nothing
-- changes until the user opts a budget in. Existing RLS policies on
-- budgets already cover the new column.
alter table budgets
  add column exclude_from_overall boolean not null default false;
