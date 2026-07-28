import { createClient } from "@/lib/supabase/server";
import { getBudgetSpent } from "@/lib/budgets";
import { deleteBudget } from "@/lib/actions/budgets";
import { BudgetForm } from "@/components/forms/budget-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatCurrency(amount: number) {
  return amount.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function periodLabel(periodType: string, startDate: string, endDate: string | null) {
  if (periodType === "monthly") return "This month";
  if (periodType === "yearly") return "This year";
  return `${startDate} → ${endDate ?? "ongoing"}`;
}

export default async function BudgetsPage() {
  const supabase = await createClient();

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
          <BudgetForm categories={categories ?? []} />
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
                const pct = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
                const isOver = budget.spent > budget.amount;
                const isNearThreshold = pct >= budget.alert_threshold_pct;
                const barColor = isOver
                  ? "bg-destructive"
                  : isNearThreshold
                    ? "bg-amber-500"
                    : "bg-emerald-500";

                return (
                  <li key={budget.id} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">
                          {category ? category.name : "Overall"}
                        </span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {periodLabel(budget.period_type, budget.start_date, budget.end_date)}
                        </span>
                      </div>
                      <form action={deleteBudget}>
                        <input type="hidden" name="id" value={budget.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Delete
                        </Button>
                      </form>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full ${barColor}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        {formatCurrency(budget.spent)} spent of{" "}
                        {formatCurrency(budget.amount)}
                      </span>
                      <span>
                        {isOver
                          ? `${formatCurrency(budget.spent - budget.amount)} over`
                          : `${formatCurrency(budget.amount - budget.spent)} remaining`}
                      </span>
                    </div>
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
