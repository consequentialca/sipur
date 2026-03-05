"use client";

import { Seed } from "@/lib/types";

export default function PlaybackScreen({ story, seed, onReset }: {
  story: string;
  seed: Seed;
  onReset: () => void;
}) {
  const firstName = seed.characters[0]?.name ?? "the story";

  return (
    <div className="animate-fade-in">
      <div style={{
        background: "rgba(255,255,255,0.025)", border: "1px solid rgba(245,230,200,0.07)",
        borderRadius: 22, padding: "30px 34px", backdropFilter: "blur(10px)",
        boxShadow: "0 2px 50px rgba(0,0,0,0.35)",
        marginBottom: 24, maxHeight: "60vh", overflowY: "auto",
      }}>
        <div style={{
          fontSize: 11, letterSpacing: "0.3em", color: "rgba(245,230,200,0.2)",
          textTransform: "uppercase", marginBottom: 20,
        }}>
          {firstName}'s Story
        </div>

        <div style={{ fontSize: 17, lineHeight: 1.85, color: "rgba(245,230,200,0.7)", fontWeight: 300 }}>
          {story.split("\n\n").map((para, i) => (
            <p key={i} style={{ marginBottom: 16 }}>{para}</p>
          ))}
        </div>
      </div>

      {/* TTS placeholder */}
      <div style={{
        padding: "12px 20px", borderRadius: 14, marginBottom: 24,
        background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)",
        fontSize: 13, color: "rgba(212,175,55,0.5)", fontStyle: "italic",
        textAlign: "center", letterSpacing: "0.05em",
      }}>
        ✦ Audio narration — ElevenLabs integration coming next
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          onClick={onReset}
          style={{
            padding: "11px 28px", borderRadius: 40,
            border: "1px solid rgba(245,230,200,0.12)",
            background: "rgba(255,255,255,0.03)",
            color: "rgba(245,230,200,0.45)",
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 14, letterSpacing: "0.15em", cursor: "pointer",
          }}
        >
          ✦ Another story
        </button>
      </div>
    </div>
  );
}
