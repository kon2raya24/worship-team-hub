"use client";

import { KEY_SIGNATURES, pickN, pickOne } from "@/lib/music";
import { QuizGame, type QuizQuestion } from "../quiz-game";

const KEYS = Object.keys(KEY_SIGNATURES);

type Question = QuizQuestion &
  (
    | {
        mode: "count";
        key: string;
        kind: "sharps" | "flats" | "neither";
        correct: number;
        options: number[];
      }
    | {
        mode: "name";
        list: string[];
        kind: "sharps" | "flats";
        correct: string;
        options: string[];
      }
  );

function countAccidentals(key: string): {
  count: number;
  kind: "sharps" | "flats" | "neither";
  list: string[];
} {
  const sig = KEY_SIGNATURES[key];
  if (sig.sharps) return { count: sig.sharps.length, kind: "sharps", list: sig.sharps };
  if (sig.flats) return { count: sig.flats.length, kind: "flats", list: sig.flats };
  return { count: 0, kind: "neither", list: [] };
}

function newQuestion(): Question {
  const mode = Math.random() < 0.5 ? "count" : "name";
  const key = pickOne(KEYS);
  const { count, kind, list } = countAccidentals(key);

  if (mode === "count") {
    // 4 numeric options including the correct one. Range 0..6.
    const pool = [0, 1, 2, 3, 4, 5, 6].filter((n) => n !== count);
    const distractors = pickN(pool, 3);
    const options = pickN([count, ...distractors], 4);
    return { mode: "count", key, kind, correct: count, options };
  }

  // "name" mode — show the accidentals list, pick which key. Only meaningful
  // when the key actually has accidentals; fall back to count mode for C.
  if (list.length === 0 || kind === "neither") return newQuestion();

  // Distractor keys with the same kind (sharp keys vs flat keys) so the
  // question stays fair.
  const sameKindKeys = KEYS.filter((k) => {
    const c = countAccidentals(k);
    return c.kind === kind && k !== key;
  });
  const distractors = pickN(sameKindKeys, Math.min(3, sameKindKeys.length));
  const options = pickN([key, ...distractors], distractors.length + 1);
  return { mode: "name", list, kind, correct: key, options };
}

export function KeysGame() {
  return (
    <QuizGame<Question>
      makeQuestion={newQuestion}
      renderPrompt={(q) =>
        q.mode === "count" ? (
          <div>
            <div className="eyebrow mb-2">Question</div>
            <div className="font-display text-xl sm:text-2xl leading-snug">
              How many accidentals does the key of{" "}
              <span className="text-accent font-mono font-bold">{q.key}</span>{" "}
              major have?
            </div>
          </div>
        ) : (
          <div>
            <div className="eyebrow mb-2">Question</div>
            <div className="font-display text-xl sm:text-2xl leading-snug mb-3">
              Which major key has these {q.kind}?
            </div>
            <div className="flex flex-wrap gap-2">
              {q.list.map((n) => (
                <span
                  key={n}
                  className="inline-flex items-center justify-center min-w-[44px] px-3 py-1.5 rounded-lg bg-tint-1 border border-border font-mono text-base text-foreground/95"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        )
      }
      renderOption={(opt, q) =>
        q.mode === "count" ? (
          <>
            <span>{opt}</span>
            <span className="text-xs text-muted-foreground">
              {opt === 1 ? "accidental" : "accidentals"}
            </span>
          </>
        ) : (
          <span>{opt}</span>
        )
      }
      renderAnswer={(q) => q.correct}
      results={{
        perfect: "Sharps + flats in your sleep.",
        good: "Strong. Try the Transpose Trainer next.",
        low: "Worth a few more rounds — the circle of fifths is a worship-team superpower.",
      }}
    />
  );
}
