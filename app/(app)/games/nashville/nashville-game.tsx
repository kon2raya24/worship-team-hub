"use client";

import { useState } from "react";
import { Check, X, RefreshCw } from "lucide-react";
import {
  KEYS_FOR_TRANSPOSE,
  ROMAN_NUMERALS,
  diatonicChord,
  pickN,
  pickOne,
  type DegreeIdx,
} from "@/lib/music";

const ROUNDS_PER_GAME = 10;

// vii° is rare in worship; stick to the six diatonic chords leaders actually
// cue from the stage. (I, ii, iii, IV, V, vi)
const DEGREES: DegreeIdx[] = [0, 1, 2, 3, 4, 5];

type Question =
  | {
      mode: "find-chord";
      key: string;
      degree: DegreeIdx;
      correct: string;
      options: string[];
    }
  | {
      mode: "find-degree";
      key: string;
      chord: string;
      correct: DegreeIdx;
      options: DegreeIdx[];
    };

function newQuestion(): Question {
  const mode = Math.random() < 0.5 ? "find-chord" : "find-degree";
  const key = pickOne(KEYS_FOR_TRANSPOSE);
  const degree = pickOne(DEGREES);
  const chord = diatonicChord(key, degree);

  if (mode === "find-chord") {
    // Distractors are other diatonic chords from the same key — they "look
    // right" but you have to actually know your scale degrees.
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
  const [questions, setQuestions] = useState<Question[]>(() =>
    Array.from({ length: ROUNDS_PER_GAME }, newQuestion),
  );
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | number | null>(null);
  const [score, setScore] = useState(0);

  const [prevIdx, setPrevIdx] = useState(idx);
  if (prevIdx !== idx) {
    setPrevIdx(idx);
    setPicked(null);
  }

  const q = questions[idx];
  const isLast = idx === questions.length - 1;
  const isCorrect = picked !== null && picked === q.correct;

  function choose(option: string | number) {
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
                key={String(opt)}
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
                  <span>
                    {q.mode === "find-chord"
                      ? opt
                      : ROMAN_NUMERALS[opt as DegreeIdx]}
                  </span>
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
              {isCorrect
                ? "Correct"
                : `Answer: ${
                    q.mode === "find-chord"
                      ? q.correct
                      : ROMAN_NUMERALS[q.correct as DegreeIdx]
                  }`}
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
                  ? "Nashville-fluent. The band hears 'go to the IV' and you're already there."
                  : score >= 7
                    ? "Solid. Spend a Sunday cueing chords by number and it'll click."
                    : "Worth a few more rounds — leaders call chords by number all the time."}
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
  if (q.mode === "find-chord") {
    return (
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
    );
  }
  return (
    <div>
      <div className="eyebrow mb-2">Question</div>
      <div className="font-display text-xl sm:text-2xl leading-snug">
        In the key of{" "}
        <span className="text-[#00e8ff] font-mono font-bold">{q.key}</span>,{" "}
        <span className="text-[#8b5cf6] font-mono font-bold">{q.chord}</span> is
        which Roman numeral?
      </div>
    </div>
  );
}
