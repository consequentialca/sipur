"use client";

import { Seed, DaasResponse } from "@/lib/types";

export default function ConfirmScreen({ seed, daas, onConfirm, onEdit }: {
  seed: Seed;
  daas: DaasResponse;
  onConfirm: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="animate-fade-in">

      {/* Daas brief card */}
      <div style={{
        background: "rgba(255,255,255,0.025)", border: "1px solid rgba(245,230,200,0.07)",
        borderRadius: 22, padding: "30px 34px", backdropFilter: "blur(10px)",
        boxShadow: "0 2px 50px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
        marginBottom: 16,
      }}>
        {/* one_liner */}
        <div style={{
          fontSize: 11, letterSpacing: "0.3em", color: "rgba(245,230,200,0.2)",
          textTransform: "uppercase", marginBottom: 14,
        }}>Tonight's Story</div>

        <div style={{
          fontSize: 20, lineHeight: 1.5, color: "#d4af37",
          fontStyle: "italic", fontWeight: 300, marginBottom: 20,
          letterSpacing: "0.02em",
        }}>
          {daas.one_liner}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(245,230,200,0.07)", marginBottom: 20 }} />

        {/* story_brief */}
        <div style={{
          fontSize: 17, lineHeight: 1.75, color: "rgba(245,230,200,0.65)",
          marginBottom: daas.corrected_lesson ? 20 : 0,
        }}>
          {daas.story_brief}
        </div>

        {/* corrected_lesson — shown only when Daas reframed */}
        {daas.corrected_lesson && (
          <div style={{
            marginTop: 16, padding: "12px 16px", borderRadius: 12,
            background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)",
            fontSize: 15, color: "rgba(212,175,55,0.8)", fontStyle: "italic", lineHeight: 1.6,
          }}>
            ✦ {daas.corrected_lesson}
          </div>
        )}
      </div>

      {/* Seed summary */}
      <div style={{
        padding: "12px 20px", borderRadius: 14, marginBottom: 28,
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(245,230,200,0.05)",
        fontSize: 14, color: "rgba(245,230,200,0.35)", fontStyle: "italic",
        lineHeight: 1.6,
      }}>
        {seed.raw}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button
          onClick={onEdit}
          style={{
            padding: "11px 24px", borderRadius: 40,
            border: "1px solid rgba(245,230,200,0.12)",
            background: "rgba(255,255,255,0.03)",
            color: "rgba(245,230,200,0.45)",
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 14, letterSpacing: "0.15em", cursor: "pointer",
          }}
        >
          ← Edit seed
        </button>

        <button
          onClick={onConfirm}
          style={{
            padding: "13px 44px", borderRadius: 40,
            background: "linear-gradient(135deg, rgba(212,175,55,0.35) 0%, rgba(180,120,220,0.35) 100%)",
            color: "#f5e6c8",
            fontFamily: "'Cormorant SC', Georgia, serif",
            fontSize: 15, letterSpacing: "0.3em", cursor: "pointer",
            boxShadow: "0 0 30px rgba(212,175,55,0.2), 0 0 60px rgba(180,120,220,0.1)",
            border: "1px solid rgba(212,175,55,0.3)",
            minWidth: 180,
          }}
        >
          Begin
        </button>
      </div>
    </div>
  );
}
