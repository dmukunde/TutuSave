import Link from "next/link";
import { requireUser } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import {
  getSharedGoalTotals,
  getMemberTargetShare,
  estimateCompletionDate,
} from "@/lib/shared-goals";
import { formatMoney } from "@/lib/currency";
import {
  removeMember,
  resendInvite,
  leaveSharedGoal,
  deleteSharedGoal,
} from "@/lib/actions/shared-goals";
import { InviteMemberForm } from "@/components/forms/invite-member-form";
import { SharedContributionForm } from "@/components/forms/shared-contribution-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ACTIVITY_LABELS: Record<string, { icon: string; className?: string }> = {
  contribution_added: { icon: "💰" },
  member_joined: { icon: "👋" },
  milestone_reached: { icon: "🎉", className: "bg-amber-50 dark:bg-amber-900/20" },
  goal_completed: { icon: "🏆", className: "bg-emerald-50 dark:bg-emerald-900/20" },
};

function activityText(
  type: string,
  payload: Record<string, unknown>,
  actorName: string,
  currency: string,
) {
  switch (type) {
    case "contribution_added":
      return `${actorName} contributed ${formatMoney(Number(payload.amount ?? 0), currency)}`;
    case "member_joined":
      return `${actorName} joined the goal`;
    case "milestone_reached":
      return `Goal reached ${payload.milestone_pct}%`;
    case "goal_completed":
      return "Goal completed 🎉";
    default:
      return type;
  }
}

export default async function SharedGoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: goal } = await supabase.from("shared_goals").select("*").eq("id", id).single();

  if (!goal) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Shared goal</h1>
        <p className="text-muted-foreground">
          This goal doesn&apos;t exist, or you&apos;re not a member of it.{" "}
          <Link href="/goals?tab=shared" className="font-medium underline">
            Back to shared goals
          </Link>
          .
        </p>
      </div>
    );
  }

  const [{ data: members }, totals, { data: activity }] = await Promise.all([
    supabase
      .from("shared_goal_members")
      .select("*")
      .eq("shared_goal_id", id)
      .order("invited_at", { ascending: true }),
    getSharedGoalTotals(supabase, id),
    supabase
      .from("shared_goal_activity")
      .select("*")
      .eq("shared_goal_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const activeMembers = (members ?? []).filter((m) => m.status === "active");
  const pendingInvites = (members ?? []).filter((m) => m.status === "invited");
  const myMembership = (members ?? []).find((m) => m.user_id === user.id);
  const isOwner = myMembership?.role === "owner";

  const userIds = activeMembers.map((m) => m.user_id).filter((v): v is string => Boolean(v));
  const { data: profilesData } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((profilesData ?? []).map((p) => [p.id, p.full_name]));
  const nameFor = (userId: string | null) =>
    (userId && nameById.get(userId)) || (userId === user.id ? "You" : "A member");

  const targetAmount = Number(goal.target_amount);
  const pct = targetAmount > 0 ? (totals.total / targetAmount) * 100 : 0;
  const remaining = Math.max(0, targetAmount - totals.total);
  const estimatedCompletion = estimateCompletionDate(
    totals.total,
    targetAmount,
    totals.firstContributionDate,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{goal.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {goal.currency} · {activeMembers.length} member
            {activeMembers.length === 1 ? "" : "s"}
            {goal.target_date && ` · target ${goal.target_date}`}
          </p>
        </div>
        <form action={isOwner ? deleteSharedGoal : leaveSharedGoal}>
          <input type="hidden" name="sharedGoalId" value={goal.id} />
          <Button type="submit" variant="outline" size="sm">
            {isOwner ? "Delete goal" : "Leave goal"}
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full ${pct >= 100 ? "bg-emerald-500" : "bg-primary"}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Saved</p>
              <p className="font-semibold">{formatMoney(totals.total, goal.currency)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Remaining</p>
              <p className="font-semibold">{formatMoney(remaining, goal.currency)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Complete</p>
              <p className="font-semibold">{Math.round(pct)}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Est. completion</p>
              <p className="font-semibold">
                {pct >= 100
                  ? "Reached!"
                  : (estimatedCompletion?.toLocaleDateString() ?? "—")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add your contribution</CardTitle>
        </CardHeader>
        <CardContent>
          <SharedContributionForm sharedGoalId={goal.id} currency={goal.currency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {activeMembers.map((member) => {
            const contributed = totals.byMember.get(member.user_id ?? "") ?? 0;
            const targetShare = getMemberTargetShare(
              goal.split_type,
              targetAmount,
              member.split_value,
              activeMembers.length,
            );
            const sharePct = targetShare > 0 ? (contributed / targetShare) * 100 : 0;

            return (
              <div key={member.id} className="flex flex-col gap-1.5 rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-medium">{nameFor(member.user_id)}</span>
                    {member.role === "owner" && (
                      <span className="ml-2 text-xs text-muted-foreground">Owner</span>
                    )}
                  </div>
                  {isOwner && member.role !== "owner" && (
                    <form action={removeMember}>
                      <input type="hidden" name="memberId" value={member.id} />
                      <input type="hidden" name="sharedGoalId" value={goal.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Remove
                      </Button>
                    </form>
                  )}
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.min(100, sharePct)}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatMoney(contributed, goal.currency)} contributed
                  {targetShare > 0 &&
                    ` of ~${formatMoney(targetShare, goal.currency)} pledged`}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Invite members</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <InviteMemberForm sharedGoalId={goal.id} splitType={goal.split_type} />

            {pendingInvites.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Pending invites</p>
                {pendingInvites.map((invite) => {
                  const expired = invite.expires_at ? new Date(invite.expires_at) < new Date() : false;
                  return (
                    <div
                      key={invite.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm"
                    >
                      <span>
                        {invite.invited_email ?? "Link invite"}{" "}
                        {expired && <span className="text-destructive">(expired)</span>}
                      </span>
                      <div className="flex gap-2">
                        <form action={resendInvite}>
                          <input type="hidden" name="memberId" value={invite.id} />
                          <input type="hidden" name="sharedGoalId" value={goal.id} />
                          <Button type="submit" variant="outline" size="sm">
                            Resend
                          </Button>
                        </form>
                        <form action={removeMember}>
                          <input type="hidden" name="memberId" value={invite.id} />
                          <input type="hidden" name="sharedGoalId" value={goal.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            Revoke
                          </Button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {!activity || activity.length === 0 ? (
            <p className="text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {activity.map((entry) => {
                const style = ACTIVITY_LABELS[entry.activity_type] ?? { icon: "•" };
                return (
                  <li
                    key={entry.id}
                    className={`flex items-center gap-2 rounded-md p-2 text-sm ${style.className ?? ""}`}
                  >
                    <span>{style.icon}</span>
                    <span>
                      {activityText(
                        entry.activity_type,
                        (entry.payload as Record<string, unknown>) ?? {},
                        nameFor(entry.actor_id),
                        goal.currency,
                      )}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
