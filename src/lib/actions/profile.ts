"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/dal";
import { currencySchema, type ProfileFormState } from "@/lib/validations/profile";

export async function updateCurrency(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const validatedFields = currencySchema.safeParse({
    currency: formData.get("currency"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const user = await requireUser();
  const supabase = await createClient();

  // upsert, not update: accounts created before the profile-creation trigger
  // existed (or any other reason the row might be missing) would otherwise
  // have this silently no-op — update() matches zero rows without erroring.
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, currency: validatedFields.data.currency });

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/", "layout");
}
