"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Seed, DaasResponse } from "@/lib/types";
import PlaybackScreen from "@/components/PlaybackScreen";
import StarField from "@/components/StarField";

interface StoryData {
  story_text: string;
  seed: Seed;
  daas_output: DaasResponse;
  audio_url: string | null;
}

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<StoryData | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [preparingAudio, setPreparingAudio] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data: row, error } = await supabase
        .from("stories")
        .select("story_text, seed, daas_output, audio_url")
        .eq("id", id)
        .single();

      if (error || !row) { setNotFound(true); setLoading(false); return; }

      const story = row as StoryData;
      setData(story);

      const url = story.audio_url;
      if (url && !url.startsWith("blob:")) {
        // Valid persistent URL — use directly
        setAudioUrl(url);
        setLoading(false);
      } else {
        // Missing or stale blob URL — re-run TTS
        setLoading(false);
        setPreparingAudio(true);
        try {
          const ttsRes = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ story: story.story_text }),
          });
          if (!ttsRes.ok) throw new Error("TTS failed");
          const blob = await ttsRes.blob();
          setAudioUrl(URL.createObjectURL(blob));
        } catch {
          // TTS failed — audioUrl stays null
        } finally {
          setPreparingAudio(false);
        }
      }
    })();
  }, [id]);

  if (loading) return <div style={{ minHeight: "100vh", background: "#0a0818" }} />;

  if (notFound || !data) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a0818",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        color: "rgba(245,238,216,0.3)", fontSize: 18, fontStyle: "italic",
      }}>
        Story not found
      </div>
    );
  }

  if (preparingAudio || !audioUrl) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0818", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
        <StarField />
        <div style={{ position: "relative", zIndex: 10, maxWidth: 480, margin: "0 auto", padding: "32px 24px" }}>
          {/* Back button */}
          <button
            onClick={() => router.push("/profile")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase",
              color: "rgba(245,238,216,0.35)", fontFamily: "'Cormorant Garamond', Georgia, serif",
            }}
          >← Back</button>
        </div>
        <div style={{
          position: "relative", zIndex: 10,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          minHeight: "60vh", gap: 24, textAlign: "center",
        }}>
          <div style={{
            fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase",
            color: "rgba(212,175,55,0.6)",
            textShadow: "0 0 10px rgba(212,175,55,0.5)",
            animation: "pulse 2s ease-in-out infinite alternate",
          }}>
            {preparingAudio ? "Preparing audio…" : "Audio unavailable for this story"}
          </div>
          {preparingAudio && (
            <div style={{ position: "relative", width: 80, height: 80 }}>
              <style>{`@keyframes orbit{0%{transform:rotate(0deg) translateX(28px) rotate(0deg);opacity:.9}25%{transform:rotate(90deg) translateX(28px) rotate(-90deg);opacity:.45}50%{transform:rotate(180deg) translateX(28px) rotate(-180deg);opacity:.9}75%{transform:rotate(270deg) translateX(28px) rotate(-270deg);opacity:.45}100%{transform:rotate(360deg) translateX(28px) rotate(-360deg);opacity:.9}}`}</style>
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                marginTop: -10, marginLeft: -10,
                animation: "orbit 4s linear infinite",
                transformOrigin: "center center",
                fontSize: 16, color: "#d4af37",
                textShadow: "0 0 8px rgba(212,175,55,0.9), 0 0 20px rgba(212,175,55,0.4)",
                lineHeight: 1, userSelect: "none",
              }}>✦</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <PlaybackScreen
      story={data.story_text}
      seed={data.seed}
      daas={data.daas_output}
      audioUrl={audioUrl}
      onReset={() => router.push("/profile")}
      loggedIn
      storyId={id}
    />
  );
}
