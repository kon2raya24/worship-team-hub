"use client";

import {
  KEY_SIGNATURES,
  keyUsesFlats,
  pickN,
  pickOne,
  transposeChord,
} from "@/lib/music";
import { QuizGame, type QuizQuestion } from "../quiz-game";

// Open-chord shapes a guitarist would actually capo from.
const SHAPES = ["C", "G", "D", "A", "E"] as const;
// Realistic capo range: open up to 7. Past 7 the neck is too cramped.
const CAPO_FRETS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

type Question = QuizQuestion &
  (
    | { mode: "find-key"; shape: string; capo: number; correct: string; options: string[] }
    | { mode: "find-capo"; shape: string; targetKey: string; correct: number; options: number[] }
  );

function shapeWithCapo(shape: string, capo: number): string {
  // Worship-canonical spelling: keep the sharp name only when it's a recognized
  // sharp-keys major (G, D, A, E, B, F#). Otherwise fall back to the flat
  // enharmonic (A# → Bb, D# → Eb, G# → Ab, C# → Db).
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

    const otherCapos = CAPO_FRETS.filter((c) => c !== capo);
    const distractors = pickN(otherCapos, 3).map((c) => shapeWithCapo(shape, c));
    const options = pickN([correct, ...distractors], 4);
    return { mode, shape, capo, correct, options };
  }

  // find-capo: pick a target key + a shape; correct capo = semitones to shift
  // the shape up to reach the key (within 0..7). Re-roll if no valid capo.
  const targetKey = pickOne([...SHAPES, "F", "Bb", "Eb"]);
  const shape = pickOne(SHAPES);
  const correct = CAPO_FRETS.find((c) => shapeWithCapo(shape, c) === targetKey);
  if (correct === undefined) return newQuestion();

  const otherFrets = CAPO_FRETS.filter((c) => c !== correct);
  const distractors = pickN(otherFrets, 3);
  const options = pickN([correct, ...distractors], 4);
  return { mode, shape, targetKey, correct, options };
}

export function CapoGame() {
  return (
    <QuizGame<Question>
      makeQuestion={newQuestion}
      renderPrompt={(q) =>
        q.mode === "find-key" ? (
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
        ) : (
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
        )
      }
      renderOption={(opt, q) => (
        <span>
          {q.mode === "find-key"
            ? opt
            : opt === 0
              ? "Open (no capo)"
              : `Fret ${opt}`}
        </span>
      )}
      renderAnswer={(q) =>
        q.mode === "find-key"
          ? q.correct
          : q.correct === 0
            ? "Open (no capo)"
            : `Fret ${q.correct}`
      }
      results={{
        perfect:
          "Capo math on autopilot. Leader changes the key two minutes before the service — no problem.",
        good:
          "Good. Practice the awkward keys (Eb, F) and you'll never freeze on a key change.",
        low: "Worth a few more rounds — capo math saves a lot of stage panic.",
      }}
    />
  );
}
