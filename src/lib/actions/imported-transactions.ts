"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/dal";
import { recordTransaction } from "@/lib/transactions";
import {
  approveImportedTransactionSchema,
  type ApproveImportedTransactionState,
} from "@/lib/validations/imported-transaction";

// Approving copies the (possibly edited) draft into the real transactions
// table via the same recordTransaction path the manual "Add transaction"
// form uses — so it emits transaction.created and runs budget-alert checks
// exactly like any other transaction. The draft row itself is never
// deleted; it's marked 'approved' with a pointer to the real row, keeping
// a permanent record of what was imported and when it was confirmed.
export async function approveImportedTransaction(
  _prevState: ApproveImportedTransactionState,
  formData: FormData,
): Promise<ApproveImportedTransactionState> {
  const validatedFields = approveImportedTransactionSchema.safeParse({
    id: formData.get("id"),
    amount: formData.get("amount"),
    kind: formData.get("kind"),
    description: formData.get("description"),
    occurredAt: formData.get("occurredAt"),
    categoryId: formData.get("categoryId"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { id, categoryId, occurredAt, ...rest } = validatedFields.data;
  const user = await requireUser();
  const supabase = await createClient();

  const result = await recordTransaction(supabase, user.id, {
    ...rest,
    categoryId,
    occurredAt,
  });

  if ("error" in result) {
    return { message: result.error };
  }

  const { error } = await supabase
    .from("imported_transactions")
    .update({
      status: "approved",
      reviewed_transaction_id: result.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/transactions/imports");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}

export async function rejectImportedTransaction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const user = await requireUser();
  const supabase = await createClient();

  await supabase
    .from("imported_transactions")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/transactions/imports");
  revalidatePath("/dashboard");
}
