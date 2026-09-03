"use client";

import { useState } from "react";
import { regenerateForwardToken } from "@/lib/actions/email-connections";
import { Button } from "@/components/ui/button";

export function ForwardingAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/50 p-3 text-sm">
      <code className="break-all">{address}</code>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          navigator.clipboard.writeText(address);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? "Copied!" : "Copy"}
      </Button>
      <form
        action={regenerateForwardToken}
        onSubmit={(e) => {
          if (
            !window.confirm(
              "Generate a new address? Mail sent to the old one will stop being picked up.",
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <Button type="submit" variant="ghost" size="sm">
          Regenerate
        </Button>
      </form>
    </div>
  );
}
