"use client";

import { useActionState, useState } from "react";
import { createSharedGoal } from "@/lib/actions/shared-goals";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SharedGoalForm({ defaultCurrency }: { defaultCurrency: string | null }) {
  const [state, action, pending] = useActionState(createSharedGoal, undefined);
  const [splitType, setSplitType] = useState("equal");

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shared-goal-name">Name</Label>
        <Input
          id="shared-goal-name"
          name="name"
          placeholder="Bali trip"
          required
          className="w-48"
        />
        {state?.errors?.name && (
          <p className="text-sm text-destructive">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shared-goal-target">Target</Label>
        <Input
          id="shared-goal-target"
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
        <Label htmlFor="shared-goal-currency">Currency</Label>
        <select
          id="shared-goal-currency"
          name="currency"
          defaultValue={defaultCurrency ?? ""}
          required
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
        >
          <option value="" disabled>
            Choose…
          </option>
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shared-goal-date">Target date</Label>
        <Input id="shared-goal-date" name="targetDate" type="date" className="w-40" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shared-goal-split">Split</Label>
        <select
          id="shared-goal-split"
          name="splitType"
          value={splitType}
          onChange={(e) => setSplitType(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
        >
          <option value="equal">Equal</option>
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed amount</option>
        </select>
      </div>

      {splitType !== "equal" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="shared-goal-owner-split">
            Your share{splitType === "percentage" ? " (%)" : ""}
          </Label>
          <Input
            id="shared-goal-owner-split"
            name="ownerSplitValue"
            type="number"
            step="0.01"
            min="0"
            className="w-28"
          />
        </div>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create shared goal"}
      </Button>

      {state?.message && <p className="w-full text-sm text-destructive">{state.message}</p>}
    </form>
  );
}
