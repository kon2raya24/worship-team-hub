"use client";

import {
  KEYS_FOR_TRANSPOSE,
  ROMAN_NUMERALS,
  diatonicChord,
  pickN,
  pickOne,
  type DegreeIdx,
} from "@/lib/music";
import { QuizGame, type QuizQuestion } from "../quiz-game";

// vii° is rare in worship; stick to the six diatonic chords leaders cue from
// the stage. (I, ii, iii, IV, V, vi)
const DEGREES: DegreeIdx[] = [0, 1, 2, 3, 4, 5];

type Question = QuizQuestion &
  (
    | { mode: "find-chord"; key: string; degree: DegreeIdx; correct: string; options: string[] }
    | { mode: "find-degree"; key: string; chord: string; correct: DegreeIdx; options: DegreeIdx[] }
  );

function newQuestion(): Question {
  const mode = Math.random() < 0.5 ? "find-chord" : "find-degree";
  const key = pickOne(KEYS_FOR_TRANSPOSE);
  const degree = pickOne(DEGREES);
  const chord = diatonicChord(key, degree);

  if (mode === "find-chord") {
    // Distractors are other diatonic chords from the same key.
    const otherDegrees = DEGREES.filter((d) => d !== degree);
    const distractors = pickN(otherDegrees, 3).map((d) => diatonicChord(key, d));
    const options = pickN([chord, ...distractors], 4);
    return { mode, key, degree, correct: chord, options };
  }

  const otherDegrees = DEGREES.filter((d) => d !== degree);
  const distractorDegrees = pickN(otherDegrees, 3);
  const options = pickN([degree, ...distractorDegrees], 4);
  return { mode, key, chord, correct: degree, options };
}

export function NashvilleGame() {
  return (
    <QuizGame<Question>
      makeQuestion={newQuestion}
      renderPrompt={(q) =>
        q.mode === "find-chord" ? (
          <div>
            <div className="eyebrow mb-2">Question</div>
            <div className="font-display text-xl sm:text-2xl leading-snug">
              In the key of{" "}
              <span className="text-[#00e8ff] font-mono font-bold">{q.key}</span>,
              what chord is the{" "}
              <span className="text-[#8b5cf6] font-mono font-bold">
                {ROMAN_NUMERALS[q.degree]}
              </span>
              ?
            </div>
          </div>
        ) : (
          <div>
            <div className="eyebrow mb-2">Question</div>
            <div className="font-display text-xl sm:text-2xl leading-snug">
              In the key of{" "}
              <span className="text-[#00e8ff] font-mono font-bold">{q.key}</span>,{" "}
              <span className="text-[#8b5cf6] font-mono font-bold">{q.chord}</span>{" "}
              is which Roman numeral?
            </div>
          </div>
        )
      }
      renderOption={(opt, q) => (
        <span>
          {q.mode === "find-chord" ? opt : ROMAN_NUMERALS[opt as DegreeIdx]}
        </span>
      )}
      renderAnswer={(q) =>
        q.mode === "find-chord" ? q.correct : ROMAN_NUMERALS[q.correct]
      }
      results={{
        perfect:
          "Nashville-fluent. The band hears 'go to the IV' and you're already there.",
        good: "Solid. Spend a Sunday cueing chords by number and it'll click.",
        low: "Worth a few more rounds — leaders call chords by number all the time.",
      }}
    />
  );
}
