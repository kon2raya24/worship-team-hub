"use client";

import {
  KEYS_FOR_TRANSPOSE,
  keyUsesFlats,
  noteAbove,
  pickN,
  pickOne,
} from "@/lib/music";
import { QuizGame, type QuizQuestion } from "../quiz-game";

// Worship-friendly chord types and the tones we test.
// Major: 1, 3 (M3=4), 5 (P5=7) · Minor: 1, ♭3 (m3=3), 5
// Maj7: 1, 3, 5, 7 (M7=11) · Dom7: 1, 3, 5, ♭7 (m7=10)
type ChordType = "maj" | "min" | "maj7" | "dom7";
const CHORD_TYPES: { type: ChordType; label: string; suffix: string }[] = [
  { type: "maj", label: "major", suffix: "" },
  { type: "min", label: "minor", suffix: "m" },
  { type: "maj7", label: "major 7", suffix: "maj7" },
  { type: "dom7", label: "dominant 7", suffix: "7" },
];

function tonesFor(type: ChordType): { tone: string; semi: number }[] {
  switch (type) {
    case "maj":
      return [
        { tone: "root", semi: 0 },
        { tone: "3rd", semi: 4 },
        { tone: "5th", semi: 7 },
      ];
    case "min":
      return [
        { tone: "root", semi: 0 },
        { tone: "♭3rd", semi: 3 },
        { tone: "5th", semi: 7 },
      ];
    case "maj7":
      return [
        { tone: "root", semi: 0 },
        { tone: "3rd", semi: 4 },
        { tone: "5th", semi: 7 },
        { tone: "7th", semi: 11 },
      ];
    case "dom7":
      return [
        { tone: "root", semi: 0 },
        { tone: "3rd", semi: 4 },
        { tone: "5th", semi: 7 },
        { tone: "♭7th", semi: 10 },
      ];
  }
}

type Question = QuizQuestion & {
  root: string;
  chordType: ChordType;
  tone: string;
  correct: string;
  options: string[];
};

function newQuestion(): Question {
  const { type } = pickOne(CHORD_TYPES);
  const root = pickOne(KEYS_FOR_TRANSPOSE);
  const useFlats = keyUsesFlats(root);
  const tones = tonesFor(type);
  const target = pickOne(tones);
  const correct = noteAbove(root, target.semi, useFlats);

  // Distractors: other chord tones + nearby notes (±1 semitone) so a 3rd vs
  // ♭3rd one-semitone-off mistake is a plausible option.
  const distractorPool = new Set<string>();
  for (const t of tones) {
    if (t.tone === target.tone) continue;
    distractorPool.add(noteAbove(root, t.semi, useFlats));
  }
  distractorPool.add(noteAbove(root, target.semi + 1, useFlats));
  distractorPool.add(noteAbove(root, target.semi - 1, useFlats));
  distractorPool.delete(correct);
  const distractors = pickN([...distractorPool], 3);
  const options = pickN([correct, ...distractors], 4);

  return { root, chordType: type, tone: target.tone, correct, options };
}

export function ChordTonesGame() {
  return (
    <QuizGame<Question>
      makeQuestion={newQuestion}
      renderPrompt={(q) => {
        const ct = CHORD_TYPES.find((c) => c.type === q.chordType)!;
        return (
          <div>
            <div className="eyebrow mb-2">Question</div>
            <div className="font-display text-xl sm:text-2xl leading-snug">
              What&apos;s the{" "}
              <span className="text-[#8b5cf6] font-mono font-bold">{q.tone}</span>{" "}
              of{" "}
              <span className="text-[#00e8ff] font-mono font-bold">
                {q.root}
                {ct.suffix}
              </span>{" "}
              <span className="text-[#8a92b4]">({ct.label})</span>?
            </div>
          </div>
        );
      }}
      renderOption={(opt) => <span>{opt}</span>}
      renderAnswer={(q) => q.correct}
      results={{
        perfect:
          "Vocal-section gold. You'll never sing the wrong harmony note again.",
        good:
          "Strong. The dominant 7 is the one most worship singers miss — drill that.",
        low: "Worth a few more rounds — chord tones are the bones of every harmony.",
      }}
    />
  );
}
