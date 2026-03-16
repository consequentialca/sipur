import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// POST /api/tts
// Converts story text to speech via OpenAI TTS.
// Splits text at sentence boundaries to stay under the 4096-char API limit.
// Body: { story: string }
// Returns: audio/mpeg binary stream

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_CHUNK = 4000;

function splitIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  let remaining = text.trim();

  while (remaining.length > MAX_CHUNK) {
    const window = remaining.slice(0, MAX_CHUNK);
    const cut = window.lastIndexOf(".");
    if (cut === -1) {
      const chunk = remaining.slice(0, MAX_CHUNK).trim();
      if (chunk.length > 0) chunks.push(chunk);
      remaining = remaining.slice(MAX_CHUNK).trim();
    } else {
      const chunk = remaining.slice(0, cut + 1).trim();
      if (chunk.length > 0) chunks.push(chunk);
      remaining = remaining.slice(cut + 1).trim();
    }
  }

  const last = remaining.trim();
  if (last.length > 0) chunks.push(last);
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const { story } = (await req.json()) as { story: string };

    if (!story?.trim()) {
      return NextResponse.json({ error: "story text required" }, { status: 400 });
    }

    const chunks = splitIntoChunks(story);
    const buffers: Buffer[] = [];

    for (let ci = 0; ci < chunks.length; ci++) {
      const isLast = ci === chunks.length - 1;
      const chunk = isLast ? `... ${chunks[ci]}` : chunks[ci];
      const response = await client.audio.speech.create({
        model: "tts-1-hd",
        voice: "sage",
        input: chunk,
        speed: 0.9,
        response_format: "mp3",
      });
      buffers.push(Buffer.from(await response.arrayBuffer()));
    }

    const combined = Buffer.concat(buffers);

    return new NextResponse(combined, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(combined.byteLength),
      },
    });
  } catch (err) {
    console.error("[/api/tts]", err);
    return NextResponse.json({ error: "TTS generation failed" }, { status: 500 });
  }
}
