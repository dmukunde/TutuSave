import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TONE_CLASSES = {
  primary: { icon: "bg-primary/10 text-primary" },
  income: { icon: "bg-income-soft text-income" },
  expense: { icon: "bg-expense-soft text-expense" },
  savings: { icon: "bg-savings-soft text-savings" },
  warning: { icon: "bg-warning-soft text-warning" },
} as const;

export function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  negative = false,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: keyof typeof TONE_CLASSES;
  negative?: boolean;
}) {
  const toneClasses = TONE_CLASSES[tone];

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2.5">
        <span
          className={`flex size-8 items-center justify-center rounded-full ${toneClasses.icon}`}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-0.5">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p
            className={
              "text-lg font-semibold tabular-nums " +
              (negative ? "text-expense" : "text-foreground")
            }
          >
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
