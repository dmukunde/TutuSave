"use client";

import { useActionState } from "react";
import {
  approveImportedTransaction,
  rejectImportedTransaction,
} from "@/lib/actions/imported-transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Category = { id: string; name: string; kind: string };

export function ReviewImportForm({
  id,
  amount,
  kind,
  description,
  occurredAt,
  categories,
  isPossibleDuplicate,
}: {
  id: string;
  amount: number;
  kind: string;
  description: string;
  occurredAt: string;
  categories: Category[];
  isPossibleDuplicate: boolean;
}) {
  const [state, action, pending] = useActionState(approveImportedTransaction, undefined);

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      {isPossibleDuplicate && (
        <p className="text-sm font-medium text-amber-600">
          ⚠ This looks similar to another transaction you already have. Check before approving.
        </p>
      )}

      <form action={action} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="id" value={id} />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`kind-${id}`}>Kind</Label>
          <select
            id={`kind-${id}`}
            name="kind"
            defaultValue={kind}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`amount-${id}`}>Amount</Label>
          <Input
            id={`amount-${id}`}
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={amount}
            required
            className="w-28"
          />
          {state?.errors?.amount && (
            <p className="text-sm text-destructive">{state.errors.amount[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`category-${id}`}>Category</Label>
          <select
            id={`category-${id}`}
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
          <Label htmlFor={`date-${id}`}>Date</Label>
          <Input
            id={`date-${id}`}
            name="occurredAt"
            type="date"
            defaultValue={occurredAt}
            required
            className="w-40"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`description-${id}`}>Description</Label>
          <Input
            id={`description-${id}`}
            name="description"
            defaultValue={description}
            required
            className="w-56"
          />
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Approving…" : "Approve"}
        </Button>

        {state?.message && (
          <p className="w-full text-sm text-destructive">{state.message}</p>
        )}
      </form>

      <form action={rejectImportedTransaction}>
        <input type="hidden" name="id" value={id} />
        <Button type="submit" variant="ghost" size="sm">
          Reject
        </Button>
      </form>
    </div>
  );
}
