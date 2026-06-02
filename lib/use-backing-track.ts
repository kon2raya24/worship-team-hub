// Backing-track engine (Phase 6). Client-only — Web Audio API + smplr samples.
// Chords, bass, AND drums play real samples (General-MIDI soundfont + drum
// machine via smplr). Each chord instrument has its own channel strip (volume /
// octave / attack / release / tone / reverb / pan). The drift-free lookahead
// scheduler steps at the eighth note so everything lands in time.

import { useCallback, useEffect, useRef, useState } from "react";
import type { DrumMachine, Soundfont } from "smplr";

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.2;
const EIGHTHS_PER_BAR = 8; // 4/4

export type SoundId =
  | "pad"
  | "epiano"
  | "piano"
  | "organ"
  | "strings"
  | "synth"
  | "brass"
  | "flute"
  | "choir"
  | "pluck"
  | "marimba"
  | "bell";
export type FeelId = "sustained" | "pulse" | "arpeggio" | "strum" | "offbeat";
export type DrumId = "none" | "pop" | "rock" | "ballad" | "funk" | "dance" | "halftime" | "ride";
export type TrackChord = { pcs: number[] }; // triad pitch classes; pcs[0]=root, pcs[2]=fifth
export type Mix = { chords: number; bass: number; drums: number };
export type InstSettings = {
  volume: number; // 0..100
  octave: number; // -2..2
  attack: number; // 0..100
  release: number; // 0..100
  tone: number; // 0..100 (lowpass brightness)
  reverb: number; // 0..100
  pan: number; // -100..100
};

// General-MIDI soundfont program for each instrument + the bass.
const GM: Record<SoundId, string> = {
  pad: "pad_1_new_age",
  epiano: "electric_piano_1",
  piano: "acoustic_grand_piano",
  organ: "drawbar_organ",
  strings: "string_ensemble_1",
  synth: "lead_2_sawtooth",
  brass: "brass_section",
  flute: "flute",
  choir: "choir_aahs",
  pluck: "acoustic_guitar_nylon",
  marimba: "marimba",
  bell: "tubular_bells",
};
const BASS_GM = "electric_bass_finger";

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const toRelease = (r: number) => 0.1 + (r / 100) * 2.4; // 0.1..2.5s
const toCutoff = (t: number) => 400 * Math.pow(45, clamp(t, 0, 100) / 100); // 400..18000Hz
const toAttack = (a: number) => (a / 100) * 0.6; // 0..0.6s

// Strum velocity per eighth — strong downbeats, lighter up-strokes on the "ands".
const STRUM: Record<number, number> = { 0: 1, 2: 0.7, 3: 0.55, 4: 1, 6: 0.7, 7: 0.55 };

// --- Drum kit (sampled via smplr DrumMachine) ----------------------------

type DrumPattern = {
  kick?: number[];
  snare?: number[];
  hat?: number[];
  openhat?: number[];
  ride?: number[];
  clap?: number[];
  rim?: number[];
  crashFirst?: boolean;
};
const DRUM_PATTERNS: Record<Exclude<DrumId, "none">, DrumPattern> = {
  pop: { kick: [0, 4], snare: [2, 6], hat: [0, 1, 2, 3, 4, 5, 6, 7], crashFirst: true },
  rock: { kick: [0, 4, 5], snare: [2, 6], hat: [0, 1, 2, 3, 4, 5, 6, 7], openhat: [7], crashFirst: true },
  ballad: { kick: [0], snare: [4], hat: [0, 2, 4, 6], crashFirst: true },
  funk: { kick: [0, 3, 4, 6], snare: [2, 6], hat: [0, 1, 2, 3, 4, 5, 6, 7], rim: [5] },
  dance: { kick: [0, 2, 4, 6], snare: [2, 6], clap: [2, 6], openhat: [1, 3, 5, 7], crashFirst: true },
  halftime: { kick: [0, 5], snare: [4], hat: [0, 1, 2, 3, 4, 5, 6, 7], crashFirst: true },
  ride: { kick: [0, 4], snare: [2, 6], ride: [0, 1, 2, 3, 4, 5, 6, 7], crashFirst: true },
};
const TOM_FILL: { eighth: number; tom: "hi" | "mid" | "lo" }[] = [
  { eighth: 4, tom: "hi" },
  { eighth: 5, tom: "hi" },
  { eighth: 6, tom: "mid" },
  { eighth: 7, tom: "lo" },
];

// Map a kit's actual sample-group names to our logical voices. Names vary per
// kit (e.g. "hihat-close" / "hhclosed", "cymbal" / "crash"), so match loosely.
type DrumMap = Record<string, string | undefined>;
function mapKit(groups: string[]): DrumMap {
  const find = (...cands: string[]) => {
    for (const c of cands) {
      const hit = groups.find((g) => g.toLowerCase().includes(c));
      if (hit) return hit;
    }
    return undefined;
  };
  const tomLo = find("tom-low", "tom-l", "conga-low", "conga-l");
  return {
    kick: find("kick", "bass"),
    snare: find("snare"),
    hatClosed: find("close", "chh", "hhc"),
    hatOpen: find("open", "ohh"),
    crash: find("crash", "cymbal", "cymball", "cym"),
    ride: find("ride", "cymbal", "cymball", "cym"),
    clap: find("clap"),
    rim: find("rim", "stick", "clave"),
    tomHi: find("tom-hi", "tom-high", "tom-h", "conga-hi", "conga-h"),
    tomMid: find("tom-mid", "mid-tom", "tom-m", "conga-mid", "conga-m") ?? tomLo,
    tomLo,
  };
}

function scheduleDrums(
  dm: DrumMachine,
  map: DrumMap,
  pattern: Exclude<DrumId, "none">,
  eighth: number,
  isLoopStart: boolean,
  isFillBar: boolean,
  time: number,
  vel: number,
) {
  const hit = (group: string | undefined, v: number) => {
    if (group) dm.start({ note: group, time, velocity: clamp(Math.round(127 * vel * v), 1, 127) });
  };
  const p = DRUM_PATTERNS[pattern];
  if (p.crashFirst && isLoopStart && eighth === 0) hit(map.crash, 0.9);
  if (isFillBar && eighth >= 4) {
    const f = TOM_FILL.find((x) => x.eighth === eighth);
    if (f) hit(f.tom === "hi" ? map.tomHi : f.tom === "mid" ? map.tomMid : map.tomLo, 0.95);
    return;
  }
  if (p.kick?.includes(eighth)) hit(map.kick, 1);
  if (p.snare?.includes(eighth)) hit(map.snare, 1);
  if (p.clap?.includes(eighth)) hit(map.clap, 0.9);
  if (p.rim?.includes(eighth)) hit(map.rim, 0.8);
  if (p.hat?.includes(eighth)) hit(map.hatClosed, eighth % 2 ? 0.6 : 0.85);
  if (p.openhat?.includes(eighth)) hit(map.hatOpen, 0.8);
  if (p.ride?.includes(eighth)) hit(map.ride, eighth % 2 ? 0.6 : 0.85);
}

function makeImpulse(ctx: AudioContext): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * 1.8);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  return buf;
}

// --- Hook -----------------------------------------------------------------

export type BackingTrack = {
  running: boolean;
  loading: boolean;
  currentIndex: number;
  toggle: () => void;
};

export function useBackingTrack(opts: {
  chords: TrackChord[];
  bpm: number;
  barsPerChord: number;
  sound: SoundId;
  feel: FeelId;
  drums: DrumId;
  drumKit: string;
  swing: number;
  mix: Mix;
  inst: InstSettings;
}): BackingTrack {
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const chordBusRef = useRef<GainNode | null>(null); // attack envelope lives here
  const reverbSendRef = useRef<GainNode | null>(null);
  const chordInstRef = useRef<Soundfont | null>(null);
  const bassInstRef = useRef<Soundfont | null>(null);
  const drumMachineRef = useRef<DrumMachine | null>(null);
  const drumMapRef = useRef<DrumMap>({});

  const nextTimeRef = useRef(0);
  const stepInChordRef = useRef(0);
  const indexRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const queueRef = useRef<{ index: number; time: number }[]>([]);
  const runningRef = useRef(false);

  // The scheduler runs imperatively, so it reads everything from refs.
  const chordsRef = useRef(opts.chords);
  const bpmRef = useRef(opts.bpm);
  const barsRef = useRef(opts.barsPerChord);
  const feelRef = useRef(opts.feel);
  const drumsRef = useRef(opts.drums);
  const swingRef = useRef(opts.swing);
  const mixRef = useRef(opts.mix);
  const instRef = useRef(opts.inst);
  useEffect(() => {
    chordsRef.current = opts.chords;
  }, [opts.chords]);
  useEffect(() => {
    bpmRef.current = opts.bpm;
  }, [opts.bpm]);
  useEffect(() => {
    barsRef.current = opts.barsPerChord;
  }, [opts.barsPerChord]);
  useEffect(() => {
    feelRef.current = opts.feel;
  }, [opts.feel]);
  useEffect(() => {
    drumsRef.current = opts.drums;
  }, [opts.drums]);
  useEffect(() => {
    swingRef.current = opts.swing;
  }, [opts.swing]);
  useEffect(() => {
    mixRef.current = opts.mix;
  }, [opts.mix]);

  // Build the audio graph once and preload the bass.
  useEffect(() => {
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.connect(ctx.destination);
    const master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(comp);
    masterRef.current = master;
    const chordBus = ctx.createGain();
    chordBus.connect(master);
    chordBusRef.current = chordBus;
    const reverbSend = ctx.createGain();
    reverbSend.gain.value = 0;
    const convolver = ctx.createConvolver();
    convolver.buffer = makeImpulse(ctx);
    chordBus.connect(reverbSend).connect(convolver).connect(master); // wet path
    reverbSendRef.current = reverbSend;

    let disposed = false;
    import("smplr").then(({ Soundfont }) => {
      if (disposed) return;
      const bass = Soundfont(ctx, { instrument: BASS_GM, destination: master });
      bass.ready.then(() => {
        if (!disposed) bassInstRef.current = bass;
      });
    });

    return () => {
      disposed = true;
      if (timerRef.current !== null) clearInterval(timerRef.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      chordInstRef.current?.dispose();
      bassInstRef.current?.dispose();
      drumMachineRef.current?.dispose();
      ctx.close();
    };
  }, []);

  // Load the selected chord instrument whenever it changes.
  useEffect(() => {
    const ctx = ctxRef.current;
    const chordBus = chordBusRef.current;
    if (!ctx || !chordBus) return;
    let cancelled = false;
    setLoading(true);
    import("smplr").then(({ Soundfont }) => {
      if (cancelled) return;
      const inst = Soundfont(ctx, { instrument: GM[opts.sound], destination: chordBus });
      inst.ready.then(() => {
        if (cancelled) {
          inst.dispose();
          return;
        }
        chordInstRef.current?.dispose();
        chordInstRef.current = inst;
        const s = instRef.current;
        inst.output.volume = Math.round(127 * (s.volume / 100));
        inst.output.pan = clamp(s.pan / 100, -1, 1);
        setLoading(false);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [opts.sound]);

  // Load the selected drum kit whenever it changes.
  useEffect(() => {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;
    let cancelled = false;
    import("smplr").then(({ DrumMachine }) => {
      if (cancelled) return;
      const dm = DrumMachine(ctx, { instrument: opts.drumKit, destination: master });
      dm.ready.then(() => {
        if (cancelled) {
          dm.dispose();
          return;
        }
        drumMachineRef.current?.dispose();
        drumMachineRef.current = dm;
        drumMapRef.current = mapKit(dm.getGroupNames());
      });
    });
    return () => {
      cancelled = true;
    };
  }, [opts.drumKit]);

  // Apply the live channel-strip settings (volume/pan to the sampler, reverb to the send).
  useEffect(() => {
    instRef.current = opts.inst;
    const inst = chordInstRef.current;
    if (inst) {
      inst.output.volume = Math.round(127 * (opts.inst.volume / 100));
      inst.output.pan = clamp(opts.inst.pan / 100, -1, 1);
    }
    if (reverbSendRef.current) reverbSendRef.current.gain.value = (opts.inst.reverb / 100) * 0.85;
  }, [opts.inst]);

  const start = useCallback(() => {
    if (runningRef.current) return;
    const ctx = ctxRef.current;
    if (!ctx || !chordInstRef.current) return;
    if (ctx.state === "suspended") ctx.resume();
    runningRef.current = true;
    indexRef.current = 0;
    stepInChordRef.current = 0;
    nextTimeRef.current = ctx.currentTime + 0.1;
    queueRef.current = [];
    setRunning(true);

    const scheduler = () => {
      const c = ctxRef.current;
      const chordInst = chordInstRef.current;
      const chordBus = chordBusRef.current;
      if (!c || !chordInst || !chordBus) return;
      while (nextTimeRef.current < c.currentTime + SCHEDULE_AHEAD) {
        const chords = chordsRef.current;
        if (chords.length === 0) break;
        const beat = 60 / bpmRef.current;
        const stepDur = beat / 2;
        const bars = barsRef.current;
        const stepsPerChord = bars * EIGHTHS_PER_BAR;
        const step = stepInChordRef.current;
        const eighth = step % EIGHTHS_PER_BAR;
        const index = indexRef.current % chords.length;
        const chord = chords[index];
        const gridTime = nextTimeRef.current;
        const time = eighth % 2 === 1 ? gridTime + (swingRef.current / 100) * stepDur : gridTime;
        const mix = mixRef.current;
        const s = instRef.current;
        const feel = feelRef.current;
        const release = toRelease(s.release);
        const cutoff = toCutoff(s.tone);
        const transpose = s.octave * 12;

        if (step === 0) queueRef.current.push({ index, time: gridTime });

        const playChord = (t: number, dur: number, velScale: number) => {
          if (mix.chords <= 0) return;
          const atk = toAttack(s.attack);
          if (atk > 0.02 && feel !== "arpeggio") {
            chordBus.gain.setValueAtTime(0.0001, t);
            chordBus.gain.linearRampToValueAtTime(1, t + atk);
          }
          const velocity = clamp(Math.round(110 * mix.chords * velScale), 1, 127);
          for (const pc of chord.pcs) {
            chordInst.start({ note: 60 + pc + transpose, time: t, duration: dur, velocity, ampRelease: release, lpfCutoffHz: cutoff });
          }
        };

        if (feel === "sustained") {
          if (step === 0) playChord(gridTime, stepsPerChord * stepDur, 1);
        } else if (feel === "pulse") {
          if (eighth % 2 === 0) playChord(time, beat * 0.9, 1);
        } else if (feel === "strum") {
          const sv = STRUM[eighth];
          if (sv) playChord(time, stepDur * 1.6, sv);
        } else if (feel === "offbeat") {
          if (eighth % 2 === 1) playChord(time, stepDur * 0.6, 1);
        } else if (mix.chords > 0) {
          // arpeggio — one tone per eighth, climbing an octave each pass
          const n = chord.pcs.length;
          const pc = chord.pcs[step % n];
          const oct = Math.floor(step / n) % 2 ? 12 : 0;
          const velocity = clamp(Math.round(110 * mix.chords), 1, 127);
          chordInst.start({ note: 60 + pc + oct + transpose, time, duration: stepDur * 0.9, velocity, ampRelease: release, lpfCutoffHz: cutoff });
        }

        // Bass — root on beat 1, fifth on beat 3
        const bass = bassInstRef.current;
        if (bass && mix.bass > 0) {
          const bvel = clamp(Math.round(110 * mix.bass), 1, 127);
          if (eighth === 0) {
            bass.start({ note: 36 + chord.pcs[0], time: gridTime, duration: beat * 2 * 0.95, velocity: bvel });
          } else if (eighth === 4) {
            bass.start({ note: 36 + (chord.pcs[2] ?? chord.pcs[0]), time: gridTime, duration: beat * 2 * 0.95, velocity: bvel });
          }
        }

        // Drums
        const dm = drumMachineRef.current;
        if (dm && mix.drums > 0 && drumsRef.current !== "none") {
          const bar = Math.floor(step / EIGHTHS_PER_BAR);
          const loopBars = chords.length * bars;
          const isLoopStart = index === 0 && bar === 0;
          const isFillBar = loopBars >= 2 && index === chords.length - 1 && bar === bars - 1;
          scheduleDrums(dm, drumMapRef.current, drumsRef.current, eighth, isLoopStart, isFillBar, time, mix.drums);
        }

        nextTimeRef.current += stepDur;
        stepInChordRef.current += 1;
        if (stepInChordRef.current >= stepsPerChord) {
          stepInChordRef.current = 0;
          indexRef.current = (index + 1) % chords.length;
        }
      }
    };
    scheduler();
    timerRef.current = window.setInterval(scheduler, LOOKAHEAD_MS);

    const draw = () => {
      const c = ctxRef.current;
      if (!c) return;
      const q = queueRef.current;
      while (q.length && q[0].time <= c.currentTime) {
        setCurrentIndex(q[0].index);
        q.shift();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    chordInstRef.current?.stop();
    if (chordBusRef.current) {
      chordBusRef.current.gain.cancelScheduledValues(0);
      chordBusRef.current.gain.value = 1;
    }
    queueRef.current = [];
    setRunning(false);
    setCurrentIndex(-1);
  }, []);

  const toggle = useCallback(() => {
    if (runningRef.current) stop();
    else start();
  }, [start, stop]);

  return { running, loading, currentIndex, toggle };
}
