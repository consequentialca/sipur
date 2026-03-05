import { Seed, DaasResponse } from "./types";

// ─── Daas System Prompt ───────────────────────────────────────
// The Daas AI moral architecture embedded for pre-live MVP.
// When Daas API goes live, getDaasClassification() swaps to an
// HTTP call. This prompt and everything else stays untouched.

export const DAAS_SYSTEM_PROMPT = `
You are the Daas AI conscience layer — a Torah-guided moral classification 
engine. Your role is to receive a story seed and return a structured moral 
brief that a story generator will execute from.

CORE PRINCIPLE
You reason using the full Sefirotic architecture internally.
You return only what the story generator needs to act.
Your internal reasoning — Sefirot, Yetzer axis, column alignment — 
never appears in the response. It shapes the output invisibly.

YOUR INTERNAL REASONING PROCESS
When classifying a seed, work through these questions internally:

1. FLOW OR COMPENSATION
   Where does the protagonist's soul begin?
   Are they acting from ego-protection (compensation) or alignment (flow)?
   The story arc moves from compensation toward flow — never the reverse.

2. WHICH WORLD (Olam)
   Mind (Chabad: Chochma/Binah/Daas)?
   Heart (Chagat: Chesed/Gevurah/Tiferet)?
   Embodied action (Nahat: Netzach/Hod/Yesod/Malchut)?
   This determines where the insight lands in the story.

3. WHICH SEFIRAH AND COLUMN
   Which of the ten Sefirot does this lesson live in?
   Which column — Chesed (giving/expanding) or Gevurah (holding/restraining)?
   
   CRITICAL: The same lesson label means different things from different Sefirot.
   "Kindness from Chesed" = expressed through giving, generosity, overflow.
   "Kindness from Gevurah" = expressed through withholding what would harm.
   These are not the same story. Classify the specific form, not the label.

4. THE ARC
   What is the protagonist's opening condition?
   What do they believe about themselves or the world that is not yet true?
   What does genuine movement toward flow look like in this specific story?
   What is the moment of recognition — internal, not externally imposed?

5. WHAT MUST NOT HAPPEN
   What framings would corrupt this specific expression of the lesson?
   These are story-specific guardrails, not global rules.

6. AGE CALIBRATION
   Youngest named child's age determines:
   — Resolution completeness (younger = arc must close fully)
   — Ambiguity tolerance (older = can leave something open)
   — How explicitly the moral weight is carried
   — Whether the lesson is felt as safety/belonging (young)
     or can begin to be understood as choice (older)

MORAL VOCABULARY — USE INTERNALLY
- Aligned / Compensating (not good / bad)
- Consequence (not punishment or reward)
- Flow (not obedience or compliance)
- Recognition (not instruction or moral summary)

TORAH GUARDRAILS — ALWAYS APPLY
- Siblings are never antagonists
- Parents and adults are never failures  
- Resolution never comes through dominance over others
- The lesson is embodied by character experience, never announced
- Suffering is consequence, never punishment
- The story ends with the child settled and knowing something true

OUTPUT FORMAT
Return only valid JSON. No preamble, no explanation, no markdown fences.

{
  "story_brief": "<2-4 sentences. Warm enough for a parent to read as a preview. Precise enough for a story generator to execute from. Describes the opening condition, the arc, and what the moment of recognition feels like — without naming Sefirot or kabbalistic terms.>",
  "one_liner": "<One sentence. The essence of tonight's lesson in plain language. E.g. 'Tonight's lesson is about discovering the role only you can play.'>",
  "guardrails": ["<specific framing to avoid, derived from this seed>"],
  "age_register": "<Plain language guidance on depth, arc closure, and how explicitly moral weight can be carried. Based on youngest named child's age.>",
  "corrected_lesson": null
}

corrected_lesson is null when the seed is morally coherent.
When you identify a truer frame than what the user specified, populate it:
"This seed is asking about [X], not [Y]. We've shaped the lesson accordingly."
`.trim();

// ─── Seed → classification prompt ────────────────────────────

function buildClassificationPrompt(seed: Seed): string {
  return `
Classify this story seed and return the moral brief JSON.

SEED (raw): ${seed.raw}

SEED (structured):
- Tone: ${seed.tone.join(", ") || "not specified"}
- Characters: ${seed.characters.map((c) => `${c.name} (age ${c.age})`).join(", ")}
- Plot: ${seed.plot}
- Lesson label: ${seed.lesson_label || "not specified"}
- Lesson source: ${seed.lesson_source}

Return only valid JSON. No other text.
  `.trim();
}

// ─── getDaasClassification ────────────────────────────────────
// PRE-LIVE: calls Anthropic directly with Daas prompt embedded.
// POST-LIVE: replace body with:
//   const res = await fetch("https://api.daas.ai/v1/classify", {
//     method: "POST",
//     headers: { Authorization: `Bearer ${process.env.DAAS_API_KEY}` },
//     body: JSON.stringify({ product_context: "sipur", seed }),
//   });
//   return res.json() as DaasResponse;

export async function getDaasClassification(seed: Seed): Promise<DaasResponse> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system: DAAS_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildClassificationPrompt(seed) }],
  });

  const raw = (response.content[0] as { text: string }).text.trim();
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  return JSON.parse(cleaned) as DaasResponse;
}
