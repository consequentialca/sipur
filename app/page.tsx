"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppState, Seed, DaasResponse, UserProfile } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import ComposeScreen from "@/components/ComposeScreen";
import ConfirmScreen from "@/components/ConfirmScreen";
import GeneratingScreen from "@/components/GeneratingScreen";
import PlaybackScreen from "@/components/PlaybackScreen";
import AuthScreen from "@/components/AuthScreen";
import UpgradePrompt from "@/components/UpgradePrompt";
import StarField from "@/components/StarField";

const ANON_KEY = "sipur_anon_count";
const ANON_LIMIT = 5;  // free stories before account required
const FREE_LIMIT = 5;  // free stories for logged-in account before upgrade

function getAnonCount(): number {
  return parseInt(localStorage.getItem(ANON_KEY) || "0", 10);
}

const initialState: AppState = {
  stage: "compose",
  seed: null,
  daas: null,
  story: null,
  audioUrl: null,
  error: null,
};

export default function Home() {
  const router = useRouter();
  const [state, setState] = useState<AppState>(initialState);

  // Auth state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  // ── Auth setup ─────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setAuthLoading(false);
        if (getAnonCount() >= ANON_LIMIT) {
          setShowSignupPrompt(true);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from("users")
      .select()
      .eq("id", userId)
      .single();
    setProfile(data ?? null);
    setAuthLoading(false);
  }

  // Called after AuthScreen succeeds
  function handleAuth() {
    // onAuthStateChange will fire and call loadProfile
    // If showing signup prompt, reset it so the compose screen appears
    setShowSignupPrompt(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setShowUpgrade(false);
    setShowSignupPrompt(false);
    setState(initialState);
  }

  // ── Stage 1: seed confirmed → call Daas ──────────────────
  async function handleSeedConfirmed(seed: Seed) {
    setState((s) => ({ ...s, stage: "classifying", seed, error: null }));

    try {
      const res = await fetch("/api/daas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed }),
      });

      if (!res.ok) throw new Error("Daas classification failed");
      const daas: DaasResponse = await res.json();

      setState((s) => ({ ...s, stage: "confirm", daas }));
    } catch {
      setState((s) => ({
        ...s,
        stage: "compose",
        error: "Something went wrong classifying the story. Please try again.",
      }));
    }
  }

  // ── Parent edits seed after seeing brief ──────────────────
  function handleEditSeed() {
    setState((s) => ({ ...s, stage: "compose", daas: null }));
  }

  // ── Stage 2: parent confirms → generate story + TTS ───────
  async function handleConfirmed() {
    if (!state.seed || !state.daas) return;

    // Gate: anonymous user hit their free story limit
    if (!profile && getAnonCount() >= ANON_LIMIT) {
      setShowSignupPrompt(true);
      return;
    }

    // Gate: free account at limit
    if (profile && profile.stories_generated >= FREE_LIMIT) {
      setShowUpgrade(true);
      return;
    }

    setState((s) => ({ ...s, stage: "generating", error: null }));

    // Capture before async gap
    const capturedSeed = state.seed;
    const capturedDaas = state.daas;

    try {
      // Step 1: generate story
      const storyRes = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: capturedSeed, daas: capturedDaas }),
      });

      if (!storyRes.ok) throw new Error("Story generation failed");
      const { story } = await storyRes.json();

      // Step 2: fetch TTS
      setState((s) => ({ ...s, stage: "preparing", story }));

      const ttsRes = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story }),
      });

      if (!ttsRes.ok) throw new Error("TTS generation failed");
      const blob = await ttsRes.blob();
      const audioUrl = URL.createObjectURL(blob);

      setState((s) => ({ ...s, stage: "playback", audioUrl }));

      if (!profile) {
        // Anonymous: increment counter
        localStorage.setItem(ANON_KEY, String(getAnonCount() + 1));
      }
    } catch {
      setState((s) => ({
        ...s,
        stage: "confirm",
        error: "Something went wrong. Please try again.",
      }));
    }
  }

  // ── Explicit save (triggered by Save button in PlaybackScreen) ──
  async function handleSaveStory() {
    if (!profile || !state.story || !state.seed || !state.daas || !state.audioUrl) return;

    const blob = await fetch(state.audioUrl).then((r) => r.blob());

    const { data: inserted, error: insertErr } = await supabase
      .from("stories")
      .insert({
        user_id: profile.id,
        seed: state.seed,
        daas_output: state.daas,
        story_text: state.story,
        audio_url: null,
      })
      .select("id")
      .single();
    if (insertErr) throw insertErr;

    const savedStoryId = inserted?.id;
    if (savedStoryId) {
      const storagePath = `${profile.id}/${savedStoryId}.mp3`;
      const { error: uploadErr } = await supabase.storage
        .from("stories")
        .upload(storagePath, blob, { contentType: "audio/mpeg", upsert: true });

      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage
          .from("stories")
          .getPublicUrl(storagePath);
        await supabase
          .from("stories")
          .update({ audio_url: publicUrl })
          .eq("id", savedStoryId);
      }
    }

    await supabase.rpc("increment_stories_generated", { uid: profile.id });
    setProfile((p) => p ? { ...p, stories_generated: p.stories_generated + 1 } : p);
  }

  // ── Start over ────────────────────────────────────────────
  function handleReset() {
    if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);

    // Anonymous user hit limit → prompt signup instead
    if (!profile && getAnonCount() >= ANON_LIMIT) {
      setState(initialState);
      setShowSignupPrompt(true);
      return;
    }

    setShowUpgrade(false);
    setState(initialState);
  }

  // ── Render ─────────────────────────────────────────────────
  if (authLoading) return null;

  return (
    <>
      <main className="relative min-h-screen flex flex-col items-center justify-center px-6 py-10 overflow-hidden">
        <StarField />

        {/* Vignette */}
        <div
          className="fixed inset-0 pointer-events-none z-10"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
          }}
        />

        <div className="relative z-20 w-full max-w-2xl animate-fade-in">
          {/* Logo */}
          <div className="text-center mb-10">
            <div
              style={{
                fontFamily: "'Cormorant SC', Georgia, serif",
                fontSize: 13,
                letterSpacing: "0.35em",
                color: "rgba(245,230,200,0.3)",
                marginBottom: 6,
              }}
            >
              סיפור
            </div>
            <div
              style={{
                fontFamily: "'Cormorant SC', Georgia, serif",
                fontSize: 42,
                fontWeight: 600,
                letterSpacing: "0.12em",
                color: "#f5e6c8",
                lineHeight: 1,
              }}
            >
              Sipur
            </div>
            <div
              style={{
                marginTop: 9,
                fontSize: 13,
                letterSpacing: "0.2em",
                color: "rgba(245,230,200,0.28)",
                fontStyle: "italic",
              }}
            >
              your story told
            </div>

            {/* Profile button — inline below tagline, left-aligned */}
            {profile && state.stage === "compose" && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 20 }}>
                <button
                  onClick={() => router.push("/profile")}
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    border: "1px solid rgba(245,230,200,0.15)",
                    background: "rgba(245,230,200,0.05)",
                    color: "rgba(245,230,200,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Error banner */}
          {state.error && (
            <div
              className="mb-6 px-4 py-3 rounded-xl text-center text-sm"
              style={{
                background: "rgba(200,80,80,0.15)",
                border: "1px solid rgba(200,80,80,0.3)",
                color: "rgba(245,200,200,0.8)",
                fontStyle: "italic",
              }}
            >
              {state.error}
            </div>
          )}

          {/* ── Anonymous story counter ── */}
          {!profile && !showSignupPrompt && !showUpgrade &&
            (state.stage === "compose" || state.stage === "classifying" || state.stage === "confirm") && (
            <div
              className="mb-4 text-center"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 13,
                fontStyle: "italic",
                color: "rgba(245,230,200,0.3)",
                letterSpacing: "0.08em",
              }}
            >
              {ANON_LIMIT - getAnonCount()} free {ANON_LIMIT - getAnonCount() === 1 ? "story" : "stories"} remaining · <button
                onClick={() => setShowSignupPrompt(true)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "rgba(245,230,200,0.4)",
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 13,
                  fontStyle: "italic",
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                  textDecoration: "underline",
                  textDecorationColor: "rgba(245,230,200,0.2)",
                }}
              >
                Sign in
              </button>
            </div>
          )}

          {/* ── Auth / gate screens ── */}
          {showSignupPrompt && (
            <AuthScreen
              mode="signup"
              prompt="You've used your free stories. Create a free account to continue — 5 more stories, no charge."
              onAuth={handleAuth}
            />
          )}

          {showUpgrade && !showSignupPrompt && (
            <UpgradePrompt onBack={() => { setShowUpgrade(false); setState(initialState); }} />
          )}

          {/* ── Main stage machine ── */}
          {!showSignupPrompt && !showUpgrade && (
            <>
              {(state.stage === "compose" || state.stage === "classifying") && (
                <ComposeScreen
                  initialSeed={state.seed}
                  loading={state.stage === "classifying"}
                  onConfirm={handleSeedConfirmed}
                />
              )}

              {state.stage === "confirm" && state.daas && state.seed && (
                <ConfirmScreen
                  seed={state.seed}
                  daas={state.daas}
                  onConfirm={handleConfirmed}
                  onEdit={handleEditSeed}
                />
              )}

              {state.stage === "generating" && state.daas && (
                <GeneratingScreen daas={state.daas} />
              )}

              {state.stage === "preparing" && state.daas && (
                <GeneratingScreen daas={state.daas} label="Preparing the narration..." />
              )}
            </>
          )}

          {/* Footer */}
          <div
            className="mt-14 text-center"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
          >
            {profile && (
              <button
                onClick={handleSignOut}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(245,230,200,0.2)",
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  cursor: "pointer",
                  fontStyle: "italic",
                  padding: 0,
                }}
              >
                Sign out · {profile.email}
              </button>
            )}
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.25em",
                color: "rgba(245,230,200,0.12)",
                textTransform: "uppercase",
              }}
            >
              Guided by Daas · ReRo Ventures
            </div>
          </div>
        </div>
      </main>

      {/* PlaybackScreen rendered outside transform/opacity containers so position:fixed works */}
      {state.stage === "playback" && state.story && state.seed && state.daas && state.audioUrl && (
        <PlaybackScreen
          story={state.story}
          seed={state.seed}
          daas={state.daas}
          audioUrl={state.audioUrl}
          onReset={handleReset}
          loggedIn={!!profile}
          onSave={profile ? handleSaveStory : undefined}
        />
      )}
    </>
  );
}
