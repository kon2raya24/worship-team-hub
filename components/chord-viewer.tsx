"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Minus,
  Plus,
  RotateCcw,
  Printer,
  Play,
  Pause,
  Gauge,
} from "lucide-react";
import { renderTransposedHtml } from "@/lib/chordpro";

export function ChordViewer({
  body,
  defaultSemitones = 0,
  persistKey,
}: {
  body: string;
  defaultSemitones?: number;
  /**
   * If provided (e.g. song id), transpose/capo/font-size/speed are saved to
   * sessionStorage under this key so leaving and returning to the song
   * preserves the leader's settings during a rehearsal session.
   */
  persistKey?: string;
}) {
  const storageKey = persistKey ? `chord-viewer:${persistKey}` : null;
  const [semitones, setSemitones] = useState(defaultSemitones);
  const [capo, setCapo] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [scrolling, setScrolling] = useState(false);
  const [speed, setSpeed] = useState(35); // pixels per second

  // Hydrate from sessionStorage on mount (post-hydration to avoid SSR mismatch).
  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<{
        semitones: number;
        capo: number;
        fontSize: number;
        speed: number;
      }>;
      if (typeof saved.semitones === "number") setSemitones(saved.semitones);
      if (typeof saved.capo === "number") setCapo(saved.capo);
      if (typeof saved.fontSize === "number") setFontSize(saved.fontSize);
      if (typeof saved.speed === "number") setSpeed(saved.speed);
    } catch {
      /* corrupt entry — ignore */
    }
  }, [storageKey]);

  // Persist on change.
  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(
        storageKey,
        JSON.stringify({ semitones, capo, fontSize, speed })
      );
    } catch {
      /* quota or private mode — ignore */
    }
  }, [storageKey, semitones, capo, fontSize, speed]);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const html = useMemo(
    () => renderTransposedHtml(body, semitones - capo),
    [body, semitones, capo]
  );

  // Smooth auto-scroll loop. Stops when bottom of sheet reaches viewport bottom.
  useEffect(() => {
    if (!scrolling) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTickRef.current = null;
      return;
    }

    function tick(now: number) {
      if (lastTickRef.current == null) lastTickRef.current = now;
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      const sheet = sheetRef.current;
      const docEl = document.documentElement;
      const maxScroll = docEl.scrollHeight - window.innerHeight;
      const nextY = Math.min(window.scrollY + speed * dt, maxScroll);
      window.scrollTo({ top: nextY });

      // Stop if at the bottom or sheet element is past viewport
      const reachedDocBottom = nextY >= maxScroll - 1;
      const sheetGone =
        sheet &&
        sheet.getBoundingClientRect().bottom < window.innerHeight * 0.2;
      if (reachedDocBottom || sheetGone) {
        setScrolling(false);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTickRef.current = null;
    };
  }, [scrolling, speed]);

  return (
    <div className="glass overflow-hidden">
      {/* Sticky toolbar — compact on mobile, expanded on desktop */}
      <div className="sticky top-[57px] z-10 flex flex-wrap items-center gap-x-2 gap-y-1.5 px-2 sm:px-4 py-2 border-b border-white/[0.08] bg-[#070a17]/90 backdrop-blur-xl print:hidden">
        {/* Key */}
        <ToolGroup label="Key">
          <ToolBtn label="−" onClick={() => setSemitones((s) => s - 1)} aria="Transpose down" />
          <span className="w-8 sm:w-10 text-center text-sm tabular-nums font-mono text-white">
            {semitones > 0 ? `+${semitones}` : semitones}
          </span>
          <ToolBtn label="+" onClick={() => setSemitones((s) => s + 1)} aria="Transpose up" />
          {semitones !== 0 && (
            <ToolBtn
              icon={<RotateCcw className="size-3.5" />}
              onClick={() => setSemitones(0)}
              aria="Reset key"
              subtle
            />
          )}
        </ToolGroup>

        <Divider />

        {/* Capo — hidden on smallest screens, shown ≥sm */}
        <div className="hidden sm:flex">
          <ToolGroup label="Capo">
            <ToolBtn
              icon={<Minus className="size-3.5" />}
              onClick={() => setCapo((c) => Math.max(0, c - 1))}
              aria="Capo down"
            />
            <span className="w-7 text-center text-sm tabular-nums font-mono text-white">
              {capo}
            </span>
            <ToolBtn
              icon={<Plus className="size-3.5" />}
              onClick={() => setCapo((c) => Math.min(11, c + 1))}
              aria="Capo up"
            />
          </ToolGroup>
        </div>

        <div className="hidden sm:block">
          <Divider />
        </div>

        {/* Size */}
        <ToolGroup label="Size">
          <ToolBtn
            label="A−"
            onClick={() => setFontSize((f) => Math.max(10, f - 2))}
            aria="Smaller"
          />
          <ToolBtn
            label="A+"
            onClick={() => setFontSize((f) => Math.min(28, f + 2))}
            aria="Larger"
          />
        </ToolGroup>

        {/* Right-aligned cluster: auto-scroll + print */}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setScrolling((s) => !s)}
            aria-label={scrolling ? "Pause auto-scroll" : "Start auto-scroll"}
            className={`inline-flex items-center justify-center gap-1.5 px-2.5 h-7 rounded-md border text-sm transition-all ${
              scrolling
                ? "bg-[#8b5cf6]/20 border-[#8b5cf6]/40 text-white shadow-[0_0_14px_rgba(139,92,246,0.35)]"
                : "bg-white/[0.06] border-white/[0.12] text-white/90 hover:bg-white/[0.1]"
            }`}
          >
            {scrolling ? (
              <Pause className="size-3.5" />
            ) : (
              <Play className="size-3.5" />
            )}
            <span className="hidden sm:inline">
              {scrolling ? "Pause" : "Scroll"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            aria-label="Print"
            className="hidden md:inline-flex items-center justify-center gap-1.5 px-2.5 h-7 rounded-md bg-white/[0.06] border border-white/[0.12] text-sm text-white/90 hover:bg-white/[0.1]"
          >
            <Printer className="size-3.5" /> Print
          </button>
        </div>

        {/* Speed slider — only when scrolling is active; takes full second row on mobile */}
        {scrolling && (
          <div className="basis-full sm:basis-auto sm:ml-2 flex items-center gap-2 px-2 h-7 rounded-md bg-white/[0.03] border border-white/[0.06]">
            <Gauge className="size-3 text-[#8b5cf6]" />
            <input
              type="range"
              min={10}
              max={120}
              step={5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="flex-1 sm:w-24 accent-[#8b5cf6]"
              aria-label="Scroll speed"
            />
            <span className="w-7 text-right tabular-nums font-mono text-xs text-[#c8cee6]">
              {speed}
            </span>
          </div>
        )}
      </div>

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="chord-sheet px-5 py-6 md:px-8 md:py-10 font-mono text-white/90"
        style={{ fontSize, lineHeight: 1.9 }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <style jsx global>{`
        .chord-sheet .paragraph {
          margin-bottom: 1.4em;
        }
        .chord-sheet .row {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
        }
        /* Columns flow tight against each other so mid-word chords
           (e.g. sur[G]render) don't visibly split the word. Word
           boundaries are preserved by trailing spaces in the lyric. */
        .chord-sheet .column {
          display: inline-flex;
          flex-direction: column;
          margin: 0;
        }
        .chord-sheet .chord {
          color: #00e8ff;
          font-weight: 600;
          min-height: 1.4em;
          line-height: 1.4em;
          text-shadow: 0 0 12px rgba(0, 232, 255, 0.35);
          letter-spacing: 0.02em;
          /* Right padding gives consecutive chords breathing room
             without separating the lyric below. */
          padding-right: 0.6em;
        }
        /* When the chord is empty, no padding — keeps mid-word lyrics tight. */
        .chord-sheet .chord:empty {
          padding-right: 0;
        }
        .chord-sheet .lyrics {
          white-space: pre;
          color: rgba(245, 247, 255, 0.95);
        }
        .chord-sheet .comment {
          font-style: italic;
          color: #8a92b4;
          margin: 0.5em 0;
          font-family: var(--font-sans);
        }
        .chord-sheet h1, .chord-sheet h2, .chord-sheet h3 {
          font-family: var(--font-heading);
          color: #f5f7ff;
          margin: 0.4em 0;
        }
        @media print {
          .chord-sheet {
            color: #000 !important;
            background: #fff !important;
          }
          .chord-sheet .chord {
            color: #1e3a8a !important;
            text-shadow: none !important;
          }
          .chord-sheet .lyrics {
            color: #000 !important;
          }
        }
      `}</style>
    </div>
  );
}

function ToolGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="eyebrow mr-1">{label}</span>
      {children}
    </div>
  );
}

function ToolBtn({
  label,
  icon,
  onClick,
  aria,
  subtle,
}: {
  label?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  aria: string;
  subtle?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={aria}
      className={`inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-md border transition-colors text-sm ${
        subtle
          ? "bg-transparent border-white/[0.08] text-[#8a92b4] hover:text-white hover:bg-white/[0.05]"
          : "bg-white/[0.06] border-white/[0.12] text-white/90 hover:bg-white/[0.1] hover:border-white/[0.2]"
      }`}
    >
      {icon ?? label}
    </button>
  );
}

function Divider() {
  return <span className="h-5 w-px bg-white/[0.1]" />;
}
