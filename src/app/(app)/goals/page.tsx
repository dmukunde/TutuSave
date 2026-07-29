import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/dal";
import { getGoalProgress } from "@/lib/goals";
import { deleteGoal } from "@/lib/actions/goals";
import { formatMoney } from "@/lib/currency";
import { GoalForm } from "@/components/forms/goal-form";
import { ContributionForm } from "@/components/forms/contribution-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function GoalsPage() {
  const supabase = await createClient();
  const profile = await getProfile();
  const currency = profile?.currency ?? null;

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
        <p className="mt-1 text-muted-foreground">
          Set savings targets and track contributions toward them.
        </p>
      </div>

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
              {goalsWithProgress.map((goal) => {
                const target = Number(goal.target_amount);
                const pct = target > 0 ? (goal.contributed / target) * 100 : 0;
                const isComplete = goal.contributed >= target;

                return (
                  <li key={goal.id} className="flex flex-col gap-2 border-b pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{goal.name}</span>
                        {goal.target_date && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            by {goal.target_date}
                          </span>
                        )}
                      </div>
                      <form action={deleteGoal}>
                        <input type="hidden" name="id" value={goal.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Delete
                        </Button>
                      </form>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full ${isComplete ? "bg-emerald-500" : "bg-primary"}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {formatMoney(goal.contributed, currency)} of{" "}
                      {formatMoney(target, currency)}
                      {isComplete && " — reached!"}
                    </div>

                    <ContributionForm goalId={goal.id} />
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
