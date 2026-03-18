"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Seed, DaasResponse } from "@/lib/types";
import { splitSentences } from "@/lib/sentences";

function fmt(secs: number): string {
  if (!isFinite(secs) || isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}


export default function PlaybackScreen({ story, seed, daas: _daas, audioUrl, ambientTrack, onReset, loggedIn, storyId, onSave }: {
  story: string;
  seed: Seed;
  daas: DaasResponse;
  audioUrl: string;
  ambientTrack: string;
  onReset: () => void;
  loggedIn?: boolean;
  storyId?: string;
  onSave?: () => Promise<void>;
}) {
  const router = useRouter();
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const ambientStarted = useRef(false);
  const narrateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const starsRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const sentenceRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const textContainerRef = useRef<HTMLDivElement>(null);

  const firstName = seed.characters[0]?.name ?? "Your Story";
  const childAge = seed.characters[0]?.age;
  const sentences = useMemo(() => splitSentences(story), [story]);

  // Proportional sync weighted by word count (best estimate without per-sentence audio)
  const sentenceWordCounts = useMemo(
    () => sentences.map((s) => s.split(/\s+/).filter(Boolean).length),
    [sentences]
  );
  const totalWords = useMemo(
    () => sentenceWordCounts.reduce((a, b) => a + b, 0) || 1,
    [sentenceWordCounts]
  );

  const activeSentenceIdx = (() => {
    if (duration <= 0) return 0;
    const wordsRead = (currentTime / duration) * totalWords;
    let cum = 0;
    for (let i = 0; i < sentenceWordCounts.length; i++) {
      cum += sentenceWordCounts[i];
      if (wordsRead <= cum) return i;
    }
    return sentences.length - 1;
  })();

  // Generate stars
  useEffect(() => {
    const container = starsRef.current;
    if (!container || container.childElementCount > 0) return;
    for (let i = 0; i < 120; i++) {
      const el = document.createElement("div");
      const size = Math.random() * 2 + 0.5;
      el.style.cssText = `position:absolute;border-radius:50%;background:white;
        left:${Math.random() * 100}%;top:${Math.random() * 75}%;
        width:${size}px;height:${size}px;
        animation:sipurTwinkle ${(Math.random() * 3 + 2).toFixed(1)}s ease-in-out ${(Math.random() * 4).toFixed(1)}s infinite alternate;`;
      el.style.setProperty("--min", (Math.random() * 0.2 + 0.1).toFixed(2));
      el.style.setProperty("--max", (Math.random() * 0.5 + 0.4).toFixed(2));
      container.appendChild(el);
    }
  }, []);

  // Generate particles
  useEffect(() => {
    const sky = skyRef.current;
    if (!sky) return;
    const colors = ["rgba(232,201,122,0.5)", "rgba(201,111,160,0.4)", "rgba(245,238,216,0.3)"];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement("div");
      p.className = "sipur-particle";
      const size = Math.random() * 3 + 1;
      p.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;
        left:${Math.random() * 100}%;bottom:${Math.random() * 30}%;
        width:${size}px;height:${size}px;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        animation:sipurFloat ${(Math.random() * 8 + 6).toFixed(1)}s ease-in ${(Math.random() * 8).toFixed(1)}s infinite;
        opacity:0;`;
      p.style.setProperty("--po", (Math.random() * 0.3 + 0.1).toFixed(2));
      sky.appendChild(p);
    }
    return () => { sky.querySelectorAll(".sipur-particle").forEach((p) => p.remove()); };
  }, []);

  // Scroll active sentence into view
  useEffect(() => {
    const el = sentenceRefs.current[activeSentenceIdx];
    const container = textContainerRef.current;
    if (!el || !container) return;
    const target = el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2;
    container.scrollTo({ top: target, behavior: "smooth" });
  }, [activeSentenceIdx]);

  // Ambient music
  useEffect(() => {
    const ambient = new Audio(ambientTrack);
    ambient.loop = true;
    ambient.volume = 0.15;
    ambientRef.current = ambient;
    ambientStarted.current = false;
    return () => { ambient.pause(); ambientRef.current = null; };
  }, []);

  const fadeOutAmbient = () => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    const ambient = ambientRef.current;
    if (!ambient) return;
    const startVol = ambient.volume;
    const steps = 40;
    const stepSize = startVol / steps;
    fadeIntervalRef.current = setInterval(() => {
      if (!ambientRef.current) { clearInterval(fadeIntervalRef.current!); return; }
      const next = ambientRef.current.volume - stepSize;
      if (next <= 0) {
        ambientRef.current.volume = 0;
        ambientRef.current.pause();
        clearInterval(fadeIntervalRef.current!);
      } else {
        ambientRef.current.volume = next;
      }
    }, 5000 / steps);
  };

  // Set up narration audio from pre-fetched URL + auto-play on mount
  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onended = () => { setPlaying(false); fadeOutAmbient(); };

    // Auto-play: start ambient immediately, narration after 1s delay
    const ambient = ambientRef.current;
    if (ambient) {
      ambient.volume = 0.15;
      ambientStarted.current = true;
      ambient.play().catch(() => {});
    }
    narrateTimeoutRef.current = setTimeout(() => {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }, 1000);

    return () => {
      if (narrateTimeoutRef.current) clearTimeout(narrateTimeoutRef.current);
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

  function signinRedirect() {
    const returnUrl = storyId ? `/play/${storyId}` : "/";
    router.push(`/signin?return=${encodeURIComponent(returnUrl)}`);
  }

  async function handleSave() {
    if (!loggedIn) { signinRedirect(); return; }
    setSaving(true);
    try {
      if (onSave) await onSave();
      setSaved(true);
      setToast("Story saved to your library");
      setTimeout(() => setToast(null), 2500);
    } catch {
      setToast("Save failed — please try again");
      setTimeout(() => setToast(null), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    if (!loggedIn) { signinRedirect(); return; }
    const url = `${window.location.origin}/play/${storyId}`;
    await navigator.clipboard.writeText(url);
    setToast("Link copied");
    setTimeout(() => setToast(null), 2000);
  }

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      if (narrateTimeoutRef.current) clearTimeout(narrateTimeoutRef.current);
      ambientRef.current?.pause();
      setPlaying(false);
    } else {
      if (ambientRef.current) ambientRef.current.volume = 0.15;
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (!ambientStarted.current && ambientRef.current) {
        ambientStarted.current = true;
        ambientRef.current.play().catch(() => {});
      } else {
        ambientRef.current?.play().catch(() => {});
      }
      narrateTimeoutRef.current = setTimeout(() => {
        audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      }, 1000);
    }
  };

  const skip = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + delta));
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * duration;
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50 }}>

      {/* ── Sky ── */}
      <div ref={skyRef} style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 120% 80% at 50% 110%, #1a0a3a 0%, #0a0818 60%)",
        overflow: "hidden",
      }}>
        <div ref={starsRef} style={{ position: "absolute", inset: 0 }} />

        {/* Shooting star */}
        <div style={{
          position: "absolute", top: "15%", left: "-5%",
          width: 2, height: 2, borderRadius: "50%", background: "white",
          boxShadow: "0 0 6px 2px rgba(255,255,255,0.6)",
          animation: "sipurShoot 6s ease-in 4s infinite", opacity: 0,
        }}>
          <div style={{
            position: "absolute", top: "50%", right: 2, transform: "translateY(-50%)",
            width: 80, height: 1,
            background: "linear-gradient(to left, rgba(255,255,255,0.8), transparent)",
          }} />
        </div>

        {/* Horizon glow */}
        <div style={{
          position: "absolute", bottom: "-40%", left: "50%",
          transform: "translateX(-50%)", width: "140%", height: "70%",
          background: "radial-gradient(ellipse at center bottom, rgba(201,111,160,0.35) 0%, rgba(74,32,128,0.25) 30%, transparent 70%)",
          animation: "sipurHorizonPulse 8s ease-in-out infinite alternate",
        }} />

        {/* Zenith glow */}
        <div style={{
          position: "absolute", top: "-20%", left: "30%", width: "60%", height: "60%",
          background: "radial-gradient(ellipse, rgba(26,31,110,0.6) 0%, transparent 70%)",
          animation: "sipurZenithDrift 12s ease-in-out infinite alternate",
        }} />

        {/* Mist layers */}
        <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(40px)", width: 500, height: 300, top: "20%", left: "-10%", background: "radial-gradient(ellipse, rgba(74,32,128,0.12), transparent 70%)", animation: "sipurMistDrift 18s ease-in-out infinite alternate" }} />
        <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(40px)", width: 400, height: 200, top: "50%", right: "-5%", background: "radial-gradient(ellipse, rgba(74,32,128,0.12), transparent 70%)", animation: "sipurMistDrift 22s ease-in-out infinite alternate" }} />
        <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(40px)", width: 600, height: 250, bottom: "10%", left: "20%", background: "radial-gradient(ellipse, rgba(201,111,160,0.07), transparent 70%)", animation: "sipurMistDrift 15s ease-in-out infinite alternate" }} />
      </div>

      {/* ── Screen ── */}
      <div style={{
        position: "relative", zIndex: 10,
        width: "100%", height: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "space-between",
        padding: "36px 24px 160px",
      }}>

        {/* Top bar + profile button */}
        <div className="sipur-fadeup-1" style={{
          width: "100%", maxWidth: 420,
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          {/* Logo row */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            <button
              className="sipur-back-btn"
              onClick={() => { ambientRef.current?.pause(); audioRef.current?.pause(); onReset(); }}
              style={{
                position: "absolute", left: 0,
                width: 32, height: 32, borderRadius: "50%",
                border: "1px solid rgba(245,238,216,0.15)",
                background: "rgba(245,238,216,0.05)",
                color: "rgba(245,238,216,0.4)", fontSize: 14,
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", transition: "all 0.2s",
              }}
            >←</button>
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 300, fontSize: 18, letterSpacing: "0.18em",
              color: "rgba(245,238,216,0.5)", textTransform: "uppercase",
            }}>סיפור</div>
          </div>

          {/* Profile button — inline below logo, left-aligned */}
          {loggedIn && (
            <button
              onClick={() => router.push("/profile")}
              style={{
                alignSelf: "flex-start",
                width: 32, height: 32, borderRadius: "50%",
                border: "1px solid rgba(245,238,216,0.15)",
                background: "rgba(245,238,216,0.05)",
                color: "rgba(245,238,216,0.4)",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", transition: "all 0.2s",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </button>
          )}
        </div>

        {/* Story meta */}
        <div className="sipur-fadeup-3" style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 300, fontSize: 13,
            letterSpacing: "0.22em", textTransform: "uppercase",
            color: "rgba(232,201,122,0.7)",
          }}>
            {firstName}{childAge ? ` · Age ${childAge}` : ""}
          </div>
        </div>

        {/* Story text */}
        <div className="sipur-fadeup-2" style={{
          flex: 1, width: "100%", maxWidth: 320,
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "20px 0",
        }}>
          <div style={{ position: "relative", padding: "28px 4px" }}>
            {/* Fade masks */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 60,
              background: "linear-gradient(to bottom, rgba(10,8,24,0.9), transparent)",
              zIndex: 2, pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
              background: "linear-gradient(to top, rgba(10,8,24,0.9), transparent)",
              zIndex: 2, pointerEvents: "none",
            }} />
            {/* Text glow */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 200, height: 60,
              background: "radial-gradient(ellipse, rgba(201,111,160,0.12), transparent 70%)",
              filter: "blur(20px)", pointerEvents: "none",
              animation: "sipurTextGlow 3s ease-in-out infinite alternate",
            }} />
            {/* Sentences */}
            <div
              ref={textContainerRef}
              className="sipur-text-container"
              style={{
                fontFamily: "'Crimson Pro', 'Crimson Text', Georgia, serif",
                fontWeight: 300, fontStyle: "italic",
                fontSize: 16, lineHeight: 1.75,
                color: "#f5eed8", textAlign: "center",
                maxHeight: 200, overflowY: "scroll",
                position: "relative",
              }}
            >
              {sentences.map((s, i) => {
                const isActive = i === activeSentenceIdx;
                const isRecent = i === activeSentenceIdx - 1;
                return (
                  <span
                    key={i}
                    ref={(el) => { sentenceRefs.current[i] = el; }}
                    style={{
                      display: "block", marginBottom: "0.35em",
                      transition: "opacity 0.6s ease, color 0.6s ease",
                      opacity: isActive ? 1 : isRecent ? 0.55 : 0.28,
                      color: isActive ? "#ffffff" : "#f5eed8",
                    }}
                  >{s}</span>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Controls — fixed to bottom of screen */}
      <div className="sipur-fadeup-4" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 20,
        padding: "20px 24px 36px",
        background: "linear-gradient(to top, rgba(10,8,24,0.98) 60%, transparent)",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <div style={{ width: "100%", maxWidth: 380 }}>

          {/* Progress bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <span style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 13, color: "rgba(245,238,216,0.35)",
              letterSpacing: "0.05em", minWidth: 32,
            }}>{fmt(currentTime)}</span>

            <div onClick={seek} style={{
              flex: 1, height: 2, borderRadius: 2,
              background: "rgba(245,238,216,0.1)",
              position: "relative", cursor: "pointer",
            }}>
              <div style={{
                height: "100%", borderRadius: 2,
                width: `${progress * 100}%`,
                background: "linear-gradient(to right, rgba(201,111,160,0.6), rgba(232,201,122,0.8))",
                position: "relative", transition: "width 0.3s ease",
              }}>
                <div style={{
                  position: "absolute", right: -4, top: "50%", transform: "translateY(-50%)",
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#e8c97a", boxShadow: "0 0 8px rgba(232,201,122,0.6)",
                }} />
              </div>
            </div>

            <span style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 13, color: "rgba(245,238,216,0.35)",
              letterSpacing: "0.05em", minWidth: 32, textAlign: "right",
            }}>{fmt(duration)}</span>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 32, position: "relative" }}>

            <button className="sipur-ctrl-btn" onClick={() => skip(-15)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(245,238,216,0.45)",
              display: "flex", alignItems: "center", transition: "color 0.2s, transform 0.15s",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2.5 12a9.5 9.5 0 1 1 1.5 5.2"/><polyline points="2 17 2.5 12 7 12"/>
                <text x="7.5" y="15" fontSize="6" fill="currentColor" stroke="none">15</text>
              </svg>
            </button>

            <button onClick={togglePlay} style={{
              position: "relative",
              width: 64, height: 64, borderRadius: "50%",
              border: "1.5px solid rgba(232,201,122,0.35)",
              background: "rgba(232,201,122,0.07)",
              backdropFilter: "blur(10px)",
              color: "#e8c97a",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.25s",
              boxShadow: "0 0 24px rgba(232,201,122,0.1), inset 0 0 20px rgba(232,201,122,0.05)",
            }}>
              <div style={{
                position: "absolute", inset: -6, borderRadius: "50%",
                border: "1px solid rgba(232,201,122,0.12)",
                animation: "sipurRingPulse 3s ease-in-out infinite",
              }} />
              {playing ? (
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <div style={{ width: 3, height: 18, background: "#e8c97a", borderRadius: 2 }} />
                  <div style={{ width: 3, height: 18, background: "#e8c97a", borderRadius: 2 }} />
                </div>
              ) : (
                <div style={{
                  width: 0, height: 0, borderStyle: "solid",
                  borderWidth: "10px 0 10px 18px",
                  borderColor: "transparent transparent transparent #e8c97a",
                  marginLeft: 3,
                }} />
              )}
            </button>

            <button className="sipur-ctrl-btn" onClick={() => skip(15)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(245,238,216,0.45)",
              display: "flex", alignItems: "center", transition: "color 0.2s, transform 0.15s",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M21.5 12a9.5 9.5 0 1 0-1.5 5.2"/><polyline points="22 17 21.5 12 17 12"/>
                <text x="7.5" y="15" fontSize="6" fill="currentColor" stroke="none">15</text>
              </svg>
            </button>
          </div>

          {/* Save + Share */}
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 22 }}>
              <button
                onClick={handleSave}
                disabled={saving || saved}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "none", border: "1px solid rgba(245,238,216,0.1)",
                  borderRadius: 20, padding: "6px 16px", cursor: saving || saved ? "default" : "pointer",
                  color: saved ? "rgba(100,180,120,0.6)" : "rgba(245,238,216,0.35)",
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 13, letterSpacing: "0.1em",
                  transition: "all 0.2s", opacity: saving ? 0.5 : 1,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v13M6 11l6 6 6-6"/><path d="M5 21h14"/>
                </svg>
                {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
              </button>

              {storyId && (
                <button
                  onClick={handleShare}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "none", border: "1px solid rgba(245,238,216,0.1)",
                    borderRadius: 20, padding: "6px 16px", cursor: "pointer",
                    color: "rgba(245,238,216,0.35)",
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: 13, letterSpacing: "0.1em",
                    transition: "all 0.2s",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
                  </svg>
                  Share
                </button>
              )}
            </div>

          {/* Toast */}
          {toast && (
            <div style={{
              position: "absolute", bottom: "calc(100% + 12px)", left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(20,16,40,0.95)", border: "1px solid rgba(245,238,216,0.12)",
              borderRadius: 20, padding: "7px 18px",
              color: "rgba(245,238,216,0.7)",
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 13, letterSpacing: "0.1em",
              whiteSpace: "nowrap", pointerEvents: "none",
              animation: "sipurFadeUp 0.2s ease",
            }}>{toast}</div>
          )}
        </div>
      </div>
    </div>
  );
}
