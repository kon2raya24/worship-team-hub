// Diatonic chord builder for the Fretboard Explorer (Phase 4).
// Stacks thirds *within the selected scale* so every 7-note scale yields its
// correct chords (Major → I ii iii IV V vi vii°, Natural Minor → i ii° ♭III …).

import { pitchClass, rootUsesFlats, spell, type ScaleDef } from "./fretboard";

const MAJOR_REF = [0, 2, 4, 5, 7, 9, 11];
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

export type ChordQuality = "maj" | "min" | "dim" | "aug";

export type DiatonicChord = {
  degree: number; // 1..7
  roman: string; // e.g. "ii", "♭VII", "vii°"
  name: string; // triad name, e.g. "Am"
  seventh: string; // seventh-chord name, e.g. "Am7", "D7"
  quality: ChordQuality;
  rootNote: string;
  notes: string[]; // triad note names
  pcs: number[]; // triad pitch classes
};

/** Scale tone `step` degrees above degree `i`, in absolute semitones. */
function stackTone(deg: number[], i: number, step: number): number {
  return deg[(i + step) % 7] + Math.floor((i + step) / 7) * 12;
}

function seventhSuffix(quality: ChordQuality, gap: number): string {
  if (quality === "maj") return gap === 11 ? "maj7" : "7";
  if (quality === "min") return gap === 11 ? "m(maj7)" : "m7";
  if (quality === "dim") return gap === 9 ? "°7" : "m7♭5";
  return gap === 11 ? "maj7♯5" : "7♯5"; // aug
}

/** Diatonic triads (+7th names) for a 7-note scale. Empty for other scales. */
export function buildDiatonicChords(root: string, scale: ScaleDef): DiatonicChord[] {
  if (scale.intervals.length !== 7) return [];
  const rootPc = pitchClass(root);
  if (rootPc === null) return [];
  const useFlats = rootUsesFlats(root);
  const deg = scale.intervals;
  const chords: DiatonicChord[] = [];

  for (let i = 0; i < 7; i++) {
    const r = deg[i];
    const third = stackTone(deg, i, 2);
    const fifth = stackTone(deg, i, 4);
    const seventh = stackTone(deg, i, 6);
    const t = (third - r) % 12; // third interval
    const f = (fifth - r) % 12; // fifth interval
    const sGap = (seventh - r) % 12;

    let quality: ChordQuality;
    let suffix: string;
    let mark = "";
    if (t === 4 && f === 7) {
      quality = "maj";
      suffix = "";
    } else if (t === 3 && f === 7) {
      quality = "min";
      suffix = "m";
    } else if (t === 3 && f === 6) {
      quality = "dim";
      suffix = "dim";
      mark = "°";
    } else if (t === 4 && f === 8) {
      quality = "aug";
      suffix = "aug";
      mark = "+";
    } else {
      // Non-tertian degree (rare, exotic scales) — fall back by the third.
      quality = t <= 3 ? "min" : "maj";
      suffix = t <= 3 ? "m" : "";
    }

    const acc = r < MAJOR_REF[i] ? "♭" : r > MAJOR_REF[i] ? "♯" : "";
    let roman = acc + ROMAN[i];
    if (quality === "min" || quality === "dim") roman = roman.toLowerCase();
    roman += mark;

    const pcs = [r, third, fifth].map((x) => (rootPc + x) % 12);
    const rootNote = spell((rootPc + r) % 12, useFlats);
    chords.push({
      degree: i + 1,
      roman,
      name: rootNote + suffix,
      seventh: rootNote + seventhSuffix(quality, sGap),
      quality,
      rootNote,
      notes: pcs.map((pc) => spell(pc, useFlats)),
      pcs,
    });
  }
  return chords;
}
