"use client";

import { useActionState, useState } from "react";
import { inviteMember } from "@/lib/actions/shared-goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function InviteLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/50 p-3 text-sm">
      <span className="text-muted-foreground">Invite link — share it yourself for now:</span>
      <code className="break-all">{fullUrl}</code>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          navigator.clipboard.writeText(fullUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? "Copied!" : "Copy"}
      </Button>
    </div>
  );
}

export function InviteMemberForm({
  sharedGoalId,
  splitType,
}: {
  sharedGoalId: string;
  splitType: string;
}) {
  const [state, action, pending] = useActionState(inviteMember, undefined);

  return (
    <div className="flex flex-col gap-3">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="sharedGoalId" value={sharedGoalId} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-email">Email (optional)</Label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            placeholder="friend@example.com"
            className="w-56"
          />
          {state?.errors?.email && (
            <p className="text-sm text-destructive">{state.errors.email[0]}</p>
          )}
        </div>

        {splitType !== "equal" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-split">
              Their share{splitType === "percentage" ? " (%)" : ""}
            </Label>
            <Input
              id="invite-split"
              name="splitValue"
              type="number"
              step="0.01"
              min="0"
              className="w-28"
            />
          </div>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Creating invite…" : "Create invite"}
        </Button>
      </form>

      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}
      {state?.inviteLink && <InviteLink path={state.inviteLink} />}
    </div>
  );
}
