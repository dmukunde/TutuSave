"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/dal";
import { budgetSchema, type BudgetFormState } from "@/lib/validations/budget";

export async function createBudget(
  _prevState: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const validatedFields = budgetSchema.safeParse({
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    periodType: formData.get("periodType"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    alertThresholdPct: formData.get("alertThresholdPct"),
    excludeFromOverall: formData.get("excludeFromOverall"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const {
    categoryId,
    periodType,
    startDate,
    endDate,
    alertThresholdPct,
    amount,
    excludeFromOverall,
  } = validatedFields.data;
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("budgets").insert({
    user_id: user.id,
    category_id: categoryId ?? null,
    amount,
    period_type: periodType,
    start_date: startDate,
    end_date: endDate ?? null,
    alert_threshold_pct: alertThresholdPct,
    // Only meaningful for category budgets; an overall budget can't be one-off.
    exclude_from_overall: categoryId ? excludeFromOverall : false,
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}

// Flips an existing category budget between "one-off" (separate from the
// Overall budget) and counted-in-Overall.
export async function setBudgetOneOff(formData: FormData) {
  const id = formData.get("id");
  const value = formData.get("value");
  if (typeof id !== "string" || (value !== "true" && value !== "false")) return;

  const user = await requireUser();
  const supabase = await createClient();

  await supabase
    .from("budgets")
    .update({ exclude_from_overall: value === "true" })
    .eq("id", id)
    .eq("user_id", user.id)
    .not("category_id", "is", null);

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}

export async function deleteBudget(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const user = await requireUser();
  const supabase = await createClient();

  await supabase.from("budgets").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/budgets");
}
