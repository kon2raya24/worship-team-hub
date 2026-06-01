"use client";

import {
  INTERVALS,
  KEYS_FOR_TRANSPOSE,
  keyUsesFlats,
  noteAbove,
  pickN,
  pickOne,
} from "@/lib/music";
import { QuizGame, type QuizQuestion } from "../quiz-game";

type Question = QuizQuestion &
  (
    | {
        mode: "name-note";
        from: string;
        intervalIdx: number;
        correct: string;
        options: string[];
      }
    | {
        mode: "name-interval";
        from: string;
        to: string;
        correct: string; // short name e.g. "P5"
        options: string[];
      }
  );

function newQuestion(): Question {
  const mode = Math.random() < 0.5 ? "name-note" : "name-interval";
  const from = pickOne(KEYS_FOR_TRANSPOSE);
  const useFlats = keyUsesFlats(from);
  const intervalIdx = Math.floor(Math.random() * INTERVALS.length);
  const interval = INTERVALS[intervalIdx];
  const to = noteAbove(from, interval.semitones, useFlats);

  if (mode === "name-note") {
    // Distractor notes: random valid pitches that aren't `to`.
    const pool: string[] = [];
    for (let i = 0; i < INTERVALS.length; i++) {
      if (i === intervalIdx) continue;
      pool.push(noteAbove(from, INTERVALS[i].semitones, useFlats));
    }
    const distractors = pickN(pool, 3);
    const options = pickN([to, ...distractors], 4);
    return { mode, from, intervalIdx, correct: to, options };
  }

  // name-interval — options are short interval names ("M3", "P5", …)
  const otherIntervals = INTERVALS.filter((_, i) => i !== intervalIdx);
  const distractors = pickN(otherIntervals, 3).map((iv) => iv.short);
  const options = pickN([interval.short, ...distractors], 4);
  return { mode, from, to, correct: interval.short, options };
}

export function IntervalsGame() {
  return (
    <QuizGame<Question>
      makeQuestion={newQuestion}
      renderPrompt={(q) =>
        q.mode === "name-note" ? (
          <div>
            <div className="eyebrow mb-2">Question</div>
            <div className="font-display text-xl sm:text-2xl leading-snug">
              What note is a{" "}
              <span className="text-[#8b5cf6] font-mono font-bold">
                {INTERVALS[q.intervalIdx].short}
              </span>{" "}
              <span className="text-muted-foreground">
                ({INTERVALS[q.intervalIdx].name})
              </span>{" "}
              above{" "}
              <span className="text-[#00e8ff] font-mono font-bold">{q.from}</span>?
            </div>
          </div>
        ) : (
          <div>
            <div className="eyebrow mb-2">Question</div>
            <div className="font-display text-xl sm:text-2xl leading-snug">
              What interval is from{" "}
              <span className="text-[#00e8ff] font-mono font-bold">{q.from}</span>{" "}
              up to{" "}
              <span className="text-[#8b5cf6] font-mono font-bold">{q.to}</span>?
            </div>
          </div>
        )
      }
      renderOption={(opt, q) => (
        <span>
          {q.mode === "name-interval"
            ? `${opt} · ${INTERVALS.find((i) => i.short === opt)?.name}`
            : opt}
        </span>
      )}
      renderAnswer={(q) => q.correct}
      results={{
        perfect:
          "Interval ear. Singers and instrumentalists alike will thank you.",
        good:
          "Strong. Mixing in m6 and m7 every round will lock in the trickier ones.",
        low: "Worth a few more rounds — intervals are the alphabet of melody.",
      }}
    />
  );
}
