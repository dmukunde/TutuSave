import type { SupabaseClient } from "@supabase/supabase-js";

// Writes to the `events` outbox table. This is the seam n8n consumes from
// (via a Supabase DB Webhook on INSERT) to drive notifications, reminders,
// and other automations — the app never sends those itself.
export async function emitEvent(
  supabase: SupabaseClient,
  userId: string,
  eventType: string,
  payload: Record<string, unknown> = {},
) {
  const { error } = await supabase.from("events").insert({
    user_id: userId,
    event_type: eventType,
    payload,
  });

  if (error) {
    console.error(`Failed to emit event "${eventType}":`, error.message);
  }
}
