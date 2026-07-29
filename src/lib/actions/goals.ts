"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/dal";
import { emitEvent } from "@/lib/events";
import { checkGoalCompletion } from "@/lib/goals";
import {
  goalSchema,
  contributionSchema,
  type GoalFormState,
  type ContributionFormState,
} from "@/lib/validations/goal";

export async function createGoal(
  _prevState: GoalFormState,
  formData: FormData,
): Promise<GoalFormState> {
  const validatedFields = goalSchema.safeParse({
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    targetDate: formData.get("targetDate"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, targetAmount, targetDate } = validatedFields.data;
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("savings_goals").insert({
    user_id: user.id,
    name,
    target_amount: targetAmount,
    target_date: targetDate ?? null,
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/goals");
}

export async function deleteGoal(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const user = await requireUser();
  const supabase = await createClient();

  await supabase.from("savings_goals").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/goals");
}

export async function addContribution(
  _prevState: ContributionFormState,
  formData: FormData,
): Promise<ContributionFormState> {
  const validatedFields = contributionSchema.safeParse({
    goalId: formData.get("goalId"),
    amount: formData.get("amount"),
    note: formData.get("note"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { goalId, amount, note } = validatedFields.data;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: goal, error: goalError } = await supabase
    .from("savings_goals")
    .select("target_amount")
    .eq("id", goalId)
    .single();

  if (goalError || !goal) {
    return { message: "Goal not found." };
  }

  const { data, error } = await supabase
    .from("goal_contributions")
    .insert({
      user_id: user.id,
      goal_id: goalId,
      amount,
      note: note ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { message: error.message };
  }

  await emitEvent(supabase, user.id, "goal.contribution_added", {
    goal_id: goalId,
    contribution_id: data.id,
    amount,
  });

  await checkGoalCompletion(supabase, user.id, {
    id: data.id,
    goalId,
    amount,
    targetAmount: Number(goal.target_amount),
  });

  revalidatePath("/goals");
}
