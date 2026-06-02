// Chromatic mic tuner engine (Phase 6c). Client-only — getUserMedia + the Web
// Audio API. Each animation frame we pull time-domain samples from an
// AnalyserNode and find the fundamental via autocorrelation (the classic ACF2+
// from Chris Wilson's PitchDetect), then convert that to the nearest note and a
// cents offset against a configurable A4 reference.

import { useCallback, useEffect, useRef, useState } from "react";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FFT_SIZE = 2048;
const RMS_FLOOR = 0.01; // below this the input is treated as silence
const HOLD_S = 0.4; // keep the last note on screen this long after sound stops

// Returns the detected fundamental in Hz, or -1 when there's no clear pitch.
function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < RMS_FLOOR) return -1;

  // Trim leading/trailing quiet samples so correlation focuses on the signal.
  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }

  const trimmed = buf.subarray(r1, r2);
  const n = trimmed.length;
  if (n < 2) return -1;

  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n - i; j++) sum += trimmed[j] * trimmed[j + i];
    c[i] = sum;
  }

  // Walk past the initial downslope, then take the highest peak after it.
  let d = 0;
  while (d < n - 1 && c[d] > c[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < n; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  if (maxpos <= 0) return -1;

  // Parabolic interpolation around the peak for sub-sample accuracy.
  let T0 = maxpos;
  if (maxpos > 0 && maxpos < n - 1) {
    const x1 = c[maxpos - 1];
    const x2 = c[maxpos];
    const x3 = c[maxpos + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = maxpos - b / (2 * a);
  }
  return T0 > 0 ? sampleRate / T0 : -1;
}

export type TunerReading = {
  note: string; // e.g. "A"
  octave: number; // scientific-pitch octave (A4 = 440)
  cents: number; // signed offset from the nearest note, roughly -50..+50
  frequency: number; // detected Hz
};

export type Tuner = {
  listening: boolean;
  reading: TunerReading | null;
  error: string | null;
  a4: number;
  setA4: (hz: number) => void;
  start: () => Promise<void>;
  stop: () => void;
  toggle: () => void;
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function useTuner(initialA4 = 440): Tuner {
  const [listening, setListening] = useState(false);
  const [reading, setReading] = useState<TunerReading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [a4, setA4State] = useState(initialA4);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufRef = useRef<Float32Array<ArrayBuffer>>(new Float32Array(FFT_SIZE));
  const rafRef = useRef<number | null>(null);
  const listeningRef = useRef(false);

  const a4Ref = useRef(a4);
  useEffect(() => {
    a4Ref.current = a4;
  }, [a4]);

  // Per-note state for smoothing the needle and a short fade-out hold.
  const lastMidiRef = useRef<number | null>(null);
  const smoothCentsRef = useRef(0);
  const lastSoundRef = useRef(0);
  const pushedRef = useRef<TunerReading | null>(null);

  const setA4 = useCallback((hz: number) => setA4State(clamp(Math.round(hz), 415, 466)), []);

  const start = useCallback(async () => {
    if (listeningRef.current) return;
    try {
      // Disable browser DSP — it warps the signal and throws off pitch detection.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false },
      });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      source.connect(analyser);
      sourceRef.current = source;
      analyserRef.current = analyser;
      bufRef.current = new Float32Array(analyser.fftSize);
      lastSoundRef.current = ctx.currentTime;
      listeningRef.current = true;
      setError(null);
      setListening(true);

      // Each frame: detect the pitch and update the reading (smoothed per note).
      const tick = () => {
        const c = ctxRef.current;
        const an = analyserRef.current;
        if (!c || !an) return;
        an.getFloatTimeDomainData(bufRef.current);
        const freq = autoCorrelate(bufRef.current, c.sampleRate);

        if (freq > 0) {
          const midi = Math.round(12 * Math.log2(freq / a4Ref.current) + 69);
          const refFreq = a4Ref.current * Math.pow(2, (midi - 69) / 12);
          const rawCents = 1200 * Math.log2(freq / refFreq);
          // Smooth the cents within a held note; snap on a note change.
          if (midi === lastMidiRef.current) {
            smoothCentsRef.current = smoothCentsRef.current * 0.7 + rawCents * 0.3;
          } else {
            smoothCentsRef.current = rawCents;
            lastMidiRef.current = midi;
          }
          lastSoundRef.current = c.currentTime;

          const next: TunerReading = {
            note: NOTE_NAMES[((midi % 12) + 12) % 12],
            octave: Math.floor(midi / 12) - 1,
            cents: Math.round(smoothCentsRef.current),
            frequency: Math.round(freq * 10) / 10,
          };
          const prev = pushedRef.current;
          // Skip re-renders when nothing meaningful changed.
          if (
            !prev ||
            prev.note !== next.note ||
            prev.octave !== next.octave ||
            prev.cents !== next.cents ||
            Math.abs(prev.frequency - next.frequency) >= 0.3
          ) {
            pushedRef.current = next;
            setReading(next);
          }
        } else if (c.currentTime - lastSoundRef.current > HOLD_S && pushedRef.current) {
          pushedRef.current = null;
          lastMidiRef.current = null;
          setReading(null);
        }

        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      setError(
        name === "NotAllowedError"
          ? "Microphone access was blocked — allow it in your browser, then start again."
          : name === "NotFoundError"
            ? "No microphone was found."
            : "Couldn't access the microphone.",
      );
    }
  }, []);

  const stop = useCallback(() => {
    listeningRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close();
    ctxRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    lastMidiRef.current = null;
    pushedRef.current = null;
    setListening(false);
    setReading(null);
  }, []);

  const toggle = useCallback(() => {
    if (listeningRef.current) stop();
    else start();
  }, [start, stop]);

  // Release the mic and audio context on unmount.
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      ctxRef.current?.close();
    };
  }, []);

  return { listening, reading, error, a4, setA4, start, stop, toggle };
}
