import { Target, CalendarDays } from "lucide-react";
import { formatMoney } from "@/lib/currency";

export function GoalProgressItem({
  name,
  targetAmount,
  contributed,
  targetDate,
  currency,
  actions,
  children,
}: {
  name: string;
  targetAmount: number;
  contributed: number;
  targetDate: string | null;
  currency: string | null;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const pct = targetAmount > 0 ? (contributed / targetAmount) * 100 : 0;
  const isComplete = contributed >= targetAmount;
  const clampedPct = Math.min(100, Math.max(0, pct));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-savings-soft text-savings">
            <Target className="size-4.5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-heading text-base leading-tight font-semibold">{name}</p>
            {targetDate && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="size-3" aria-hidden="true" />
                Target {targetDate}
              </p>
            )}
          </div>
        </div>
        {actions}
      </div>

      <div className="flex items-center gap-2">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-[width] ${isComplete ? "bg-income" : "bg-savings"}`}
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

      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm">
          <span className="font-semibold tabular-nums">
            {formatMoney(contributed, currency)}
          </span>
          <span className="text-muted-foreground"> of {formatMoney(targetAmount, currency)}</span>
        </p>
        {isComplete && (
          <span className="text-xs font-medium text-income">Goal reached</span>
        )}
      </div>

      {children}
    </div>
  );
}
