import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/dal";
import { getMonthlyTrend, getCategoryBreakdown, getSpendingPace } from "@/lib/reports";
import { formatMoney } from "@/lib/currency";
import { MonthlyTrendChart } from "@/components/charts/monthly-trend-chart";
import { CategoryBreakdownChart } from "@/components/charts/category-breakdown-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ReportsPage() {
  const supabase = await createClient();
  const profile = await getProfile();
  const currency = profile?.currency ?? null;

  const [trend, breakdown, pace] = await Promise.all([
    getMonthlyTrend(supabase, 6),
    getCategoryBreakdown(supabase),
    getSpendingPace(supabase),
  ]);

  const paceDelta = pace.projectedTotal - pace.previousMonthTotal;
  const paceIsHigher = pace.previousMonthTotal > 0 && paceDelta > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-muted-foreground">
          Spending trends and pace, drawn from your transaction history.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Spending pace</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-2xl font-semibold">{formatMoney(pace.spentSoFar, currency)}</p>
          <p className="text-sm text-muted-foreground">
            spent so far, day {pace.daysElapsed} of {pace.daysInMonth} this month
          </p>
          <p className="text-sm">
            At this pace you&apos;re on track for{" "}
            <span className="font-medium">{formatMoney(pace.projectedTotal, currency)}</span>{" "}
            by month end
            {pace.previousMonthTotal > 0 && (
              <>
                {" "}
                —{" "}
                <span className={paceIsHigher ? "text-amber-600" : "text-emerald-600"}>
                  {formatMoney(Math.abs(paceDelta), currency)}{" "}
                  {paceIsHigher ? "more" : "less"} than last month
                </span>
              </>
            )}
            .
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Income vs. expenses, last 6 months</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyTrendChart data={trend} currency={currency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spending by category, this month</CardTitle>
        </CardHeader>
        <CardContent>
          {breakdown.length === 0 ? (
            <p className="text-muted-foreground">No expenses logged this month yet.</p>
          ) : (
            <CategoryBreakdownChart data={breakdown} currency={currency} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
