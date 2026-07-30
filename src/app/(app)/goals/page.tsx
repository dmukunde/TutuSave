import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile, requireUser } from "@/lib/supabase/dal";
import { getGoalProgress } from "@/lib/goals";
import { getSharedGoalTotals } from "@/lib/shared-goals";
import { deleteGoal } from "@/lib/actions/goals";
import { GoalForm } from "@/components/forms/goal-form";
import { ContributionForm } from "@/components/forms/contribution-form";
import { GoalProgressItem } from "@/components/goals/goal-progress-item";
import { SharedGoalForm } from "@/components/forms/shared-goal-form";
import { SharedGoalCard } from "@/components/goals/shared-goal-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function PersonalGoalsSection({ currency }: { currency: string | null }) {
  const supabase = await createClient();

  const { data: goals } = await supabase
    .from("savings_goals")
    .select("*")
    .order("created_at", { ascending: false });

  const goalsWithProgress = await Promise.all(
    (goals ?? []).map(async (goal) => ({
      ...goal,
      contributed: await getGoalProgress(supabase, goal.id),
    })),
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Add a goal</CardTitle>
        </CardHeader>
        <CardContent>
          <GoalForm currency={currency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your goals</CardTitle>
        </CardHeader>
        <CardContent>
          {goalsWithProgress.length === 0 ? (
            <p className="text-muted-foreground">No goals yet.</p>
          ) : (
            <ul className="flex flex-col gap-6">
              {goalsWithProgress.map((goal) => (
                <li key={goal.id} className="border-b pb-6 last:border-0 last:pb-0">
                  <GoalProgressItem
                    name={goal.name}
                    targetAmount={Number(goal.target_amount)}
                    contributed={goal.contributed}
                    targetDate={goal.target_date}
                    currency={currency}
                    actions={
                      <form action={deleteGoal}>
                        <input type="hidden" name="id" value={goal.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Delete
                        </Button>
                      </form>
                    }
                  >
                    <ContributionForm goalId={goal.id} />
                  </GoalProgressItem>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

async function SharedGoalsSection({ currency }: { currency: string | null }) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("shared_goal_members")
    .select("shared_goal_id, shared_goals(id, name, target_amount, currency, target_date, status)")
    .eq("status", "active")
    .eq("user_id", user.id);

  const goals = (memberships ?? [])
    .map((m) => (Array.isArray(m.shared_goals) ? m.shared_goals[0] : m.shared_goals))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  const goalsWithTotals = await Promise.all(
    goals.map(async (goal) => {
      const [{ total }, { count }] = await Promise.all([
        getSharedGoalTotals(supabase, goal.id),
        supabase
          .from("shared_goal_members")
          .select("id", { count: "exact", head: true })
          .eq("shared_goal_id", goal.id)
          .eq("status", "active"),
      ]);
      return { ...goal, totalSaved: total, memberCount: count ?? 1 };
    }),
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Create a shared goal</CardTitle>
        </CardHeader>
        <CardContent>
          <SharedGoalForm defaultCurrency={currency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your shared goals</CardTitle>
        </CardHeader>
        <CardContent>
          {goalsWithTotals.length === 0 ? (
            <p className="text-muted-foreground">
              No shared goals yet — create one above, or accept an invite someone sent you.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {goalsWithTotals.map((goal) => (
                <SharedGoalCard
                  key={goal.id}
                  id={goal.id}
                  name={goal.name}
                  targetAmount={Number(goal.target_amount)}
                  totalSaved={goal.totalSaved}
                  currency={goal.currency}
                  targetDate={goal.target_date}
                  memberCount={goal.memberCount}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "shared" ? "shared" : "personal";
  const profile = await getProfile();
  const currency = profile?.currency ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
        <p className="mt-1 text-muted-foreground">
          Personal savings targets, and goals you&apos;re saving toward with other people.
        </p>
      </div>

      <div className="flex gap-1 border-b">
        <Link
          href="/goals?tab=personal"
          className={
            "px-3 py-2 text-sm font-medium " +
            (activeTab === "personal"
              ? "border-b-2 border-foreground text-foreground"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          Personal
        </Link>
        <Link
          href="/goals?tab=shared"
          className={
            "px-3 py-2 text-sm font-medium " +
            (activeTab === "shared"
              ? "border-b-2 border-foreground text-foreground"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          Shared
        </Link>
      </div>

      {activeTab === "personal" ? (
        <PersonalGoalsSection currency={currency} />
      ) : (
        <SharedGoalsSection currency={currency} />
      )}
    </div>
  );
}
