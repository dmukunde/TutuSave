import Link from "next/link";
import { formatMoney } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  return (
    <Link href={`/goals/shared/${id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader>
          <CardTitle>{name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full ${isComplete ? "bg-emerald-500" : "bg-primary"}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              {formatMoney(totalSaved, currency)} of {formatMoney(targetAmount, currency)} (
              {Math.round(pct)}%)
            </span>
            <span>
              {memberCount} member{memberCount === 1 ? "" : "s"}
            </span>
          </div>
          {targetDate && <p className="text-xs text-muted-foreground">Target: {targetDate}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}
