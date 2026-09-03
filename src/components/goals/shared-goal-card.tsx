import Link from "next/link";
import { Users, Target, CalendarDays } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { Card, CardContent } from "@/components/ui/card";

export function SharedGoalCard({
  id,
  name,
  targetAmount,
  totalSaved,
  currency,
  targetDate,
  memberCount,
}: {
  id: string;
  name: string;
  targetAmount: number;
  totalSaved: number;
  currency: string;
  targetDate: string | null;
  memberCount: number;
}) {
  const pct = targetAmount > 0 ? (totalSaved / targetAmount) * 100 : 0;
  const isComplete = totalSaved >= targetAmount;
  const clampedPct = Math.min(100, Math.max(0, pct));

  return (
    <Link href={`/goals/shared/${id}`} className="block">
      <Card className="h-full border-savings/20 transition-colors hover:bg-savings-soft/40 active:bg-savings-soft/40">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-savings-soft text-savings">
                <Target className="size-4.5" aria-hidden="true" />
              </span>
              <p className="font-heading text-base leading-tight font-semibold">{name}</p>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-savings-soft px-2 py-0.5 text-xs font-medium text-savings">
              <Users className="size-3" aria-hidden="true" />
              {memberCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${isComplete ? "bg-income" : "bg-savings"}`}
                style={{ width: `${clampedPct}%` }}
              />
            </div>
            <span
              className={
                "shrink-0 text-xs font-semibold tabular-nums " +
                (isComplete ? "text-income" : "text-savings")
              }
            >
              {Math.round(pct)}%
            </span>
          </div>

          <p className="text-sm">
            <span className="font-semibold tabular-nums">
              {formatMoney(totalSaved, currency)}
            </span>
            <span className="text-muted-foreground"> of {formatMoney(targetAmount, currency)}</span>
          </p>

          {targetDate && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="size-3" aria-hidden="true" />
              Target {targetDate}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
