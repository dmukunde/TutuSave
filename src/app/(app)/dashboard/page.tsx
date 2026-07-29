import Link from "next/link";
import { getProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { getBudgetSpent } from "@/lib/budgets";
import { getPeriodLabel } from "@/lib/budget-period";
import { getGoalProgress } from "@/lib/goals";
import { getCurrentMonthSummary } from "@/lib/reports";
import { formatMoney } from "@/lib/currency";
import { BudgetProgressItem } from "@/components/budgets/budget-progress-item";
import { GoalProgressItem } from "@/components/goals/goal-progress-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

function SummaryCard({ label, value, tone }: { label: string; value: string; tone?: "negative" }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={"text-xl font-semibold " + (tone === "negative" ? "text-destructive" : "")}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function formatSignedAmount(amount: number, kind: string, currency: string | null) {
  const formatted = formatMoney(amount, currency);
  return kind === "income" ? `+${formatted}` : `-${formatted}`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const profile = await getProfile();
  const currency = profile?.currency ?? null;

  const [monthSummary, { data: categories }, { data: budgets }, { data: goals }, { data: recentTransactions }] =
    await Promise.all([
      getCurrentMonthSummary(supabase),
      supabase.from("categories").select("id, name"),
      supabase.from("budgets").select("*").order("created_at", { ascending: false }),
      supabase
        .from("savings_goals")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase
        .from("transactions")
        .select("id, amount, kind, description, occurred_at, categories(name, color)")
        .order("occurred_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]));

  const [budgetsWithSpend, goalsWithProgress] = await Promise.all([
    Promise.all(
      (budgets ?? []).map(async (budget) => ({
        ...budget,
        spent: await getBudgetSpent(supabase, budget),
      })),
    ),
    Promise.all(
      (goals ?? []).map(async (goal) => ({
        ...goal,
        contributed: await getGoalProgress(supabase, goal.id),
      })),
    ),
  ]);

  const remaining = monthSummary.income - monthSummary.expense;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Your finances at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryCard label="Income this month" value={formatMoney(monthSummary.income, currency)} />
        <SummaryCard
          label="Expenses this month"
          value={formatMoney(monthSummary.expense, currency)}
        />
        <SummaryCard
          label="Remaining balance"
          value={formatMoney(remaining, currency)}
          tone={remaining < 0 ? "negative" : undefined}
        />
        <SummaryCard label="Active budgets" value={String(budgetsWithSpend.length)} />
        <SummaryCard label="Active goals" value={String(goalsWithProgress.length)} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/transactions" className={buttonVariants({ size: "sm" })}>
          Add transaction
        </Link>
        <Link href="/budgets" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Create budget
        </Link>
        <Link href="/goals" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Create savings goal
        </Link>
        <Link href="/reports" className={buttonVariants({ variant: "outline", size: "sm" })}>
          View reports
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budgets</CardTitle>
        </CardHeader>
        <CardContent>
          {budgetsWithSpend.length === 0 ? (
            <p className="text-muted-foreground">
              No budgets yet.{" "}
              <Link href="/budgets" className="font-medium underline">
                Create one
              </Link>
              .
            </p>
          ) : (
            <ul className="flex flex-col gap-5">
              {budgetsWithSpend.map((budget) => (
                <li key={budget.id}>
                  <BudgetProgressItem
                    categoryName={
                      budget.category_id
                        ? (categoryNameById.get(budget.category_id) ?? "Category budget")
                        : "Overall"
                    }
                    periodLabel={getPeriodLabel(budget)}
                    amount={budget.amount}
                    spent={budget.spent}
                    alertThresholdPct={budget.alert_threshold_pct}
                    currency={currency}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Savings goals</CardTitle>
        </CardHeader>
        <CardContent>
          {goalsWithProgress.length === 0 ? (
            <p className="text-muted-foreground">
              No active savings goals.{" "}
              <Link href="/goals" className="font-medium underline">
                Create one
              </Link>
              .
            </p>
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
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentTransactions || recentTransactions.length === 0 ? (
            <p className="text-muted-foreground">
              No transactions yet.{" "}
              <Link href="/transactions" className="font-medium underline">
                Add one
              </Link>
              .
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Description</th>
                    <th className="py-2 pr-4">Category</th>
                    <th className="py-2 pr-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => {
                    const category = Array.isArray(tx.categories)
                      ? tx.categories[0]
                      : tx.categories;

                    return (
                      <tr key={tx.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 whitespace-nowrap">{tx.occurred_at}</td>
                        <td className="py-2 pr-4">{tx.description || "—"}</td>
                        <td className="py-2 pr-4">
                          {category ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: category.color ?? undefined }}
                              />
                              {category.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Uncategorized</span>
                          )}
                        </td>
                        <td
                          className={
                            "py-2 pr-4 text-right font-medium whitespace-nowrap " +
                            (tx.kind === "income" ? "text-emerald-600" : "text-foreground")
                          }
                        >
                          {formatSignedAmount(Number(tx.amount), tx.kind, currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {recentTransactions && recentTransactions.length > 0 && (
            <div className="mt-4">
              <Link href="/transactions" className="text-sm font-medium underline">
                View all transactions →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
