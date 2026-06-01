// Pattern/position systems for the Fretboard Explorer (Phase 2).
// Each pattern produces a list of "positions"; a position is the set of
// note cells (string:fret) it lights up. The board dims everything else.
// Standard tuning only for now (alternate tunings come later).

import { pitchClass, STANDARD_TUNING, type ScaleDef } from "./fretboard";

export type PatternMode = "full" | "caged" | "3nps" | "diagonal";
export type Position = { label: string; keys: Set<string> };

export const noteKey = (string: number, fret: number) => `${string}:${fret}`;

// Open-string pitch classes (low E … high e) and their absolute semitones
// above the low E open string. The 15→19 gap encodes the G→B major third.
const OPEN_PC = STANDARD_TUNING.map((n) => pitchClass(n) ?? 0); // [4,9,2,7,11,4]
const OPEN_SEMI = [0, 5, 10, 15, 19, 24];

function scalePitchClasses(root: string, scale: ScaleDef): Set<number> {
  const rootPc = pitchClass(root) ?? 0;
  return new Set(scale.intervals.map((i) => (rootPc + i) % 12));
}

/** Root fret (0-11) on each string — the anchors for CAGED positions. */
function rootAnchors(rootPc: number): number[] {
  return [...new Set(OPEN_PC.map((pc) => (((rootPc - pc) % 12) + 12) % 12))].sort((a, b) => a - b);
}

/** Lit cells inside a per-string fret window. */
function windowKeys(
  inScale: Set<number>,
  maxFret: number,
  lo: (s: number) => number,
  hi: (s: number) => number,
): Set<string> {
  const keys = new Set<string>();
  for (let s = 0; s < 6; s++) {
    const from = Math.max(0, lo(s));
    const to = Math.min(maxFret, hi(s));
    for (let f = from; f <= to; f++) {
      if (inScale.has((OPEN_PC[s] + f) % 12)) keys.add(noteKey(s, f));
    }
  }
  return keys;
}

function cagedPositions(rootPc: number, inScale: Set<number>, maxFret: number): Position[] {
  const anchors = rootAnchors(rootPc).slice(0, 5);
  return anchors.map((a, i) => ({
    label: `Position ${i + 1}`,
    keys: windowKeys(inScale, maxFret, () => a - 1, () => a + 3),
  }));
}

function diagonalPositions(rootPc: number, inScale: Set<number>, maxFret: number): Position[] {
  const anchors = rootAnchors(rootPc);
  const bases = [anchors[0], anchors[2] ?? anchors[1], anchors[4] ?? anchors[anchors.length - 1]];
  const SHIFT = 2;
  const SPAN = 3;
  return bases.map((base, i) => ({
    label: `Diagonal ${i + 1}`,
    keys: windowKeys(inScale, maxFret, (s) => base + s * SHIFT, (s) => base + s * SHIFT + SPAN),
  }));
}

/** Smallest semitone value ≥ v (above low E open) that is a scale tone. */
function nextScaleSemi(v: number, inScale: Set<number>, inclusive: boolean): number {
  let w = inclusive ? v : v + 1;
  while (!inScale.has((OPEN_PC[0] + w) % 12)) w++;
  return w;
}

function threeNPSPositions(rootPc: number, inScale: Set<number>, maxFret: number): Position[] {
  // 3 notes per string is only standard for 7-note (diatonic) scales.
  if (inScale.size !== 7) return [];
  const lowEStarts: number[] = [];
  for (let f = 0; f < 12; f++) if (inScale.has((OPEN_PC[0] + f) % 12)) lowEStarts.push(f);

  return lowEStarts.slice(0, 7).map((startFret, k) => {
    const keys = new Set<string>();
    let current = startFret;
    for (let s = 0; s < 6; s++) {
      let v = nextScaleSemi(current, inScale, true);
      for (let n = 0; n < 3; n++) {
        const fret = v - OPEN_SEMI[s];
        if (fret >= 0 && fret <= maxFret) keys.add(noteKey(s, fret));
        v = nextScaleSemi(v, inScale, false);
      }
      current = v; // next string picks up at the next scale tone
    }
    return { label: `Position ${k + 1}`, keys };
  });
}

/** Positions for the chosen pattern. Empty array = no position filtering. */
export function getPositions(mode: PatternMode, root: string, scale: ScaleDef, maxFret: number): Position[] {
  if (mode === "full") return [];
  const rootPc = pitchClass(root) ?? 0;
  const inScale = scalePitchClasses(root, scale);
  if (mode === "caged") return cagedPositions(rootPc, inScale, maxFret);
  if (mode === "diagonal") return diagonalPositions(rootPc, inScale, maxFret);
  return threeNPSPositions(rootPc, inScale, maxFret);
}
