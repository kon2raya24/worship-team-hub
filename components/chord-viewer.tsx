"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, RotateCcw, Printer, Type } from "lucide-react";
import { renderTransposedHtml } from "@/lib/chordpro";

export function ChordViewer({
  body,
  defaultSemitones = 0,
}: {
  body: string;
  defaultSemitones?: number;
}) {
  const [semitones, setSemitones] = useState(defaultSemitones);
  const [capo, setCapo] = useState(0);
  const [fontSize, setFontSize] = useState(16);

  const html = useMemo(
    () => renderTransposedHtml(body, semitones - capo),
    [body, semitones, capo]
  );

  return (
    <div className="glass overflow-hidden">
      {/* Sticky toolbar */}
      <div className="sticky top-[60px] z-10 flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-white/[0.08] bg-[#070a17]/85 backdrop-blur-xl print:hidden">
        <ToolGroup label="Key">
          <ToolBtn label="−" onClick={() => setSemitones((s) => s - 1)} aria="Transpose down" />
          <span className="w-10 text-center text-sm tabular-nums font-mono text-white">
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

        <ToolGroup label="Capo">
          <ToolBtn
            icon={<Minus className="size-3.5" />}
            onClick={() => setCapo((c) => Math.max(0, c - 1))}
            aria="Capo down"
          />
          <span className="w-8 text-center text-sm tabular-nums font-mono text-white">{capo}</span>
          <ToolBtn
            icon={<Plus className="size-3.5" />}
            onClick={() => setCapo((c) => Math.min(11, c + 1))}
            aria="Capo up"
          />
        </ToolGroup>

        <Divider />

        <ToolGroup label="Size">
          <ToolBtn label="A−" onClick={() => setFontSize((f) => Math.max(10, f - 2))} aria="Smaller" />
          <ToolBtn label="A+" onClick={() => setFontSize((f) => Math.min(28, f + 2))} aria="Larger" />
        </ToolGroup>

        <button
          type="button"
          onClick={() => window.print()}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.12] text-sm text-white/90 hover:bg-white/[0.1] hover:border-white/[0.2] transition-colors"
        >
          <Printer className="size-3.5" /> Print
        </button>
      </div>

      {/* Sheet */}
      <div
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
        .chord-sheet .column {
          display: inline-flex;
          flex-direction: column;
          margin-right: 0.35rem;
        }
        .chord-sheet .chord {
          color: #00e8ff;
          font-weight: 600;
          min-height: 1.4em;
          line-height: 1.4em;
          text-shadow: 0 0 12px rgba(0, 232, 255, 0.35);
          letter-spacing: 0.02em;
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

function ToolGroup({ label, children }: { label: string; children: React.ReactNode }) {
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
