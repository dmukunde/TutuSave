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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="font-medium">{name}</span>
          {targetDate && (
            <span className="ml-2 text-sm text-muted-foreground">by {targetDate}</span>
          )}
        </div>
        {actions}
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full ${isComplete ? "bg-emerald-500" : "bg-primary"}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>

      <div className="text-sm text-muted-foreground">
        {formatMoney(contributed, currency)} of {formatMoney(targetAmount, currency)} (
        {Math.round(pct)}%){isComplete && " — reached!"}
      </div>

      {children}
    </div>
  );
}
