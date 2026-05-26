"use client";

import { useState } from "react";
import { Check, X, RefreshCw } from "lucide-react";
import {
  KEYS_FOR_TRANSPOSE,
  keyUsesFlats,
  noteAbove,
  pickN,
  pickOne,
} from "@/lib/music";

const ROUNDS_PER_GAME = 10;

// Worship-friendly chord types and the tones we test.
// Major: 1, 3 (M3=4), 5 (P5=7)
// Minor: 1, b3 (m3=3), 5 (P5=7)
// Maj7: 1, 3, 5, 7 (M7=11)
// Dom7: 1, 3, 5, b7 (m7=10)
type ChordType = "maj" | "min" | "maj7" | "dom7";
const CHORD_TYPES: { type: ChordType; label: string; suffix: string }[] = [
  { type: "maj", label: "major", suffix: "" },
  { type: "min", label: "minor", suffix: "m" },
  { type: "maj7", label: "major 7", suffix: "maj7" },
  { type: "dom7", label: "dominant 7", suffix: "7" },
];

// Tone name + semitones from the root for each chord type.
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

type Question = {
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

  // Distractors: other chord tones + nearby notes (±1 semitone). This makes
  // the multiple choice meaningful — a 3rd vs b3rd one-semitone-off mistake.
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
  const ct = CHORD_TYPES.find((c) => c.type === q.chordType)!;

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
        <div>
          <div className="eyebrow mb-2">Question</div>
          <div className="font-display text-xl sm:text-2xl leading-snug">
            What&apos;s the{" "}
            <span className="text-[#8b5cf6] font-mono font-bold">
              {q.tone}
            </span>{" "}
            of{" "}
            <span className="text-[#00e8ff] font-mono font-bold">
              {q.root}
              {ct.suffix}
            </span>{" "}
            <span className="text-[#8a92b4]">({ct.label})</span>?
          </div>
        </div>

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
                  ? "Vocal-section gold. You'll never sing the wrong harmony note again."
                  : score >= 7
                    ? "Strong. The dominant 7 is the one most worship singers miss — drill that."
                    : "Worth a few more rounds — chord tones are the bones of every harmony."}
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
