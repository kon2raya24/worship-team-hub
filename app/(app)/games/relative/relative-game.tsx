"use client";

import {
  KEYS_FOR_TRANSPOSE,
  pickN,
  pickOne,
  relativeMajor,
  relativeMinor,
} from "@/lib/music";
import { QuizGame, type QuizQuestion } from "../quiz-game";

// Worship-common major keys plus a few flat-side keys guitarists hit (Bb, Eb).
const MAJOR_POOL = [...KEYS_FOR_TRANSPOSE];

type Question = QuizQuestion &
  (
    | { mode: "major-to-minor"; majorKey: string; correct: string; options: string[] }
    | { mode: "minor-to-major"; minorKey: string; correct: string; options: string[] }
  );

function newQuestion(): Question {
  const mode = Math.random() < 0.5 ? "major-to-minor" : "minor-to-major";

  if (mode === "major-to-minor") {
    const majorKey = pickOne(MAJOR_POOL);
    const correct = relativeMinor(majorKey);
    const otherMajors = MAJOR_POOL.filter((k) => k !== majorKey);
    const distractors = pickN(otherMajors, 3).map(relativeMinor);
    const options = pickN([correct, ...distractors], 4);
    return { mode, majorKey, correct, options };
  }

  const sourceMajor = pickOne(MAJOR_POOL);
  const minorKey = relativeMinor(sourceMajor);
  const correct = relativeMajor(minorKey);
  const otherMajors = MAJOR_POOL.filter((k) => k !== correct);
  const distractors = pickN(otherMajors, 3);
  const options = pickN([correct, ...distractors], 4);
  return { mode, minorKey, correct, options };
}

export function RelativeGame() {
  return (
    <QuizGame<Question>
      makeQuestion={newQuestion}
      renderPrompt={(q) =>
        q.mode === "major-to-minor" ? (
          <div>
            <div className="eyebrow mb-2">Question</div>
            <div className="font-display text-xl sm:text-2xl leading-snug">
              What&apos;s the relative minor of{" "}
              <span className="text-[#00e8ff] font-mono font-bold">
                {q.majorKey}
              </span>{" "}
              major?
            </div>
          </div>
        ) : (
          <div>
            <div className="eyebrow mb-2">Question</div>
            <div className="font-display text-xl sm:text-2xl leading-snug">
              What&apos;s the relative major of{" "}
              <span className="text-[#00e8ff] font-mono font-bold">
                {q.minorKey}
              </span>
              ?
            </div>
          </div>
        )
      }
      renderOption={(opt) => <span>{opt}</span>}
      renderAnswer={(q) => q.correct}
      results={{
        perfect:
          "Major / minor pairings on autopilot. Reharmonizations are now in reach.",
        good:
          "Strong. The minor 3rd-below pattern (C → A, G → E, …) is the shortcut.",
        low: "Worth a few more rounds — relative keys unlock half of every worship reharm.",
      }}
    />
  );
}
