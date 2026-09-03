"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/currency";
import type { MonthlyTrendPoint } from "@/lib/reports";

// Matches the app-wide income/expense accent tokens (--income / --expense in
// globals.css). Lightness and chroma are deliberately kept apart (not just
// hue) so the two bars stay distinguishable for colorblind viewers; both are
// also directly labeled via the legend + tooltip, not color-only.
const INCOME_COLOR = "#419363";
const EXPENSE_COLOR = "#d86357";

export function MonthlyTrendChart({
  data,
  currency,
}: {
  data: MonthlyTrendPoint[];
  currency: string | null;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={2} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="currentColor" className="text-muted opacity-20" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          className="text-xs fill-muted-foreground"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(value) => formatMoney(value, currency)}
          className="text-xs fill-muted-foreground"
        />
        <Tooltip
          formatter={(value) => formatMoney(Number(value), currency)}
          contentStyle={{ fontSize: 13 }}
        />
        <Legend wrapperStyle={{ fontSize: 13 }} />
        <Bar dataKey="income" name="Income" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Expense" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
