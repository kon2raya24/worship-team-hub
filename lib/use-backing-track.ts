// Backing-track engine (Phase 6). Client-only — Web Audio API + smplr samples.
// Chords (one OR MORE layered instruments), bass, and drums all play real
// samples. Each chord instrument has its own channel strip (volume / octave /
// attack / release / tone / reverb / pan). The drift-free lookahead scheduler
// steps at the eighth note so everything lands in time.

import { useCallback, useEffect, useRef, useState } from "react";
import type { DrumMachine, Soundfont } from "smplr";

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.2;
const EIGHTHS: Record<MeterId, number> = { "4/4": 8, "6/8": 6 };

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
export type MeterId = "4/4" | "6/8";
export type DrumId =
  | "none"
  | "pop"
  | "rock"
  | "ballad"
  | "funk"
  | "dance"
  | "halftime"
  | "ride"
  | "bossa"
  | "gospel"
  | "motown" // extra 4/4 grooves
  | "march"
  | "swing"; // 6/8 grooves
export type DrumPiece =
  | "kick"
  | "snare"
  | "hatClosed"
  | "hatOpen"
  | "crash"
  | "ride"
  | "clap"
  | "rim"
  | "tom";
export type DrumMixEntry = { volume: number; enabled: boolean }; // volume 0..100
export type DrumMix = Record<DrumPiece, DrumMixEntry>;
export type TrackChord = { pcs: number[]; bass?: number }; // triad pcs; bass = slash bass pitch class
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
export type ActiveInstrument = { id: SoundId; settings: InstSettings };

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
const STRUM_44: Record<number, number> = { 0: 1, 2: 0.7, 3: 0.55, 4: 1, 6: 0.7, 7: 0.55 };
// 6/8 lilts in two: accent the two dotted-quarter pulses (0 and 3).
const STRUM_68: Record<number, number> = { 0: 1, 1: 0.4, 2: 0.5, 3: 0.85, 4: 0.4, 5: 0.5 };

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
// 4/4 grooves (eighth-note grid, indices 0..7).
const DRUM_PATTERNS: Record<string, DrumPattern> = {
  pop: { kick: [0, 4], snare: [2, 6], hat: [0, 1, 2, 3, 4, 5, 6, 7], crashFirst: true },
  rock: { kick: [0, 4, 5], snare: [2, 6], hat: [0, 1, 2, 3, 4, 5, 6, 7], openhat: [7], crashFirst: true },
  ballad: { kick: [0], snare: [4], hat: [0, 2, 4, 6], crashFirst: true },
  funk: { kick: [0, 3, 4, 6], snare: [2, 6], hat: [0, 1, 2, 3, 4, 5, 6, 7], rim: [5] },
  dance: { kick: [0, 2, 4, 6], snare: [2, 6], clap: [2, 6], openhat: [1, 3, 5, 7], crashFirst: true },
  halftime: { kick: [0, 5], snare: [4], hat: [0, 1, 2, 3, 4, 5, 6, 7], crashFirst: true },
  ride: { kick: [0, 4], snare: [2, 6], ride: [0, 1, 2, 3, 4, 5, 6, 7], crashFirst: true },
  bossa: { kick: [0, 3, 4, 7], hat: [0, 1, 2, 3, 4, 5, 6, 7], rim: [2, 6] },
  gospel: { kick: [0, 3, 4, 6], snare: [2, 6], hat: [0, 1, 2, 3, 4, 5, 6, 7], openhat: [7], crashFirst: true },
  motown: { kick: [0, 4], snare: [0, 2, 4, 6], hat: [0, 1, 2, 3, 4, 5, 6, 7], crashFirst: true },
};
// 6/8 grooves (eighth-note grid, indices 0..5; felt in two pulses on 0 and 3).
const DRUM_PATTERNS_68: Record<string, DrumPattern> = {
  ballad: { kick: [0], snare: [3], hat: [0, 1, 2, 3, 4, 5], crashFirst: true },
  rock: { kick: [0, 3], snare: [3], hat: [0, 1, 2, 3, 4, 5], openhat: [5], crashFirst: true },
  march: { kick: [0, 3], snare: [3], hat: [0, 2, 3, 5], crashFirst: true },
  swing: { kick: [0, 3], snare: [3], ride: [0, 2, 3, 5], crashFirst: true },
};
type TomFillStep = { eighth: number; tom: "hi" | "mid" | "lo" };
const TOM_FILL_44: TomFillStep[] = [
  { eighth: 4, tom: "hi" },
  { eighth: 5, tom: "hi" },
  { eighth: 6, tom: "mid" },
  { eighth: 7, tom: "lo" },
];
const TOM_FILL_68: TomFillStep[] = [
  { eighth: 3, tom: "hi" },
  { eighth: 4, tom: "mid" },
  { eighth: 5, tom: "lo" },
];

// Map a kit's actual sample-group names to our logical voices. Names vary per
// kit (e.g. "hihat-close" / "hhclosed", "cymbal" / "crash"), so match loosely.
type DrumMap = {
  kick?: string;
  snare?: string;
  hatClosed?: string;
  hatOpen?: string;
  crash?: string;
  ride?: string;
  clap?: string;
  rim?: string;
  tomHi?: string;
  tomMid?: string;
  tomLo?: string;
};
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
    snare: find("snare", "snr"),
    hatClosed: find("close", "chh", "hhc", "hihat", "hat"),
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

type KitNode = { dm: DrumMachine; map: DrumMap };

function scheduleDrums(
  kits: Map<string, KitNode>,
  pieceKits: Record<DrumPiece, string>,
  drumMix: DrumMix,
  table: Record<string, DrumPattern>,
  fill: TomFillStep[],
  fillFrom: number,
  pattern: DrumId,
  eighth: number,
  isLoopStart: boolean,
  isFillBar: boolean,
  time: number,
  vel: number,
) {
  const p = table[pattern];
  if (!p) return;
  // Each piece is gated by its own enable + volume, and plays from its own kit.
  const hit = (piece: DrumPiece, voice: keyof DrumMap, accent: number) => {
    const m = drumMix[piece];
    if (!m || !m.enabled) return;
    const kit = kits.get(pieceKits[piece]);
    const sample = kit?.map[voice];
    if (!kit || !sample) return;
    kit.dm.start({ note: sample, time, velocity: clamp(Math.round(127 * vel * accent * (m.volume / 100)), 1, 127) });
  };
  if (p.crashFirst && isLoopStart && eighth === 0) hit("crash", "crash", 0.9);
  if (isFillBar && eighth >= fillFrom) {
    const f = fill.find((x) => x.eighth === eighth);
    if (f) hit("tom", f.tom === "hi" ? "tomHi" : f.tom === "mid" ? "tomMid" : "tomLo", 0.95);
    return;
  }
  if (p.kick?.includes(eighth)) hit("kick", "kick", 1);
  if (p.snare?.includes(eighth)) hit("snare", "snare", 1);
  if (p.clap?.includes(eighth)) hit("clap", "clap", 0.9);
  if (p.rim?.includes(eighth)) hit("rim", "rim", 0.8);
  if (p.hat?.includes(eighth)) hit("hatClosed", "hatClosed", eighth % 2 ? 0.6 : 0.85);
  if (p.openhat?.includes(eighth)) hit("hatOpen", "hatOpen", 0.8);
  if (p.ride?.includes(eighth)) hit("ride", "ride", eighth % 2 ? 0.6 : 0.85);
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

type InstNode = { inst: Soundfont; bus: GainNode; reverbSend: GainNode };

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
  instruments: ActiveInstrument[];
  feel: FeelId;
  meter: MeterId;
  drums: DrumId;
  pieceKits: Record<DrumPiece, string>;
  drumMix: DrumMix;
  swing: number;
  mix: Mix;
}): BackingTrack {
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const convolverRef = useRef<ConvolverNode | null>(null);
  const bassInstRef = useRef<Soundfont | null>(null);
  // One loaded DrumMachine per distinct kit name in use across the pieces.
  const kitsRef = useRef<Map<string, KitNode>>(new Map());
  const pendingKitsRef = useRef<Set<string>>(new Set());

  // One sampled instrument per active layer, plus its routing nodes.
  const nodesRef = useRef<Map<SoundId, InstNode>>(new Map());
  const pendingRef = useRef<Set<SoundId>>(new Set());
  const activeIdsRef = useRef<SoundId[]>([]);
  const settingsRef = useRef<Record<string, InstSettings>>({});

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
  const meterRef = useRef(opts.meter);
  const drumsRef = useRef(opts.drums);
  const pieceKitsRef = useRef(opts.pieceKits);
  const drumMixRef = useRef(opts.drumMix);
  const swingRef = useRef(opts.swing);
  const mixRef = useRef(opts.mix);
  useEffect(() => {
    chordsRef.current = opts.chords;
  }, [opts.chords]);
  useEffect(() => {
    meterRef.current = opts.meter;
  }, [opts.meter]);
  useEffect(() => {
    pieceKitsRef.current = opts.pieceKits;
  }, [opts.pieceKits]);
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
    drumMixRef.current = opts.drumMix;
  }, [opts.drumMix]);
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
    const convolver = ctx.createConvolver();
    convolver.buffer = makeImpulse(ctx);
    convolver.connect(master);
    convolverRef.current = convolver;

    let disposed = false;
    import("smplr").then(({ Soundfont }) => {
      if (disposed) return;
      const bass = Soundfont(ctx, { instrument: BASS_GM, destination: master });
      bass.ready.then(() => {
        if (!disposed) bassInstRef.current = bass;
      });
    });

    const nodes = nodesRef.current;
    const kits = kitsRef.current;
    const pendingKits = pendingKitsRef.current;
    return () => {
      disposed = true;
      if (timerRef.current !== null) clearInterval(timerRef.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      nodes.forEach((n) => n.inst.dispose());
      nodes.clear();
      bassInstRef.current?.dispose();
      kits.forEach((k) => k.dm.dispose());
      kits.clear();
      pendingKits.clear();
      ctx.close();
    };
  }, []);

  // Load a DrumMachine for every distinct kit the pieces reference; drop any
  // kit no piece uses any more. The captured (per-mount) ctx is the lifecycle
  // guard — it goes "closed" on unmount, so in-flight loads bail cleanly.
  useEffect(() => {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;
    const kits = kitsRef.current;
    const needed = new Set(Object.values(opts.pieceKits));

    needed.forEach((kitName) => {
      if (kits.has(kitName) || pendingKitsRef.current.has(kitName)) return;
      pendingKitsRef.current.add(kitName);
      import("smplr").then(({ DrumMachine }) => {
        if (ctx.state === "closed") {
          pendingKitsRef.current.delete(kitName);
          return;
        }
        const dm = DrumMachine(ctx, { instrument: kitName, destination: master });
        dm.ready.then(() => {
          pendingKitsRef.current.delete(kitName);
          const stillNeeded = new Set(Object.values(pieceKitsRef.current)).has(kitName);
          if (ctx.state === "closed" || !stillNeeded || kits.has(kitName)) {
            dm.dispose();
            return;
          }
          // Map against full sample names ("hihat-close", "tom-hi") — group names
          // are split on -/ and collapse closed/open hats and all toms together.
          kits.set(kitName, { dm, map: mapKit(dm.getSampleNames()) });
        });
      });
    });

    for (const name of [...kits.keys()]) {
      if (!needed.has(name)) {
        kits.get(name)!.dm.dispose();
        kits.delete(name);
      }
    }
  }, [opts.pieceKits]);

  // Reconcile the loaded instruments with the active layer set, and apply each
  // layer's live channel-strip settings.
  useEffect(() => {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    const convolver = convolverRef.current;
    if (!ctx || !master || !convolver) return;
    const nodes = nodesRef.current;

    const active = opts.instruments.map((i) => i.id);
    activeIdsRef.current = active;
    const sm: Record<string, InstSettings> = {};
    opts.instruments.forEach((i) => {
      sm[i.id] = i.settings;
    });
    settingsRef.current = sm;

    const recomputeLoading = () =>
      setLoading(active.length === 0 || active.some((id) => !nodes.has(id)));

    const applySettings = (id: SoundId) => {
      const node = nodes.get(id);
      const s = sm[id];
      if (!node || !s) return;
      node.inst.output.volume = Math.round(127 * (s.volume / 100));
      node.inst.output.pan = clamp(s.pan / 100, -1, 1);
      node.reverbSend.gain.value = (s.reverb / 100) * 0.85;
    };

    // Add newly-active instruments.
    for (const id of active) {
      if (nodes.has(id) || pendingRef.current.has(id)) {
        applySettings(id);
        continue;
      }
      pendingRef.current.add(id);
      const bus = ctx.createGain();
      bus.connect(master);
      const reverbSend = ctx.createGain();
      reverbSend.gain.value = 0;
      bus.connect(reverbSend).connect(convolver);
      import("smplr").then(({ Soundfont }) => {
        const inst = Soundfont(ctx, { instrument: GM[id], destination: bus });
        inst.ready.then(() => {
          pendingRef.current.delete(id);
          if (!activeIdsRef.current.includes(id)) {
            inst.dispose();
            bus.disconnect();
            reverbSend.disconnect();
            return;
          }
          nodes.set(id, { inst, bus, reverbSend });
          applySettings(id);
          recomputeLoading();
        });
      });
    }

    // Remove instruments no longer active.
    for (const id of [...nodes.keys()]) {
      if (!active.includes(id)) {
        const node = nodes.get(id)!;
        node.inst.dispose();
        node.bus.disconnect();
        node.reverbSend.disconnect();
        nodes.delete(id);
      }
    }

    recomputeLoading();
  }, [opts.instruments]);

  const start = useCallback(() => {
    if (runningRef.current) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    runningRef.current = true;
    indexRef.current = 0;
    stepInChordRef.current = 0;
    nextTimeRef.current = ctx.currentTime + 0.1;
    queueRef.current = [];
    setRunning(true);

    const scheduler = () => {
      const c = ctxRef.current;
      if (!c) return;
      const nodes = nodesRef.current;
      while (nextTimeRef.current < c.currentTime + SCHEDULE_AHEAD) {
        const chords = chordsRef.current;
        if (chords.length === 0) break;
        const meter = meterRef.current;
        const eighthsPerBar = EIGHTHS[meter];
        const beat = 60 / bpmRef.current;
        const stepDur = beat / 2;
        const bars = barsRef.current;
        const stepsPerChord = bars * eighthsPerBar;
        const step = stepInChordRef.current;
        const eighth = step % eighthsPerBar;
        const index = indexRef.current % chords.length;
        const chord = chords[index];
        const gridTime = nextTimeRef.current;
        // 6/8 is a compound meter — its lilt comes from the grouping, not swing.
        const sw = meter === "4/4" ? swingRef.current : 0;
        const time = eighth % 2 === 1 ? gridTime + (sw / 100) * stepDur : gridTime;
        const mix = mixRef.current;
        const feel = feelRef.current;

        if (step === 0) queueRef.current.push({ index, time: gridTime });

        // Play a chord (or one arp tone) across every active layer.
        const eachLayer = (cb: (node: InstNode, s: InstSettings) => void) => {
          for (const id of activeIdsRef.current) {
            const node = nodes.get(id);
            const s = settingsRef.current[id];
            if (node && s) cb(node, s);
          }
        };
        const playChord = (t: number, dur: number, velScale: number) => {
          if (mix.chords <= 0) return;
          const velocity = clamp(Math.round(110 * mix.chords * velScale), 1, 127);
          eachLayer((node, s) => {
            const atk = toAttack(s.attack);
            if (atk > 0.02 && feel !== "arpeggio") {
              node.bus.gain.setValueAtTime(0.0001, t);
              node.bus.gain.linearRampToValueAtTime(1, t + atk);
            }
            const rel = toRelease(s.release);
            const cutoff = toCutoff(s.tone);
            const transpose = s.octave * 12;
            for (const pc of chord.pcs) {
              node.inst.start({ note: 60 + pc + transpose, time: t, duration: dur, velocity, ampRelease: rel, lpfCutoffHz: cutoff });
            }
          });
        };

        const compound = meter === "6/8";
        if (feel === "sustained") {
          if (step === 0) playChord(gridTime, stepsPerChord * stepDur, 1);
        } else if (feel === "pulse") {
          // Quarters in 4/4; the two dotted-quarter pulses (0, 3) in 6/8.
          const onPulse = compound ? eighth === 0 || eighth === 3 : eighth % 2 === 0;
          if (onPulse) playChord(time, (compound ? 3 : 2) * stepDur * 0.9, 1);
        } else if (feel === "strum") {
          const sv = (compound ? STRUM_68 : STRUM_44)[eighth];
          if (sv) playChord(time, stepDur * (compound ? 1.4 : 1.6), sv);
        } else if (feel === "offbeat") {
          const off = compound ? eighth === 2 || eighth === 5 : eighth % 2 === 1;
          if (off) playChord(time, stepDur * 0.6, 1);
        } else if (mix.chords > 0) {
          // arpeggio — one tone per eighth, climbing an octave each pass
          const n = chord.pcs.length;
          const pc = chord.pcs[step % n];
          const oct = Math.floor(step / n) % 2 ? 12 : 0;
          const velocity = clamp(Math.round(110 * mix.chords), 1, 127);
          eachLayer((node, s) => {
            node.inst.start({ note: 60 + pc + oct + s.octave * 12, time, duration: stepDur * 0.9, velocity, ampRelease: toRelease(s.release), lpfCutoffHz: toCutoff(s.tone) });
          });
        }

        // Bass — root on pulse 1, fifth on pulse 2 (eighth 4 in 4/4, eighth 3 in 6/8).
        const bass = bassInstRef.current;
        if (bass && mix.bass > 0) {
          const bvel = clamp(Math.round(110 * mix.bass), 1, 127);
          const bdur = (eighthsPerBar / 2) * stepDur * 0.95; // half a bar
          if (eighth === 0) {
            // Slash chords put a different note in the bass (e.g. D/F# → F#).
            bass.start({ note: 36 + (chord.bass ?? chord.pcs[0]), time: gridTime, duration: bdur, velocity: bvel });
          } else if (eighth === (compound ? 3 : 4)) {
            bass.start({ note: 36 + (chord.pcs[2] ?? chord.pcs[0]), time: gridTime, duration: bdur, velocity: bvel });
          }
        }

        // Drums — each piece plays from its own kit (per-piece kit selection).
        const kits = kitsRef.current;
        if (kits.size && mix.drums > 0 && drumsRef.current !== "none") {
          const bar = Math.floor(step / eighthsPerBar);
          const loopBars = chords.length * bars;
          const isLoopStart = index === 0 && bar === 0;
          const isFillBar = loopBars >= 2 && index === chords.length - 1 && bar === bars - 1;
          scheduleDrums(
            kits,
            pieceKitsRef.current,
            drumMixRef.current,
            compound ? DRUM_PATTERNS_68 : DRUM_PATTERNS,
            compound ? TOM_FILL_68 : TOM_FILL_44,
            compound ? 3 : 4,
            drumsRef.current,
            eighth,
            isLoopStart,
            isFillBar,
            time,
            mix.drums,
          );
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
    nodesRef.current.forEach((node) => {
      node.inst.stop();
      node.bus.gain.cancelScheduledValues(0);
      node.bus.gain.value = 1;
    });
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
