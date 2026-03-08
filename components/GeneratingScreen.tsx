"use client";

import { DaasResponse, Seed } from "@/lib/types";

// ─── GeneratingScreen ─────────────────────────────────────────
// Shown while Stage 2 (story generation) is in flight.
// Displays the one_liner as a holding thought.

export function GeneratingScreen({ daas, label }: { daas: DaasResponse; label?: string }) {
  return (
    <div className="animate-fade-in" style={{ textAlign: "center", padding: "40px 0" }}>

      {/* Orbiting ✦ star */}
      <div style={{
        position: "relative",
        width: 80,
        height: 80,
        margin: "0 auto 24px",
      }}>
        <style>{`
          @keyframes orbit {
            0%   { transform: rotate(0deg)   translateX(28px) rotate(0deg);   opacity: 0.9; }
            25%  { transform: rotate(90deg)  translateX(28px) rotate(-90deg);  opacity: 0.45; }
            50%  { transform: rotate(180deg) translateX(28px) rotate(-180deg); opacity: 0.9; }
            75%  { transform: rotate(270deg) translateX(28px) rotate(-270deg); opacity: 0.45; }
            100% { transform: rotate(360deg) translateX(28px) rotate(-360deg); opacity: 0.9; }
          }
        `}</style>
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          marginTop: -10,
          marginLeft: -10,
          animation: "orbit 4s linear infinite",
          transformOrigin: "center center",
          fontSize: 16,
          color: "#d4af37",
          textShadow: "0 0 8px rgba(212,175,55,0.9), 0 0 20px rgba(212,175,55,0.4)",
          lineHeight: 1,
          userSelect: "none",
        }}>✦</div>
      </div>

      <div style={{
        fontSize: 19, lineHeight: 1.6, color: "#d4af37",
        fontStyle: "italic", fontWeight: 300, marginBottom: 16,
        letterSpacing: "0.02em", maxWidth: 460, margin: "0 auto 16px",
      }}>
        {daas.one_liner}
      </div>

      <div style={{
        fontSize: 13, letterSpacing: "0.2em",
        color: "rgba(245,230,200,0.25)", textTransform: "uppercase",
      }}>
        {label ?? "Weaving your story..."}
      </div>
    </div>
  );
}

// ─── PlaybackScreen ───────────────────────────────────────────
// Story is ready. For MVP: displays text.
// ElevenLabs TTS integration slots in here in the next phase.

export function PlaybackScreen({ story, seed, onReset }: {
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

        {/* Story text — placeholder until TTS */}
        <div style={{
          fontSize: 17, lineHeight: 1.85,
          color: "rgba(245,230,200,0.7)",
          fontWeight: 300,
        }}>
          {story.split("\n\n").map((para, i) => (
            <p key={i} style={{ marginBottom: 16 }}>{para}</p>
          ))}
        </div>
      </div>

      {/* TTS placeholder banner */}
      <div style={{
        padding: "12px 20px", borderRadius: 14, marginBottom: 24,
        background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)",
        fontSize: 13, color: "rgba(212,175,55,0.5)", fontStyle: "italic",
        textAlign: "center", letterSpacing: "0.05em",
      }}>
        ✦ Audio narration — ElevenLabs integration coming next
      </div>

      {/* Reset */}
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

// Default export for GeneratingScreen (imported by name elsewhere)
export default GeneratingScreen;
