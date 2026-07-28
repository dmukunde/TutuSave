"use client";

import { useActionState } from "react";
import { createCategory } from "@/lib/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CategoryForm() {
  const [state, action, pending] = useActionState(createCategory, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cat-name">Name</Label>
        <Input id="cat-name" name="name" placeholder="Groceries" required className="w-40" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cat-kind">Kind</Label>
        <select
          id="cat-kind"
          name="kind"
          defaultValue="expense"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cat-color">Color</Label>
        <input
          id="cat-color"
          name="color"
          type="color"
          defaultValue="#0ea5e9"
          className="h-8 w-12 rounded-lg border border-input bg-transparent"
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add category"}
      </Button>

      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}
      {state?.errors?.name && (
        <p className="text-sm text-destructive">{state.errors.name[0]}</p>
      )}
    </form>
  );
}
