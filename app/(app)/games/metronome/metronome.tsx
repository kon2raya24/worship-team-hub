"use client";

import { useEffect, useRef } from "react";
import { Minus, Pause, Play, Plus } from "lucide-react";
import { useMetronome } from "@/lib/use-metronome";

const TIME_SIGS = [2, 3, 4, 5, 6];

const PRESETS = [
  { label: "Largo", bpm: 50 },
  { label: "Adagio", bpm: 68 },
  { label: "Andante", bpm: 84 },
  { label: "Moderato", bpm: 100 },
  { label: "Allegro", bpm: 132 },
  { label: "Vivace", bpm: 160 },
  { label: "Presto", bpm: 184 },
];

function tempoName(bpm: number): string {
  if (bpm < 60) return "Largo";
  if (bpm < 76) return "Adagio";
  if (bpm < 92) return "Andante";
  if (bpm < 112) return "Moderato";
  if (bpm < 140) return "Allegro";
  if (bpm < 176) return "Vivace";
  return "Presto";
}

const stepBtn =
  "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium font-mono tabular-nums " +
  "bg-tint-1 text-foreground/80 ring-1 ring-border transition-colors hover:bg-tint-2 hover:text-foreground";

export function Metronome() {
  const m = useMetronome(100, 4);
  const { toggle } = m;
  const tapsRef = useRef<number[]>([]);

  // Tap along to set the tempo — averages the last few intervals.
  const tap = () => {
    const now = performance.now();
    const taps = tapsRef.current;
    if (taps.length && now - taps[taps.length - 1] > 2000) taps.length = 0; // stale → restart
    taps.push(now);
    if (taps.length > 6) taps.shift();
    if (taps.length >= 2) {
      let sum = 0;
      for (let i = 1; i < taps.length; i++) sum += taps[i] - taps[i - 1];
      m.setBpm(60000 / (sum / (taps.length - 1)));
    }
  };

  // Spacebar starts/stops, like a real metronome pedal.
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
      {/* Tempo display + transport */}
      <div className="glass space-y-5 rounded-2xl p-6 text-center ring-1 ring-border">
        {/* Beat indicator */}
        <div className="flex items-center justify-center gap-2.5">
          {Array.from({ length: m.beatsPerBar }).map((_, i) => {
            const active = m.currentBeat === i;
            const down = i === 0;
            return (
              <span
                key={i}
                className={
                  "rounded-full transition-all duration-75 " +
                  (active
                    ? `${down ? "bg-primary" : "bg-accent"} size-4 scale-125`
                    : "size-3 bg-muted-foreground/25")
                }
              />
            );
          })}
        </div>

        {/* BPM readout */}
        <div>
          <div className="font-display text-6xl font-bold tabular-nums text-foreground">{m.bpm}</div>
          <div className="eyebrow mt-1">
            {tempoName(m.bpm)} · BPM
          </div>
        </div>

        {/* Tempo slider */}
        <input
          type="range"
          min={40}
          max={240}
          value={m.bpm}
          onChange={(e) => m.setBpm(Number(e.target.value))}
          aria-label="Tempo in beats per minute"
          className="w-full max-w-md accent-primary"
        />

        {/* Steppers + start/stop */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button type="button" onClick={() => m.setBpm(m.bpm - 5)} className={stepBtn}>
            <Minus className="size-3.5" /> 5
          </button>
          <button type="button" onClick={() => m.setBpm(m.bpm - 1)} className={stepBtn}>
            <Minus className="size-3.5" /> 1
          </button>
          <button
            type="button"
            onClick={m.toggle}
            aria-pressed={m.running}
            className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-base font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02]"
          >
            {m.running ? <Pause className="size-4" /> : <Play className="size-4" />}
            {m.running ? "Stop" : "Start"}
          </button>
          <button type="button" onClick={() => m.setBpm(m.bpm + 1)} className={stepBtn}>
            <Plus className="size-3.5" /> 1
          </button>
          <button type="button" onClick={() => m.setBpm(m.bpm + 5)} className={stepBtn}>
            <Plus className="size-3.5" /> 5
          </button>
        </div>
      </div>

      {/* Meter + tap tempo */}
      <div className="glass space-y-4 rounded-2xl p-4 ring-1 ring-border sm:p-5">
        <div className="space-y-1.5">
          <span className="eyebrow">Beats per bar</span>
          <div className="inline-flex rounded-xl bg-tint-1 p-1 ring-1 ring-border">
            {TIME_SIGS.map((n) => {
              const active = n === m.beatsPerBar;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => m.setBeatsPerBar(n)}
                  aria-pressed={active}
                  className={
                    "min-w-[44px] rounded-lg px-3 py-1.5 text-sm font-medium tabular-nums transition-colors " +
                    (active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {n}/4
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="eyebrow">Find a tempo</span>
          <button
            type="button"
            onClick={tap}
            className="block w-full rounded-xl bg-tint-1 px-4 py-3 text-sm font-medium text-foreground/85 ring-1 ring-border transition-colors hover:bg-tint-2 sm:w-fit"
          >
            Tap along to set the BPM
          </button>
        </div>
      </div>

      {/* Tempo presets */}
      <div className="space-y-2">
        <span className="eyebrow">Tempo presets</span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const active = m.bpm === p.bpm;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => m.setBpm(p.bpm)}
                aria-pressed={active}
                className={
                  "rounded-lg px-3 py-1.5 text-sm font-medium ring-1 transition-colors " +
                  (active
                    ? "bg-primary/15 text-primary ring-primary/40"
                    : "bg-tint-1 text-foreground/80 ring-border hover:bg-tint-2 hover:text-foreground")
                }
              >
                {p.label} <span className="font-mono text-xs text-muted-foreground">{p.bpm}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Press{" "}
        <kbd className="rounded border border-border bg-tint-1 px-1.5 py-0.5 font-mono text-xs">
          Space
        </kbd>{" "}
        to start or stop. The first beat of each bar is accented.
      </p>
    </div>
  );
}
