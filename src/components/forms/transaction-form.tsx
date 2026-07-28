"use client";

import { useActionState } from "react";
import { createTransaction } from "@/lib/actions/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Category = {
  id: string;
  name: string;
  kind: string;
};

const today = () => new Date().toISOString().slice(0, 10);

export function TransactionForm({ categories }: { categories: Category[] }) {
  const [state, action, pending] = useActionState(createTransaction, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tx-kind">Kind</Label>
        <select
          id="tx-kind"
          name="kind"
          defaultValue="expense"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tx-amount">Amount</Label>
        <Input
          id="tx-amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          required
          className="w-28"
        />
        {state?.errors?.amount && (
          <p className="text-sm text-destructive">{state.errors.amount[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tx-category">Category</Label>
        <select
          id="tx-category"
          name="categoryId"
          defaultValue=""
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
        >
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tx-date">Date</Label>
        <Input
          id="tx-date"
          name="occurredAt"
          type="date"
          defaultValue={today()}
          required
          className="w-40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tx-description">Description</Label>
        <Input id="tx-description" name="description" placeholder="Optional" className="w-48" />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add transaction"}
      </Button>

      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}
    </form>
  );
}
