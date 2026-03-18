/**
 * Splits story text into individual sentences.
 * Used by both the TTS route (server) and PlaybackScreen (client)
 * so that sentenceIdx values align perfectly.
 */
export function splitSentences(text: string): string[] {
  // Temporarily replace ellipsis (...) with a placeholder so it isn't treated
  // as three sentence boundaries, then restore after splitting.
  const placeholder = "\u2026"; // …
  const normalized = text.replace(/\.{2,}/g, placeholder);
  const matches = normalized.match(/[^.!?]+[.!?…]+/g);
  return (matches ?? [text])
    .map((s) => s.replace(new RegExp(placeholder, "g"), "...").trim())
    .filter(Boolean);
}
