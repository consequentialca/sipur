"use client";

import { useState } from "react";
import { Seed, Character } from "@/lib/types";

const TONES = ["Funny", "Heartwarming", "Cute", "Emotional", "Adventurous", "Calm & Dreamy"];
const LESSONS = [
  "Being kind to others",
  "Waiting for something good",
  "Making things right",
  "Getting along with a sibling",
  "Being brave",
  "Finding your place",
  "Shabbos & special days",
  "Gratitude for small things",
];

const CHIP_COLORS = {
  gold:   { bg: "rgba(212,175,55,0.15)",  border: "rgba(212,175,55,0.45)",  text: "#d4af37", glow: "rgba(212,175,55,0.25)", hex: "#d4af37" },
  blue:   { bg: "rgba(100,160,220,0.15)", border: "rgba(100,160,220,0.45)", text: "#64a0dc", glow: "rgba(100,160,220,0.25)", hex: "#64a0dc" },
  green:  { bg: "rgba(100,180,120,0.15)", border: "rgba(100,180,120,0.45)", text: "#64b478", glow: "rgba(100,180,120,0.25)", hex: "#64b478" },
  purple: { bg: "rgba(180,120,220,0.15)", border: "rgba(180,120,220,0.45)", text: "#b478dc", glow: "rgba(180,120,220,0.25)", hex: "#b478dc" },
};

type ColorKey = keyof typeof CHIP_COLORS;

// ─── Sub-components ───────────────────────────────────────────

function Chip({ color, label, value, onTap, onClear }: {
  color: ColorKey; label: string; value: string | null;
  onTap: () => void; onClear?: () => void;
}) {
  const c = CHIP_COLORS[color];
  const [hovered, setHovered] = useState(false);
  const isEmpty = !value;

  return (
    <span
      onClick={onTap}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 11px 4px", borderRadius: 20, cursor: "pointer",
        background: isEmpty ? "rgba(255,255,255,0.03)" : c.bg,
        border: `1px solid ${isEmpty ? "rgba(255,255,255,0.12)" : c.border}`,
        color: isEmpty ? "rgba(245,230,200,0.28)" : c.text,
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: 17, fontStyle: isEmpty ? "italic" : "normal",
        fontWeight: isEmpty ? 400 : 600, letterSpacing: "0.02em",
        boxShadow: isEmpty ? "none" : `0 0 10px ${c.glow}`,
        whiteSpace: "nowrap", userSelect: "none", transition: "all 0.25s",
      }}
    >
      {value || label}
      {!isEmpty && onClear && hovered && (
        <span
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          style={{ fontSize: 10, opacity: 0.5, marginLeft: 2 }}
        >✕</span>
      )}
    </span>
  );
}

function SparkButton({ color, loading, onClick }: {
  color: string; loading: boolean; onClick: () => void;
}) {
  return (
    <span
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title="Generate this"
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 18, height: 18, borderRadius: "50%", fontSize: 9,
        border: `1px solid ${color}55`, color: `${color}88`,
        cursor: "pointer", flexShrink: 0, transition: "all 0.2s",
        animation: loading ? "pulse 0.8s infinite" : "none",
        background: loading ? `${color}18` : "transparent",
      }}
    >{loading ? "·" : "✦"}</span>
  );
}

function PlusButton({ onClick }: { onClick: () => void }) {
  return (
    <span
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 18, height: 18, borderRadius: "50%", fontSize: 12,
        border: "1px solid rgba(245,230,200,0.2)", color: "rgba(245,230,200,0.35)",
        cursor: "pointer", flexShrink: 0, transition: "all 0.2s",
      }}
    >+</span>
  );
}

function Selector({ options, color, onSelect, onClose }: {
  options: string[]; color: ColorKey;
  onSelect: (v: string) => void; onClose: () => void;
}) {
  const c = CHIP_COLORS[color];
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute", top: "calc(100% + 8px)", left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(10,8,16,0.98)", border: "1px solid rgba(245,230,200,0.1)",
        borderRadius: 14, padding: "10px 8px",
        display: "flex", flexWrap: "wrap", gap: 6,
        maxWidth: 290, zIndex: 100,
        boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
        animation: "fadeUp 0.16s ease",
      }}
    >
      {options.map((opt) => (
        <span
          key={opt}
          onClick={() => { onSelect(opt); onClose(); }}
          style={{
            padding: "5px 12px", borderRadius: 16, cursor: "pointer",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
            color: c.text, fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 15, fontWeight: 500, transition: "all 0.15s",
          }}
        >{opt}</span>
      ))}
    </div>
  );
}

function NameEntry({ onAdd, onClose }: {
  onAdd: (c: Character) => void; onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const canConfirm = name.trim().length > 0 && age.trim().length > 0;
  const confirm = () => {
    if (canConfirm) { onAdd({ name: name.trim().toUpperCase(), age: parseInt(age) }); onClose(); }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute", top: "calc(100% + 8px)", left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(10,8,16,0.98)", border: "1px solid rgba(100,160,220,0.2)",
        borderRadius: 14, padding: "14px 16px",
        display: "flex", flexDirection: "column", gap: 10, zIndex: 100,
        boxShadow: "0 20px 60px rgba(0,0,0,0.7)", animation: "fadeUp 0.16s ease",
        minWidth: 210,
      }}
    >
      <input
        autoFocus value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && confirm()}
        placeholder="Name"
        style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(100,160,220,0.3)",
          borderRadius: 8, padding: "7px 12px", color: "#64a0dc",
          fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16,
          outline: "none", width: "100%",
        }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={age}
          onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))}
          onKeyDown={(e) => e.key === "Enter" && confirm()}
          placeholder="Age"
          style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(100,160,220,0.3)",
            borderRadius: 8, padding: "7px 12px", color: "#64a0dc",
            fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16,
            outline: "none", width: 70,
          }}
        />
        <button
          disabled={!canConfirm} onClick={confirm}
          style={{
            flex: 1, padding: "7px 12px", borderRadius: 8, border: "none",
            background: canConfirm ? "rgba(100,160,220,0.2)" : "rgba(255,255,255,0.03)",
            color: canConfirm ? "#64a0dc" : "rgba(255,255,255,0.15)",
            fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15,
            fontWeight: 600, cursor: canConfirm ? "pointer" : "default",
          }}
        >Add</button>
      </div>
    </div>
  );
}

// ─── Demo generators (replace with real Daas chip generation) ─

const DEMO = {
  tones: [["Heartwarming"], ["Funny"], ["Funny", "Heartwarming"], ["Calm & Dreamy"]],
  plots: [
    "faced the disappointment of not becoming a kugel like their Zaidy — but discovered that being a karpas at the Seder is its own irreplaceable role",
    "was the smallest candle on the menorah but gave the most light",
    "got lost in the forest and found a hidden garden nobody else had ever seen",
  ],
  lessons: ["trusting your own unique path", "being brave when everything feels too big", "gratitude for the small gifts hiding in plain sight"],
};

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── ComposeScreen ────────────────────────────────────────────

export default function ComposeScreen({ initialSeed, loading, onConfirm }: {
  initialSeed: Seed | null;
  loading: boolean;
  onConfirm: (seed: Seed) => void;
}) {
  const [tones, setTones] = useState<string[]>(initialSeed?.tone ?? []);
  const [characters, setCharacters] = useState<Character[]>(initialSeed?.characters ?? []);
  const [plot, setPlot] = useState(initialSeed?.plot ?? "");
  const [lesson, setLesson] = useState(initialSeed?.lesson_label ?? "");
  const [openSelector, setOpenSelector] = useState<string | null>(null);
  const [chipLoading, setChipLoading] = useState<Record<string, boolean>>({});

  const closeAll = () => setOpenSelector(null);

  const isEmpty = tones.length === 0 && characters.length === 0 && !plot && !lesson;
  const isReady = tones.length > 0 && characters.length > 0 && plot.trim() && lesson.trim();

  const buttonLabel = loading
    ? "Classifying..."
    : isReady
    ? "Begin"
    : isEmpty
    ? "✦ Generate"
    : "✦ Generate remaining";

  const setChipLoad = (key: string, val: boolean) =>
    setChipLoading((p) => ({ ...p, [key]: val }));

  const generateChip = (key: string) => {
    setChipLoad(key, true);
    setTimeout(() => {
      if (key === "tone")   setTones(pick(DEMO.tones));
      if (key === "plot")   setPlot(pick(DEMO.plots));
      if (key === "lesson") setLesson(pick(DEMO.lessons));
      setChipLoad(key, false);
    }, 800 + Math.random() * 400);
  };

  const handleButton = () => {
    if (loading) return;
    if (isReady) {
      // Build raw seed sentence
      const raw = `A ${tones.join(" + ")} story about ${
        characters.map((c) => `${c.name} (${c.age})`).join(" + ")
      }, who ${plot}, teaching a lesson about ${lesson}.`;

      onConfirm({
        raw,
        tone: tones.map((t) => t.toLowerCase()),
        characters,
        plot,
        lesson_label: lesson,
        lesson_source: "list_selected",
        family_terms: [],
      });
      return;
    }
    // Generate missing fields
    if (tones.length === 0)    generateChip("tone");
    if (characters.length === 0) {
      setCharacters([{ name: "YOSSI", age: 8 }]); // placeholder — real app prompts name entry
    }
    if (!plot.trim())          generateChip("plot");
    if (!lesson.trim())        generateChip("lesson");
  };

  return (
    <div onClick={closeAll}>
      {/* Card */}
      <div style={{
        background: "rgba(255,255,255,0.025)", border: "1px solid rgba(245,230,200,0.07)",
        borderRadius: 22, padding: "30px 34px 26px", backdropFilter: "blur(10px)",
        boxShadow: "0 2px 50px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
        marginBottom: 24,
      }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: "rgba(245,230,200,0.2)",
          textTransform: "uppercase", marginBottom: 22 }}>Tonight's Story</div>

        <div style={{ fontSize: 18, lineHeight: 2.2, color: "rgba(245,230,200,0.65)",
          display: "flex", flexWrap: "wrap", alignItems: "center", gap: "5px 5px" }}>

          <span style={{ fontStyle: "italic", opacity: 0.45 }}>A</span>

          {/* TONE */}
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 4 }}
            onClick={(e) => e.stopPropagation()}>
            {tones.length === 0 ? (
              <>
                <Chip color="gold" label="tone" value={null} onTap={() => setOpenSelector("tone")} />
                <SparkButton color="#d4af37" loading={!!chipLoading.tone} onClick={() => generateChip("tone")} />
              </>
            ) : (
              <>
                {tones.map((t, i) => (
                  <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {i > 0 && <span style={{ opacity: 0.25, fontSize: 13 }}>+</span>}
                    <Chip color="gold" label="tone" value={t}
                      onTap={() => setOpenSelector("tone")}
                      onClear={() => setTones((p) => p.filter((x) => x !== t))} />
                  </span>
                ))}
                {tones.length < 2 && <PlusButton onClick={() => setOpenSelector("tone")} />}
                <SparkButton color="#d4af37" loading={!!chipLoading.tone}
                  onClick={() => { setTones([]); generateChip("tone"); }} />
              </>
            )}
            {openSelector === "tone" && (
              <Selector options={TONES.filter((t) => !tones.includes(t))} color="gold"
                onSelect={(t) => setTones((p) => [...p, t])} onClose={closeAll} />
            )}
          </div>

          <span style={{ fontStyle: "italic", opacity: 0.45 }}>story about</span>

          {/* NAMES */}
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 4 }}
            onClick={(e) => e.stopPropagation()}>
            {characters.map((c, i) => (
              <span key={c.name} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                {i > 0 && <span style={{ opacity: 0.25, fontSize: 13 }}>+</span>}
                <Chip color="blue" label="name" value={`${c.name} (${c.age})`}
                  onTap={() => {}}
                  onClear={() => setCharacters((p) => p.filter((x) => x.name !== c.name))} />
              </span>
            ))}
            <PlusButton onClick={() => setOpenSelector("name")} />
            {openSelector === "name" && (
              <NameEntry onAdd={(c) => setCharacters((p) => [...p, c])} onClose={closeAll} />
            )}
          </div>

          <span style={{ fontStyle: "italic", opacity: 0.45 }}>, who</span>

          {/* PLOT */}
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 4 }}
            onClick={(e) => e.stopPropagation()}>
            {openSelector === "plot" ? (
              <textarea
                autoFocus value={plot}
                onChange={(e) => setPlot(e.target.value)}
                onBlur={() => setOpenSelector(null)}
                rows={2}
                style={{
                  background: "rgba(100,180,120,0.1)", border: "1px solid rgba(100,180,120,0.4)",
                  borderRadius: 12, padding: "4px 12px", color: "#64b478",
                  fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17,
                  fontWeight: 600, outline: "none", resize: "none",
                  minWidth: 200, maxWidth: 380, lineHeight: 1.5,
                }}
              />
            ) : (
              <Chip color="green" label="what happens..." value={plot || null}
                onTap={() => setOpenSelector("plot")}
                onClear={plot ? () => setPlot("") : undefined} />
            )}
            <SparkButton color="#64b478" loading={!!chipLoading.plot}
              onClick={() => { closeAll(); generateChip("plot"); }} />
          </div>

          <span style={{ fontStyle: "italic", opacity: 0.45 }}>, teaching a lesson about</span>

          {/* LESSON */}
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 4 }}
            onClick={(e) => e.stopPropagation()}>
            <Chip color="purple" label="lesson" value={lesson || null}
              onTap={() => setOpenSelector("lesson")}
              onClear={lesson ? () => setLesson("") : undefined} />
            <SparkButton color="#b478dc" loading={!!chipLoading.lesson}
              onClick={() => { setLesson(""); generateChip("lesson"); }} />
            {openSelector === "lesson" && (
              <Selector options={LESSONS} color="purple"
                onSelect={(l) => setLesson(l)} onClose={closeAll} />
            )}
          </div>

          <span style={{ fontStyle: "italic", opacity: 0.45 }}>.</span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 18, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
        {[["#d4af37","Tone"],["#64a0dc","Names"],["#64b478","Plot"],["#b478dc","Lesson"]].map(([color, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, boxShadow: `0 0 5px ${color}` }} />
            <span style={{ fontSize: 10, letterSpacing: "0.22em", color: "rgba(245,230,200,0.25)", textTransform: "uppercase" }}>{label}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 9, color: "rgba(245,230,200,0.4)" }}>✦</span>
          <span style={{ fontSize: 10, letterSpacing: "0.22em", color: "rgba(245,230,200,0.25)", textTransform: "uppercase" }}>Generate field</span>
        </div>
      </div>

      {/* Smart button */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          onClick={handleButton}
          disabled={loading}
          style={{
            padding: "13px 44px", borderRadius: 40,
            background: isReady
              ? "linear-gradient(135deg, rgba(212,175,55,0.35) 0%, rgba(180,120,220,0.35) 100%)"
              : "rgba(255,255,255,0.04)",
            color: isReady ? "#f5e6c8" : "rgba(245,230,200,0.5)",
            fontFamily: isReady ? "'Cormorant SC', Georgia, serif" : "'Cormorant Garamond', Georgia, serif",
            fontSize: 15, letterSpacing: isReady ? "0.3em" : "0.15em",
            cursor: loading ? "default" : "pointer", transition: "all 0.35s",
            boxShadow: isReady ? "0 0 30px rgba(212,175,55,0.2), 0 0 60px rgba(180,120,220,0.1)" : "none",
            border: isReady ? "1px solid rgba(212,175,55,0.3)" : "1px solid rgba(245,230,200,0.1)",
            minWidth: 220, opacity: loading ? 0.6 : 1,
          }}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
