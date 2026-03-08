import { NextRequest, NextResponse } from "next/server";

// POST /api/suggest
// Generates a single chip field value using Claude, given the current seed context.

const TONES = ["Funny", "Heartwarming", "Cute", "Emotional", "Adventurous", "Calm & Dreamy"];

const FIELD_INSTRUCTIONS: Record<string, string> = {
  tone: `Choose 1 or 2 tones from this list that would produce the most entertaining and cohesive bedtime story given the context: ${TONES.join(", ")}.
Return JSON: { "value": ["Tone1"] } or { "value": ["Tone1", "Tone2"] }`,

  plot: `Invent a surprising, delightful one-sentence plot premise for a children's bedtime story. Describe the situation or challenge the characters face — do not mention character names (they are added separately). Be vivid and inventive. Avoid clichés.
Return JSON: { "value": "..." }`,

  lesson: `Suggest a single relatable life lesson theme for children, expressed as a short phrase (3–6 words, lowercase).
Return JSON: { "value": "..." }`,

  character: `Invent one child character for a bedtime story — a culturally diverse, universally relatable first name and a realistic age between 3 and 10. No bias toward any culture or religion. The name should be warm and easy to pronounce aloud.
Return JSON: { "value": { "name": "...", "age": ... } }`,
};

export async function POST(req: NextRequest) {
  try {
    const { field, context } = (await req.json()) as {
      field: "tone" | "plot" | "lesson" | "character";
      context: {
        tones: string[];
        characters: { name: string; age: number }[];
        plot: string;
        lesson: string;
      };
    };

    if (!FIELD_INSTRUCTIONS[field]) {
      return NextResponse.json({ error: "Unknown field" }, { status: 400 });
    }

    // Build context string from what the user has already filled
    const contextParts = [
      context.tones.length > 0 && `Tone: ${context.tones.join(", ")}`,
      context.characters.length > 0 &&
        `Characters: ${context.characters.map((c) => `${c.name} (age ${c.age})`).join(", ")}`,
      context.plot && `Plot: ${context.plot}`,
      context.lesson && `Lesson theme: ${context.lesson}`,
    ].filter(Boolean);

    const userMessage =
      contextParts.length > 0
        ? `Current story context:\n${contextParts.join("\n")}\n\n${FIELD_INSTRUCTIONS[field]}`
        : FIELD_INSTRUCTIONS[field];

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 256,
      system:
        "You generate single field suggestions for a children's bedtime story builder. " +
        "Maximize for entertainment, surprise, and warmth. " +
        "No cultural, religious, or ethnic bias — suggestions must feel natural in any family's home anywhere in the world. " +
        "Return only valid JSON. No explanation, no markdown.",
      messages: [{ role: "user", content: userMessage }],
    });

    const raw = (response.content[0] as { text: string }).text.trim();
    // Strip markdown code fences if present
    const text = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/api/suggest]", err);
    return NextResponse.json({ error: "Suggestion failed", detail: msg }, { status: 500 });
  }
}
