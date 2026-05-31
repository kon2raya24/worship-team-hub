// Lightweight music-theory helpers for the team-only mini-games.
// Independent of chordsheetjs so the bundle stays tiny.

const SHARP_SCALE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const FLAT_SCALE = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"] as const;

function noteIndex(note: string): number | null {
  const s = SHARP_SCALE.indexOf(note as (typeof SHARP_SCALE)[number]);
  if (s !== -1) return s;
  const f = FLAT_SCALE.indexOf(note as (typeof FLAT_SCALE)[number]);
  if (f !== -1) return f;
  return null;
}

function parseRoot(chord: string): { rootIdx: number; suffix: string } | null {
  if (!chord) return null;
  const first = chord[0];
  if (first < "A" || first > "G") return null;
  let root = first;
  let i = 1;
  if (i < chord.length) {
    const a = chord[i];
    if (a === "#" || a === "♯") {
      root += "#";
      i++;
    } else if (a === "b" || a === "♭") {
      root += "b";
      i++;
    }
  }
  const idx = noteIndex(root);
  if (idx === null) return null;
  return { rootIdx: idx, suffix: chord.slice(i) };
}

/** Transpose a chord token by `semitones`. Handles slash chords. */
export function transposeChord(chord: string, semitones: number, useFlats = false): string {
  if (!chord) return chord;
  const slash = chord.indexOf("/");
  if (slash !== -1) {
    const root = transposeChord(chord.slice(0, slash), semitones, useFlats);
    const bass = transposeChord(chord.slice(slash + 1), semitones, useFlats);
    return `${root}/${bass}`;
  }
  const p = parseRoot(chord);
  if (!p) return chord;
  const newIdx = ((p.rootIdx + semitones) % 12 + 12) % 12;
  const scale = useFlats ? FLAT_SCALE : SHARP_SCALE;
  return `${scale[newIdx]}${p.suffix}`;
}

/** Normalize alternate spellings so user input compares cleanly. */
export function normalizeChord(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, "")
    .replace(/^([a-g])/i, (m) => m.toUpperCase())
    .replace(/♭/g, "b")
    .replace(/♯/g, "#")
    .replace(/^([A-G])([Bb])/, "$1b")
    .replace(/^([A-G])[Ss](?![a-z])/, "$1#");
}

/** Best-effort equivalence: same pitch class + same suffix. */
export function chordsEqual(a: string, b: string): boolean {
  const na = normalizeChord(a);
  const nb = normalizeChord(b);
  if (na === nb) return true;
  const pa = parseRoot(na);
  const pb = parseRoot(nb);
  if (!pa || !pb) return false;
  return pa.rootIdx === pb.rootIdx && pa.suffix === pb.suffix;
}

/** Common worship-friendly progressions in C major (Nashville: I IV V vi ii). */
export const PROGRESSIONS: { name: string; chords: string[] }[] = [
  { name: "I–V–vi–IV (4-chord)", chords: ["C", "G", "Am", "F"] },
  { name: "I–vi–IV–V (50s)", chords: ["C", "Am", "F", "G"] },
  { name: "vi–IV–I–V", chords: ["Am", "F", "C", "G"] },
  { name: "I–IV–V (basic)", chords: ["C", "F", "G"] },
  { name: "I–V–vi–iii–IV (canon)", chords: ["C", "G", "Am", "Em", "F"] },
  { name: "ii–V–I", chords: ["Dm", "G", "C"] },
  { name: "I–iii–IV–V", chords: ["C", "Em", "F", "G"] },
];

/** Major keys we ask about. Picked from the worship-team's common range. */
export const KEYS_FOR_TRANSPOSE = [
  "G", "D", "A", "E",
  "F", "Bb", "Eb",
  "C",
] as const;

/**
 * Key signatures for major keys — accidental count + which notes.
 * Used by the key signature quiz.
 */
export const KEY_SIGNATURES: Record<
  string,
  { sharps?: string[]; flats?: string[] }
> = {
  C: {},
  G: { sharps: ["F#"] },
  D: { sharps: ["F#", "C#"] },
  A: { sharps: ["F#", "C#", "G#"] },
  E: { sharps: ["F#", "C#", "G#", "D#"] },
  B: { sharps: ["F#", "C#", "G#", "D#", "A#"] },
  "F#": { sharps: ["F#", "C#", "G#", "D#", "A#", "E#"] },
  F: { flats: ["Bb"] },
  Bb: { flats: ["Bb", "Eb"] },
  Eb: { flats: ["Bb", "Eb", "Ab"] },
  Ab: { flats: ["Bb", "Eb", "Ab", "Db"] },
  Db: { flats: ["Bb", "Eb", "Ab", "Db", "Gb"] },
};

/** Detect whether a key prefers flats (so transposition uses flat spellings). */
export function keyUsesFlats(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(KEY_SIGNATURES[key] ?? {}, "flats");
}

/**
 * Major scale semitone intervals from the tonic (I … vii°).
 * 0=I, 2=ii, 4=iii, 5=IV, 7=V, 9=vi, 11=vii°.
 */
const MAJOR_SCALE_SEMITONES = [0, 2, 4, 5, 7, 9, 11] as const;
const DIATONIC_QUALITY = ["", "m", "m", "", "", "m", "dim"] as const;

/** Nashville / Roman numerals for the 7 diatonic chords of a major key. */
export const ROMAN_NUMERALS = ["I", "ii", "iii", "IV", "V", "vi", "vii°"] as const;
export type DegreeIdx = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Diatonic chord at a given scale degree of a major key (e.g. G + IV → C). */
export function diatonicChord(key: string, degree: DegreeIdx): string {
  const useFlats = keyUsesFlats(key);
  const root = transposeChord(key, MAJOR_SCALE_SEMITONES[degree], useFlats);
  return `${root}${DIATONIC_QUALITY[degree]}`;
}

/** Relative minor key (a minor 3rd below the major). E.g. C → Am. */
export function relativeMinor(majorKey: string): string {
  const useFlats = keyUsesFlats(majorKey);
  return `${transposeChord(majorKey, -3, useFlats)}m`;
}

/** Relative major key from a minor key. Strips an optional "m" suffix. */
export function relativeMajor(minorKey: string): string {
  const base = minorKey.endsWith("m") ? minorKey.slice(0, -1) : minorKey;
  // Use the same spelling family as a likely-related major (if the minor
  // root happens to be a recognized flat-key major, the result will be one
  // too). The fallback is the sharp side.
  const flatMajor = transposeChord(base, 3, true);
  if (KEY_SIGNATURES[flatMajor] && keyUsesFlats(flatMajor)) return flatMajor;
  return transposeChord(base, 3, false);
}

/**
 * Intervals between two pitches, by semitone count. Worship-friendly subset:
 * skip tritone / m2 / b5 since they basically never come up in chord cues.
 */
export const INTERVALS: { name: string; short: string; semitones: number }[] = [
  { name: "Major 2nd", short: "M2", semitones: 2 },
  { name: "Minor 3rd", short: "m3", semitones: 3 },
  { name: "Major 3rd", short: "M3", semitones: 4 },
  { name: "Perfect 4th", short: "P4", semitones: 5 },
  { name: "Perfect 5th", short: "P5", semitones: 7 },
  { name: "Minor 6th", short: "m6", semitones: 8 },
  { name: "Major 6th", short: "M6", semitones: 9 },
  { name: "Minor 7th", short: "m7", semitones: 10 },
  { name: "Major 7th", short: "M7", semitones: 11 },
  { name: "Octave", short: "P8", semitones: 12 },
];

/** Note `semitones` above `from`, respecting the key's spelling preference. */
export function noteAbove(from: string, semitones: number, useFlats = false): string {
  return transposeChord(from, semitones, useFlats);
}

/** Semitone delta from one major key to another. */
export function semitonesBetween(from: string, to: string): number {
  const a = parseRoot(from);
  const b = parseRoot(to);
  if (!a || !b) return 0;
  let diff = (b.rootIdx - a.rootIdx) % 12;
  if (diff > 6) diff -= 12;
  if (diff < -5) diff += 12;
  return diff;
}

/** Pick a random element. */
export function pickOne<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Pick N distinct elements (or all if N > arr.length). */
export function pickN<T>(arr: readonly T[], n: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  while (out.length < n && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}
