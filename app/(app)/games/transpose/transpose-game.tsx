"use client";

import { useEffect, useState } from "react";
import { Check, X, RefreshCw, ArrowRight } from "lucide-react";
import {
  PROGRESSIONS,
  KEYS_FOR_TRANSPOSE,
  transposeChord,
  chordsEqual,
  keyUsesFlats,
  semitonesBetween,
  pickOne,
} from "@/lib/music";

const ROUNDS_PER_GAME = 5;

type Round = {
  fromKey: string;
  toKey: string;
  progression: string[]; // chords in fromKey
  expected: string[]; // chords in toKey
};

function newRound(): Round {
  const progTemplate = pickOne(PROGRESSIONS);
  const fromKey = pickOne(KEYS_FOR_TRANSPOSE);
  let toKey = pickOne(KEYS_FOR_TRANSPOSE);
  // Avoid pointless "no transpose" rounds.
  while (toKey === fromKey) toKey = pickOne(KEYS_FOR_TRANSPOSE);

  const fromUseFlats = keyUsesFlats(fromKey);
  const toUseFlats = keyUsesFlats(toKey);
  const semitonesToFrom = semitonesBetween("C", fromKey);
  const semitonesToTarget = semitonesBetween("C", toKey);

  const progression = progTemplate.chords.map((c) =>
    transposeChord(c, semitonesToFrom, fromUseFlats),
  );
  const expected = progTemplate.chords.map((c) =>
    transposeChord(c, semitonesToTarget, toUseFlats),
  );

  return { fromKey, toKey, progression, expected };
}

export function TransposeGame() {
  const [rounds, setRounds] = useState<Round[]>(() =>
    Array.from({ length: ROUNDS_PER_GAME }, newRound),
  );
  const [roundIndex, setRoundIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const round = rounds[roundIndex];

  // Reset inputs whenever the round changes.
  useEffect(() => {
    setAnswers(round.progression.map(() => ""));
  }, [round]);

  const isLast = roundIndex === rounds.length - 1;
  const allCorrect =
    submitted &&
    round.expected.every((exp, i) => chordsEqual(answers[i] ?? "", exp));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitted) return;
    setSubmitted(true);
    const got = round.expected.reduce(
      (n, exp, i) => n + (chordsEqual(answers[i] ?? "", exp) ? 1 : 0),
      0,
    );
    if (got === round.expected.length) {
      setScore((s) => s + 1);
    }
  }

  function handleNext() {
    setSubmitted(false);
    setRoundIndex((i) => i + 1);
  }

  function handleRestart() {
    setRounds(Array.from({ length: ROUNDS_PER_GAME }, newRound));
    setRoundIndex(0);
    setSubmitted(false);
    setScore(0);
  }

  const finished = submitted && isLast;

  return (
    <div className="space-y-6">
      {/* Score + progress */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="eyebrow">
          Round {Math.min(roundIndex + 1, ROUNDS_PER_GAME)} / {ROUNDS_PER_GAME}
        </div>
        <div className="flex items-center gap-2">
          <span className="eyebrow">Score</span>
          <span className="font-display text-lg font-semibold">
            {score} / {ROUNDS_PER_GAME}
          </span>
        </div>
      </div>

      {/* Prompt card */}
      <div className="glass p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="eyebrow">Original</span>
          <KeyChip k={round.fromKey} accent="violet" />
          <span className="text-[#8a92b4] text-sm">→</span>
          <span className="eyebrow">Target</span>
          <KeyChip k={round.toKey} accent="cyan" />
        </div>

        {/* Chord progression chips */}
        <div className="flex flex-wrap items-center gap-2">
          {round.progression.map((c, i) => (
            <span
              key={`${c}-${i}`}
              className="inline-flex items-center justify-center min-w-[44px] px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 font-mono text-base text-white/95"
            >
              {c}
            </span>
          ))}
        </div>

        {/* Input row */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap items-stretch gap-2">
            {round.progression.map((_, i) => {
              const correct =
                submitted && chordsEqual(answers[i] ?? "", round.expected[i]);
              const wrong = submitted && !correct;
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <input
                    type="text"
                    value={answers[i] ?? ""}
                    onChange={(e) => {
                      const next = [...answers];
                      next[i] = e.target.value;
                      setAnswers(next);
                    }}
                    disabled={submitted}
                    placeholder="?"
                    autoComplete="off"
                    spellCheck={false}
                    className={[
                      "h-12 w-20 rounded-lg border bg-white/[0.04] px-2 text-center font-mono text-lg text-white placeholder:text-[#4a5278]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e8ff]/50",
                      correct ? "border-[#8eff6a]/60 bg-[#8eff6a]/10" : "",
                      wrong ? "border-[#ff5566]/60 bg-[#ff5566]/10" : "",
                      !submitted ? "border-white/10" : "",
                    ].join(" ")}
                  />
                  {submitted && wrong && (
                    <span className="text-[10px] font-mono text-[#8eff6a]">
                      {round.expected[i]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {!submitted ? (
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-[linear-gradient(135deg,rgba(0,232,255,0.28),rgba(139,92,246,0.32))] border border-[#00e8ff]/40 text-white font-semibold text-sm hover:brightness-110 transition"
            >
              Check answer
            </button>
          ) : finished ? (
            <div className="space-y-3 pt-2">
              <div className="text-sm">
                {allCorrect ? (
                  <span className="inline-flex items-center gap-2 text-[#8eff6a]">
                    <Check className="size-4" /> All correct this round!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-[#ff5566]">
                    <X className="size-4" /> Some chords were off.
                  </span>
                )}
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 space-y-2">
                <div className="eyebrow">Game over</div>
                <div className="font-display text-2xl font-semibold">
                  {score} / {ROUNDS_PER_GAME}
                </div>
                <p className="text-sm text-[#8a92b4]">
                  {score === ROUNDS_PER_GAME
                    ? "Perfect run. The whole band trusts you on key changes."
                    : score >= 3
                      ? "Solid — that 'play in F' request on Sunday won't faze you."
                      : "Keep going. The circle of fifths gets easier every round."}
                </p>
              </div>
              <button
                onClick={handleRestart}
                type="button"
                className="inline-flex items-center gap-2 px-4 h-10 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white font-semibold text-sm hover:bg-white/[0.08] transition"
              >
                <RefreshCw className="size-4" /> Play again
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 pt-1">
              <span
                className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                  allCorrect ? "text-[#8eff6a]" : "text-[#ff5566]"
                }`}
              >
                {allCorrect ? (
                  <>
                    <Check className="size-4" /> Correct
                  </>
                ) : (
                  <>
                    <X className="size-4" /> Not quite
                  </>
                )}
              </span>
              <button
                onClick={handleNext}
                type="button"
                className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-[linear-gradient(135deg,rgba(0,232,255,0.28),rgba(139,92,246,0.32))] border border-[#00e8ff]/40 text-white font-semibold text-sm hover:brightness-110 transition"
              >
                Next round <ArrowRight className="size-4" />
              </button>
            </div>
          )}
        </form>
      </div>

      <p className="text-xs text-[#8a92b4]">
        Tips: minor chords use lowercase <span className="font-mono">m</span> (
        <span className="font-mono">Am</span>). Flats use{" "}
        <span className="font-mono">b</span> (<span className="font-mono">Bb</span>
        ), sharps use <span className="font-mono">#</span>.
      </p>
    </div>
  );
}

function KeyChip({ k, accent }: { k: string; accent: "violet" | "cyan" }) {
  const cls =
    accent === "violet"
      ? "border-[#8b5cf6]/35 bg-[#8b5cf6]/15 text-[#c8a4ff]"
      : "border-[#00e8ff]/35 bg-[#00e8ff]/15 text-[#00e8ff]";
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-md border font-mono text-sm font-semibold ${cls}`}
    >
      {k}
    </span>
  );
}
