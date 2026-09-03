import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatMoney } from "@/lib/currency";

export type TransactionListItem = {
  id: string;
  amount: number;
  kind: string;
  description: string | null;
  occurred_at: string;
  categories: { name: string; color: string | null } | null;
};

function formatShortDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Shared mobile list pattern for a transaction: a tinted icon circle (the
// category's own color when set, otherwise the income/expense semantic
// color), description/category/date, and a clearly +/- colored amount.
// Used on both the dashboard's "recent transactions" and the full
// Transactions page list, so the two never drift apart visually.
export function TransactionList({
  transactions,
  currency,
  actions,
}: {
  transactions: TransactionListItem[];
  currency: string | null;
  actions?: (transaction: TransactionListItem) => React.ReactNode;
}) {
  return (
    <ul className="flex flex-col divide-y divide-border">
      {transactions.map((tx) => {
        const isIncome = tx.kind === "income";
        const tint = tx.categories?.color ?? undefined;
        return (
          <li key={tx.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span
              className={
                "flex size-10 shrink-0 items-center justify-center rounded-full " +
                (tint ? "" : isIncome ? "bg-income-soft" : "bg-expense-soft")
              }
              style={tint ? { backgroundColor: `color-mix(in oklch, ${tint} 16%, transparent)` } : undefined}
            >
              {isIncome ? (
                <ArrowDownLeft
                  className="size-4.5"
                  style={{ color: tint ?? "var(--income)" }}
                  aria-hidden="true"
                />
              ) : (
                <ArrowUpRight
                  className="size-4.5"
                  style={{ color: tint ?? "var(--expense)" }}
                  aria-hidden="true"
                />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{tx.description || "—"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {tx.categories?.name ?? "Uncategorized"} · {formatShortDate(tx.occurred_at)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span
                className={
                  "text-sm font-semibold tabular-nums " +
                  (isIncome ? "text-income" : "text-foreground")
                }
              >
                {isIncome ? "+" : "-"}
                {formatMoney(Number(tx.amount), currency)}
              </span>
              {actions?.(tx)}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
