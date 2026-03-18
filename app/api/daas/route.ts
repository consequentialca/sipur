import { NextRequest, NextResponse } from "next/server";
import { getDaasClassification } from "@/lib/daas";
import { Seed } from "@/lib/types";
import { logError } from "@/lib/log-error";

// POST /api/daas
// Stage 1 — Daas classification.
// Called after seed is confirmed. Returns DaasResponse.
// Frontend pauses here — shows parent one_liner + story_brief.
// Parent confirms → frontend calls /api/story (Stage 2).

export async function POST(req: NextRequest) {
  try {
    const { seed } = (await req.json()) as { seed: Seed };

    if (!seed) {
      return NextResponse.json({ error: "seed required" }, { status: 400 });
    }

    const daas = await getDaasClassification(seed);
    return NextResponse.json(daas);
  } catch (err) {
    console.error("[/api/daas]", err);
    void logError("/api/daas", err);
    const apiStatus = (err as { status?: number }).status;
    if (apiStatus === 529 || apiStatus === 500) {
      return NextResponse.json(
        { error: "That story was so good it broke our machine — give us a moment and try again." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Daas classification failed" },
      { status: 500 }
    );
  }
}
