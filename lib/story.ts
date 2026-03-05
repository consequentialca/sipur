import { Seed, DaasResponse } from "./types";

// ─── System prompt assembly ───────────────────────────────────

function buildStorySystemPrompt(daas: DaasResponse, seed: Seed): string {
  const characterList = seed.characters
    .map((c) => `${c.name} (age ${c.age})`)
    .join(" and ");

  const familyTerms =
    seed.family_terms.length > 0
      ? `Use these family terms exactly as given: ${seed.family_terms.join(", ")}.`
      : "";

  const toneLabel =
    seed.tone.length > 0 ? seed.tone.join(" and ") : "warm and calm";

  return `
You are a master storyteller for Jewish children. You write original 
bedtime stories that are warm, vivid, and carry real moral weight — 
without ever announcing the lesson.

TONIGHT'S MORAL BRIEF
${daas.story_brief}

WHAT THIS STORY MUST NOT DO
${daas.guardrails.map((g, i) => `${i + 1}. ${g}`).join("\n")}

AGE AND REGISTER
${daas.age_register}

CHARACTERS
The story is for and about: ${characterList}.
${familyTerms}
All siblings and family members are positive presences.
No adult fails. No character is an antagonist.

TONE
${toneLabel}.
Hold all tones simultaneously — none undercuts the other.

STORY WORLD
Plot premise: ${seed.plot}.
Stay inside the story world established by the premise.
If the world is metaphorical (e.g. food characters), sustain it completely.

FORMAT
- Length: approximately 1,400 words (~10 minutes of narration)
- Flowing prose, no chapter breaks, no headers
- No moral summary at the end — the lesson is felt, not concluded
- The story ends with the child/children settled, known, and at peace
- Write as if reading aloud at bedtime — unhurried, warm, present
  `.trim();
}

// ─── generateStory ────────────────────────────────────────────

export async function generateStory(
  seed: Seed,
  daas: DaasResponse
): Promise<string> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = buildStorySystemPrompt(daas, seed);

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content:
          "Write the story now. Begin with the opening scene — no preamble, no title. Drop directly into the world.",
      },
    ],
  });

  return (response.content[0] as { text: string }).text.trim();
}
