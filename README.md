# Sipur — סיפור
### A Torah-guided bedtime story app for Jewish children

---

## Setup

```bash
npm install
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Architecture

### Two-stage pipeline

```
Seed confirmed
    ↓
POST /api/daas          ← Stage 1: Daas classification
    ↓
PAUSE — parent sees     ← one_liner + story_brief surfaced in UI
one_liner + brief           parent confirms or edits seed
    ↓
POST /api/story         ← Stage 2: Story generation
    ↓
Playback                ← Text now, ElevenLabs TTS next
```

### Key files

```
lib/
  types.ts          — Shared types (Seed, DaasResponse, AppState)
  daas.ts           — getDaasClassification() + DAAS_SYSTEM_PROMPT
  story.ts          — generateStory() + prompt assembly

app/
  page.tsx          — Stage orchestrator (compose → confirm → generate → playback)
  api/daas/route.ts — POST /api/daas (Stage 1)
  api/story/route.ts — POST /api/story (Stage 2)

components/
  ComposeScreen.tsx  — Seed sentence UI with color-coded chips
  ConfirmScreen.tsx  — Daas brief review (the pause point)
  GeneratingScreen.tsx — Loading state during Stage 2
  PlaybackScreen.tsx  — Story display (TTS coming)
  StarField.tsx      — Background stars
```

---

## Swapping Daas to live API

When the Daas API goes live, edit one function in `lib/daas.ts`:

```typescript
// Replace this:
export async function getDaasClassification(seed: Seed): Promise<DaasResponse> {
  // ... internal Anthropic call ...
}

// With this:
export async function getDaasClassification(seed: Seed): Promise<DaasResponse> {
  const res = await fetch("https://api.daas.ai/v1/classify", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.DAAS_API_KEY}` },
    body: JSON.stringify({ product_context: "sipur", seed }),
  });
  return res.json();
}
```

Nothing else changes.

---

## Next integrations

1. **ElevenLabs TTS** — `PlaybackScreen.tsx`, slot in after story text is ready
2. **Image generation** — Replicate/fal.ai, story cover on `GeneratingScreen`
3. **Daas API** — swap `getDaasClassification()` as above
4. **Name memory** — Vercel KV, persist characters across sessions
5. **Vercel deployment** — `vercel deploy`, add env vars in dashboard
