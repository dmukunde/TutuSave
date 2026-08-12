import type { SupabaseClient } from "@supabase/supabase-js";
import { emitEvent } from "@/lib/events";
import { checkBudgetAlerts } from "@/lib/budgets";

// Shared by the manual "Add transaction" form and by approving an imported
// draft — both are "a real transaction now exists," so both go through the
// same event emission and budget-alert check rather than duplicating it.
export async function recordTransaction(
  supabase: SupabaseClient,
  userId: string,
  input: {
    amount: number;
    kind: string;
    categoryId?: string | null;
    description?: string | null;
    occurredAt: string;
  },
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      category_id: input.categoryId ?? null,
      amount: input.amount,
      kind: input.kind,
      description: input.description ?? null,
      occurred_at: input.occurredAt,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create transaction." };
  }

  await emitEvent(supabase, userId, "transaction.created", {
    transaction_id: data.id,
    amount: input.amount,
    kind: input.kind,
  });

  await checkBudgetAlerts(supabase, userId, {
    id: data.id,
    category_id: input.categoryId ?? null,
    kind: input.kind,
    amount: input.amount,
  });

  return { id: data.id };
}
