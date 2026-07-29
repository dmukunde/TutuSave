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
  const barColor = isOver ? "bg-destructive" : isNearThreshold ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="font-medium">{categoryName}</span>
          <span className="ml-2 text-sm text-muted-foreground">{periodLabel}</span>
          {(isOver || isNearThreshold) && (
            <span
              className={
                "ml-2 text-xs font-medium " +
                (isOver ? "text-destructive" : "text-amber-600")
              }
            >
              {isOver ? "Over budget" : "Near limit"}
            </span>
          )}
        </div>
        {actions}
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${barColor}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>

      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          {formatMoney(spent, currency)} spent of {formatMoney(amount, currency)} (
          {Math.round(pct)}%)
        </span>
        <span className={isOver ? "text-destructive" : isNearThreshold ? "text-amber-600" : undefined}>
          {isOver
            ? `${formatMoney(spent - amount, currency)} over`
            : `${formatMoney(amount - spent, currency)} remaining`}
        </span>
      </div>
    </div>
  );
}
