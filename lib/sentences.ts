/**
 * Splits story text into individual sentences.
 * Used by both the TTS route (server) and PlaybackScreen (client)
 * so that sentenceIdx values align perfectly.
 */
export function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+/g);
  return (matches ?? [text]).map((s) => s.trim()).filter(Boolean);
}
