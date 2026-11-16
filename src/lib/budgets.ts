import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentPeriodRange, type BudgetPeriod } from "@/lib/budget-period";
import { emitEvent } from "@/lib/events";

type BudgetLike = BudgetPeriod & { category_id: string | null };

// Category ids belonging to one-off budgets (exclude_from_overall = true).
// Expenses in these categories are tracked by their own budget and don't
// count toward any "overall" budget.
async function getOneOffCategoryIds(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase
    .from("budgets")
    .select("category_id")
    .eq("exclude_from_overall", true)
    .not("category_id", "is", null);

  return (data ?? []).map((row) => row.category_id as string);
}

// Sums expense transactions for a budget's current period. A budget with no
// category (an "overall" budget) counts every expense except those in
// one-off categories; a category budget only counts expenses in that
// category.
export async function getBudgetSpent(
  supabase: SupabaseClient,
  budget: BudgetLike,
  options: { excludeTransactionId?: string } = {},
): Promise<number> {
  const { start, end } = getCurrentPeriodRange(budget);

  let query = supabase
    .from("transactions")
    .select("amount")
    .eq("kind", "expense")
    .gte("occurred_at", start)
    .lte("occurred_at", end);

  if (budget.category_id) {
    query = query.eq("category_id", budget.category_id);
  } else {
    const oneOffIds = await getOneOffCategoryIds(supabase);
    if (oneOffIds.length > 0) {
      // Plain NOT IN would also drop uncategorized (NULL) expenses, which
      // must still count toward the overall budget.
      query = query.or(`category_id.is.null,category_id.not.in.(${oneOffIds.join(",")})`);
    }
  }

  if (options.excludeTransactionId) {
    query = query.neq("id", options.excludeTransactionId);
  }

  const { data } = await query;
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
}

// Checks every budget this new expense could affect (its own category's
// budget, plus any overall/no-category budget) and emits an event the
// instant a threshold or the budget itself is crossed — never on every
// transaction after that, only on the one that caused the crossing.
export async function checkBudgetAlerts(
  supabase: SupabaseClient,
  userId: string,
  transaction: { id: string; category_id: string | null; kind: string; amount: number },
) {
  if (transaction.kind !== "expense") return;

  const { data: budgets } = await supabase
    .from("budgets")
    .select(
      "id, category_id, amount, period_type, start_date, end_date, alert_threshold_pct, exclude_from_overall",
    )
    .eq("user_id", userId);

  const oneOffCategoryIds = new Set(
    (budgets ?? [])
      .filter((budget) => budget.exclude_from_overall && budget.category_id)
      .map((budget) => budget.category_id as string),
  );
  const isOneOffExpense =
    transaction.category_id !== null && oneOffCategoryIds.has(transaction.category_id);

  // An overall budget is only affected by this expense if its category
  // isn't a one-off one.
  const relevant = (budgets ?? []).filter(
    (budget) =>
      budget.category_id === transaction.category_id ||
      (budget.category_id === null && !isOneOffExpense),
  );

  for (const budget of relevant) {
    const spentBefore = await getBudgetSpent(supabase, budget, {
      excludeTransactionId: transaction.id,
    });
    const spentAfter = spentBefore + transaction.amount;
    const thresholdAmount = budget.amount * (budget.alert_threshold_pct / 100);

    if (spentBefore < thresholdAmount && spentAfter >= thresholdAmount) {
      await emitEvent(supabase, userId, "budget.threshold_crossed", {
        budget_id: budget.id,
        category_id: budget.category_id,
        spent: spentAfter,
        budget_amount: budget.amount,
        threshold_pct: budget.alert_threshold_pct,
      });
    }

    if (spentBefore <= budget.amount && spentAfter > budget.amount) {
      await emitEvent(supabase, userId, "budget.exceeded", {
        budget_id: budget.id,
        category_id: budget.category_id,
        spent: spentAfter,
        budget_amount: budget.amount,
      });
    }
  }
}
