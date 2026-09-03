import Link from "next/link";
import { Plus, Wallet, Target, BarChart3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const secondaryActions: {
  href: string;
  label: string;
  icon: LucideIcon;
  tone: "warning" | "savings" | "primary";
}[] = [
  { href: "/budgets", label: "Create budget", icon: Wallet, tone: "warning" },
  { href: "/goals", label: "Savings goal", icon: Target, tone: "savings" },
  { href: "/reports", label: "View reports", icon: BarChart3, tone: "primary" },
];

const TONE_CLASSES = {
  primary: "bg-primary/10 text-primary",
  warning: "bg-warning-soft text-warning",
  savings: "bg-savings-soft text-savings",
} as const;

export function QuickActions() {
  return (
    <div className="flex flex-col gap-3">
      <Link
        href="/transactions"
        className={buttonVariants({ className: "w-full gap-1.5 py-2.5" })}
      >
        <Plus className="size-4" aria-hidden="true" />
        Add transaction
      </Link>

      <div className="grid grid-cols-3 gap-2.5">
        {secondaryActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-2 py-3 text-center transition-colors hover:bg-muted active:bg-muted"
            >
              <span
                className={`flex size-9 items-center justify-center rounded-full ${TONE_CLASSES[action.tone]}`}
              >
                <Icon className="size-4.5" aria-hidden="true" />
              </span>
              <span className="text-xs leading-tight font-medium text-foreground">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
