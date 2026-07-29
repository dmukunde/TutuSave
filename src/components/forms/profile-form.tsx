"use client";

import { useActionState } from "react";
import { updateFullName } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({ currentFullName }: { currentFullName: string | null }) {
  const [state, action, pending] = useActionState(updateFullName, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={currentFullName ?? ""}
          className="w-56"
          required
        />
        {state?.errors?.fullName && (
          <p className="text-sm text-destructive">{state.errors.fullName[0]}</p>
        )}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>

      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}
    </form>
  );
}
