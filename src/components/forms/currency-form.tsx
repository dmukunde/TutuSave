"use client";

import { useActionState } from "react";
import { updateCurrency } from "@/lib/actions/profile";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function CurrencyForm({ currentCurrency }: { currentCurrency: string | null }) {
  const [state, action, pending] = useActionState(updateCurrency, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currency">Default currency</Label>
        <select
          id="currency"
          name="currency"
          defaultValue={currentCurrency ?? ""}
          className="h-8 w-56 rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
        >
          <option value="" disabled>
            Choose a currency…
          </option>
          {SUPPORTED_CURRENCIES.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code} — {currency.name}
            </option>
          ))}
        </select>
        {state?.errors?.currency && (
          <p className="text-sm text-destructive">{state.errors.currency[0]}</p>
        )}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>

      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}
    </form>
  );
}
