"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/currency";
import type { CategoryBreakdownPoint } from "@/lib/reports";

export function CategoryBreakdownChart({
  data,
  currency,
}: {
  data: CategoryBreakdownPoint[];
  currency: string | null;
}) {
  // Single series: each bar's identity is the category itself, using the
  // color the user picked when creating it — no separate categorical
  // palette to assign or validate here.
  const height = Math.max(120, data.length * 36);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 0, right: 24, top: 8, bottom: 0 }}
        barCategoryGap={8}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={100}
          className="text-xs fill-muted-foreground"
        />
        <Tooltip
          formatter={(value) => formatMoney(Number(value), currency)}
          contentStyle={{ fontSize: 13 }}
        />
        <Bar
          dataKey="amount"
          radius={[0, 4, 4, 0]}
          label={{
            position: "right",
            fontSize: 12,
            formatter: (value: unknown) => formatMoney(Number(value), currency),
          }}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
