import { NextRequest, NextResponse } from "next/server";
import { generateStory } from "@/lib/story";
import { Seed, DaasResponse } from "@/lib/types";

// POST /api/story
// Stage 2 — Story generation.
// Called after parent confirms the Daas brief.
// Receives seed + daasResponse. Returns { story: string }.

export async function POST(req: NextRequest) {
  try {
    const { seed, daas } = (await req.json()) as {
      seed: Seed;
      daas: DaasResponse;
    };

    if (!seed || !daas) {
      return NextResponse.json(
        { error: "seed and daas response required" },
        { status: 400 }
      );
    }

    const story = await generateStory(seed, daas);
    return NextResponse.json({ story });
  } catch (err) {
    console.error("[/api/story]", err);
    return NextResponse.json(
      { error: "Story generation failed" },
      { status: 500 }
    );
  }
}
