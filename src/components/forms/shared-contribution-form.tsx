"use client";

import { useActionState } from "react";
import { addSharedContribution } from "@/lib/actions/shared-goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const today = () => new Date().toISOString().slice(0, 10);

export function SharedContributionForm({
  sharedGoalId,
  currency,
}: {
  sharedGoalId: string;
  currency: string;
}) {
  const [state, action, pending] = useActionState(addSharedContribution, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="sharedGoalId" value={sharedGoalId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shared-contrib-amount">Amount ({currency})</Label>
        <Input
          id="shared-contrib-amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          className="w-32"
        />
        {state?.errors?.amount && (
          <p className="text-sm text-destructive">{state.errors.amount[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shared-contrib-date">Date</Label>
        <Input
          id="shared-contrib-date"
          name="contributedAt"
          type="date"
          defaultValue={today()}
          required
          className="w-40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shared-contrib-note">Note</Label>
        <Input id="shared-contrib-note" name="note" placeholder="Optional" className="w-48" />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add contribution"}
      </Button>

      {state?.message && <p className="w-full text-sm text-destructive">{state.message}</p>}
    </form>
  );
}
