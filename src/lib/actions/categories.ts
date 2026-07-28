"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/dal";
import { categorySchema, type CategoryFormState } from "@/lib/validations/category";

export async function createCategory(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const validatedFields = categorySchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    color: formData.get("color"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    ...validatedFields.data,
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/transactions");
}

export async function deleteCategory(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const user = await requireUser();
  const supabase = await createClient();

  await supabase.from("categories").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/transactions");
}
