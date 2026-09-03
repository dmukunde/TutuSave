"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/dal";

// Called from the Settings page render. Upserts on first visit — same
// precedent as updateCurrency in profile.ts — so a forwarding address
// exists as soon as someone opens Settings, no separate "activate" step.
export async function ensureEmailConnection() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("email_connections")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return existing;

  const { data } = await supabase
    .from("email_connections")
    .upsert({ user_id: user.id }, { onConflict: "user_id" })
    .select()
    .single();

  return data;
}

export async function regenerateForwardToken() {
  const user = await requireUser();
  const supabase = await createClient();

  await supabase
    .from("email_connections")
    .update({ forward_token: randomUUID() })
    .eq("user_id", user.id);

  revalidatePath("/settings");
}
