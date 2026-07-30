"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/dal";
import { computeNewMilestones, getSharedGoalTotals } from "@/lib/shared-goals";
import {
  createSharedGoalSchema,
  inviteMemberSchema,
  sharedContributionSchema,
  updateSplitSchema,
  type CreateSharedGoalFormState,
  type InviteMemberFormState,
  type SharedContributionFormState,
} from "@/lib/validations/shared-goal";

export async function createSharedGoal(
  _prevState: CreateSharedGoalFormState,
  formData: FormData,
): Promise<CreateSharedGoalFormState> {
  const validatedFields = createSharedGoalSchema.safeParse({
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    currency: formData.get("currency"),
    targetDate: formData.get("targetDate"),
    splitType: formData.get("splitType"),
    ownerSplitValue: formData.get("ownerSplitValue"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, targetAmount, currency, targetDate, splitType, ownerSplitValue } =
    validatedFields.data;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: goal, error: goalError } = await supabase
    .from("shared_goals")
    .insert({
      created_by: user.id,
      name,
      target_amount: targetAmount,
      currency,
      target_date: targetDate ?? null,
      split_type: splitType,
    })
    .select("id")
    .single();

  if (goalError || !goal) {
    return { message: goalError?.message ?? "Could not create goal." };
  }

  const { error: memberError } = await supabase.from("shared_goal_members").insert({
    shared_goal_id: goal.id,
    user_id: user.id,
    role: "owner",
    status: "active",
    split_value: splitType === "equal" ? null : (ownerSplitValue ?? null),
    joined_at: new Date().toISOString(),
  });

  if (memberError) {
    return { message: memberError.message };
  }

  revalidatePath("/goals");
  redirect(`/goals/shared/${goal.id}`);
}

export async function inviteMember(
  _prevState: InviteMemberFormState,
  formData: FormData,
): Promise<InviteMemberFormState> {
  const validatedFields = inviteMemberSchema.safeParse({
    sharedGoalId: formData.get("sharedGoalId"),
    email: formData.get("email"),
    splitValue: formData.get("splitValue"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { sharedGoalId, email, splitValue } = validatedFields.data;
  await requireUser();
  const supabase = await createClient();

  const { data: member, error } = await supabase
    .from("shared_goal_members")
    .insert({
      shared_goal_id: sharedGoalId,
      invited_email: email ?? null,
      split_value: splitValue ?? null,
    })
    .select("invite_token")
    .single();

  if (error || !member) {
    return {
      message:
        error?.message ??
        "Could not create invite. Only the goal owner can invite members, and one invite per email.",
    };
  }

  revalidatePath(`/goals/shared/${sharedGoalId}`);

  return { inviteLink: `/goals/shared/join/${member.invite_token}` };
}

// Used for both "revoke a pending invite" and "remove an active member" —
// the same soft-delete (status='removed') either way. Only the goal owner's
// update passes RLS for someone else's row; a member updating their own row
// is the "leave" flow below.
export async function removeMember(formData: FormData) {
  const memberId = formData.get("memberId");
  const sharedGoalId = formData.get("sharedGoalId");
  if (typeof memberId !== "string") return;

  await requireUser();
  const supabase = await createClient();

  await supabase.from("shared_goal_members").update({ status: "removed" }).eq("id", memberId);

  if (typeof sharedGoalId === "string") revalidatePath(`/goals/shared/${sharedGoalId}`);
}

export async function resendInvite(formData: FormData) {
  const memberId = formData.get("memberId");
  const sharedGoalId = formData.get("sharedGoalId");
  if (typeof memberId !== "string") return;

  await requireUser();
  const supabase = await createClient();

  await supabase
    .from("shared_goal_members")
    .update({ expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() })
    .eq("id", memberId);

  if (typeof sharedGoalId === "string") revalidatePath(`/goals/shared/${sharedGoalId}`);
}

export async function updateMemberSplit(formData: FormData) {
  const validatedFields = updateSplitSchema.safeParse({
    memberId: formData.get("memberId"),
    splitValue: formData.get("splitValue"),
  });
  if (!validatedFields.success) return;

  const sharedGoalId = formData.get("sharedGoalId");
  await requireUser();
  const supabase = await createClient();

  await supabase
    .from("shared_goal_members")
    .update({ split_value: validatedFields.data.splitValue })
    .eq("id", validatedFields.data.memberId);

  if (typeof sharedGoalId === "string") revalidatePath(`/goals/shared/${sharedGoalId}`);
}

// Owners can't leave their own goal (they'd orphan it) — delete it instead.
// The button for this is simply not rendered for the owner in the UI, but
// the check is repeated here since client-side hiding is never the real
// access control.
export async function leaveSharedGoal(formData: FormData) {
  const sharedGoalId = formData.get("sharedGoalId");
  if (typeof sharedGoalId !== "string") return;

  const user = await requireUser();
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("shared_goal_members")
    .select("id, role")
    .eq("shared_goal_id", sharedGoalId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role === "owner") return;

  await supabase.from("shared_goal_members").update({ status: "removed" }).eq("id", membership.id);

  redirect("/goals?tab=shared");
}

export async function deleteSharedGoal(formData: FormData) {
  const sharedGoalId = formData.get("sharedGoalId");
  if (typeof sharedGoalId !== "string") return;

  await requireUser();
  const supabase = await createClient();

  await supabase.from("shared_goals").delete().eq("id", sharedGoalId);

  redirect("/goals?tab=shared");
}

export async function acceptSharedGoalInvite(formData: FormData) {
  const token = formData.get("token");
  if (typeof token !== "string") return;

  const user = await requireUser();
  const supabase = await createClient();

  const { data: sharedGoalId, error } = await supabase.rpc("accept_shared_goal_invite", {
    p_token: token,
  });

  if (error || !sharedGoalId) {
    redirect(
      `/goals/shared/join/${token}?error=${encodeURIComponent(error?.message ?? "This invite is no longer valid.")}`,
    );
  }

  await supabase.rpc("notify_shared_goal_members", {
    p_goal_id: sharedGoalId,
    p_event_type: "shared_goal.member_joined",
    p_activity_type: "member_joined",
    p_actor_id: user.id,
    p_payload: {},
  });

  revalidatePath("/goals");
  redirect(`/goals/shared/${sharedGoalId}`);
}

export async function addSharedContribution(
  _prevState: SharedContributionFormState,
  formData: FormData,
): Promise<SharedContributionFormState> {
  const validatedFields = sharedContributionSchema.safeParse({
    sharedGoalId: formData.get("sharedGoalId"),
    amount: formData.get("amount"),
    contributedAt: formData.get("contributedAt"),
    note: formData.get("note"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { sharedGoalId, amount, contributedAt, note } = validatedFields.data;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: goal, error: goalError } = await supabase
    .from("shared_goals")
    .select("target_amount, milestones_reached, status")
    .eq("id", sharedGoalId)
    .single();

  if (goalError || !goal) {
    return { message: "Goal not found." };
  }

  const { data: contribution, error: contribError } = await supabase
    .from("shared_goal_contributions")
    .insert({
      shared_goal_id: sharedGoalId,
      contributed_by: user.id,
      amount,
      contributed_at: contributedAt,
      note: note ?? null,
    })
    .select("id")
    .single();

  if (contribError || !contribution) {
    return { message: contribError?.message ?? "Could not record contribution." };
  }

  const { total } = await getSharedGoalTotals(supabase, sharedGoalId);
  const pct = (total / Number(goal.target_amount)) * 100;
  const { all, newlyReached } = computeNewMilestones(goal.milestones_reached ?? [], pct);
  const newStatus = pct >= 100 && goal.status !== "completed" ? "completed" : null;

  if (newlyReached.length > 0 || newStatus) {
    await supabase.rpc("advance_shared_goal_status", {
      p_goal_id: sharedGoalId,
      p_milestones: all,
      p_status: newStatus,
    });
  }

  await supabase.rpc("notify_shared_goal_members", {
    p_goal_id: sharedGoalId,
    p_event_type: "shared_goal.contribution_added",
    p_activity_type: "contribution_added",
    p_actor_id: user.id,
    p_payload: { amount, contribution_id: contribution.id },
  });

  for (const milestone of newlyReached) {
    if (milestone === 100) continue; // covered by the completed event below
    await supabase.rpc("notify_shared_goal_members", {
      p_goal_id: sharedGoalId,
      p_event_type: "shared_goal.milestone_reached",
      p_activity_type: "milestone_reached",
      p_actor_id: user.id,
      p_payload: { milestone_pct: milestone },
    });
  }

  if (newStatus === "completed") {
    await supabase.rpc("notify_shared_goal_members", {
      p_goal_id: sharedGoalId,
      p_event_type: "shared_goal.completed",
      p_activity_type: "goal_completed",
      p_actor_id: user.id,
      p_payload: {},
    });
  }

  revalidatePath(`/goals/shared/${sharedGoalId}`);
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}
