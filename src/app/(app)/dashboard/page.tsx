import Link from "next/link";
import { TrendingUp, TrendingDown, Scale, Wallet, Target } from "lucide-react";
import { getProfile, requireUser } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { getBudgetSpent } from "@/lib/budgets";
import { getPeriodLabel } from "@/lib/budget-period";
import { getGoalProgress } from "@/lib/goals";
import { getCurrentMonthSummary } from "@/lib/reports";
import { getSharedGoalTotals } from "@/lib/shared-goals";
import { formatMoney } from "@/lib/currency";
import { BudgetProgressItem } from "@/components/budgets/budget-progress-item";
import { GoalProgressItem } from "@/components/goals/goal-progress-item";
import { SharedGoalCard } from "@/components/goals/shared-goal-card";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ImportBanner } from "@/components/dashboard/import-banner";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const profile = await getProfile();
  const currency = profile?.currency ?? null;

  const [
    monthSummary,
    { data: categories },
    { data: budgets },
    { data: goals },
    { data: recentTransactions },
    { count: pendingImportsCount },
  ] = await Promise.all([
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
    supabase
      .from("imported_transactions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]));

  const { data: sharedMemberships } = await supabase
    .from("shared_goal_members")
    .select("shared_goals(id, name, target_amount, currency, target_date)")
    .eq("status", "active")
    .eq("user_id", user.id);

  const sharedGoals = (sharedMemberships ?? [])
    .map((m) => (Array.isArray(m.shared_goals) ? m.shared_goals[0] : m.shared_goals))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  const [budgetsWithSpend, goalsWithProgress, sharedGoalsWithTotals] = await Promise.all([
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
    Promise.all(
      sharedGoals.map(async (goal) => {
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
    ),
  ]);

  const remaining = monthSummary.income - monthSummary.expense;

  const normalizedTransactions = (recentTransactions ?? []).map((tx) => ({
    ...tx,
    categories: Array.isArray(tx.categories) ? (tx.categories[0] ?? null) : tx.categories,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Your finances at a glance.</p>
      </div>

      <ImportBanner pendingCount={pendingImportsCount} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryCard
          label="Income this month"
          value={formatMoney(monthSummary.income, currency)}
          icon={TrendingUp}
          tone="income"
        />
        <SummaryCard
          label="Expenses this month"
          value={formatMoney(monthSummary.expense, currency)}
          icon={TrendingDown}
          tone="expense"
        />
        <SummaryCard
          label="Remaining balance"
          value={formatMoney(remaining, currency)}
          icon={Scale}
          tone="primary"
          negative={remaining < 0}
        />
        <SummaryCard
          label="Active budgets"
          value={String(budgetsWithSpend.length)}
          icon={Wallet}
          tone="warning"
        />
        <SummaryCard
          label="Active goals"
          value={String(goalsWithProgress.length)}
          icon={Target}
          tone="savings"
        />
      </div>

      <QuickActions />

      <Card>
        <CardHeader>
          <CardTitle>Budgets</CardTitle>
        </CardHeader>
        <CardContent>
          {budgetsWithSpend.length === 0 ? (
            <p className="text-muted-foreground">
              No budgets yet.{" "}
              <Link href="/budgets" className="font-medium text-primary underline">
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
              <Link href="/goals" className="font-medium text-primary underline">
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
          <CardTitle>Shared goals</CardTitle>
        </CardHeader>
        <CardContent>
          {sharedGoalsWithTotals.length === 0 ? (
            <p className="text-muted-foreground">
              No shared goals yet.{" "}
              <Link href="/goals?tab=shared" className="font-medium text-primary underline">
                Start one with someone
              </Link>
              .
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {sharedGoalsWithTotals.map((goal) => (
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

      <Card>
        <CardHeader>
          <CardTitle>Recent transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {normalizedTransactions.length === 0 ? (
            <p className="text-muted-foreground">
              No transactions yet.{" "}
              <Link href="/transactions" className="font-medium text-primary underline">
                Add one
              </Link>
              .
            </p>
          ) : (
            <TransactionList transactions={normalizedTransactions} currency={currency} />
          )}
          {normalizedTransactions.length > 0 && (
            <div className="mt-4">
              <Link href="/transactions" className="text-sm font-medium text-primary underline">
                View all transactions →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
