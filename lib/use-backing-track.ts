// Backing-track engine (Phase 6). Client-only — Web Audio API.
// Loops a chord progression as a soft pad + bass (+ optional click) so a player
// can solo over it. Same drift-free lookahead scheduler as the metronome, but
// at chord-duration granularity: each chord is one sustained pad with an
// attack/release envelope, scheduled slightly ahead against the audio clock.

import { useCallback, useEffect, useRef, useState } from "react";

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.2; // seconds queued ahead (a chord can be ~2-3s long)
const BEATS_PER_BAR = 4;

export type TrackChord = { pcs: number[]; bassPc: number };

const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

function schedulePad(
  ctx: AudioContext,
  master: AudioNode,
  chord: TrackChord,
  start: number,
  dur: number,
) {
  const end = start + dur;
  const hold = Math.max(start + 0.05, end - 0.18); // start the release before the chord ends

  // Pad: detuned triangles through a lowpass, clustered around C4.
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1800;
  const padGain = ctx.createGain();
  padGain.gain.setValueAtTime(0, start);
  padGain.gain.linearRampToValueAtTime(0.1, start + 0.04);
  padGain.gain.setValueAtTime(0.1, hold);
  padGain.gain.linearRampToValueAtTime(0, end - 0.02);
  filter.connect(padGain).connect(master);
  for (const pc of chord.pcs) {
    for (const detune of [-7, 7]) {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = midiToFreq(60 + pc);
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(start);
      osc.stop(end);
    }
  }

  // Bass: a clean sine, two octaves below the pad.
  const bassGain = ctx.createGain();
  bassGain.gain.setValueAtTime(0, start);
  bassGain.gain.linearRampToValueAtTime(0.2, start + 0.03);
  bassGain.gain.setValueAtTime(0.2, hold);
  bassGain.gain.linearRampToValueAtTime(0, end - 0.02);
  const bass = ctx.createOscillator();
  bass.type = "sine";
  bass.frequency.value = midiToFreq(36 + chord.bassPc);
  bass.connect(bassGain).connect(master);
  bass.start(start);
  bass.stop(end);
}

function scheduleClick(ctx: AudioContext, master: AudioNode, time: number, accent: boolean) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = accent ? 1600 : 1100;
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(accent ? 0.25 : 0.16, time + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
  osc.connect(gain).connect(master);
  osc.start(time);
  osc.stop(time + 0.05);
}

export type BackingTrack = {
  running: boolean;
  currentIndex: number; // -1 when stopped, else index into the progression
  toggle: () => void;
};

export function useBackingTrack(opts: {
  chords: TrackChord[];
  bpm: number;
  barsPerChord: number;
  click: boolean;
}): BackingTrack {
  const [running, setRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const nextTimeRef = useRef(0);
  const indexRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const queueRef = useRef<{ index: number; time: number }[]>([]);
  const runningRef = useRef(false);
  // The scheduler is imperative, so it reads inputs from refs synced below.
  const chordsRef = useRef(opts.chords);
  const bpmRef = useRef(opts.bpm);
  const barsRef = useRef(opts.barsPerChord);
  const clickRef = useRef(opts.click);
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
    clickRef.current = opts.click;
  }, [opts.click]);

  const start = useCallback(() => {
    if (runningRef.current) return;
    if (chordsRef.current.length === 0) return;
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") ctx.resume();
    if (!masterRef.current) {
      const master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
      masterRef.current = master;
    }
    const master = masterRef.current;
    runningRef.current = true;
    indexRef.current = 0;
    nextTimeRef.current = ctx.currentTime + 0.1;
    queueRef.current = [];
    setRunning(true);

    const scheduler = () => {
      const c = ctxRef.current;
      if (!c || !master) return;
      while (nextTimeRef.current < c.currentTime + SCHEDULE_AHEAD) {
        const chords = chordsRef.current;
        if (chords.length === 0) break;
        const beat = 60 / bpmRef.current;
        const bars = barsRef.current;
        const dur = bars * BEATS_PER_BAR * beat;
        const index = indexRef.current % chords.length;
        const time = nextTimeRef.current;
        schedulePad(c, master, chords[index], time, dur);
        if (clickRef.current) {
          for (let b = 0; b < bars * BEATS_PER_BAR; b++) {
            scheduleClick(c, master, time + b * beat, b % BEATS_PER_BAR === 0);
          }
        }
        queueRef.current.push({ index, time });
        nextTimeRef.current += dur;
        indexRef.current = (index + 1) % chords.length;
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
