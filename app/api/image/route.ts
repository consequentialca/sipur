import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { Seed } from "@/lib/types";

// POST /api/image
// Generates a story cover image via fal.ai flux/schnell.
// Body: { seed: Seed, storyBrief: string }
// Returns: { imageUrl: string }

fal.config({ credentials: process.env.FAL_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { seed, storyBrief } = (await req.json()) as {
      seed: Seed;
      storyBrief: string;
    };

    if (!seed || !storyBrief) {
      return NextResponse.json(
        { error: "seed and storyBrief required" },
        { status: 400 }
      );
    }

    const characters = seed.characters
      .map((c) => `${c.name} (age ${c.age})`)
      .join(" and ");

    const prompt = [
      `A warm, dreamlike illustrated scene for a Jewish children's book.`,
      `Characters: ${characters}.`,
      `Scene: ${seed.plot}.`,
      `Mood: ${seed.tone.join(", ")}.`,
      `Lesson: ${seed.lesson_label}.`,
      `Style: soft watercolor, warm golden tones, illustrated storybook, cozy and magical, no text, no words, no letters.`,
    ].join(" ");

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: "portrait_4_3",
        num_images: 1,
        num_inference_steps: 4,
      },
    });

    const imageUrl = (result.data as { images: { url: string }[] }).images[0]?.url;

    if (!imageUrl) {
      return NextResponse.json({ error: "No image returned" }, { status: 500 });
    }

    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error("[/api/image]", err);
    return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
  }
}
