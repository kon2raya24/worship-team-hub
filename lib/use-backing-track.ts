// Backing-track engine (Phase 6). Client-only — Web Audio API.
// A small groove machine: loops a chord progression with a selectable
// instrument sound, rhythmic feel, swing, synthesized drums, and a per-part
// mix. Same drift-free lookahead scheduler as the metronome, stepping at the
// eighth note so drums and rhythmic comping land in time.

import { useCallback, useEffect, useRef, useState } from "react";

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.2;
const EIGHTHS_PER_BAR = 8; // 4/4

export type SoundId =
  | "pad"
  | "epiano"
  | "piano"
  | "organ"
  | "pluck"
  | "strings"
  | "synth"
  | "brass"
  | "flute"
  | "bell"
  | "marimba"
  | "choir";
export type FeelId = "sustained" | "pulse" | "arpeggio" | "strum" | "offbeat";
export type DrumId = "none" | "pop" | "rock" | "ballad" | "funk" | "dance" | "halftime" | "ride";
export type TrackChord = { pcs: number[] }; // triad pitch classes; pcs[0]=root, pcs[2]=fifth
export type Mix = { chords: number; bass: number; drums: number };

const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// Drum-kit hit positions, as eighth-note indexes within a 4/4 bar. Every voice
// is optional, so a pattern uses as much of the kit as it needs. `crashFirst`
// adds a crash on beat 1 of the first bar of each chord.
type DrumPattern = {
  kick?: number[];
  snare?: number[];
  hat?: number[]; // closed hi-hat
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

// A one-bar tom fill, played on the final bar of the progression loop.
const TOM_FILL: { eighth: number; tom: "hi" | "mid" | "lo" }[] = [
  { eighth: 4, tom: "hi" },
  { eighth: 5, tom: "hi" },
  { eighth: 6, tom: "mid" },
  { eighth: 7, tom: "lo" },
];

// Strum velocity per eighth — strong downbeats, lighter up-strokes on the "ands".
const STRUM: Record<number, number> = { 0: 1, 2: 0.7, 3: 0.55, 4: 1, 6: 0.7, 7: 0.55 };

// Struck-instrument partials: [frequency ratio, gain, waveform]. Bell uses
// inharmonic ratios for its metallic shimmer.
type Partial = [number, number, OscillatorType];
const PARTIALS_PIANO: Partial[] = [[1, 1, "triangle"], [2, 0.5, "sine"], [3, 0.25, "sine"], [4, 0.12, "sine"]];
const PARTIALS_EPIANO: Partial[] = [[1, 1, "sine"], [2, 0.4, "sine"]];
const PARTIALS_BELL: Partial[] = [[1, 1, "sine"], [2, 0.6, "sine"], [2.76, 0.5, "sine"], [3.76, 0.3, "sine"], [5.4, 0.2, "sine"]];
const PARTIALS_MARIMBA: Partial[] = [[1, 1, "sine"], [4, 0.4, "sine"], [10, 0.1, "sine"]];

// --- Chord instrument voices ---------------------------------------------

function voiceNote(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  dur: number,
  sound: SoundId,
  vel: number,
) {
  const end = start + dur;
  const g = ctx.createGain();
  g.connect(dest);

  // Sustained-envelope timbres (attack → hold → release), with optional vibrato.
  const sustainVoice = (
    attack: number,
    peak: number,
    cutoff: number,
    type: OscillatorType,
    detunes: number[],
    vibrato?: { rate: number; depth: number },
  ) => {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    filter.connect(g);
    const hold = Math.max(start + attack, end - Math.min(0.2, dur * 0.4));
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(peak * vel, start + attack);
    g.gain.setValueAtTime(peak * vel, hold);
    g.gain.linearRampToValueAtTime(0, end - 0.02);
    let lfoGain: GainNode | null = null;
    if (vibrato) {
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = vibrato.rate;
      lfoGain = ctx.createGain();
      lfoGain.gain.value = vibrato.depth; // cents
      lfo.connect(lfoGain);
      lfo.start(start);
      lfo.stop(end);
    }
    for (const detune of detunes) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(filter);
      if (lfoGain) lfoGain.connect(osc.detune);
      osc.start(start);
      osc.stop(end);
    }
  };

  // Struck timbres (fast attack → exponential decay) from harmonic partials.
  const struckVoice = (peak: number, partials: Partial[], cutoff?: number) => {
    let node: AudioNode = g;
    if (cutoff) {
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = cutoff;
      filter.connect(g);
      node = filter;
    }
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak * vel, start + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    for (const [ratio, amp, type] of partials) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq * ratio;
      const og = ctx.createGain();
      og.gain.value = amp;
      osc.connect(og).connect(node);
      osc.start(start);
      osc.stop(end);
    }
  };

  switch (sound) {
    case "pad":
      return sustainVoice(0.06, 0.1, 1400, "triangle", [-7, 7]);
    case "strings":
      return sustainVoice(0.15, 0.07, 1500, "sawtooth", [-10, 0, 10]);
    case "synth":
      return sustainVoice(0.02, 0.08, 2600, "sawtooth", [-6, 6]);
    case "brass":
      return sustainVoice(0.08, 0.075, 1600, "sawtooth", [-5, 5], { rate: 6, depth: 8 });
    case "flute":
      return sustainVoice(0.06, 0.1, 3000, "sine", [0], { rate: 5, depth: 12 });
    case "choir":
      return sustainVoice(0.12, 0.06, 1200, "triangle", [-8, 0, 8], { rate: 5.5, depth: 6 });
    case "piano":
      return struckVoice(0.13, PARTIALS_PIANO, 3500);
    case "epiano":
      return struckVoice(0.2, PARTIALS_EPIANO);
    case "bell":
      return struckVoice(0.12, PARTIALS_BELL);
    case "marimba":
      return struckVoice(0.16, PARTIALS_MARIMBA);
    case "pluck":
      return struckVoice(0.18, [[1, 1, "sawtooth"]], 2000);
    case "organ": {
      const hold = Math.max(start + 0.02, end - 0.05);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.07 * vel, start + 0.01);
      g.gain.setValueAtTime(0.07 * vel, hold);
      g.gain.linearRampToValueAtTime(0, end - 0.01);
      for (const [mult, amp] of [[1, 1], [2, 0.5], [3, 0.3]] as const) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq * mult;
        const og = ctx.createGain();
        og.gain.value = amp;
        osc.connect(og).connect(g);
        osc.start(start);
        osc.stop(end);
      }
      return;
    }
  }
}

function voiceBass(ctx: AudioContext, dest: AudioNode, freq: number, start: number, dur: number, vel: number) {
  const end = start + dur;
  const hold = Math.max(start + 0.03, end - 0.1);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(0.22 * vel, start + 0.02);
  g.gain.setValueAtTime(0.22 * vel, hold);
  g.gain.linearRampToValueAtTime(0, end - 0.02);
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = freq;
  osc.connect(g).connect(dest);
  osc.start(start);
  osc.stop(end);
}

// --- Drum voices ----------------------------------------------------------

function playKick(ctx: AudioContext, dest: AudioNode, time: number, vel: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(50, time + 0.12);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(0.9 * vel, time + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
  osc.connect(g).connect(dest);
  osc.start(time);
  osc.stop(time + 0.2);
}

function playNoise(
  ctx: AudioContext,
  dest: AudioNode,
  noise: AudioBuffer,
  time: number,
  cutoff: number,
  peak: number,
  decay: number,
) {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = cutoff;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(peak, time + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, time + decay);
  src.connect(hp).connect(g).connect(dest);
  src.start(time);
  src.stop(time + decay + 0.02);
}

function playSnare(ctx: AudioContext, dest: AudioNode, noise: AudioBuffer, time: number, vel: number) {
  playNoise(ctx, dest, noise, time, 1500, 0.5 * vel, 0.12);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 180;
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(0.18 * vel, time + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);
  osc.connect(g).connect(dest);
  osc.start(time);
  osc.stop(time + 0.1);
}

function playClap(ctx: AudioContext, dest: AudioNode, noise: AudioBuffer, time: number, vel: number) {
  for (const off of [0, 0.012, 0.024]) playNoise(ctx, dest, noise, time + off, 1000, 0.4 * vel, 0.05);
  playNoise(ctx, dest, noise, time + 0.03, 1000, 0.3 * vel, 0.12);
}

function playRim(ctx: AudioContext, dest: AudioNode, noise: AudioBuffer, time: number, vel: number) {
  playNoise(ctx, dest, noise, time, 2000, 0.35 * vel, 0.03);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 400;
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(0.3 * vel, time + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);
  osc.connect(g).connect(dest);
  osc.start(time);
  osc.stop(time + 0.04);
}

function playRide(ctx: AudioContext, dest: AudioNode, noise: AudioBuffer, time: number, vel: number) {
  playNoise(ctx, dest, noise, time, 5000, 0.1 * vel, 0.3);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = 520;
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(0.05 * vel, time + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);
  osc.connect(g).connect(dest);
  osc.start(time);
  osc.stop(time + 0.27);
}

function playTom(
  ctx: AudioContext,
  dest: AudioNode,
  tom: "hi" | "mid" | "lo",
  time: number,
  vel: number,
) {
  const f0 = tom === "hi" ? 220 : tom === "mid" ? 160 : 110;
  const f1 = tom === "hi" ? 140 : tom === "mid" ? 100 : 70;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.frequency.setValueAtTime(f0, time);
  osc.frequency.exponentialRampToValueAtTime(f1, time + 0.2);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(0.7 * vel, time + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);
  osc.connect(g).connect(dest);
  osc.start(time);
  osc.stop(time + 0.27);
}

function scheduleDrums(
  ctx: AudioContext,
  dest: AudioNode,
  noise: AudioBuffer,
  pattern: Exclude<DrumId, "none">,
  eighth: number,
  isLoopStart: boolean,
  isFillBar: boolean,
  time: number,
  vel: number,
) {
  const p = DRUM_PATTERNS[pattern];
  if (p.crashFirst && isLoopStart && eighth === 0) {
    playNoise(ctx, dest, noise, time, 3000, 0.35 * vel, 1.0); // crash cymbal
  }
  // A tom fill takes over the second half of the loop's final bar.
  if (isFillBar && eighth >= 4) {
    const f = TOM_FILL.find((x) => x.eighth === eighth);
    if (f) playTom(ctx, dest, f.tom, time, vel);
    return;
  }
  if (p.kick?.includes(eighth)) playKick(ctx, dest, time, vel);
  if (p.snare?.includes(eighth)) playSnare(ctx, dest, noise, time, vel);
  if (p.clap?.includes(eighth)) playClap(ctx, dest, noise, time, vel);
  if (p.rim?.includes(eighth)) playRim(ctx, dest, noise, time, vel);
  if (p.hat?.includes(eighth)) playNoise(ctx, dest, noise, time, 7000, (eighth % 2 ? 0.16 : 0.24) * vel, 0.03);
  if (p.openhat?.includes(eighth)) playNoise(ctx, dest, noise, time, 6000, 0.2 * vel, 0.18);
  if (p.ride?.includes(eighth)) playRide(ctx, dest, noise, time, (eighth % 2 ? 0.7 : 1) * vel);
}

function makeNoise(ctx: AudioContext): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

// --- Hook -----------------------------------------------------------------

export type BackingTrack = {
  running: boolean;
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
  swing: number; // 0..60 (% of an eighth note)
  mix: Mix;
}): BackingTrack {
  const [running, setRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const noiseRef = useRef<AudioBuffer | null>(null);
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
  const soundRef = useRef(opts.sound);
  const feelRef = useRef(opts.feel);
  const drumsRef = useRef(opts.drums);
  const swingRef = useRef(opts.swing);
  const mixRef = useRef(opts.mix);
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
    soundRef.current = opts.sound;
  }, [opts.sound]);
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

  const start = useCallback(() => {
    if (runningRef.current) return;
    if (chordsRef.current.length === 0) return;
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") ctx.resume();
    if (!masterRef.current) {
      const master = ctx.createGain();
      master.gain.value = 0.8;
      // A gentle limiter glues the mix and keeps the fuller kit from clipping.
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp);
      comp.connect(ctx.destination);
      masterRef.current = master;
    }
    if (!noiseRef.current) noiseRef.current = makeNoise(ctx);
    const master = masterRef.current;
    const noise = noiseRef.current;
    runningRef.current = true;
    indexRef.current = 0;
    stepInChordRef.current = 0;
    nextTimeRef.current = ctx.currentTime + 0.1;
    queueRef.current = [];
    setRunning(true);

    const scheduler = () => {
      const c = ctxRef.current;
      if (!c || !master || !noise) return;
      while (nextTimeRef.current < c.currentTime + SCHEDULE_AHEAD) {
        const chords = chordsRef.current;
        if (chords.length === 0) break;
        const beat = 60 / bpmRef.current;
        const stepDur = beat / 2; // eighth note
        const bars = barsRef.current;
        const stepsPerChord = bars * EIGHTHS_PER_BAR;
        const step = stepInChordRef.current;
        const eighth = step % EIGHTHS_PER_BAR;
        const index = indexRef.current % chords.length;
        const chord = chords[index];
        const gridTime = nextTimeRef.current;
        // Swing pushes the off-beat eighths later for a looser groove.
        const time = eighth % 2 === 1 ? gridTime + (swingRef.current / 100) * stepDur : gridTime;
        const mix = mixRef.current;
        const sound = soundRef.current;

        if (step === 0) queueRef.current.push({ index, time: gridTime });

        const playChord = (t: number, dur: number, vel: number) => {
          for (const pc of chord.pcs) voiceNote(c, master, midiToFreq(60 + pc), t, dur, sound, vel);
        };

        // Chord comping
        if (mix.chords > 0) {
          const feel = feelRef.current;
          if (feel === "sustained") {
            if (step === 0) playChord(gridTime, stepsPerChord * stepDur, mix.chords);
          } else if (feel === "pulse") {
            if (eighth % 2 === 0) playChord(time, beat * 0.9, mix.chords);
          } else if (feel === "strum") {
            const sv = STRUM[eighth];
            if (sv) playChord(time, stepDur * 1.6, mix.chords * sv);
          } else if (feel === "offbeat") {
            if (eighth % 2 === 1) playChord(time, stepDur * 0.6, mix.chords);
          } else {
            // arpeggio — one tone per eighth, climbing an octave each pass
            const n = chord.pcs.length;
            const pc = chord.pcs[step % n];
            const oct = Math.floor(step / n) % 2 ? 12 : 0;
            voiceNote(c, master, midiToFreq(60 + pc + oct), time, stepDur * 0.9, sound, mix.chords);
          }
        }

        // Bass — root on beat 1, fifth on beat 3
        if (mix.bass > 0) {
          if (eighth === 0) {
            voiceBass(c, master, midiToFreq(36 + chord.pcs[0]), gridTime, beat * 2 * 0.95, mix.bass);
          } else if (eighth === 4) {
            voiceBass(c, master, midiToFreq(36 + (chord.pcs[2] ?? chord.pcs[0])), gridTime, beat * 2 * 0.95, mix.bass);
          }
        }

        // Drums
        if (mix.drums > 0 && drumsRef.current !== "none") {
          const bar = Math.floor(step / EIGHTHS_PER_BAR);
          const loopBars = chords.length * bars;
          const isLoopStart = index === 0 && bar === 0;
          const isFillBar = loopBars >= 2 && index === chords.length - 1 && bar === bars - 1;
          scheduleDrums(c, master, noise, drumsRef.current, eighth, isLoopStart, isFillBar, time, mix.drums);
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
    queueRef.current = [];
    setRunning(false);
    setCurrentIndex(-1);
  }, []);

  const toggle = useCallback(() => {
    if (runningRef.current) stop();
    else start();
  }, [start, stop]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      ctxRef.current?.close();
    };
  }, []);

  return { running, currentIndex, toggle };
}
