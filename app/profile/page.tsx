"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { UserProfile, Seed } from "@/lib/types";
import StarField from "@/components/StarField";

const FREE_LIMIT = 5;

interface StoryRow {
  id: string;
  created_at: string;
  seed: Seed;
  story_text: string;
  audio_url: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push("/"); return; }

      const userId = session.user.id;
      const [{ data: prof }, { data: storiesData }] = await Promise.all([
        supabase.from("users").select().eq("id", userId).single(),
        supabase.from("stories").select("id, created_at, seed, story_text, audio_url")
          .eq("user_id", userId).order("created_at", { ascending: false }),
      ]);

      if (prof) setProfile(prof as UserProfile);
      if (storiesData) setStories(storiesData as StoryRow[]);
      setLoading(false);
    })();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  async function handleDelete(id: string) {
    if (!profile) return;
    const { data: deleted, error } = await supabase
      .from("stories")
      .delete()
      .eq("id", id)
      .eq("user_id", profile.id)
      .select("id");
    if (error || !deleted?.length) {
      console.error("[delete] failed", error ?? "no rows deleted — check RLS DELETE policy");
      setConfirmDelete(null);
      return;
    }
    await supabase.storage.from("stories").remove([`${profile.id}/${id}.mp3`]);
    setStories((prev) => prev.filter((s) => s.id !== id));
    setConfirmDelete(null);
  }

  async function handlePromoSubmit() {
    if (!promoCode.trim() || !profile) return;
    setPromoLoading(true);
    setPromoMessage(null);
    try {
      const res = await fetch("/api/redeem-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim(), userId: profile.id }),
      });
      const body = await res.json();
      if (!res.ok) {
        setPromoMessage({ text: body.error ?? "Invalid promo code", ok: false });
      } else {
        const bonus = body.bonus_stories as number;
        setPromoMessage({ text: `Code applied — ${bonus} bonus ${bonus === 1 ? "story" : "stories"} added.`, ok: true });
        setProfile((p) => p ? { ...p, bonus_stories: p.bonus_stories + bonus } : p);
        setPromoCode("");
      }
    } catch {
      setPromoMessage({ text: "Something went wrong. Please try again.", ok: false });
    } finally {
      setPromoLoading(false);
    }
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${date} · ${time}`;
  }

  const used = profile?.stories_generated ?? 0;
  const usagePct = Math.min((used / FREE_LIMIT) * 100, 100);

  if (loading) {
    return <div style={{ minHeight: "100vh", background: "#0a0818" }} />;
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0818",
      fontFamily: "'Cormorant Garamond', Georgia, serif", color: "#f5eed8",
    }}>
      <StarField />

      <div style={{ position: "relative", zIndex: 10, maxWidth: 480, margin: "0 auto", padding: "0 20px 80px" }}>

        {/* Top nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "32px 0 24px" }}>
          <button
            onClick={() => router.push("/")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase",
              color: "rgba(245,238,216,0.35)", fontFamily: "'Cormorant Garamond', Georgia, serif",
              transition: "color 0.2s",
            }}
          >← Back</button>
          <div style={{
            fontSize: 18, letterSpacing: "0.18em", textTransform: "uppercase",
            color: "rgba(245,238,216,0.4)", fontWeight: 300,
          }}>סיפור</div>
          <div style={{ width: 60 }} />
        </div>

        {/* User header */}
        <div style={{ textAlign: "center", padding: "8px 0 32px" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(100,160,220,0.3), rgba(180,120,220,0.3))",
            border: "1px solid rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px", fontSize: 22, color: "rgba(245,238,216,0.6)",
          }}>✦</div>
          <div style={{ fontSize: 24, fontWeight: 400, letterSpacing: "0.04em", color: "#f5eed8" }}>
            {profile?.email?.split("@")[0] ?? ""}
          </div>
          <div style={{ fontSize: 13, letterSpacing: "0.08em", color: "rgba(245,238,216,0.3)", marginTop: 4, fontStyle: "italic" }}>
            {profile?.email}
          </div>
        </div>

        {/* ── Stories section ── */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase",
            color: "rgba(245,238,216,0.25)", marginBottom: 12, paddingLeft: 2,
          }}>Your Stories</div>

          {stories.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "40px 20px",
              color: "rgba(245,238,216,0.2)", fontStyle: "italic",
              fontSize: 18, lineHeight: 1.6,
            }}>
              Your bedtime stories<br />will appear here
            </div>
          ) : stories.map((story) => {
            const seed = story.seed as Seed;
            const tones = seed?.tone ?? [];
            const characters = seed?.characters ?? [];
            const duration = seed?.duration ?? "";
            const lesson = seed?.lesson_label ?? "";

            return (
              <div
                key={story.id}
                onClick={() => { if (confirmDelete !== story.id) router.push(`/play/${story.id}`); }}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 18, padding: "16px 18px", marginBottom: 12,
                  cursor: "pointer", transition: "all 0.25s",
                  display: "flex", alignItems: "center", gap: 16,
                  position: "relative",
                }}
              >
                {/* Share + ✕ — top right */}
                {confirmDelete !== story.id && (
                  <div
                    style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 5 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/play/${story.id}`;
                        void navigator.clipboard.writeText(url).then(() => {
                          setCopiedId(story.id);
                          setTimeout(() => setCopiedId(null), 1800);
                        });
                      }}
                      style={{
                        height: 20, borderRadius: 10, padding: "0 7px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.04)",
                        color: copiedId === story.id ? "rgba(212,175,55,0.7)" : "rgba(245,238,216,0.25)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", fontSize: 9, letterSpacing: "0.06em",
                        transition: "all 0.2s", whiteSpace: "nowrap",
                      }}
                    >{copiedId === story.id ? "Copied" : "Share"}</button>
                    <button
                      onClick={() => setConfirmDelete(story.id)}
                      style={{
                        width: 20, height: 20, borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.04)",
                        color: "rgba(245,238,216,0.25)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", fontSize: 9, lineHeight: 1,
                        transition: "all 0.2s",
                      }}
                    >✕</button>
                  </div>
                )}

                {/* Confirmation overlay */}
                {confirmDelete === story.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: "absolute", inset: 0, borderRadius: 18,
                      background: "rgba(10,8,20,0.92)", backdropFilter: "blur(4px)",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 14,
                      zIndex: 10,
                    }}
                  >
                    <div style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: 15, fontStyle: "italic",
                      color: "rgba(245,238,216,0.6)", letterSpacing: "0.03em",
                    }}>Remove this story?</div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={() => handleDelete(story.id)}
                        style={{
                          padding: "6px 18px", borderRadius: 20,
                          border: "1px solid rgba(200,80,80,0.35)",
                          background: "rgba(200,80,80,0.12)",
                          color: "rgba(220,120,120,0.9)",
                          fontFamily: "'Cormorant Garamond', Georgia, serif",
                          fontSize: 13, letterSpacing: "0.08em", cursor: "pointer",
                        }}
                      >Remove</button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        style={{
                          padding: "6px 18px", borderRadius: 20,
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "transparent",
                          color: "rgba(245,238,216,0.3)",
                          fontFamily: "'Cormorant Garamond', Georgia, serif",
                          fontSize: 13, letterSpacing: "0.08em", cursor: "pointer",
                        }}
                      >Cancel</button>
                    </div>
                  </div>
                )}

                {/* Play button — left side, centered vertically */}
                <div
                  onClick={(e) => { e.stopPropagation(); router.push(`/play/${story.id}`); }}
                  style={{
                    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.04)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{
                    width: 0, height: 0, borderStyle: "solid",
                    borderWidth: "6px 0 6px 10px",
                    borderColor: "transparent transparent transparent rgba(245,238,216,0.4)",
                    marginLeft: 2,
                  }} />
                </div>

                {/* Text content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Child name chips */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
                    {characters.map((c) => (
                      <span key={c.name} style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "2px 9px 3px", borderRadius: 999,
                        background: "rgba(100,160,220,0.12)",
                        border: "1px solid rgba(100,160,220,0.3)",
                        fontSize: 13, fontWeight: 600,
                        color: "#64a0dc", letterSpacing: "0.02em",
                      }}>
                        {c.name}
                        <span style={{
                          fontSize: 11, fontWeight: 400,
                          color: "rgba(100,160,220,0.65)",
                          background: "rgba(100,160,220,0.15)",
                          border: "1px solid rgba(100,160,220,0.2)",
                          borderRadius: 999, padding: "0 5px",
                        }}>{c.age}</span>
                      </span>
                    ))}
                  </div>

                  {/* Lesson */}
                  <div style={{
                    fontSize: 16, fontStyle: "italic", fontWeight: 300,
                    color: "rgba(245,238,216,0.75)", lineHeight: 1.4,
                    marginBottom: 7,
                  }}>
                    "{lesson}"
                  </div>

                  {/* Tone + duration + date */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {tones.length > 0 && (
                      <span style={{
                        display: "inline-flex", alignItems: "center",
                        padding: "2px 8px 3px", borderRadius: 999,
                        fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
                        background: "rgba(212,175,55,0.08)",
                        border: "1px solid rgba(212,175,55,0.2)",
                        color: "rgba(212,175,55,0.6)",
                      }}>{tones[0]}</span>
                    )}
                    {duration && (
                      <>
                        <div style={{ width: 2, height: 2, borderRadius: "50%", background: "rgba(245,238,216,0.15)" }} />
                        <span style={{
                          fontSize: 11, letterSpacing: "0.1em",
                          textTransform: "uppercase", color: "rgba(245,238,216,0.22)",
                        }}>{duration}</span>
                      </>
                    )}
                    <div style={{ width: 2, height: 2, borderRadius: "50%", background: "rgba(245,238,216,0.15)" }} />
                    <span style={{
                      fontSize: 11, letterSpacing: "0.08em",
                      color: "rgba(245,238,216,0.2)", fontStyle: "italic",
                    }}>{formatDate(story.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Plan section ── */}
        <div style={{
          fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase",
          color: "rgba(245,238,216,0.25)", marginBottom: 12, paddingLeft: 2,
        }}>Your Plan</div>

        <div style={{
          background: "rgba(212,175,55,0.06)",
          border: "1px solid rgba(212,175,55,0.2)",
          borderRadius: 18, padding: 20, marginBottom: 36,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#d4af37", letterSpacing: "0.04em" }}>Free</div>
            <div style={{
              fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase",
              background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.3)",
              color: "#d4af37", padding: "3px 10px", borderRadius: 999,
            }}>{used} of {FREE_LIMIT} used</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 14, color: "rgba(245,238,216,0.45)", letterSpacing: "0.03em" }}>Stories this month</span>
            <span style={{ fontSize: 14, color: "rgba(245,238,216,0.6)", letterSpacing: "0.05em" }}>{used} / {FREE_LIMIT}</span>
          </div>
          <div style={{ height: 2, background: "rgba(212,175,55,0.12)", borderRadius: 2, overflow: "hidden", marginBottom: 16 }}>
            <div style={{
              height: "100%", borderRadius: 2, width: `${usagePct}%`,
              background: "linear-gradient(to right, rgba(212,175,55,0.5), rgba(212,175,55,0.9))",
            }} />
          </div>
          <button
            onClick={() => setShowUpgrade(true)}
            style={{
              width: "100%", padding: 10, borderRadius: 12,
              border: "1px solid rgba(212,175,55,0.35)",
              background: "rgba(212,175,55,0.1)", color: "#d4af37",
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 15, letterSpacing: "0.08em", cursor: "pointer",
            }}
          >✦ Upgrade for more stories</button>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          style={{
            display: "block", width: "100%", padding: 10,
            borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)",
            background: "transparent", color: "rgba(245,238,216,0.25)",
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 14, letterSpacing: "0.1em", textTransform: "uppercase",
            cursor: "pointer",
          }}
        >Sign out</button>
      </div>

      {/* ── Upgrade modal ── */}
      {showUpgrade && (
        <div
          onClick={() => { setShowUpgrade(false); setShowPromoInput(false); setPromoCode(""); setPromoMessage(null); }}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 480,
              background: "rgba(12,10,24,0.98)",
              border: "1px solid rgba(245,238,216,0.08)",
              borderTop: "1px solid rgba(212,175,55,0.2)",
              borderRadius: "20px 20px 0 0",
              padding: "28px 24px 52px",
            }}
          >
            {/* Drag handle */}
            <div style={{
              width: 36, height: 3, background: "rgba(255,255,255,0.15)",
              borderRadius: 2, margin: "0 auto 24px",
            }} />

            <div style={{
              fontSize: 22, fontWeight: 400, letterSpacing: "0.04em",
              color: "#f5eed8", marginBottom: 6, textAlign: "center",
            }}>Unlock unlimited stories</div>
            <div style={{
              fontSize: 14, color: "rgba(245,238,216,0.35)",
              textAlign: "center", marginBottom: 28, fontStyle: "italic",
            }}>Choose what works for your family</div>

            {/* Monthly — primary */}
            <div style={{
              background: "rgba(212,175,55,0.08)",
              border: "1px solid rgba(212,175,55,0.3)",
              borderRadius: 16, padding: "20px 20px 18px",
              marginBottom: 12, cursor: "pointer", position: "relative",
            }}>
              <div style={{
                position: "absolute", top: -10, right: 16,
                fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase",
                background: "rgba(212,175,55,0.85)", color: "#0a0818",
                padding: "2px 10px", borderRadius: 999, fontWeight: 700,
              }}>Most popular</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#d4af37" }}>Monthly</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: "#f5eed8" }}>
                  $9<span style={{ fontSize: 13, fontWeight: 300, color: "rgba(245,238,216,0.45)" }}>/mo</span>
                </div>
              </div>
              <div style={{ fontSize: 14, color: "rgba(245,238,216,0.45)", letterSpacing: "0.02em" }}>
                30 stories per month
              </div>
            </div>

            {/* Story pack — secondary */}
            <div style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 16, padding: "20px 20px 18px",
              marginBottom: 24, cursor: "pointer",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 18, fontWeight: 400, color: "#f5eed8" }}>Story Pack</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: "#f5eed8" }}>
                  $5<span style={{ fontSize: 13, fontWeight: 300, color: "rgba(245,238,216,0.45)" }}> once</span>
                </div>
              </div>
              <div style={{ fontSize: 14, color: "rgba(245,238,216,0.4)", letterSpacing: "0.02em" }}>
                10 stories · no commitment
              </div>
            </div>

            {/* Promo code */}
            <div style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: 20, marginBottom: 16, textAlign: "center",
            }}>
              {!showPromoInput ? (
                <button
                  onClick={() => setShowPromoInput(true)}
                  style={{
                    background: "none", border: "none",
                    color: "rgba(245,238,216,0.28)",
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: 13, letterSpacing: "0.1em",
                    cursor: "pointer", fontStyle: "italic",
                    textDecoration: "underline",
                    textDecorationColor: "rgba(245,238,216,0.12)",
                  }}
                >Have a promo code?</button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && void handlePromoSubmit()}
                      placeholder="PROMO CODE"
                      maxLength={32}
                      style={{
                        background: "rgba(245,230,200,0.06)",
                        border: "1px solid rgba(245,230,200,0.15)",
                        borderRadius: 8, padding: "8px 14px",
                        color: "#f5eed8",
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: 14, letterSpacing: "0.15em",
                        outline: "none", width: 160, textAlign: "center",
                      }}
                    />
                    <button
                      onClick={() => void handlePromoSubmit()}
                      disabled={promoLoading || !promoCode.trim()}
                      style={{
                        background: "rgba(180,150,80,0.2)",
                        border: "1px solid rgba(180,150,80,0.35)",
                        borderRadius: 8, padding: "8px 16px",
                        color: "rgba(180,150,80,0.85)",
                        fontFamily: "'Cormorant SC', Georgia, serif",
                        fontSize: 13, letterSpacing: "0.15em",
                        cursor: promoLoading || !promoCode.trim() ? "default" : "pointer",
                        opacity: promoLoading || !promoCode.trim() ? 0.5 : 1,
                        transition: "all 0.2s",
                      }}
                    >{promoLoading ? "…" : "Apply"}</button>
                  </div>
                  {promoMessage && (
                    <div style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: 13, fontStyle: "italic",
                      color: promoMessage.ok ? "rgba(100,200,130,0.8)" : "rgba(220,120,100,0.8)",
                      letterSpacing: "0.05em",
                    }}>{promoMessage.text}</div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowUpgrade(false)}
              style={{
                width: "100%", padding: 10, borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.07)",
                background: "transparent", color: "rgba(245,238,216,0.22)",
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 14, letterSpacing: "0.1em", cursor: "pointer",
              }}
            >Maybe later</button>
          </div>
        </div>
      )}
    </div>
  );
}
