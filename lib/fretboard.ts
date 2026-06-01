// Scale + fretboard engine for the Guitar Fretboard Explorer (visual-only v1).
// Pure data/geometry — no audio, no React. Mirrors the note conventions in
// lib/music.ts but stays self-contained so the games bundle stays small.

const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"] as const;

/** Pitch class (0-11) for a note name; null if unrecognized. */
export function pitchClass(note: string): number | null {
  const s = SHARP_NAMES.indexOf(note as (typeof SHARP_NAMES)[number]);
  if (s !== -1) return s;
  const f = FLAT_NAMES.indexOf(note as (typeof FLAT_NAMES)[number]);
  if (f !== -1) return f;
  return null;
}

/** Roots offered in the picker — guitar-idiomatic enharmonic spellings. */
export const ROOTS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;
export type Root = (typeof ROOTS)[number];

/** Roots whose key signatures use flats (so accidentals read naturally). */
const FLAT_ROOTS = new Set(["F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"]);
export function rootUsesFlats(root: string): boolean {
  return root.includes("b") || FLAT_ROOTS.has(root);
}

/** Spell a pitch class with sharp or flat names. */
export function spell(pc: number, useFlats: boolean): string {
  const i = ((pc % 12) + 12) % 12;
  return (useFlats ? FLAT_NAMES : SHARP_NAMES)[i];
}

/** Standard tuning, low → high (6th string E … 1st string e). */
export const STANDARD_TUNING = ["E", "A", "D", "G", "B", "E"] as const;

export type ScaleCategory = "Common" | "Pentatonic & Blues" | "Modes" | "Exotic";
export const SCALE_CATEGORIES: ScaleCategory[] = ["Common", "Pentatonic & Blues", "Modes", "Exotic"];
export type ScaleDef = { id: string; name: string; intervals: number[]; category: ScaleCategory };

/** 20+ scales as semitone offsets from the root, grouped for the picker. */
export const SCALES: ScaleDef[] = [
  // Common
  { id: "major", name: "Major (Ionian)", intervals: [0, 2, 4, 5, 7, 9, 11], category: "Common" },
  { id: "natural-minor", name: "Natural Minor (Aeolian)", intervals: [0, 2, 3, 5, 7, 8, 10], category: "Common" },
  // Pentatonic & Blues
  { id: "major-pentatonic", name: "Major Pentatonic", intervals: [0, 2, 4, 7, 9], category: "Pentatonic & Blues" },
  { id: "minor-pentatonic", name: "Minor Pentatonic", intervals: [0, 3, 5, 7, 10], category: "Pentatonic & Blues" },
  { id: "blues-minor", name: "Blues (Minor)", intervals: [0, 3, 5, 6, 7, 10], category: "Pentatonic & Blues" },
  { id: "blues-major", name: "Blues (Major)", intervals: [0, 2, 3, 4, 7, 9], category: "Pentatonic & Blues" },
  // Modes
  { id: "dorian", name: "Dorian", intervals: [0, 2, 3, 5, 7, 9, 10], category: "Modes" },
  { id: "phrygian", name: "Phrygian", intervals: [0, 1, 3, 5, 7, 8, 10], category: "Modes" },
  { id: "lydian", name: "Lydian", intervals: [0, 2, 4, 6, 7, 9, 11], category: "Modes" },
  { id: "mixolydian", name: "Mixolydian", intervals: [0, 2, 4, 5, 7, 9, 10], category: "Modes" },
  { id: "locrian", name: "Locrian", intervals: [0, 1, 3, 5, 6, 8, 10], category: "Modes" },
  // Exotic
  { id: "harmonic-minor", name: "Harmonic Minor", intervals: [0, 2, 3, 5, 7, 8, 11], category: "Exotic" },
  { id: "melodic-minor", name: "Melodic Minor", intervals: [0, 2, 3, 5, 7, 9, 11], category: "Exotic" },
  { id: "phrygian-dominant", name: "Phrygian Dominant", intervals: [0, 1, 4, 5, 7, 8, 10], category: "Exotic" },
  { id: "lydian-dominant", name: "Lydian Dominant", intervals: [0, 2, 4, 6, 7, 9, 10], category: "Exotic" },
  { id: "dim-whole-half", name: "Diminished (Whole-Half)", intervals: [0, 2, 3, 5, 6, 8, 9, 11], category: "Exotic" },
  { id: "dim-half-whole", name: "Diminished (Half-Whole)", intervals: [0, 1, 3, 4, 6, 7, 9, 10], category: "Exotic" },
  { id: "whole-tone", name: "Whole Tone", intervals: [0, 2, 4, 6, 8, 10], category: "Exotic" },
  { id: "augmented", name: "Augmented", intervals: [0, 3, 4, 7, 8, 11], category: "Exotic" },
  { id: "altered", name: "Altered (Super Locrian)", intervals: [0, 1, 3, 4, 6, 8, 10], category: "Exotic" },
  { id: "hungarian-minor", name: "Hungarian Minor", intervals: [0, 2, 3, 6, 7, 8, 11], category: "Exotic" },
];

/** Interval label for a semitone distance from the root (0-11). */
const INTERVAL_LABELS = ["R", "♭2", "2", "♭3", "3", "4", "♭5", "5", "♭6", "6", "♭7", "7"] as const;
export function intervalLabel(semitoneFromRoot: number): string {
  return INTERVAL_LABELS[((semitoneFromRoot % 12) + 12) % 12];
}

/** The spelled notes of a scale, in order from the root. */
export function scaleNotes(root: string, scale: ScaleDef): string[] {
  const rootPc = pitchClass(root);
  if (rootPc === null) return [];
  const useFlats = rootUsesFlats(root);
  return scale.intervals.map((i) => spell((rootPc + i) % 12, useFlats));
}

export type FretNote = {
  string: number; // 0 = low E (6th), 5 = high e (1st)
  fret: number; // 0 = open
  pc: number; // pitch class 0-11
  note: string; // spelled name
  degree: number; // semitones above the root, 0-11
  interval: string; // interval label (R, ♭3, 5, …)
  isRoot: boolean;
};

/**
 * Every in-scale note on the board, fret 0..maxFret, for the given tuning.
 * Strings are indexed low → high (0 = low E).
 */
export function buildScaleFretboard(
  root: string,
  scale: ScaleDef,
  maxFret = 12,
  tuning: readonly string[] = STANDARD_TUNING,
): FretNote[] {
  const rootPc = pitchClass(root);
  if (rootPc === null) return [];
  const useFlats = rootUsesFlats(root);
  const inScale = new Set(scale.intervals.map((i) => (rootPc + i) % 12));
  const out: FretNote[] = [];
  for (let string = 0; string < tuning.length; string++) {
    const openPc = pitchClass(tuning[string]);
    if (openPc === null) continue;
    for (let fret = 0; fret <= maxFret; fret++) {
      const pc = (openPc + fret) % 12;
      if (!inScale.has(pc)) continue;
      const degree = (((pc - rootPc) % 12) + 12) % 12;
      out.push({
        string,
        fret,
        pc,
        note: spell(pc, useFlats),
        degree,
        interval: intervalLabel(degree),
        isRoot: degree === 0,
      });
    }
  }
  return out;
}

export type CompareNote = FretNote & { inA: boolean; inB: boolean };

/**
 * Every note belonging to scale A and/or scale B (same root), tagged with which
 * scale(s) it's in — for the side-by-side comparison overlay.
 */
export function buildComparison(
  root: string,
  scaleA: ScaleDef,
  scaleB: ScaleDef,
  maxFret = 12,
  tuning: readonly string[] = STANDARD_TUNING,
): CompareNote[] {
  const rootPc = pitchClass(root);
  if (rootPc === null) return [];
  const useFlats = rootUsesFlats(root);
  const aSet = new Set(scaleA.intervals.map((i) => (rootPc + i) % 12));
  const bSet = new Set(scaleB.intervals.map((i) => (rootPc + i) % 12));
  const out: CompareNote[] = [];
  for (let string = 0; string < tuning.length; string++) {
    const openPc = pitchClass(tuning[string]);
    if (openPc === null) continue;
    for (let fret = 0; fret <= maxFret; fret++) {
      const pc = (openPc + fret) % 12;
      const inA = aSet.has(pc);
      const inB = bSet.has(pc);
      if (!inA && !inB) continue;
      const degree = (((pc - rootPc) % 12) + 12) % 12;
      out.push({
        string,
        fret,
        pc,
        note: spell(pc, useFlats),
        degree,
        interval: intervalLabel(degree),
        isRoot: degree === 0,
        inA,
        inB,
      });
    }
  }
  return out;
}

/** Count of shared pitch classes between two scales at the same root. */
export function sharedToneCount(scaleA: ScaleDef, scaleB: ScaleDef): number {
  const b = new Set(scaleB.intervals.map((i) => i % 12));
  const a = new Set(scaleA.intervals.map((i) => i % 12));
  return [...a].filter((i) => b.has(i)).length;
}
