"use client";

import { useState } from "react";
import { Check, X, RefreshCw } from "lucide-react";
import {
  KEY_SIGNATURES,
  keyUsesFlats,
  pickN,
  pickOne,
  transposeChord,
} from "@/lib/music";

const ROUNDS_PER_GAME = 10;

// Open-chord shapes a guitarist would actually capo from.
const SHAPES = ["C", "G", "D", "A", "E"] as const;
// Realistic capo range: open up to 7. Past 7 the neck is too cramped.
const CAPO_FRETS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

type Question =
  | {
      mode: "find-key";
      shape: string;
      capo: number;
      correct: string;
      options: string[];
    }
  | {
      mode: "find-capo";
      shape: string;
      targetKey: string;
      correct: number;
      options: number[];
    };

function shapeWithCapo(shape: string, capo: number): string {
  // Worship-canonical spelling: keep the sharp name only when it's a
  // recognized sharp-keys major (G, D, A, E, B, F#). Otherwise fall back to
  // the flat enharmonic (A# → Bb, D# → Eb, G# → Ab, C# → Db) — that's how
  // every worship band names them.
  const sharp = transposeChord(shape, capo, false);
  if (KEY_SIGNATURES[sharp] && !keyUsesFlats(sharp)) return sharp;
  return transposeChord(shape, capo, true);
}

function newQuestion(): Question {
  const mode = Math.random() < 0.5 ? "find-key" : "find-capo";

  if (mode === "find-key") {
    const shape = pickOne(SHAPES);
    const capo = pickOne(CAPO_FRETS);
    const correct = shapeWithCapo(shape, capo);

    // Distractor keys: other sounding-key options for the same shape but
    // different capo positions. Guarantees plausible-looking options that
    // share the shape's chord family.
    const otherCapos = CAPO_FRETS.filter((c) => c !== capo);
    const distractors = pickN(otherCapos, 3).map((c) => shapeWithCapo(shape, c));
    const options = pickN([correct, ...distractors], 4);
    return { mode, shape, capo, correct, options };
  }

  // find-capo: pick a target key, pick a shape; correct capo = how many
  // semitones to shift the shape up to reach the key (within 0..7).
  // Not every (target, shape) pair has a valid capo in 0..7 — re-roll if so.
  const targetKey = pickOne([...SHAPES, "F", "Bb", "Eb"]);
  const shape = pickOne(SHAPES);
  const correct = CAPO_FRETS.find(
    (c) => shapeWithCapo(shape, c) === targetKey
  );
  if (correct === undefined) return newQuestion();

  const otherFrets = CAPO_FRETS.filter((c) => c !== correct);
  const distractors = pickN(otherFrets, 3);
  const options = pickN([correct, ...distractors], 4);
  return { mode, shape, targetKey, correct, options };
}

export function CapoGame() {
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
                    {q.mode === "find-key"
                      ? opt
                      : opt === 0
                        ? "Open (no capo)"
                        : `Fret ${opt}`}
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
                : q.mode === "find-key"
                  ? `Answer: ${q.correct}`
                  : q.correct === 0
                    ? "Answer: Open (no capo)"
                    : `Answer: Fret ${q.correct}`}
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
                  ? "Capo math on autopilot. Leader changes the key two minutes before the service — no problem."
                  : score >= 7
                    ? "Good. Practice the awkward keys (Eb, F) and you'll never freeze on a key change."
                    : "Worth a few more rounds — capo math saves a lot of stage panic."}
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
  if (q.mode === "find-key") {
    return (
      <div>
        <div className="eyebrow mb-2">Question</div>
        <div className="font-display text-xl sm:text-2xl leading-snug">
          You&apos;re playing the{" "}
          <span className="text-[#00e8ff] font-mono font-bold">{q.shape}</span>{" "}
          shape with capo at{" "}
          <span className="text-[#8b5cf6] font-mono font-bold">
            {q.capo === 0 ? "no capo" : `fret ${q.capo}`}
          </span>
          . What key is sounding?
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="eyebrow mb-2">Question</div>
      <div className="font-display text-xl sm:text-2xl leading-snug">
        Service is in the key of{" "}
        <span className="text-[#00e8ff] font-mono font-bold">
          {q.targetKey}
        </span>
        . You want to play{" "}
        <span className="text-[#8b5cf6] font-mono font-bold">{q.shape}</span>{" "}
        shape — where does the capo go?
      </div>
    </div>
  );
}
