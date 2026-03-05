import { NextRequest, NextResponse } from "next/server";
import { getDaasClassification } from "@/lib/daas";
import { Seed } from "@/lib/types";

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
    return NextResponse.json(
      { error: "Daas classification failed" },
      { status: 500 }
    );
  }
}
