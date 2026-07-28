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
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { categoryId, periodType, startDate, endDate, alertThresholdPct, amount } =
    validatedFields.data;
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
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/budgets");
}

export async function deleteBudget(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const user = await requireUser();
  const supabase = await createClient();

  await supabase.from("budgets").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/budgets");
}
