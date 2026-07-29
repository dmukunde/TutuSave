import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Memoized per-request: safe to call from multiple Server Components
// without triggering duplicate network calls to Supabase Auth.
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
});

export async function requireUser() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

// Memoized per-request, same reasoning as getUser: pages that need the
// user's currency (Transactions, Budgets, Dashboard, Settings) all call
// this without triggering duplicate queries.
export const getProfile = cache(async () => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return data;
});
