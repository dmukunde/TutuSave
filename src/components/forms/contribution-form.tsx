"use client";

import { useActionState } from "react";
import { addContribution } from "@/lib/actions/goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ContributionForm({ goalId }: { goalId: string }) {
  const [state, action, pending] = useActionState(addContribution, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="goalId" value={goalId} />
      <Input
        name="amount"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="Amount"
        required
        className="w-28"
      />
      <Input name="note" placeholder="Optional note" className="w-40" />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Adding…" : "Add contribution"}
      </Button>
      {state?.errors?.amount && (
        <p className="w-full text-sm text-destructive">{state.errors.amount[0]}</p>
      )}
      {state?.message && (
        <p className="w-full text-sm text-destructive">{state.message}</p>
      )}
    </form>
  );
}
