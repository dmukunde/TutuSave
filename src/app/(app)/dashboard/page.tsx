import Link from "next/link";
import { requireUser } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { getBudgetSpent } from "@/lib/budgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ count: transactionCount }, { data: budgets }] = await Promise.all([
    supabase.from("transactions").select("id", { count: "exact", head: true }),
    supabase.from("budgets").select("*"),
  ]);

  const budgetsWithSpend = await Promise.all(
    (budgets ?? []).map(async (budget) => ({
      ...budget,
      spent: await getBudgetSpent(supabase, budget),
    })),
  );

  const overBudget = budgetsWithSpend.filter((b) => b.spent > b.amount);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Signed in as {user.email}.</p>
      </div>

      {overBudget.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle>Over budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {overBudget.length} budget{overBudget.length > 1 ? "s are" : " is"} over its
              limit this period.{" "}
              <Link href="/budgets" className="font-medium underline">
                Review budgets
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/transactions">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{transactionCount ?? 0}</p>
              <p className="text-sm text-muted-foreground">logged so far</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/budgets">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle>Budgets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{budgetsWithSpend.length}</p>
              <p className="text-sm text-muted-foreground">active</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <p className="text-sm text-muted-foreground">
        Savings goals, spending trends, and reports are coming in later phases.
      </p>
    </div>
  );
}
