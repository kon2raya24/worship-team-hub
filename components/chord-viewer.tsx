"use client";

import { useMemo, useState } from "react";
import { renderTransposedHtml } from "@/lib/chordpro";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 sticky top-0 z-10 bg-white dark:bg-zinc-950 border-b py-2 print:hidden">
        <div className="flex items-center gap-1">
          <span className="text-xs uppercase text-zinc-500 mr-1">Key</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setSemitones((s) => s - 1)}
            aria-label="Transpose down"
          >
            −
          </Button>
          <span className="w-10 text-center text-sm tabular-nums">
            {semitones > 0 ? `+${semitones}` : semitones}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setSemitones((s) => s + 1)}
            aria-label="Transpose up"
          >
            +
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setSemitones(0)}
          >
            Reset
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs uppercase text-zinc-500 mr-1">Capo</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setCapo((c) => Math.max(0, c - 1))}
            aria-label="Capo down"
          >
            −
          </Button>
          <span className="w-8 text-center text-sm tabular-nums">{capo}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setCapo((c) => Math.min(11, c + 1))}
            aria-label="Capo up"
          >
            +
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs uppercase text-zinc-500 mr-1">Size</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setFontSize((f) => Math.max(10, f - 2))}
            aria-label="Smaller"
          >
            A−
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setFontSize((f) => Math.min(28, f + 2))}
            aria-label="Larger"
          >
            A+
          </Button>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="ml-auto"
          onClick={() => window.print()}
        >
          Print
        </Button>
      </div>

      <div
        className="chord-sheet font-mono leading-relaxed"
        style={{ fontSize }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <style jsx global>{`
        .chord-sheet .row {
          display: flex;
          flex-wrap: wrap;
        }
        .chord-sheet .column {
          display: inline-flex;
          flex-direction: column;
          margin-right: 0.25rem;
        }
        .chord-sheet .chord {
          color: #2563eb;
          font-weight: 600;
          min-height: 1em;
        }
        .chord-sheet .lyrics {
          white-space: pre;
        }
        .chord-sheet .paragraph {
          margin-bottom: 1em;
        }
        .chord-sheet .comment {
          font-style: italic;
          color: #71717a;
        }
        @media print {
          .chord-sheet .chord {
            color: #000;
          }
        }
      `}</style>
    </div>
  );
}
