import { NextRequest, NextResponse } from "next/server";
import { generateStory } from "@/lib/story";
import { Seed, DaasResponse } from "@/lib/types";
import { logError } from "@/lib/log-error";
import { checkRateLimit } from "@/lib/rate-limit";

// POST /api/story
// Stage 2 — Story generation.
// Called after parent confirms the Daas brief.
// Receives seed + daasResponse. Returns { story: string }.

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(`story:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before generating another story." },
      { status: 429 }
    );
  }

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
    void logError("/api/story", err);
    const apiStatus = (err as { status?: number }).status;
    if (apiStatus === 529 || apiStatus === 500) {
      return NextResponse.json(
        { error: "That story was so good it broke our machine — give us a moment and try again." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Story generation failed" },
      { status: 500 }
    );
  }
}
