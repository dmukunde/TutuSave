import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/dal";
import { deleteCategory } from "@/lib/actions/categories";
import { deleteTransaction } from "@/lib/actions/transactions";
import { CategoryForm } from "@/components/forms/category-form";
import { TransactionForm } from "@/components/forms/transaction-form";
import { ImportBanner } from "@/components/dashboard/import-banner";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TransactionsPage() {
  const supabase = await createClient();
  const profile = await getProfile();
  const currency = profile?.currency ?? null;

  const [{ data: categories }, { data: transactions }, { count: pendingImportsCount }] =
    await Promise.all([
      supabase.from("categories").select("id, name, kind, color").order("name"),
      supabase
        .from("transactions")
        .select("id, amount, kind, description, occurred_at, categories(name, color)")
        .order("occurred_at", { ascending: false })
        .limit(50),
      supabase
        .from("imported_transactions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

  const normalizedTransactions = (transactions ?? []).map((tx) => ({
    ...tx,
    categories: Array.isArray(tx.categories) ? (tx.categories[0] ?? null) : tx.categories,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="mt-1 text-muted-foreground">
          Log income and expenses, and organize spending with custom categories.
        </p>
      </div>

      <ImportBanner pendingCount={pendingImportsCount} />

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CategoryForm />
          {categories && categories.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: category.color ?? undefined }}
                  />
                  {category.name}
                  <span className="text-muted-foreground">({category.kind})</span>
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={category.id} />
                    <button
                      type="submit"
                      aria-label={`Delete ${category.name}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      ×
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add a transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionForm categories={categories ?? []} currency={currency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {normalizedTransactions.length === 0 ? (
            <p className="text-muted-foreground">No transactions yet.</p>
          ) : (
            <TransactionList
              transactions={normalizedTransactions}
              currency={currency}
              actions={(tx) => (
                <form action={deleteTransaction}>
                  <input type="hidden" name="id" value={tx.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete transaction: ${tx.description || "untitled"}`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </form>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
