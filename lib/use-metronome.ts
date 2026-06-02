// Metronome audio engine (Phase 6). Client-only — uses the Web Audio API.
// setInterval drifts, so we schedule each click slightly ahead against the
// audio clock (the "A Tale of Two Clocks" lookahead pattern) and drive the
// visual beat from a rAF loop reading that same clock.

import { useCallback, useEffect, useRef, useState } from "react";

const LOOKAHEAD_MS = 25; // how often the scheduler wakes
const SCHEDULE_AHEAD = 0.1; // seconds of audio queued in advance

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function scheduleClick(ctx: AudioContext, time: number, accent: boolean) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = accent ? 1500 : 1000; // downbeat sits higher
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(accent ? 0.6 : 0.4, time + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
  osc.connect(gain).connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.06);
}

export type Metronome = {
  running: boolean;
  bpm: number;
  beatsPerBar: number;
  currentBeat: number; // -1 when stopped, else 0..beatsPerBar-1
  setBpm: (n: number) => void;
  setBeatsPerBar: (n: number) => void;
  toggle: () => void;
};

export function useMetronome(initialBpm = 100, initialBeats = 4): Metronome {
  const [running, setRunning] = useState(false);
  const [bpm, setBpmState] = useState(initialBpm);
  const [beatsPerBar, setBeatsState] = useState(initialBeats);
  const [currentBeat, setCurrentBeat] = useState(-1);

  const ctxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const beatRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const queueRef = useRef<{ beat: number; time: number }[]>([]);
  const runningRef = useRef(false);
  // The scheduler runs imperatively, so it reads tempo/meter from refs.
  const bpmRef = useRef(bpm);
  const beatsRef = useRef(beatsPerBar);
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);
  useEffect(() => {
    beatsRef.current = beatsPerBar;
  }, [beatsPerBar]);

  const setBpm = useCallback((n: number) => setBpmState(clamp(Math.round(n), 40, 240)), []);
  const setBeatsPerBar = useCallback((n: number) => setBeatsState(clamp(n, 1, 12)), []);

  const start = useCallback(() => {
    if (runningRef.current) return;
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") ctx.resume();
    runningRef.current = true;
    beatRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime + 0.06;
    queueRef.current = [];
    setRunning(true);

    const scheduler = () => {
      const c = ctxRef.current;
      if (!c) return;
      while (nextNoteTimeRef.current < c.currentTime + SCHEDULE_AHEAD) {
        const beat = beatRef.current;
        const time = nextNoteTimeRef.current;
        scheduleClick(c, time, beat === 0);
        queueRef.current.push({ beat, time });
        nextNoteTimeRef.current += 60 / bpmRef.current;
        beatRef.current = (beat + 1) % beatsRef.current;
      }
    };
    scheduler();
    timerRef.current = window.setInterval(scheduler, LOOKAHEAD_MS);

    // Light the visual beat the moment its scheduled audio time arrives.
    const draw = () => {
      const c = ctxRef.current;
      if (!c) return;
      const q = queueRef.current;
      while (q.length && q[0].time <= c.currentTime) {
        setCurrentBeat(q[0].beat);
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
    setCurrentBeat(-1);
  }, []);

  const toggle = useCallback(() => {
    if (runningRef.current) stop();
    else start();
  }, [start, stop]);

  // Tear down the audio context and timers on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      ctxRef.current?.close();
    };
  }, []);

  return { running, bpm, beatsPerBar, currentBeat, setBpm, setBeatsPerBar, toggle };
}
