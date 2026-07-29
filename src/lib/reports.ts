import type { SupabaseClient } from "@supabase/supabase-js";

export type MonthSummary = { income: number; expense: number };

export async function getCurrentMonthSummary(supabase: SupabaseClient): Promise<MonthSummary> {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);

  const { data } = await supabase
    .from("transactions")
    .select("amount, kind")
    .gte("occurred_at", start);

  let income = 0;
  let expense = 0;
  for (const tx of data ?? []) {
    if (tx.kind === "income") income += Number(tx.amount);
    else expense += Number(tx.amount);
  }

  return { income, expense };
}

function monthKey(dateStr: string) {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
  });
}

export type MonthlyTrendPoint = {
  month: string;
  label: string;
  income: number;
  expense: number;
};

// Continuous range of the last `months` calendar months (including the
// current one), filling in zero-activity months so the chart doesn't skip.
export async function getMonthlyTrend(
  supabase: SupabaseClient,
  months = 6,
): Promise<MonthlyTrendPoint[]> {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
  const startStr = start.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("transactions")
    .select("amount, kind, occurred_at")
    .gte("occurred_at", startStr);

  const byMonth = new Map<string, { income: number; expense: number }>();
  for (let i = 0; i < months; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1 - i), 1));
    byMonth.set(d.toISOString().slice(0, 7), { income: 0, expense: 0 });
  }

  for (const tx of data ?? []) {
    const key = monthKey(tx.occurred_at);
    const bucket = byMonth.get(key);
    if (!bucket) continue;
    if (tx.kind === "income") bucket.income += Number(tx.amount);
    else bucket.expense += Number(tx.amount);
  }

  return Array.from(byMonth.entries()).map(([key, totals]) => ({
    month: key,
    label: monthLabel(key),
    ...totals,
  }));
}

export type CategoryBreakdownPoint = {
  name: string;
  color: string;
  amount: number;
};

// Expense-only breakdown for the current calendar month, one bar per
// category using that category's own color (set when the user created it).
export async function getCategoryBreakdown(
  supabase: SupabaseClient,
): Promise<CategoryBreakdownPoint[]> {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);

  const { data } = await supabase
    .from("transactions")
    .select("amount, category_id, categories(name, color)")
    .eq("kind", "expense")
    .gte("occurred_at", start);

  const byCategory = new Map<string, { name: string; color: string; amount: number }>();

  for (const tx of data ?? []) {
    const key = tx.category_id ?? "uncategorized";
    const category = Array.isArray(tx.categories) ? tx.categories[0] : tx.categories;
    const name = category?.name ?? "Uncategorized";
    const color = category?.color ?? "#a3a3a3";
    const existing = byCategory.get(key);
    if (existing) {
      existing.amount += Number(tx.amount);
    } else {
      byCategory.set(key, { name, color, amount: Number(tx.amount) });
    }
  }

  return Array.from(byCategory.values()).sort((a, b) => b.amount - a.amount);
}

export type SpendingPace = {
  spentSoFar: number;
  projectedTotal: number;
  previousMonthTotal: number;
  daysElapsed: number;
  daysInMonth: number;
};

export async function getSpendingPace(supabase: SupabaseClient): Promise<SpendingPace> {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthStartStr = monthStart.toISOString().slice(0, 10);
  const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const prevMonthStartStr = prevMonthStart.toISOString().slice(0, 10);

  const daysInMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const daysElapsed = now.getUTCDate();

  const { data } = await supabase
    .from("transactions")
    .select("amount, occurred_at")
    .eq("kind", "expense")
    .gte("occurred_at", prevMonthStartStr);

  let spentSoFar = 0;
  let previousMonthTotal = 0;
  for (const tx of data ?? []) {
    if (tx.occurred_at >= monthStartStr) {
      spentSoFar += Number(tx.amount);
    } else {
      previousMonthTotal += Number(tx.amount);
    }
  }

  const projectedTotal = daysElapsed > 0 ? (spentSoFar / daysElapsed) * daysInMonth : 0;

  return { spentSoFar, projectedTotal, previousMonthTotal, daysElapsed, daysInMonth };
}
