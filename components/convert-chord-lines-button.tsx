"use client";

import { useCallback } from "react";
import { Wand2 } from "lucide-react";
import {
  convertChordOverLyrics,
  looksLikeChordOverLyrics,
} from "@/lib/chord-line-parse";

/**
 * Reads the target textarea by id, runs the chord-over-lyrics → ChordPro
 * converter on its value, and writes the result back. Fires a native
 * `input` event so React stays in sync with the change.
 */
export function ConvertChordLinesButton({ targetId }: { targetId: string }) {
  const onClick = useCallback(() => {
    const el = document.getElementById(targetId) as HTMLTextAreaElement | null;
    if (!el) return;
    const current = el.value;
    if (!current.trim()) return;
    if (!looksLikeChordOverLyrics(current)) {
      el.focus();
      return;
    }
    const next = convertChordOverLyrics(current);
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value"
    )?.set;
    setter?.call(el, next);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.focus();
  }, [targetId]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-foreground px-2 py-1 rounded-sm border border-accent/30 hover:border-accent/60 bg-accent/[0.04] hover:bg-accent/[0.1] transition-colors"
      title="Convert chord-above-lyrics format to inline ChordPro"
    >
      <Wand2 className="size-3" />
      Convert chord lines
    </button>
  );
}
