"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ROOTS,
  SCALES,
  SCALE_CATEGORIES,
  STANDARD_TUNING,
  buildComparison,
  buildScaleFretboard,
  scaleNotes,
  sharedToneCount,
  type ScaleDef,
} from "@/lib/fretboard";
import { getPositions, noteKey, type PatternMode } from "@/lib/fretboard-patterns";
import { buildDiatonicChords } from "@/lib/fretboard-chords";

const MAX_FRET = 15;

const LABEL_MODES = [
  { id: "notes", label: "Notes" },
  { id: "intervals", label: "Intervals" },
  { id: "hide", label: "Hide" },
] as const;
type LabelMode = (typeof LABEL_MODES)[number]["id"];

const PATTERNS: { id: PatternMode; label: string }[] = [
  { id: "full", label: "Full" },
  { id: "caged", label: "CAGED" },
  { id: "3nps", label: "3NPS" },
  { id: "diagonal", label: "Diagonal" },
];

// --- SVG geometry (px) ---
const STRING_GAP = 34;
const FRET_W = 52;
const PAD_T = 22;
const PAD_L = 60; // open-string label + open-note column, left of the nut
const PAD_R = 18;
const PAD_B = 40; // fret numbers, clear of the bottom row of dots
const DOT_R = 12;
const N_STRINGS = 6;
const BOARD_H = STRING_GAP * (N_STRINGS - 1);
const SVG_W = PAD_L + FRET_W * MAX_FRET + PAD_R;
const SVG_H = PAD_T + BOARD_H + PAD_B;
const INLAY_FRETS = [3, 5, 7, 9, 15];
const DOUBLE_INLAY = 12;

// String 0 (low E) at the top → string 5 (high e) at the bottom.
const stringY = (s: number) => PAD_T + s * STRING_GAP;
const fretLineX = (fret: number) => PAD_L + fret * FRET_W;
// Fretted notes sit centered in their fret space; open notes sit left of the nut.
const noteX = (fret: number) => (fret === 0 ? PAD_L - FRET_W * 0.36 : PAD_L + (fret - 0.5) * FRET_W);
const BOARD_CENTER_Y = PAD_T + BOARD_H / 2;

/** Grouped scale picker, reused for the main scale and the comparison scale. */
function ScaleSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger className="w-full">
        <SelectValue>
          {(v: string | null) => SCALES.find((s) => s.id === v)?.name ?? "Select…"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SCALE_CATEGORIES.map((cat) => (
          <SelectGroup key={cat}>
            <SelectLabel>{cat}</SelectLabel>
            {SCALES.filter((s) => s.category === cat).map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

type Dot = {
  key: string;
  x: number;
  y: number;
  label: string;
  fillClass: string;
  textClass: string;
  hollow: boolean;
  ring: boolean;
  dim: boolean;
};

export function FretboardExplorer() {
  const [root, setRoot] = useState<string>("G"); // worship's workhorse key
  const [scaleId, setScaleId] = useState("major");
  const [scaleBId, setScaleBId] = useState("natural-minor");
  const [labelMode, setLabelMode] = useState<LabelMode>("notes");
  const [pattern, setPattern] = useState<PatternMode>("full");
  const [posIndex, setPosIndex] = useState(0);
  const [compare, setCompare] = useState(false);
  const [selectedDegree, setSelectedDegree] = useState<number | null>(null);

  const scale = useMemo<ScaleDef>(() => SCALES.find((s) => s.id === scaleId) ?? SCALES[0], [scaleId]);
  const scaleB = useMemo<ScaleDef>(
    () => SCALES.find((s) => s.id === scaleBId) ?? SCALES[1],
    [scaleBId],
  );
  const notes = useMemo(() => buildScaleFretboard(root, scale, MAX_FRET), [root, scale]);
  const noteList = useMemo(() => scaleNotes(root, scale), [root, scale]);
  const positions = useMemo(
    () => getPositions(pattern, root, scale, MAX_FRET),
    [pattern, root, scale],
  );
  const chords = useMemo(() => buildDiatonicChords(root, scale), [root, scale]);
  const selectedChord = useMemo(
    () => (selectedDegree ? chords.find((c) => c.degree === selectedDegree) ?? null : null),
    [selectedDegree, chords],
  );

  // Changing the pattern/key/scale jumps back to the first position.
  const resetView = () => {
    setPosIndex(0);
    setSelectedDegree(null);
  };
  const chooseRoot = (r: string) => {
    setRoot(r);
    resetView();
  };
  const chooseScale = (v: string) => {
    setScaleId(v);
    resetView();
  };
  const choosePattern = (p: PatternMode) => {
    setPattern(p);
    resetView();
  };
  const selectChord = (degree: number) => {
    setSelectedDegree((d) => (d === degree ? null : degree));
    setPattern("full");
    setPosIndex(0);
  };

  const hasPositions = !compare && positions.length > 0;
  const idx = hasPositions ? ((posIndex % positions.length) + positions.length) % positions.length : 0;
  const activeKeys = hasPositions ? positions[idx].keys : null;
  // 3NPS chosen on a non-7-note scale → no positions to show.
  const notApplicable = !compare && pattern === "3nps" && positions.length === 0;

  const shared = sharedToneCount(scale, scaleB);

  const dots = useMemo<Dot[]>(() => {
    if (compare) {
      return buildComparison(root, scale, scaleB, MAX_FRET).map((n) => {
        const both = n.inA && n.inB;
        const aOnly = n.inA && !n.inB;
        return {
          key: `${n.string}-${n.fret}`,
          x: noteX(n.fret),
          y: stringY(n.string),
          label: labelMode === "notes" ? n.note : n.interval,
          fillClass: both ? "fill-primary" : aOnly ? "fill-accent" : "fill-background stroke-chart-4",
          textClass: both ? "fill-primary-foreground" : aOnly ? "fill-accent-foreground" : "fill-foreground",
          hollow: !n.inA, // B-only notes render as hollow outlines
          ring: n.isRoot,
          dim: false,
        };
      });
    }
    const selPcs = selectedChord ? new Set(selectedChord.pcs) : null;
    return notes.map((n) => ({
      key: `${n.string}-${n.fret}`,
      x: noteX(n.fret),
      y: stringY(n.string),
      label: labelMode === "notes" ? n.note : n.interval,
      fillClass: n.isRoot ? "fill-primary" : "fill-accent",
      textClass: n.isRoot ? "fill-primary-foreground" : "fill-accent-foreground",
      hollow: false,
      ring: false,
      dim: selPcs
        ? !selPcs.has(n.pc)
        : activeKeys
          ? !activeKeys.has(noteKey(n.string, n.fret))
          : false,
    }));
  }, [compare, root, scale, scaleB, notes, activeKeys, labelMode, selectedChord]);

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="glass rounded-2xl p-4 sm:p-5 ring-1 ring-border space-y-4">
        {/* Key — tap to choose */}
        <div className="space-y-1.5">
          <span className="eyebrow">Key</span>
          <div className="flex flex-wrap gap-1.5">
            {ROOTS.map((r) => {
              const active = r === root;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => chooseRoot(r)}
                  aria-pressed={active}
                  className={
                    "min-w-[44px] px-3 py-2 rounded-lg text-sm font-mono font-semibold transition-colors " +
                    (active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-tint-1 text-foreground/80 ring-1 ring-border hover:bg-tint-2 hover:text-foreground")
                  }
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Scale — grouped dropdown */}
          <label className="block space-y-1.5">
            <span className="eyebrow">{compare ? "Scale A" : "Scale"}</span>
            <ScaleSelect value={scaleId} onChange={chooseScale} />
          </label>

          {/* Label mode — segmented */}
          <div className="space-y-1.5">
            <span className="eyebrow">Labels</span>
            <div className="flex w-full rounded-xl bg-tint-1 p-1 ring-1 ring-border sm:w-fit">
              {LABEL_MODES.map((m) => {
                const active = m.id === labelMode;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setLabelMode(m.id)}
                    aria-pressed={active}
                    className={
                      "flex-1 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors sm:flex-none " +
                      (active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Compare — toggle + second scale */}
        <div className="space-y-1.5">
          <span className="eyebrow">Compare</span>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setCompare((c) => !c);
                setSelectedDegree(null);
              }}
              aria-pressed={compare}
              className={
                "px-3.5 py-1.5 text-sm font-medium rounded-lg ring-1 transition-colors " +
                (compare
                  ? "bg-primary text-primary-foreground ring-transparent shadow-sm"
                  : "bg-tint-1 text-muted-foreground ring-border hover:text-foreground")
              }
            >
              {compare ? "Comparing" : "Compare a second scale"}
            </button>
            {compare && (
              <div className="min-w-[200px] flex-1">
                <ScaleSelect value={scaleBId} onChange={setScaleBId} />
              </div>
            )}
          </div>
        </div>

        {/* Pattern + position stepper — hidden while comparing */}
        {!compare && (
          <div className="space-y-1.5">
            <span className="eyebrow">Pattern</span>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-xl bg-tint-1 p-1 ring-1 ring-border">
                {PATTERNS.map((p) => {
                  const active = p.id === pattern;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => choosePattern(p.id)}
                      aria-pressed={active}
                      className={
                        "px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors " +
                        (active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground")
                      }
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {hasPositions && (
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-tint-1 p-1 ring-1 ring-border">
                  <button
                    type="button"
                    onClick={() => setPosIndex((i) => i - 1)}
                    aria-label="Previous position"
                    className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-tint-2 hover:text-foreground"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="min-w-[96px] text-center text-sm font-medium tabular-nums">
                    {positions[idx].label}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPosIndex((i) => i + 1)}
                    aria-label="Next position"
                    className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-tint-2 hover:text-foreground"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              )}
            </div>
            {notApplicable && (
              <p className="text-sm text-chart-4">
                3 Notes Per String needs a 7-note scale (Major, the modes, harmonic/melodic
                minor…). Showing the full scale.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Summary + plain-language hint */}
      <div className="space-y-2">
        {compare ? (
          <>
            <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground/95">
              {root} {scale.name} <span className="text-muted-foreground">vs</span> {scaleB.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              <span className="text-primary font-medium">{shared} shared</span> ·{" "}
              {scale.intervals.length - shared} only in {scale.name} ·{" "}
              {scaleB.intervals.length - shared} only in {scaleB.name}.
            </p>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground/95">
                {root} {scale.name}
              </h2>
              <span className="text-muted-foreground">·</span>
              <div className="flex flex-wrap gap-1.5">
                {noteList.map((n, i) => (
                  <span
                    key={`${n}-${i}`}
                    className={
                      "inline-flex items-center justify-center min-w-[34px] px-2 py-0.5 rounded-md font-mono text-sm " +
                      (i === 0
                        ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                        : "bg-tint-1 text-foreground/90 ring-1 ring-border")
                    }
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedChord
                ? `Showing ${selectedChord.roman} · ${selectedChord.name} (${selectedChord.notes.join(" ")}).`
                : activeKeys
                  ? "The bright dots are this position; the faded ones show where it sits on the neck."
                  : "Every lit dot is a place to play this scale across the neck."}{" "}
              <span className="text-primary font-medium">Root</span> notes are highlighted.
            </p>
          </>
        )}
      </div>

      {/* Fretboard */}
      <div className="glass rounded-2xl p-3 sm:p-4 ring-1 ring-border overflow-x-auto">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width={SVG_W}
          height={SVG_H}
          className="max-w-none"
          role="img"
          aria-label={`${root} ${scale.name}${compare ? ` versus ${scaleB.name}` : ""} on a guitar fretboard`}
        >
          {/* Inlay markers */}
          {INLAY_FRETS.map((f) => (
            <circle
              key={`inlay-${f}`}
              cx={noteX(f)}
              cy={BOARD_CENTER_Y}
              r={5}
              className="fill-muted-foreground/25"
            />
          ))}
          <circle cx={noteX(DOUBLE_INLAY)} cy={BOARD_CENTER_Y - STRING_GAP} r={5} className="fill-muted-foreground/25" />
          <circle cx={noteX(DOUBLE_INLAY)} cy={BOARD_CENTER_Y + STRING_GAP} r={5} className="fill-muted-foreground/25" />

          {/* Frets */}
          {Array.from({ length: MAX_FRET }, (_, i) => i + 1).map((f) => (
            <line
              key={`fret-${f}`}
              x1={fretLineX(f)}
              y1={stringY(0)}
              x2={fretLineX(f)}
              y2={stringY(N_STRINGS - 1)}
              className="stroke-foreground/15"
              strokeWidth={2}
            />
          ))}
          {/* Nut */}
          <line
            x1={fretLineX(0)}
            y1={stringY(0)}
            x2={fretLineX(0)}
            y2={stringY(N_STRINGS - 1)}
            className="stroke-foreground/45"
            strokeWidth={5}
            strokeLinecap="round"
          />

          {/* Strings */}
          {Array.from({ length: N_STRINGS }, (_, s) => s).map((s) => (
            <line
              key={`string-${s}`}
              x1={PAD_L - 30}
              y1={stringY(s)}
              x2={fretLineX(MAX_FRET)}
              y2={stringY(s)}
              className="stroke-foreground/25"
              strokeWidth={1 + (N_STRINGS - 1 - s) * 0.35}
            />
          ))}

          {/* Open-string names (which string is which) */}
          {STANDARD_TUNING.map((openNote, s) => (
            <text
              key={`open-${s}`}
              x={14}
              y={stringY(s)}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-muted-foreground font-mono"
              fontSize={10}
            >
              {openNote}
            </text>
          ))}

          {/* Fret numbers */}
          {Array.from({ length: MAX_FRET }, (_, i) => i + 1).map((f) => (
            <text
              key={`num-${f}`}
              x={noteX(f)}
              y={SVG_H - 14}
              textAnchor="middle"
              className="fill-muted-foreground font-mono"
              fontSize={10}
            >
              {f}
            </text>
          ))}

          {/* Note dots */}
          {dots.map((d) => (
            <g key={d.key} opacity={d.dim ? 0.14 : 1}>
              {d.ring && (
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={DOT_R + 3}
                  className="fill-none stroke-foreground/50"
                  strokeWidth={1.5}
                />
              )}
              <circle
                cx={d.x}
                cy={d.y}
                r={DOT_R}
                strokeWidth={2}
                className={d.hollow ? d.fillClass : `${d.fillClass} stroke-background`}
              />
              {labelMode !== "hide" && (
                <text
                  x={d.x}
                  y={d.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={d.textClass}
                  fontSize={10.5}
                  fontWeight={600}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {d.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Chords — diatonic progression, hidden while comparing */}
      {!compare && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="eyebrow">
              Chords in {root} {scale.name}
            </span>
            {selectedChord && (
              <button
                type="button"
                onClick={() => setSelectedDegree(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear ✕
              </button>
            )}
          </div>
          {chords.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
                {chords.map((c) => {
                  const active = c.degree === selectedDegree;
                  return (
                    <button
                      key={c.degree}
                      type="button"
                      onClick={() => selectChord(c.degree)}
                      aria-pressed={active}
                      className={
                        "rounded-xl p-2.5 text-center ring-1 transition-colors " +
                        (active
                          ? "bg-primary/15 ring-primary/50"
                          : "bg-tint-1 ring-border hover:bg-tint-2")
                      }
                    >
                      <div className="eyebrow">{c.roman}</div>
                      <div className="font-display text-base font-semibold text-foreground/95">
                        {c.name}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {c.notes.join(" ")}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-accent">{c.seventh}</div>
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground">
                Tap a chord to light up its tones on the neck. The whole {root} {scale.name} scale
                solos over all of them.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Chord progressions need a 7-note scale — try Major, a mode, or harmonic/melodic minor.
            </p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        {compare ? (
          <>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block size-3.5 rounded-full bg-primary" /> In both
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block size-3.5 rounded-full bg-accent" /> Only {scale.name}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block size-3.5 rounded-full border-2 border-chart-4" /> Only{" "}
              {scaleB.name}
            </span>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block size-3.5 rounded-full bg-primary" /> Root note
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block size-3.5 rounded-full bg-accent" /> Scale tone
            </span>
            <span className="hidden sm:inline">Standard tuning — low E on top</span>
          </>
        )}
      </div>
    </div>
  );
}
