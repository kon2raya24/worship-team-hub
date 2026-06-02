"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import { ROOTS, SCALES, type ScaleDef } from "@/lib/fretboard";
import { buildDiatonicChords } from "@/lib/fretboard-chords";
import { useBackingTrack } from "@/lib/use-backing-track";

const QUALITIES = [
  { id: "major", label: "Major" },
  { id: "natural-minor", label: "Minor" },
] as const;
type QualityId = (typeof QUALITIES)[number]["id"];

const PROGRESSIONS = [
  { id: "pop", label: "Pop", degrees: [1, 5, 6, 4] },
  { id: "classic", label: "Classic", degrees: [1, 4, 5] },
  { id: "fifties", label: "'50s", degrees: [1, 6, 4, 5] },
  { id: "twofiveone", label: "ii–V–I", degrees: [2, 5, 1] },
];

export function BackingTrack() {
  const [root, setRoot] = useState("G");
  const [qualityId, setQualityId] = useState<QualityId>("major");
  const [progId, setProgId] = useState("pop");
  const [bpm, setBpm] = useState(90);
  const [barsPerChord, setBarsPerChord] = useState(1);
  const [click, setClick] = useState(false);

  const scale = useMemo<ScaleDef>(
    () => SCALES.find((s) => s.id === qualityId) ?? SCALES[0],
    [qualityId],
  );
  const degrees = useMemo(
    () => PROGRESSIONS.find((p) => p.id === progId)?.degrees ?? PROGRESSIONS[0].degrees,
    [progId],
  );
  // Resolve the progression's scale degrees to real diatonic chords in this key.
  const progChords = useMemo(() => {
    const all = buildDiatonicChords(root, scale);
    return degrees
      .map((d) => all.find((c) => c.degree === d))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
  }, [root, scale, degrees]);
  const voices = useMemo(
    () => progChords.map((c) => ({ pcs: c.pcs, bassPc: c.pcs[0] })),
    [progChords],
  );

  const track = useBackingTrack({ chords: voices, bpm, barsPerChord, click });
  const { toggle } = track;

  // Spacebar starts/stops.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <div className="space-y-5">
      {/* Setup */}
      <div className="glass space-y-4 rounded-2xl p-4 ring-1 ring-border sm:p-5">
        {/* Key */}
        <div className="space-y-1.5">
          <span className="eyebrow">Key</span>
          <div className="flex flex-wrap gap-1.5">
            {ROOTS.map((r) => {
              const active = r === root;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoot(r)}
                  aria-pressed={active}
                  className={
                    "min-w-[44px] rounded-lg px-3 py-2 text-sm font-mono font-semibold transition-colors " +
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
          {/* Quality */}
          <div className="space-y-1.5">
            <span className="eyebrow">Tonality</span>
            <div className="flex rounded-xl bg-tint-1 p-1 ring-1 ring-border sm:w-fit">
              {QUALITIES.map((q) => {
                const active = q.id === qualityId;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setQualityId(q.id)}
                    aria-pressed={active}
                    className={
                      "flex-1 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none " +
                      (active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    {q.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progression */}
          <div className="space-y-1.5">
            <span className="eyebrow">Progression</span>
            <div className="flex flex-wrap gap-1.5">
              {PROGRESSIONS.map((p) => {
                const active = p.id === progId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProgId(p.id)}
                    aria-pressed={active}
                    className={
                      "rounded-lg px-3 py-1.5 text-sm font-medium ring-1 transition-colors " +
                      (active
                        ? "bg-primary/15 text-primary ring-primary/40"
                        : "bg-tint-1 text-foreground/80 ring-border hover:bg-tint-2 hover:text-foreground")
                    }
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tempo */}
        <div className="space-y-1.5">
          <span className="eyebrow">Tempo — {bpm} BPM</span>
          <input
            type="range"
            min={50}
            max={200}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            aria-label="Tempo in beats per minute"
            className="w-full accent-primary"
          />
        </div>

        {/* Bars per chord + click */}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div className="space-y-1.5">
            <span className="eyebrow">Bars per chord</span>
            <div className="inline-flex rounded-xl bg-tint-1 p-1 ring-1 ring-border">
              {[1, 2].map((n) => {
                const active = n === barsPerChord;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setBarsPerChord(n)}
                    aria-pressed={active}
                    className={
                      "min-w-[44px] rounded-lg px-3 py-1.5 text-sm font-medium tabular-nums transition-colors " +
                      (active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground/85">
            <input
              type="checkbox"
              checked={click}
              onChange={(e) => setClick(e.target.checked)}
              className="size-4 accent-primary"
            />
            Metronome click
          </label>
        </div>
      </div>

      {/* Transport */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={track.running}
          className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02]"
        >
          {track.running ? <Pause className="size-4" /> : <Play className="size-4" />}
          {track.running ? "Stop" : "Play"}
        </button>
      </div>

      {/* Progression chords — current one lit */}
      <div className="space-y-2">
        <span className="eyebrow">
          {root} {scale.name} · {progChords.map((c) => c.roman).join(" – ")}
        </span>
        <div className="flex flex-wrap gap-2">
          {progChords.map((c, i) => {
            const active = track.currentIndex === i;
            return (
              <div
                key={`${c.degree}-${i}`}
                className={
                  "min-w-[84px] rounded-xl p-3 text-center ring-1 transition-all " +
                  (active
                    ? "bg-primary/15 ring-primary/60 scale-105"
                    : "bg-tint-1 ring-border")
                }
              >
                <div className="eyebrow">{c.roman}</div>
                <div className="font-display text-lg font-semibold text-foreground/95">{c.name}</div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {c.notes.join(" ")}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Pick a key and a progression, then solo over it with the matching {scale.name.toLowerCase()}{" "}
        scale on the{" "}
        <a href="/games/fretboard" className="text-primary hover:underline">
          Fretboard Explorer
        </a>
        . Press{" "}
        <kbd className="rounded border border-border bg-tint-1 px-1.5 py-0.5 font-mono text-xs">
          Space
        </kbd>{" "}
        to play or stop.
      </p>
    </div>
  );
}
