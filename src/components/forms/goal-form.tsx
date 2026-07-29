"use client";

import { useActionState } from "react";
import { createGoal } from "@/lib/actions/goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GoalForm({ currency }: { currency: string | null }) {
  const [state, action, pending] = useActionState(createGoal, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="goal-name">Name</Label>
        <Input id="goal-name" name="name" placeholder="Emergency fund" required className="w-48" />
        {state?.errors?.name && (
          <p className="text-sm text-destructive">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="goal-target">Target{currency ? ` (${currency})` : ""}</Label>
        <Input
          id="goal-target"
          name="targetAmount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          required
          className="w-32"
        />
        {state?.errors?.targetAmount && (
          <p className="text-sm text-destructive">{state.errors.targetAmount[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="goal-date">Target date</Label>
        <Input id="goal-date" name="targetDate" type="date" className="w-40" />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add goal"}
      </Button>

      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}
    </form>
  );
}
