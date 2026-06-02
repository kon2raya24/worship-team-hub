"use client";

import { Mic, MicOff, Minus, Plus, RotateCcw } from "lucide-react";
import { useTuner } from "@/lib/use-tuner";

const IN_TUNE = 5; // cents within this counts as in tune
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

const stepBtn =
  "inline-flex items-center justify-center rounded-lg size-9 " +
  "bg-tint-1 text-foreground/80 ring-1 ring-border transition-colors hover:bg-tint-2 hover:text-foreground";

export function Tuner() {
  const t = useTuner(440);
  const r = t.reading;
  const cents = r?.cents ?? 0;
  const inTune = !!r && Math.abs(cents) <= IN_TUNE;
  const needleLeft = 50 + clamp(cents, -50, 50);

  return (
    <div className="space-y-5">
      {/* Note + cents meter */}
      <div className="glass space-y-6 rounded-2xl p-6 text-center ring-1 ring-border">
        {/* Big note readout */}
        <div className="flex min-h-[5.5rem] items-center justify-center">
          {r ? (
            <div className="flex items-start justify-center gap-1">
              <span
                className="font-display text-7xl font-bold leading-none tabular-nums transition-colors"
                style={{ color: inTune ? "#34d399" : "var(--foreground)" }}
              >
                {r.note.replace("#", "♯")}
              </span>
              <span className="mt-1 font-mono text-2xl text-muted-foreground">{r.octave}</span>
            </div>
          ) : (
            <span className="font-display text-5xl font-bold text-muted-foreground/40">—</span>
          )}
        </div>

        {/* Status line */}
        <div className="eyebrow" style={{ color: inTune ? "#34d399" : undefined }}>
          {!t.listening
            ? "Mic off"
            : !r
              ? "Play a note…"
              : inTune
                ? "In tune"
                : cents < 0
                  ? `${cents} cents · flat ♭ — tune up`
                  : `+${cents} cents · sharp ♯ — tune down`}
        </div>

        {/* Needle meter */}
        <div className="mx-auto max-w-md space-y-2">
          <div className="relative h-14">
            {/* track */}
            <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-tint-1 ring-1 ring-border" />
            {/* in-tune band (±5 cents) */}
            <div
              className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#34d399]/25"
              style={{ left: `${50 - IN_TUNE}%`, width: `${IN_TUNE * 2}%` }}
            />
            {/* tick marks */}
            {[-50, -25, 0, 25, 50].map((c) => (
              <div
                key={c}
                className={
                  "absolute top-1/2 w-px -translate-x-1/2 -translate-y-1/2 " +
                  (c === 0 ? "h-6 bg-muted-foreground/50" : "h-3 bg-muted-foreground/30")
                }
                style={{ left: `${50 + c}%` }}
              />
            ))}
            {/* needle */}
            {r && (
              <div
                className="absolute top-1/2 h-9 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[left] duration-75 ease-out"
                style={{
                  left: `${needleLeft}%`,
                  backgroundColor: inTune ? "#34d399" : "var(--foreground)",
                  boxShadow: inTune ? "0 0 12px rgba(52,211,153,0.7)" : "none",
                }}
              />
            )}
          </div>
          <div className="flex justify-between px-0.5 font-mono text-[10px] text-muted-foreground/60">
            <span>♭ 50</span>
            <span>25</span>
            <span>0</span>
            <span>25</span>
            <span>50 ♯</span>
          </div>
        </div>

        {/* Frequency / cents readout */}
        <div className="flex items-center justify-center gap-6 font-mono text-sm tabular-nums text-muted-foreground">
          <span>{r ? `${r.frequency.toFixed(1)} Hz` : "— Hz"}</span>
          <span>{r ? `${cents > 0 ? "+" : ""}${cents}¢` : "—"}</span>
        </div>

        {/* Start / stop */}
        <button
          type="button"
          onClick={t.toggle}
          aria-pressed={t.listening}
          className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-base font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02]"
        >
          {t.listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
          {t.listening ? "Stop listening" : "Start mic"}
        </button>

        {t.error && <p className="text-sm text-destructive">{t.error}</p>}
      </div>

      {/* A4 calibration */}
      <div className="glass space-y-2 rounded-2xl p-4 ring-1 ring-border sm:p-5">
        <span className="eyebrow">Reference pitch</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => t.setA4(t.a4 - 1)}
            aria-label="Lower the A4 reference"
            className={stepBtn}
          >
            <Minus className="size-4" />
          </button>
          <div className="min-w-[88px] text-center">
            <span className="font-display text-2xl font-bold tabular-nums text-foreground">{t.a4}</span>
            <span className="ml-1 text-sm text-muted-foreground">Hz</span>
          </div>
          <button
            type="button"
            onClick={() => t.setA4(t.a4 + 1)}
            aria-label="Raise the A4 reference"
            className={stepBtn}
          >
            <Plus className="size-4" />
          </button>
          {t.a4 !== 440 && (
            <button
              type="button"
              onClick={() => t.setA4(440)}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground"
            >
              <RotateCcw className="size-3" /> 440
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          A = {t.a4} Hz. Most bands tune to 440; nudge it if you play to a fixed instrument.
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        Standard guitar:{" "}
        <span className="font-mono text-foreground/80">E2 A2 D3 G3 B3 E4</span>. For bass and low
        strings, tune the 12th-fret harmonic (one octave up) for a cleaner reading. Audio stays on
        your device — nothing is recorded or uploaded.
      </p>
    </div>
  );
}
