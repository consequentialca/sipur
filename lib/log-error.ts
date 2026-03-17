import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function logError(
  route: string,
  err: unknown,
  opts?: { userId?: string; metadata?: Record<string, unknown> }
) {
  const message = err instanceof Error ? err.message : String(err);
  try {
    const db = getSupabaseAdmin();
    await db.from("error_logs").insert({
      route,
      error_message: message,
      user_id: opts?.userId ?? null,
      metadata: opts?.metadata ?? null,
    });
  } catch (e) {
    console.error("[logError] failed to write to error_logs:", e);
  }
}
