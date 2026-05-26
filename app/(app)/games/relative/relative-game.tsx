"use client";

import { useState } from "react";
import { Check, X, RefreshCw } from "lucide-react";
import {
  KEYS_FOR_TRANSPOSE,
  pickN,
  pickOne,
  relativeMajor,
  relativeMinor,
} from "@/lib/music";

const ROUNDS_PER_GAME = 10;

// We test the worship-common major keys plus a few from the flat side that
// guitar players run into during key changes (Bb, Eb).
const MAJOR_POOL = [...KEYS_FOR_TRANSPOSE];

type Question =
  | {
      mode: "major-to-minor";
      majorKey: string;
      correct: string; // e.g. "Em"
      options: string[];
    }
  | {
      mode: "minor-to-major";
      minorKey: string;
      correct: string; // e.g. "G"
      options: string[];
    };

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
  const [questions, setQuestions] = useState<Question[]>(() =>
    Array.from({ length: ROUNDS_PER_GAME }, newQuestion),
  );
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const [prevIdx, setPrevIdx] = useState(idx);
  if (prevIdx !== idx) {
    setPrevIdx(idx);
    setPicked(null);
  }

  const q = questions[idx];
  const isLast = idx === questions.length - 1;
  const isCorrect = picked !== null && picked === q.correct;

  function choose(option: string) {
    if (picked !== null) return;
    setPicked(option);
    if (option === q.correct) setScore((s) => s + 1);
  }

  function next() {
    setIdx((i) => i + 1);
  }

  function restart() {
    setQuestions(Array.from({ length: ROUNDS_PER_GAME }, newQuestion));
    setIdx(0);
    setPicked(null);
    setScore(0);
  }

  const finished = picked !== null && isLast;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="eyebrow">
          Question {idx + 1} / {ROUNDS_PER_GAME}
        </div>
        <div className="flex items-center gap-2">
          <span className="eyebrow">Score</span>
          <span className="font-display text-lg font-semibold">
            {score} / {ROUNDS_PER_GAME}
          </span>
        </div>
      </div>

      <div className="glass p-5 sm:p-6 space-y-5">
        <Prompt q={q} />

        <div className="grid gap-2 sm:grid-cols-2">
          {q.options.map((opt) => {
            const isPick = picked === opt;
            const isRight = picked !== null && opt === q.correct;
            return (
              <button
                key={opt}
                disabled={picked !== null}
                onClick={() => choose(opt)}
                className={[
                  "h-12 px-4 rounded-lg border text-left font-mono text-base text-white transition",
                  picked === null
                    ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20"
                    : "",
                  picked !== null && isRight
                    ? "border-[#8eff6a]/60 bg-[#8eff6a]/12"
                    : "",
                  picked !== null && isPick && !isRight
                    ? "border-[#ff5566]/60 bg-[#ff5566]/12"
                    : "",
                  picked !== null && !isPick && !isRight
                    ? "border-white/[0.06] bg-white/[0.02] opacity-60"
                    : "",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-2 w-full">
                  <span>{opt}</span>
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
              {isCorrect ? "Correct" : `Answer: ${q.correct}`}
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
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 space-y-2">
              <div className="eyebrow">Done</div>
              <div className="font-display text-2xl font-semibold">
                {score} / {ROUNDS_PER_GAME}
              </div>
              <p className="text-sm text-[#8a92b4]">
                {score === ROUNDS_PER_GAME
                  ? "Major / minor pairings on autopilot. Reharmonizations are now in reach."
                  : score >= 7
                    ? "Strong. The minor 3rd-below pattern (C → A, G → E, …) is the shortcut."
                    : "Worth a few more rounds — relative keys unlock half of every worship reharm."}
              </p>
            </div>
            <button
              onClick={restart}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white font-semibold text-sm hover:bg-white/[0.08] transition"
            >
              <RefreshCw className="size-4" /> Play again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Prompt({ q }: { q: Question }) {
  if (q.mode === "major-to-minor") {
    return (
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
    );
  }
  return (
    <div>
      <div className="eyebrow mb-2">Question</div>
      <div className="font-display text-xl sm:text-2xl leading-snug">
        What&apos;s the relative major of{" "}
        <span className="text-[#00e8ff] font-mono font-bold">{q.minorKey}</span>?
      </div>
    </div>
  );
}
