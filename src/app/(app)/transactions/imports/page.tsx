import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/currency";
import { ReviewImportForm } from "@/components/forms/review-import-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ReviewImportsPage() {
  const supabase = await createClient();

  const [{ data: imports }, { data: categories }] = await Promise.all([
    supabase
      .from("imported_transactions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name, kind"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Review imports</h1>
        <p className="mt-1 text-muted-foreground">
          Transactions detected from your bank emails, waiting for your confirmation
          before they count toward your budgets and reports.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending review ({imports?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!imports || imports.length === 0 ? (
            <p className="text-muted-foreground">
              Nothing waiting for review right now.{" "}
              <Link href="/transactions" className="font-medium underline">
                Back to transactions
              </Link>
              .
            </p>
          ) : (
            imports.map((item) => (
              <div key={item.id} className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">
                  Imported from {item.source} · {formatMoney(Number(item.amount), item.currency)}{" "}
                  detected
                  {item.card_last4 && ` · card ending ${item.card_last4}`}
                </p>
                <ReviewImportForm
                  id={item.id}
                  amount={Number(item.amount)}
                  kind={item.kind}
                  description={item.description}
                  occurredAt={item.occurred_at}
                  categories={categories ?? []}
                  isPossibleDuplicate={Boolean(item.possible_duplicate_of)}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
