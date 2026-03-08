"use client";

interface UpgradePromptProps {
  onBack: () => void;
}

export default function UpgradePrompt({ onBack }: UpgradePromptProps) {
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
