import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/dal";
import { getGoalProgress } from "@/lib/goals";
import { deleteGoal } from "@/lib/actions/goals";
import { GoalForm } from "@/components/forms/goal-form";
import { ContributionForm } from "@/components/forms/contribution-form";
import { GoalProgressItem } from "@/components/goals/goal-progress-item";
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
    </div>
  );
}
