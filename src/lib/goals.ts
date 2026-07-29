import type { SupabaseClient } from "@supabase/supabase-js";
import { emitEvent } from "@/lib/events";

// Sums a goal's contributions. current_amount isn't stored on the goal
// itself — it's always derived from goal_contributions, same reasoning as
// budgets deriving spent from transactions: one source of truth, no sync bugs.
export async function getGoalProgress(
  supabase: SupabaseClient,
  goalId: string,
  options: { excludeContributionId?: string } = {},
): Promise<number> {
  let query = supabase.from("goal_contributions").select("amount").eq("goal_id", goalId);

  if (options.excludeContributionId) {
    query = query.neq("id", options.excludeContributionId);
  }

  const { data } = await query;
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
}

// Same crossing-detection pattern as checkBudgetAlerts: emit goal.completed
// only on the contribution that pushes the total across target_amount, not
// on every contribution after that.
export async function checkGoalCompletion(
  supabase: SupabaseClient,
  userId: string,
  contribution: { id: string; goalId: string; amount: number; targetAmount: number },
) {
  const contributedBefore = await getGoalProgress(supabase, contribution.goalId, {
    excludeContributionId: contribution.id,
  });
  const contributedAfter = contributedBefore + contribution.amount;

  if (contributedBefore < contribution.targetAmount && contributedAfter >= contribution.targetAmount) {
    await emitEvent(supabase, userId, "goal.completed", {
      goal_id: contribution.goalId,
      contributed: contributedAfter,
      target_amount: contribution.targetAmount,
    });
  }
}
