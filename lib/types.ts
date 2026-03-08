// ─── Seed ────────────────────────────────────────────────────

export interface Character {
  name: string;
  age: number;
}

export interface Seed {
  raw: string;
  tone: string[];
  characters: Character[];
  plot: string;
  lesson_label: string;
  lesson_source: "list_selected" | "freeform" | "generated";
  family_terms: string[];
}

// ─── Daas Response Contract (frozen) ─────────────────────────

export interface DaasResponse {
  story_brief: string;       // moral brief — shown to parent, used by story generator
  one_liner: string;         // single sentence — shown to parent as preview
  guardrails: string[];      // framings the story must actively avoid
  age_register: string;      // depth/closure/register guidance from youngest child's age
  corrected_lesson: string | null; // null if seed coherent; plain-language reframe if not
}

// ─── App State ────────────────────────────────────────────────

export type AppStage =
  | "compose"     // user is building the seed sentence
  | "classifying" // Stage 1 running — Daas call in flight
  | "confirm"     // Daas returned — parent reviews one_liner + story_brief
  | "generating"  // Stage 2 running — story being written
  | "preparing"   // story ready, TTS being fetched + durations measured
  | "playback";   // audio ready — narration can begin

export interface AppState {
  stage: AppStage;
  seed: Seed | null;
  daas: DaasResponse | null;
  story: string | null;
  audioUrl: string | null;
  error: string | null;
}
