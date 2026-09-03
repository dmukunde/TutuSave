import Link from "next/link";
import { Mail, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

// The dashboard/transactions banner for the Gmail bank-import n8n
// automation. This is TutuSave's one "the app is doing something smart
// for you" moment, so it gets its own distinct visual treatment (the
// automation accent) rather than looking like an ordinary card.
export function ImportBanner({ pendingCount }: { pendingCount: number | null }) {
  if (!pendingCount) {
    return (
      <Card size="sm" className="border-none bg-income-soft">
        <CardContent className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-income/15 text-income">
            <CheckCircle2 className="size-4.5" aria-hidden="true" />
          </span>
          <p className="text-sm text-foreground">
            <span className="font-medium">All caught up.</span> No imported
            transactions waiting for review.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm" className="border-none bg-automation-soft">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-automation/15 text-automation">
            <Mail className="size-4.5" aria-hidden="true" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-foreground">
                {pendingCount} transaction{pendingCount === 1 ? "" : "s"} detected from
                email
              </p>
              <span className="rounded-full bg-automation/15 px-2 py-0.5 text-[0.7rem] font-medium tracking-wide text-automation uppercase">
                Needs review
              </span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              TutuSave automatically found{" "}
              {pendingCount === 1 ? "this transaction" : "these transactions"} in your
              email. Review and confirm before they count toward your budgets.
            </p>
          </div>
        </div>

        <Link
          href="/transactions/imports"
          className={buttonVariants({ size: "sm", className: "shrink-0 gap-1.5" })}
        >
          Review transactions
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}
