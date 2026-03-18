"use client";

import { useState } from "react";

interface UpgradePromptProps {
  onBack: () => void;
  userId?: string;
  onPromoApplied?: (bonusStories: number) => void;
}

export default function UpgradePrompt({ onBack, userId, onPromoApplied }: UpgradePromptProps) {
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const cardStyle: React.CSSProperties = {
    background: "rgba(10,8,20,0.72)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1px solid rgba(245,230,200,0.12)",
    borderRadius: 20,
    padding: "40px 32px 36px",
    width: "100%",
    textAlign: "center",
  };

  async function handlePromoSubmit() {
    if (!promoCode.trim() || !userId) return;
    setPromoLoading(true);
    setPromoMessage(null);
    try {
      const res = await fetch("/api/redeem-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim(), userId }),
      });
      const body = await res.json();
      if (!res.ok) {
        setPromoMessage({ text: body.error ?? "Invalid promo code", ok: false });
      } else {
        const bonus = body.bonus_stories as number;
        setPromoMessage({ text: `Code applied — ${bonus} bonus ${bonus === 1 ? "story" : "stories"} added.`, ok: true });
        setTimeout(() => onPromoApplied?.(bonus), 1200);
      }
    } catch {
      setPromoMessage({ text: "Something went wrong. Please try again.", ok: false });
    } finally {
      setPromoLoading(false);
    }
  }

  return (
    <div style={cardStyle}>
      <div
        style={{
          fontFamily: "'Cormorant SC', Georgia, serif",
          fontSize: 13,
          letterSpacing: "0.3em",
          color: "rgba(180,150,80,0.6)",
          marginBottom: 16,
          textTransform: "uppercase",
        }}
      >
        Story Limit Reached
      </div>

      <div
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 28,
          fontWeight: 600,
          color: "#f5e6c8",
          letterSpacing: "0.04em",
          marginBottom: 12,
          lineHeight: 1.2,
        }}
      >
        5 of 5 stories used
      </div>

      <p
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 16,
          color: "rgba(245,230,200,0.55)",
          lineHeight: 1.65,
          marginBottom: 32,
          fontStyle: "italic",
        }}
      >
        You&rsquo;ve shared five beautiful stories. To continue weaving tales,
        reach out and we&rsquo;ll unlock the night sky for you.
      </p>

      <a
        href="mailto:hello@sipur.app?subject=Sipur upgrade request"
        style={{
          display: "inline-block",
          padding: "12px 32px",
          borderRadius: 12,
          background: "rgba(180,150,80,0.85)",
          color: "#0a0814",
          fontFamily: "'Cormorant SC', Georgia, serif",
          fontSize: 14,
          letterSpacing: "0.22em",
          textDecoration: "none",
          marginBottom: 20,
          transition: "background 0.2s",
        }}
      >
        Contact Us to Upgrade
      </a>

      {/* Promo code section */}
      <div style={{ marginBottom: 20 }}>
        {!showPromoInput ? (
          <button
            onClick={() => setShowPromoInput(true)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(245,230,200,0.3)",
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 13,
              letterSpacing: "0.1em",
              cursor: "pointer",
              padding: 0,
              fontStyle: "italic",
              textDecoration: "underline",
              textDecorationColor: "rgba(245,230,200,0.15)",
            }}
          >
            Have a promo code?
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handlePromoSubmit()}
                placeholder="PROMO CODE"
                maxLength={32}
                style={{
                  background: "rgba(245,230,200,0.06)",
                  border: "1px solid rgba(245,230,200,0.15)",
                  borderRadius: 8,
                  padding: "8px 14px",
                  color: "#f5e6c8",
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 14,
                  letterSpacing: "0.15em",
                  outline: "none",
                  width: 160,
                  textAlign: "center",
                }}
              />
              <button
                onClick={handlePromoSubmit}
                disabled={promoLoading || !promoCode.trim()}
                style={{
                  background: "rgba(180,150,80,0.2)",
                  border: "1px solid rgba(180,150,80,0.35)",
                  borderRadius: 8,
                  padding: "8px 16px",
                  color: "rgba(180,150,80,0.85)",
                  fontFamily: "'Cormorant SC', Georgia, serif",
                  fontSize: 13,
                  letterSpacing: "0.15em",
                  cursor: promoLoading || !promoCode.trim() ? "default" : "pointer",
                  opacity: promoLoading || !promoCode.trim() ? 0.5 : 1,
                  transition: "all 0.2s",
                }}
              >
                {promoLoading ? "…" : "Apply"}
              </button>
            </div>

            {promoMessage && (
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 13,
                  fontStyle: "italic",
                  color: promoMessage.ok ? "rgba(100,200,130,0.8)" : "rgba(220,120,100,0.8)",
                  letterSpacing: "0.05em",
                }}
              >
                {promoMessage.text}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "rgba(245,230,200,0.3)",
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 13,
            letterSpacing: "0.12em",
            cursor: "pointer",
            padding: 0,
            fontStyle: "italic",
          }}
        >
          ← Edit story
        </button>
      </div>
    </div>
  );
}
