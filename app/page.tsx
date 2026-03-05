"use client";

import { useState } from "react";
import { AppState, Seed, DaasResponse } from "@/lib/types";
import ComposeScreen from "@/components/ComposeScreen";
import ConfirmScreen from "@/components/ConfirmScreen";
import GeneratingScreen from "@/components/GeneratingScreen";
import PlaybackScreen from "@/components/PlaybackScreen";
import StarField from "@/components/StarField";

const initialState: AppState = {
  stage: "compose",
  seed: null,
  daas: null,
  story: null,
  error: null,
};

export default function Home() {
  const [state, setState] = useState<AppState>(initialState);

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

      // PAUSE POINT — show parent the brief before generating
      setState((s) => ({ ...s, stage: "confirm", daas }));
    } catch (err) {
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

  // ── Stage 2: parent confirms → generate story ─────────────
  async function handleConfirmed() {
    if (!state.seed || !state.daas) return;
    setState((s) => ({ ...s, stage: "generating", error: null }));

    try {
      const res = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: state.seed, daas: state.daas }),
      });

      if (!res.ok) throw new Error("Story generation failed");
      const { story } = await res.json();

      setState((s) => ({ ...s, stage: "playback", story }));
    } catch (err) {
      setState((s) => ({
        ...s,
        stage: "confirm",
        error: "Something went wrong generating the story. Please try again.",
      }));
    }
  }

  // ── Start over ────────────────────────────────────────────
  function handleReset() {
    setState(initialState);
  }

  return (
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
        {/* Logo — always visible */}
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
            a bedtime story
          </div>
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

        {/* Stage rendering */}
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

        {state.stage === "playback" && state.story && state.seed && (
          <PlaybackScreen
            story={state.story}
            seed={state.seed}
            onReset={handleReset}
          />
        )}

        {/* Footer */}
        <div
          className="mt-14 text-center"
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
    </main>
  );
}
