import { createClient } from "@/lib/supabase/server";
import { deleteCategory } from "@/lib/actions/categories";
import { deleteTransaction } from "@/lib/actions/transactions";
import { CategoryForm } from "@/components/forms/category-form";
import { TransactionForm } from "@/components/forms/transaction-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatAmount(amount: number, kind: string) {
  const formatted = amount.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
  return kind === "income" ? `+${formatted}` : `-${formatted}`;
}

export default async function TransactionsPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: transactions }] = await Promise.all([
    supabase.from("categories").select("id, name, kind, color").order("name"),
    supabase
      .from("transactions")
      .select("id, amount, kind, description, occurred_at, categories(name, color)")
      .order("occurred_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="mt-1 text-muted-foreground">
          Log income and expenses, and organize spending with custom categories.
        </p>
      </div>

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
          <TransactionForm categories={categories ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {!transactions || transactions.length === 0 ? (
            <p className="text-muted-foreground">No transactions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Description</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4 text-right">Amount</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 whitespace-nowrap">{tx.occurred_at}</td>
                    <td className="py-2 pr-4">{tx.description || "—"}</td>
                    <td className="py-2 pr-4">
                      {tx.categories ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="size-2 rounded-full"
                            style={{
                              backgroundColor: tx.categories.color ?? undefined,
                            }}
                          />
                          {tx.categories.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Uncategorized</span>
                      )}
                    </td>
                    <td
                      className={
                        "py-2 pr-4 text-right font-medium whitespace-nowrap " +
                        (tx.kind === "income" ? "text-emerald-600" : "text-foreground")
                      }
                    >
                      {formatAmount(Number(tx.amount), tx.kind)}
                    </td>
                    <td className="py-2 text-right">
                      <form action={deleteTransaction}>
                        <input type="hidden" name="id" value={tx.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Delete
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
