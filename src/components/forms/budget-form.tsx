"use client";

import { useActionState, useState } from "react";
import { createBudget } from "@/lib/actions/budgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Category = {
  id: string;
  name: string;
  kind: string;
};

const today = () => new Date().toISOString().slice(0, 10);

export function BudgetForm({
  categories,
  currency,
}: {
  categories: Category[];
  currency: string | null;
}) {
  const [state, action, pending] = useActionState(createBudget, undefined);
  const [periodType, setPeriodType] = useState("monthly");
  const [categoryId, setCategoryId] = useState("");

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="budget-category">Category</Label>
        <select
          id="budget-category"
          name="categoryId"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
        >
          <option value="">Overall (all spending)</option>
          {categories
            .filter((category) => category.kind === "expense")
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="budget-amount">Amount{currency ? ` (${currency})` : ""}</Label>
        <Input
          id="budget-amount"
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
        <Label htmlFor="budget-period">Period</Label>
        <select
          id="budget-period"
          name="periodType"
          value={periodType}
          onChange={(event) => setPeriodType(event.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="budget-start">Start date</Label>
        <Input
          id="budget-start"
          name="startDate"
          type="date"
          defaultValue={today()}
          required
          className="w-40"
        />
      </div>

      {periodType === "custom" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="budget-end">End date</Label>
          <Input id="budget-end" name="endDate" type="date" required className="w-40" />
          {state?.errors?.endDate && (
            <p className="text-sm text-destructive">{state.errors.endDate[0]}</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="budget-threshold">Alert at %</Label>
        <Input
          id="budget-threshold"
          name="alertThresholdPct"
          type="number"
          min="1"
          max="100"
          defaultValue="80"
          required
          className="w-24"
        />
      </div>

      {categoryId && (
        <label
          htmlFor="budget-one-off"
          className="flex w-full items-start gap-2 text-sm text-muted-foreground"
        >
          <input
            id="budget-one-off"
            name="excludeFromOverall"
            type="checkbox"
            className="mt-0.5 size-4"
          />
          <span>
            <span className="font-medium text-foreground">One-off budget</span> — spending in
            this category won&apos;t count toward your Overall budget.
          </span>
        </label>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add budget"}
      </Button>

      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}
    </form>
  );
}
