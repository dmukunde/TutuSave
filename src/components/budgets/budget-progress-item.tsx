import { Wallet } from "lucide-react";
import { formatMoney } from "@/lib/currency";

export function BudgetProgressItem({
  categoryName,
  periodLabel,
  amount,
  spent,
  alertThresholdPct,
  currency,
  actions,
}: {
  categoryName: string;
  periodLabel: string;
  amount: number;
  spent: number;
  alertThresholdPct: number;
  currency: string | null;
  actions?: React.ReactNode;
}) {
  const pct = amount > 0 ? (spent / amount) * 100 : 0;
  const isOver = spent > amount;
  const isNearThreshold = !isOver && pct >= alertThresholdPct;
  const clampedPct = Math.min(100, Math.max(0, pct));

  const barColor = isOver ? "bg-destructive" : isNearThreshold ? "bg-warning" : "bg-income";
  const badgeClasses = isOver
    ? "bg-destructive/10 text-destructive"
    : "bg-warning-soft text-warning";
  const iconClasses = isOver
    ? "bg-destructive/10 text-destructive"
    : isNearThreshold
      ? "bg-warning-soft text-warning"
      : "bg-income-soft text-income";
  const pctClasses = isOver ? "text-destructive" : isNearThreshold ? "text-warning" : "text-income";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${iconClasses}`}>
            <Wallet className="size-4.5" aria-hidden="true" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="font-heading text-base leading-tight font-semibold">{categoryName}</p>
              {(isOver || isNearThreshold) && (
                <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${badgeClasses}`}>
                  {isOver ? "Over budget" : "Near limit"}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{periodLabel}</p>
          </div>
        </div>
        {actions}
      </div>

      <div className="flex items-center gap-2">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-[width] ${barColor}`}
            style={{ width: `${clampedPct}%` }}
          />
        </div>
        <span className={`shrink-0 text-xs font-semibold tabular-nums ${pctClasses}`}>
          {Math.round(pct)}%
        </span>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
        <p>
          <span className="font-semibold tabular-nums">{formatMoney(spent, currency)}</span>
          <span className="text-muted-foreground"> spent of {formatMoney(amount, currency)}</span>
        </p>
        <span className={"font-medium tabular-nums " + (isOver ? "text-destructive" : "text-muted-foreground")}>
          {isOver
            ? `${formatMoney(spent - amount, currency)} over`
            : `${formatMoney(amount - spent, currency)} remaining`}
        </span>
      </div>
    </div>
  );
}
