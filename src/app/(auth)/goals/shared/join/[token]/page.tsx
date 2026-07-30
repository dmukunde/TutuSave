import Link from "next/link";
import { getUser } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { acceptSharedGoalInvite } from "@/lib/actions/shared-goals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function JoinSharedGoalPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const user = await getUser();
  const supabase = await createClient();

  const { data: invites } = await supabase.rpc("get_shared_goal_invite", { p_token: token });
  const invite = invites?.[0];

  const currentPath = `/goals/shared/join/${token}`;

  if (!invite) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invite not found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This invite link isn&apos;t valid. Ask whoever sent it for a new one.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isExpired = invite.expires_at ? new Date(invite.expires_at) < new Date() : false;
  const isUsable = invite.member_status === "invited" && !isExpired;

  return (
    <Card>
      <CardHeader>
        <CardTitle>You&apos;re invited to &ldquo;{invite.goal_name}&rdquo;</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground">
          {invite.invited_by_name} invited you to save toward this goal together.
        </p>

        {error && <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>}

        {!isUsable ? (
          <p className="text-sm text-destructive">
            {isExpired
              ? "This invite has expired. Ask the goal owner to resend it."
              : "This invite is no longer valid — it may have already been used or revoked."}
          </p>
        ) : !user ? (
          <div className="flex gap-2">
            <Link
              href={`/login?next=${encodeURIComponent(currentPath)}`}
              className="text-sm font-medium underline"
            >
              Log in
            </Link>
            <span className="text-sm text-muted-foreground">or</span>
            <Link
              href={`/signup?next=${encodeURIComponent(currentPath)}`}
              className="text-sm font-medium underline"
            >
              sign up
            </Link>
            <span className="text-sm text-muted-foreground">to accept.</span>
          </div>
        ) : (
          <form action={acceptSharedGoalInvite}>
            <input type="hidden" name="token" value={token} />
            <Button type="submit">Accept invite</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
