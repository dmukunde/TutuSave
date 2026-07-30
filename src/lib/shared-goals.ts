import type { SupabaseClient } from "@supabase/supabase-js";

const MILESTONE_THRESHOLDS = [25, 50, 75, 100];

// Milestones are tracked as a stored array on the goal (milestones_reached),
// not recomputed from a before/after comparison — a plain "not already in
// this array" check is more robust against firing duplicates than redoing
// the crossing-detection math budgets/personal goals use, and lets multiple
// members contribute without racing each other into double-firing.
export function computeNewMilestones(
  existing: number[],
  pct: number,
): { all: number[]; newlyReached: number[] } {
  const newlyReached = MILESTONE_THRESHOLDS.filter(
    (t) => pct >= t && !existing.includes(t),
  );
  const all = [...existing, ...newlyReached].sort((a, b) => a - b);
  return { all, newlyReached };
}

export type SharedGoalTotals = {
  total: number;
  byMember: Map<string, number>;
  firstContributionDate: string | null;
};

export async function getSharedGoalTotals(
  supabase: SupabaseClient,
  sharedGoalId: string,
): Promise<SharedGoalTotals> {
  const { data } = await supabase
    .from("shared_goal_contributions")
    .select("amount, contributed_by, contributed_at")
    .eq("shared_goal_id", sharedGoalId);

  let total = 0;
  const byMember = new Map<string, number>();
  let firstContributionDate: string | null = null;

  for (const row of data ?? []) {
    const amount = Number(row.amount);
    total += amount;
    byMember.set(row.contributed_by, (byMember.get(row.contributed_by) ?? 0) + amount);
    if (!firstContributionDate || row.contributed_at < firstContributionDate) {
      firstContributionDate = row.contributed_at;
    }
  }

  return { total, byMember, firstContributionDate };
}

// A member's notional pledge, used only as a motivating "ahead/behind"
// comparison — never enforced. Equal split is computed on the fly (not
// stored) so it automatically rebalances as members join or leave.
export function getMemberTargetShare(
  splitType: string,
  targetAmount: number,
  splitValue: number | null,
  activeMemberCount: number,
): number {
  if (splitType === "equal") {
    return activeMemberCount > 0 ? targetAmount / activeMemberCount : 0;
  }
  if (splitType === "percentage") {
    return targetAmount * ((splitValue ?? 0) / 100);
  }
  // fixed
  return splitValue ?? 0;
}

export function estimateCompletionDate(
  totalSaved: number,
  targetAmount: number,
  firstContributionDate: string | null,
): Date | null {
  if (!firstContributionDate || totalSaved <= 0 || totalSaved >= targetAmount) return null;

  const daysElapsed = Math.max(
    1,
    Math.ceil((Date.now() - new Date(firstContributionDate).getTime()) / (1000 * 60 * 60 * 24)),
  );
  const dailyRate = totalSaved / daysElapsed;
  if (dailyRate <= 0) return null;

  const remaining = targetAmount - totalSaved;
  const daysRemaining = Math.ceil(remaining / dailyRate);
  const estimate = new Date();
  estimate.setDate(estimate.getDate() + daysRemaining);
  return estimate;
}
