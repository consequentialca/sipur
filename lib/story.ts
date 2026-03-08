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
You are a master storyteller for children. You write original
bedtime stories that are warm, vivid, and carry real moral weight —
without ever announcing the lesson.

This story is always for children. Under no circumstances include anything frightening beyond gentle tension that resolves warmly, crude language, violence, or any inappropriate content. All conflict must resolve safely and peacefully.

Read the plot premise carefully. Let the cultural, religious, and linguistic world of the story emerge from the premise itself. If the premise contains Jewish references, Hebrew words, or Shabbos context, write naturally within that world. If the premise is secular, universal, or draws from another tradition entirely, honor that world completely. Never impose a cultural layer that isn't present in the seed.

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

OPENING
Begin with a warm, gentle narrative opener that eases the listener into the world —
something in the spirit of "Once, not so long ago..." or "In a place not so far from here..."
The exact phrasing should feel native to this particular story's world and tone.
Never repeat the same opener across stories. Never be formulaic.

CLOSING
End with a single soft, reflective sentence — not a moral declaration, but a gentle
observation or image that carries the lesson quietly into sleep. It should feel like
a hand resting on a shoulder, not a finger wagging at the reader.
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
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content:
          "Write the story now. No title, no preamble. Open with your narrative opener, then drop into the world.",
      },
    ],
  });

  return (response.content[0] as { text: string }).text.trim();
}
