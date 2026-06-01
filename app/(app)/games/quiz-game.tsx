"use client";

import { useState, type ReactNode } from "react";
import { Check, X, RefreshCw } from "lucide-react";

export type QuizQuestion = {
  options: (string | number)[];
  correct: string | number;
};

export type QuizResults = { perfect: string; good: string; low: string };

/**
 * Shared multiple-choice quiz shell for the music-theory games. Owns the round
 * state machine, score/progress header, option grid, feedback row, and results
 * panel. Each game supplies only its question generator and how to render the
 * prompt, the options, and the answer label.
 */
export function QuizGame<Q extends QuizQuestion>({
  rounds = 10,
  makeQuestion,
  renderPrompt,
  renderOption,
  renderAnswer,
  results,
}: {
  rounds?: number;
  makeQuestion: () => Q;
  renderPrompt: (q: Q) => ReactNode;
  renderOption: (opt: string | number, q: Q) => ReactNode;
  renderAnswer: (q: Q) => ReactNode;
  results: QuizResults;
}) {
  const [questions, setQuestions] = useState<Q[]>(() =>
    Array.from({ length: rounds }, makeQuestion),
  );
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | number | null>(null);
  const [score, setScore] = useState(0);

  // React 19 prop-sync: reset the selection when the question changes
  // (compare during render rather than running an effect).
  const [prevIdx, setPrevIdx] = useState(idx);
  if (prevIdx !== idx) {
    setPrevIdx(idx);
    setPicked(null);
  }

  const q = questions[idx];
  const isLast = idx === questions.length - 1;
  const isCorrect = picked !== null && picked === q.correct;
  const finished = picked !== null && isLast;

  function choose(option: string | number) {
    if (picked !== null) return;
    setPicked(option);
    if (option === q.correct) setScore((s) => s + 1);
  }
  function next() {
    setIdx((i) => i + 1);
  }
  function restart() {
    setQuestions(Array.from({ length: rounds }, makeQuestion));
    setIdx(0);
    setPicked(null);
    setScore(0);
  }

  const message =
    score === rounds
      ? results.perfect
      : score >= Math.ceil(rounds * 0.7)
        ? results.good
        : results.low;

  return (
    <div className="space-y-6">
      {/* Score + progress */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="eyebrow">
          Question {idx + 1} / {rounds}
        </div>
        <div className="flex items-center gap-2">
          <span className="eyebrow">Score</span>
          <span className="font-display text-lg font-semibold">
            {score} / {rounds}
          </span>
        </div>
      </div>

      <div className="glass p-5 sm:p-6 space-y-5">
        {renderPrompt(q)}

        <div className="grid gap-2 sm:grid-cols-2">
          {q.options.map((opt) => {
            const isPick = picked === opt;
            const isRight = picked !== null && opt === q.correct;
            return (
              <button
                key={String(opt)}
                disabled={picked !== null}
                onClick={() => choose(opt)}
                className={[
                  "h-12 px-4 rounded-lg border text-left font-mono text-base text-foreground transition",
                  picked === null
                    ? "border-border bg-tint-1 hover:bg-tint-2 hover:border-hairline-strong"
                    : "",
                  picked !== null && isRight
                    ? "border-[#8eff6a]/60 bg-[#8eff6a]/12"
                    : "",
                  picked !== null && isPick && !isRight
                    ? "border-[#ff5566]/60 bg-[#ff5566]/12"
                    : "",
                  picked !== null && !isPick && !isRight
                    ? "border-border bg-tint-1 opacity-60"
                    : "",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-2 w-full">
                  {renderOption(opt, q)}
                  {picked !== null && isRight && (
                    <Check className="ml-auto size-4 text-[#8eff6a]" />
                  )}
                  {picked !== null && isPick && !isRight && (
                    <X className="ml-auto size-4 text-[#ff5566]" />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {picked !== null && !finished && (
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                isCorrect ? "text-[#8eff6a]" : "text-[#ff5566]"
              }`}
            >
              {isCorrect ? "Correct" : <>Answer: {renderAnswer(q)}</>}
            </span>
            <button
              onClick={next}
              className="ml-auto inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-[linear-gradient(135deg,rgba(0,232,255,0.28),rgba(139,92,246,0.32))] border border-[#00e8ff]/40 text-white font-semibold text-sm hover:brightness-110 transition"
            >
              Next
            </button>
          </div>
        )}

        {finished && (
          <div className="space-y-3 pt-2">
            <div className="rounded-lg border border-border bg-tint-1 p-4 space-y-2">
              <div className="eyebrow">Done</div>
              <div className="font-display text-2xl font-semibold">
                {score} / {rounds}
              </div>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
            <button
              onClick={restart}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-lg border border-hairline-strong bg-tint-1 text-foreground font-semibold text-sm hover:bg-tint-2 transition"
            >
              <RefreshCw className="size-4" /> Play again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
