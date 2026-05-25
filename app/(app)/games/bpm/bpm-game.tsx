"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

/** Keep this many recent tap intervals when averaging. */
const WINDOW = 8;
/** A tap more than this long after the previous one resets the run. */
const RESET_AFTER_MS = 2200;

const PRESETS = [
  { label: "Ballad", bpm: 72 },
  { label: "Mid", bpm: 90 },
  { label: "Upbeat", bpm: 120 },
  { label: "Fast", bpm: 140 },
];

function intervalsToBpm(intervals: number[]): number {
  if (intervals.length === 0) return 0;
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  if (avg <= 0) return 0;
  return Math.round(60000 / avg);
}

export function BpmGame() {
  const [target, setTarget] = useState<number>(90);
  const [bpm, setBpm] = useState<number>(0);
  const [taps, setTaps] = useState<number>(0);
  const [flash, setFlash] = useState<boolean>(false);
  const lastTapRef = useRef<number | null>(null);
  const intervalsRef = useRef<number[]>([]);

  const reset = useCallback(() => {
    lastTapRef.current = null;
    intervalsRef.current = [];
    setBpm(0);
    setTaps(0);
  }, []);

  const tap = useCallback(() => {
    const now = performance.now();
    setFlash(true);
    setTimeout(() => setFlash(false), 90);
    if (lastTapRef.current === null) {
      lastTapRef.current = now;
      setTaps(1);
      return;
    }
    const dt = now - lastTapRef.current;
    lastTapRef.current = now;
    if (dt > RESET_AFTER_MS) {
      intervalsRef.current = [];
      setTaps(1);
      setBpm(0);
      return;
    }
    intervalsRef.current = [...intervalsRef.current, dt].slice(-WINDOW);
    setBpm(intervalsToBpm(intervalsRef.current));
    setTaps((n) => n + 1);
  }, []);

  // Spacebar binding so it feels natural on desktop.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space") {
        // Only when the user isn't typing into an input/textarea.
        const t = e.target as HTMLElement;
        const tag = t?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        tap();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tap]);

  const diff = bpm > 0 ? bpm - target : 0;
  const within = Math.abs(diff) <= 2;
  const close = !within && Math.abs(diff) <= 5;
  const bpmColor = within
    ? "text-[#8eff6a]"
    : close
      ? "text-[#ffb547]"
      : bpm > 0
        ? "text-[#ff5566]"
        : "text-white/40";

  return (
    <div className="space-y-6">
      {/* Target picker */}
      <div className="glass p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <div className="eyebrow">Target BPM</div>
            <input
              type="number"
              min={30}
              max={240}
              value={target}
              onChange={(e) =>
                setTarget(Math.max(30, Math.min(240, Number(e.target.value))))
              }
              className="h-10 w-24 rounded-lg border border-white/10 bg-white/[0.04] px-3 font-mono text-lg text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e8ff]/50"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setTarget(p.bpm)}
                className={[
                  "px-3 h-9 rounded-lg border text-xs font-mono uppercase tracking-wider transition",
                  target === p.bpm
                    ? "border-[#00e8ff]/50 bg-[#00e8ff]/10 text-[#00e8ff]"
                    : "border-white/10 bg-white/[0.04] text-[#8a92b4] hover:bg-white/[0.08] hover:text-white",
                ].join(" ")}
              >
                {p.label} {p.bpm}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tap pad + live BPM */}
      <div className="glass p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="eyebrow">Your tempo</div>
            <div className={`font-display text-6xl font-semibold mt-1 transition-colors ${bpmColor}`}>
              {bpm || "—"}
            </div>
            <div className="text-xs text-[#8a92b4] mt-1">BPM</div>
          </div>
          <div className="text-right">
            <div className="eyebrow">Delta</div>
            <div
              className={`font-display text-3xl font-semibold mt-1 ${bpmColor}`}
            >
              {bpm > 0 ? (diff > 0 ? `+${diff}` : `${diff}`) : "—"}
            </div>
            <div className="text-xs text-[#8a92b4] mt-1">
              {within
                ? "On the beat"
                : close
                  ? "Drifting"
                  : bpm > 0
                    ? diff > 0
                      ? "Rushing"
                      : "Dragging"
                    : "Tap to start"}
            </div>
          </div>
        </div>

        <button
          onClick={tap}
          className={[
            "w-full h-32 rounded-xl border text-white text-xl font-display font-semibold transition-all select-none",
            "bg-[linear-gradient(135deg,rgba(0,232,255,0.18),rgba(139,92,246,0.22),rgba(255,58,163,0.18))]",
            "border-white/[0.12] hover:border-white/[0.2] active:scale-[0.99]",
            flash
              ? "shadow-[0_0_0_2px_rgba(0,232,255,0.55)_inset,0_0_40px_rgba(0,232,255,0.4)] brightness-110"
              : "shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]",
          ].join(" ")}
        >
          TAP
          <div className="block text-[10px] uppercase tracking-[0.18em] text-white/60 font-mono mt-1">
            or press <span className="text-white">space</span> · {taps} tap
            {taps === 1 ? "" : "s"}
          </div>
        </button>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-[#8a92b4]">
            Need ~4 taps before the reading stabilises. Stop tapping for 2 sec to
            reset.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white/85 text-xs hover:bg-white/[0.08] transition"
          >
            <RefreshCw className="size-3.5" /> Reset
          </button>
        </div>
      </div>
    </div>
  );
}
