import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/dal";
import { getBudgetSpent } from "@/lib/budgets";
import { getPeriodLabel } from "@/lib/budget-period";
import { deleteBudget } from "@/lib/actions/budgets";
import { BudgetForm } from "@/components/forms/budget-form";
import { BudgetProgressItem } from "@/components/budgets/budget-progress-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BudgetsPage() {
  const supabase = await createClient();
  const profile = await getProfile();
  const currency = profile?.currency ?? null;

  const [{ data: categories }, { data: budgets }] = await Promise.all([
    supabase.from("categories").select("id, name, kind"),
    supabase.from("budgets").select("*").order("created_at", { ascending: false }),
  ]);

  const categoryById = new Map((categories ?? []).map((c) => [c.id, c]));

  const budgetsWithSpend = await Promise.all(
    (budgets ?? []).map(async (budget) => ({
      ...budget,
      spent: await getBudgetSpent(supabase, budget),
    })),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
        <p className="mt-1 text-muted-foreground">
          Set spending limits per category or overall, and track how much you
          have left in the current period.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a budget</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetForm categories={categories ?? []} currency={currency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your budgets</CardTitle>
        </CardHeader>
        <CardContent>
          {budgetsWithSpend.length === 0 ? (
            <p className="text-muted-foreground">No budgets yet.</p>
          ) : (
            <ul className="flex flex-col gap-5">
              {budgetsWithSpend.map((budget) => {
                const category = budget.category_id
                  ? categoryById.get(budget.category_id)
                  : null;

                return (
                  <li key={budget.id}>
                    <BudgetProgressItem
                      categoryName={category ? category.name : "Overall"}
                      periodLabel={getPeriodLabel(budget)}
                      amount={budget.amount}
                      spent={budget.spent}
                      alertThresholdPct={budget.alert_threshold_pct}
                      currency={currency}
                      actions={
                        <form action={deleteBudget}>
                          <input type="hidden" name="id" value={budget.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            Delete
                          </Button>
                        </form>
                      }
                    />
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
