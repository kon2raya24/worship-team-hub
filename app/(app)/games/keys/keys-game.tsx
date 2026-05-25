"use client";

import { useEffect, useState } from "react";
import { Check, X, RefreshCw } from "lucide-react";
import { KEY_SIGNATURES, pickN, pickOne } from "@/lib/music";

const ROUNDS_PER_GAME = 10;
const KEYS = Object.keys(KEY_SIGNATURES);

type QuestionMode = "count" | "name";

type Question =
  | {
      mode: "count";
      key: string;
      kind: "sharps" | "flats" | "neither";
      correct: number; // number of accidentals
      options: number[];
    }
  | {
      mode: "name";
      list: string[]; // the actual sharps/flats list
      kind: "sharps" | "flats";
      correct: string; // the key name
      options: string[];
    };

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
  const mode: QuestionMode = Math.random() < 0.5 ? "count" : "name";
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

  // Pick distractor keys with the same kind (sharp keys vs flat keys) so
  // the question stays fair.
  const sameKindKeys = KEYS.filter((k) => {
    const c = countAccidentals(k);
    return c.kind === kind && k !== key;
  });
  const distractors = pickN(sameKindKeys, Math.min(3, sameKindKeys.length));
  const options = pickN([key, ...distractors], distractors.length + 1);
  return { mode: "name", list, kind, correct: key, options };
}

export function KeysGame() {
  const [questions, setQuestions] = useState<Question[]>(() =>
    Array.from({ length: ROUNDS_PER_GAME }, newQuestion),
  );
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | number | null>(null);
  const [score, setScore] = useState(0);

  const q = questions[idx];

  const isLast = idx === questions.length - 1;
  const isCorrect =
    picked !== null &&
    (q.mode === "count" ? picked === q.correct : picked === q.correct);

  useEffect(() => {
    setPicked(null);
  }, [idx]);

  function choose(option: string | number) {
    if (picked !== null) return;
    setPicked(option);
    const correct =
      q.mode === "count" ? option === q.correct : option === q.correct;
    if (correct) setScore((s) => s + 1);
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
      {/* Score + progress */}
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
            const isRight =
              picked !== null &&
              (q.mode === "count"
                ? opt === q.correct
                : opt === q.correct);
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
                <span className="inline-flex items-center gap-2">
                  {q.mode === "count" ? (
                    <>
                      <span>{opt}</span>
                      <span className="text-xs text-[#8a92b4]">
                        {opt === 1 ? "accidental" : "accidentals"}
                      </span>
                    </>
                  ) : (
                    <span>{opt}</span>
                  )}
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
          <div className="flex items-center gap-3">
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
                  ? "Sharps + flats in your sleep."
                  : score >= 7
                    ? "Strong. Try the Transpose Trainer next."
                    : "Worth a few more rounds — the circle of fifths is a worship-team superpower."}
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
  if (q.mode === "count") {
    return (
      <div>
        <div className="eyebrow mb-2">Question</div>
        <div className="font-display text-xl sm:text-2xl leading-snug">
          How many accidentals does the key of{" "}
          <span className="text-[#00e8ff] font-mono font-bold">{q.key}</span>{" "}
          major have?
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="eyebrow mb-2">Question</div>
      <div className="font-display text-xl sm:text-2xl leading-snug mb-3">
        Which major key has these {q.kind}?
      </div>
      <div className="flex flex-wrap gap-2">
        {q.list.map((n) => (
          <span
            key={n}
            className="inline-flex items-center justify-center min-w-[44px] px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 font-mono text-base text-white/95"
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

