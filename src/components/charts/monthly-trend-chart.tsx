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

// Validated pair (dataviz skill: validate_palette.js, CVD ΔE 27.1 deutan / 31.8
// normal, light mode) — income and expense read apart for colorblind viewers,
// and both are also directly labeled via the legend + tooltip, not color-only.
const INCOME_COLOR = "#10b981";
const EXPENSE_COLOR = "#6366f1";

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
