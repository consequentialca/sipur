"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface AuthScreenProps {
  mode?: "signin" | "signup";
  prompt?: string;
  onAuth: () => void;
}

export default function AuthScreen({ mode = "signin", prompt, onAuth }: AuthScreenProps) {
  const [tab, setTab] = useState<"signin" | "signup">(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } =
      tab === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      onAuth();
    }
  }

  const cardStyle: React.CSSProperties = {
    background: "rgba(10,8,20,0.72)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1px solid rgba(245,230,200,0.12)",
    borderRadius: 20,
    padding: "36px 32px 32px",
    width: "100%",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 13,
    letterSpacing: "0.18em",
    color: "rgba(245,230,200,0.5)",
    display: "block",
    marginBottom: 6,
    textTransform: "uppercase" as const,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(245,230,200,0.06)",
    border: "1px solid rgba(245,230,200,0.15)",
    borderRadius: 10,
    padding: "10px 14px",
    color: "#f5e6c8",
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const btnStyle: React.CSSProperties = {
    width: "100%",
    marginTop: 20,
    padding: "12px 0",
    borderRadius: 12,
    border: "none",
    background: loading ? "rgba(180,150,80,0.3)" : "rgba(180,150,80,0.85)",
    color: loading ? "rgba(10,8,20,0.5)" : "#0a0814",
    fontFamily: "'Cormorant SC', Georgia, serif",
    fontSize: 15,
    letterSpacing: "0.22em",
    cursor: loading ? "not-allowed" : "pointer",
    transition: "background 0.2s",
  };

  return (
    <div style={cardStyle}>
      {prompt && (
        <p
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 15,
            color: "rgba(245,230,200,0.65)",
            textAlign: "center",
            marginBottom: 24,
            fontStyle: "italic",
            lineHeight: 1.5,
          }}
        >
          {prompt}
        </p>
      )}

      {/* Tab toggle */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28 }}>
        {(["signin", "signup"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(null); }}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 8,
              border: "none",
              background: tab === t ? "rgba(180,150,80,0.2)" : "transparent",
              color: tab === t ? "#f5e6c8" : "rgba(245,230,200,0.35)",
              fontFamily: "'Cormorant SC', Georgia, serif",
              fontSize: 13,
              letterSpacing: "0.2em",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {t === "signin" ? "Sign In" : "Create Account"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(200,80,80,0.12)",
              border: "1px solid rgba(200,80,80,0.25)",
              color: "rgba(245,200,200,0.8)",
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 14,
              fontStyle: "italic",
            }}
          >
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? "…" : tab === "signin" ? "Sign In" : "Create Account"}
        </button>
      </form>
    </div>
  );
}
