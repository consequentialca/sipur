import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logError } from "@/lib/log-error";

// POST /api/redeem-promo
// Body: { code: string, userId: string }
// Returns: { bonus_stories: number } on success, { error: string } on failure.

export async function POST(req: NextRequest) {
  try {
    const { code, userId } = (await req.json()) as {
      code?: string;
      userId?: string;
    };

    if (!code?.trim() || !userId) {
      return NextResponse.json({ error: "code and userId required" }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { data, error } = await db.rpc("redeem_promo_code", {
      p_code: code.trim().toUpperCase(),
      p_uid: userId,
    });

    if (error) {
      console.error("[/api/redeem-promo] rpc error:", error);
      void logError("/api/redeem-promo", error, { userId });
      return NextResponse.json({ error: "Failed to redeem code" }, { status: 500 });
    }

    const result = data as { ok: boolean; error?: string; bonus_stories?: number };

    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Invalid promo code" }, { status: 422 });
    }

    return NextResponse.json({ bonus_stories: result.bonus_stories });
  } catch (err) {
    console.error("[/api/redeem-promo]", err);
    void logError("/api/redeem-promo", err);
    return NextResponse.json({ error: "Failed to redeem code" }, { status: 500 });
  }
}
