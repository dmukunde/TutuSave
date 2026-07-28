"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/dal";
import { emitEvent } from "@/lib/events";
import {
  transactionSchema,
  type TransactionFormState,
} from "@/lib/validations/transaction";

export async function createTransaction(
  _prevState: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const validatedFields = transactionSchema.safeParse({
    amount: formData.get("amount"),
    kind: formData.get("kind"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description"),
    occurredAt: formData.get("occurredAt"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { categoryId, occurredAt, ...rest } = validatedFields.data;
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      category_id: categoryId ?? null,
      occurred_at: occurredAt,
      ...rest,
    })
    .select("id")
    .single();

  if (error) {
    return { message: error.message };
  }

  await emitEvent(supabase, user.id, "transaction.created", {
    transaction_id: data.id,
    amount: rest.amount,
    kind: rest.kind,
  });

  revalidatePath("/transactions");
}

export async function deleteTransaction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const user = await requireUser();
  const supabase = await createClient();

  await supabase.from("transactions").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/transactions");
}
