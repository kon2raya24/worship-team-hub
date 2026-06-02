// Backing-track engine (Phase 6). Client-only — Web Audio API.
// A small groove machine: loops a chord progression with a selectable
// instrument sound, rhythmic feel, swing, synthesized drums, and a per-part
// mix. Same drift-free lookahead scheduler as the metronome, stepping at the
// eighth note so drums and rhythmic comping land in time.

import { useCallback, useEffect, useRef, useState } from "react";

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.2;
const EIGHTHS_PER_BAR = 8; // 4/4

export type SoundId = "pad" | "epiano" | "organ" | "pluck" | "strings" | "synth";
export type FeelId = "sustained" | "pulse" | "arpeggio" | "strum" | "offbeat";
export type DrumId = "none" | "pop" | "rock" | "ballad" | "funk" | "dance" | "halftime";
export type TrackChord = { pcs: number[] }; // triad pitch classes; pcs[0]=root, pcs[2]=fifth
export type Mix = { chords: number; bass: number; drums: number };

const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// Kick/snare/hat hit positions, as eighth-note indexes within a 4/4 bar.
const DRUM_PATTERNS: Record<
  Exclude<DrumId, "none">,
  { kick: number[]; snare: number[]; hat: number[] }
> = {
  pop: { kick: [0, 4], snare: [2, 6], hat: [0, 1, 2, 3, 4, 5, 6, 7] },
  rock: { kick: [0, 4, 5], snare: [2, 6], hat: [0, 1, 2, 3, 4, 5, 6, 7] },
  ballad: { kick: [0], snare: [4], hat: [0, 2, 4, 6] },
  funk: { kick: [0, 3, 4, 6], snare: [2, 6], hat: [0, 1, 2, 3, 4, 5, 6, 7] },
  dance: { kick: [0, 2, 4, 6], snare: [2, 6], hat: [1, 3, 5, 7] },
  halftime: { kick: [0], snare: [4], hat: [0, 1, 2, 3, 4, 5, 6, 7] },
};

// Strum velocity per eighth — strong downbeats, lighter up-strokes on the "ands".
const STRUM: Record<number, number> = { 0: 1, 2: 0.7, 3: 0.55, 4: 1, 6: 0.7, 7: 0.55 };

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

  // Sustained-envelope timbres (attack → hold → release).
  const sustainVoice = (
    attack: number,
    peak: number,
    cutoff: number,
    type: OscillatorType,
    detunes: number[],
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
    for (const detune of detunes) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(start);
      osc.stop(end);
    }
  };

  if (sound === "pad") return sustainVoice(0.06, 0.1, 1400, "triangle", [-7, 7]);
  if (sound === "strings") return sustainVoice(0.15, 0.07, 1500, "sawtooth", [-10, 0, 10]);
  if (sound === "synth") return sustainVoice(0.02, 0.08, 2600, "sawtooth", [-6, 6]);

  if (sound === "organ") {
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

  // epiano / pluck — a struck note: fast attack, exponential decay.
  const peak = (sound === "epiano" ? 0.2 : 0.18) * vel;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  if (sound === "epiano") {
    const o1 = ctx.createOscillator();
    o1.type = "sine";
    o1.frequency.value = freq;
    o1.connect(g);
    const o2 = ctx.createOscillator();
    o2.type = "sine";
    o2.frequency.value = freq * 2;
    const o2g = ctx.createGain();
    o2g.gain.value = 0.4;
    o2.connect(o2g).connect(g);
    o1.start(start);
    o1.stop(end);
    o2.start(start);
    o2.stop(end);
  } else {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2000;
    filter.connect(g);
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    osc.connect(filter);
    osc.start(start);
    osc.stop(end);
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

function scheduleDrums(
  ctx: AudioContext,
  dest: AudioNode,
  noise: AudioBuffer,
  pattern: Exclude<DrumId, "none">,
  eighth: number,
  time: number,
  vel: number,
) {
  const p = DRUM_PATTERNS[pattern];
  if (p.kick.includes(eighth)) playKick(ctx, dest, time, vel);
  if (p.snare.includes(eighth)) playNoise(ctx, dest, noise, time, 1500, 0.5 * vel, 0.12);
  if (p.hat.includes(eighth)) playNoise(ctx, dest, noise, time, 7000, (eighth % 2 ? 0.18 : 0.26) * vel, 0.03);
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
      master.connect(ctx.destination);
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
          scheduleDrums(c, master, noise, drumsRef.current, eighth, time, mix.drums);
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
