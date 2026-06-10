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
// pcs = chord pitch classes (bass + walk-ups read these); notes = the actual
// voiced midi notes to play (voice-led by the UI); bass = slash bass pc.
export type TrackChord = { pcs: number[]; notes?: number[]; bass?: number };
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
// Within-bar dynamics — beat 1 strongest, backbeats medium, "ands" lighter.
// Real players never hit every subdivision at the same strength.
const CONTOUR_44 = [1, 0.84, 0.92, 0.84, 0.96, 0.84, 0.9, 0.84];
const CONTOUR_68 = [1, 0.85, 0.88, 0.95, 0.85, 0.88];

// --- Energy / arrangement ------------------------------------------------
// Energy shapes the whole arrangement: how hard everything hits, which drum
// pieces play, how busy the bass line is, and whether fills happen.
type DrumDensity = "tick" | "low" | "full" | "push";
type EnergyConf = { vel: number; drums: DrumDensity; bassBusy: number; fills: boolean };
const ENERGY_CONF: EnergyConf[] = [
  { vel: 0.72, drums: "tick", bassBusy: 0, fills: false }, // sparse
  { vel: 0.85, drums: "low", bassBusy: 1, fills: false }, // groove
  { vel: 1, drums: "full", bassBusy: 2, fills: true }, // full
  { vel: 1.08, drums: "push", bassBusy: 2, fills: true }, // push
];
// Auto-build steps this arc once per pass through the progression:
// verse → build → chorus → peak → peak → drop back down, then around again.
const BUILD_ARC = [0, 1, 2, 3, 3, 1];

// --- Bass lines -----------------------------------------------------------
// Style-specific bass patterns on the eighth grid. `busy` marks pickup notes
// that only play at full bass busyness (energy ≥ full).
type BassTone = "root" | "third" | "fifth" | "octave";
type BassStep = { e: number; tone: BassTone; len: number; vel?: number; busy?: number };
const BASS_44: Record<string, BassStep[]> = {
  default: [
    { e: 0, tone: "root", len: 4 },
    { e: 4, tone: "fifth", len: 3 },
    { e: 7, tone: "octave", len: 1, vel: 0.75, busy: 2 },
  ],
  ballad: [{ e: 0, tone: "root", len: 8 }],
  pump: [
    { e: 0, tone: "root", len: 2 },
    { e: 2, tone: "root", len: 2, vel: 0.85 },
    { e: 4, tone: "root", len: 2 },
    { e: 6, tone: "root", len: 2, vel: 0.85 },
  ],
  funk: [
    { e: 0, tone: "root", len: 2 },
    { e: 3, tone: "octave", len: 1, vel: 0.85, busy: 2 },
    { e: 4, tone: "fifth", len: 2 },
    { e: 6, tone: "root", len: 1, vel: 0.9 },
    { e: 7, tone: "octave", len: 1, vel: 0.75, busy: 2 },
  ],
  disco: [
    { e: 0, tone: "root", len: 1 },
    { e: 1, tone: "octave", len: 1, vel: 0.8 },
    { e: 2, tone: "root", len: 1 },
    { e: 3, tone: "octave", len: 1, vel: 0.8 },
    { e: 4, tone: "root", len: 1 },
    { e: 5, tone: "octave", len: 1, vel: 0.8 },
    { e: 6, tone: "root", len: 1 },
    { e: 7, tone: "octave", len: 1, vel: 0.8 },
  ],
  bossa: [
    { e: 0, tone: "root", len: 3 },
    { e: 3, tone: "fifth", len: 1, vel: 0.8, busy: 2 },
    { e: 4, tone: "fifth", len: 3 },
    { e: 7, tone: "root", len: 1, vel: 0.8, busy: 2 },
  ],
  halftime: [
    { e: 0, tone: "root", len: 5 },
    { e: 5, tone: "root", len: 2, vel: 0.9 },
    { e: 7, tone: "fifth", len: 1, vel: 0.75, busy: 2 },
  ],
  motown: [
    { e: 0, tone: "root", len: 2 },
    { e: 2, tone: "third", len: 1, vel: 0.85, busy: 2 },
    { e: 3, tone: "fifth", len: 1, vel: 0.85 },
    { e: 4, tone: "octave", len: 2, vel: 0.9 },
    { e: 6, tone: "fifth", len: 2, vel: 0.85 },
  ],
};
const BASS_68: Record<string, BassStep[]> = {
  default: [
    { e: 0, tone: "root", len: 3 },
    { e: 3, tone: "fifth", len: 3 },
  ],
  ballad: [{ e: 0, tone: "root", len: 6 }],
  pump: [
    { e: 0, tone: "root", len: 2 },
    { e: 2, tone: "root", len: 1, vel: 0.8, busy: 2 },
    { e: 3, tone: "fifth", len: 2 },
    { e: 5, tone: "octave", len: 1, vel: 0.8, busy: 2 },
  ],
};
// Which bass line each drum style wants.
const BASS_FOR_DRUMS: Record<DrumId, string> = {
  none: "default",
  pop: "default",
  rock: "pump",
  ballad: "ballad",
  funk: "funk",
  dance: "disco",
  halftime: "halftime",
  ride: "default",
  bossa: "bossa",
  gospel: "funk",
  motown: "motown",
  march: "pump",
  swing: "default",
};

// --- Voicing ----------------------------------------------------------------

export type VoicingId = "close" | "smooth" | "spread";

// Voice-lead a chord sequence: pick each chord's inversion so its voices move
// minimally from the previous chord, instead of re-stacking every chord in
// the same octave (the single biggest "robotic" tell). "spread" then drops
// the lowest voice an octave for an open, pad-like spacing.
export function voiceLead(seq: number[][], mode: VoicingId): number[][] {
  if (mode === "close") return seq.map((pcs) => pcs.map((pc) => 60 + pc));
  let prev: number[] | null = null;
  return seq.map((pcs) => {
    let best: number[] = [];
    let bestScore = Infinity;
    for (let inv = 0; inv < pcs.length; inv++) {
      const order = [...pcs.slice(inv), ...pcs.slice(0, inv)];
      // First voice lands in [55, 66]; the rest stack strictly upward.
      const notes = [55 + ((((order[0] - 55) % 12) + 12) % 12)];
      for (let i = 1; i < order.length; i++) {
        const up = (((order[i] - notes[i - 1]) % 12) + 12) % 12 || 12;
        notes.push(notes[i - 1] + up);
      }
      const p = prev;
      const score = p
        ? notes.reduce((a, x) => a + Math.min(...p.map((q) => Math.abs(x - q))), 0)
        : Math.abs(notes.reduce((a, b) => a + b, 0) / notes.length - 64);
      if (score < bestScore) {
        bestScore = score;
        best = notes;
      }
    }
    prev = best;
    return mode === "spread" ? [best[0] - 12, ...best.slice(1)] : best;
  });
}

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
// The alternate fill — a snare roll building into the next section.
type SnareFillStep = { e: number; v: number };
const SNARE_FILL_44: SnareFillStep[] = [
  { e: 4, v: 0.5 },
  { e: 5, v: 0.62 },
  { e: 6, v: 0.78 },
  { e: 7, v: 0.95 },
];
const SNARE_FILL_68: SnareFillStep[] = [
  { e: 3, v: 0.55 },
  { e: 4, v: 0.72 },
  { e: 5, v: 0.92 },
];
type FillKind = "tom" | "snare" | null;

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

function scheduleDrums(o: {
  kits: Map<string, KitNode>;
  pieceKits: Record<DrumPiece, string>;
  drumMix: DrumMix;
  table: Record<string, DrumPattern>;
  tomFill: TomFillStep[];
  snareFill: SnareFillStep[];
  fillFrom: number;
  pattern: DrumId;
  eighth: number;
  crashBar: boolean;
  fillKind: FillKind;
  compound: boolean;
  density: DrumDensity;
  time: number;
  vel: number;
  h: number; // humanize amount 0..1
}) {
  const p = o.table[o.pattern];
  if (!p) return;
  const { eighth, h } = o;
  // Each piece is gated by its own enable + volume, and plays from its own kit.
  // Every hit's velocity wobbles with the humanize amount.
  const hit = (piece: DrumPiece, voice: keyof DrumMap, accent: number, t = o.time) => {
    const m = o.drumMix[piece];
    if (!m || !m.enabled) return;
    const kit = o.kits.get(o.pieceKits[piece]);
    const sample = kit?.map[voice];
    if (!kit || !sample) return;
    const wobble = 1 - Math.random() * 0.12 * h;
    kit.dm.start({ note: sample, time: t, velocity: clamp(Math.round(127 * o.vel * accent * wobble * (m.volume / 100)), 1, 127) });
  };
  // Real cymbal hands drift a few ms and never hit twice at the same strength.
  const loose = () => o.time + (Math.random() - 0.5) * 0.009 * h;
  const pulse = () => {
    const acc = (eighth % 2 ? 0.52 : 0.78) + Math.random() * 0.12 * (0.5 + h);
    if (p.hat?.includes(eighth)) hit("hatClosed", "hatClosed", acc, loose());
    if (p.ride?.includes(eighth)) hit("ride", "ride", acc, loose());
  };
  if (p.crashFirst && o.crashBar && eighth === 0) hit("crash", "crash", 0.9);
  if (o.fillKind && eighth >= o.fillFrom) {
    if (o.fillKind === "tom") {
      const f = o.tomFill.find((x) => x.eighth === eighth);
      if (f) hit("tom", f.tom === "hi" ? "tomHi" : f.tom === "mid" ? "tomMid" : "tomLo", 0.95);
    } else {
      const f = o.snareFill.find((x) => x.e === eighth);
      if (f) hit("snare", "snare", f.v);
    }
    return;
  }
  // tick = just the cymbal pulse; low = kick + sidestick backbeat until the
  // song opens up; full = the written groove; push = full + open-hat lift.
  if (o.density === "tick") {
    pulse();
    return;
  }
  if (o.density === "low") {
    if (p.kick?.includes(eighth)) hit("kick", "kick", 1);
    if (p.snare?.includes(eighth)) hit("rim", "rim", 0.85);
    pulse();
    return;
  }
  if (p.kick?.includes(eighth)) hit("kick", "kick", 1);
  if (p.snare?.includes(eighth)) hit("snare", "snare", 1);
  else if (!o.compound && (eighth === 3 || eighth === 7) && Math.random() < 0.28 * h)
    hit("snare", "snare", 0.22); // ghost note between backbeats
  if (p.clap?.includes(eighth)) hit("clap", "clap", 0.9);
  if (p.rim?.includes(eighth)) hit("rim", "rim", 0.8);
  pulse();
  if (p.openhat?.includes(eighth)) hit("hatOpen", "hatOpen", 0.8);
  else if (o.density === "push" && eighth === (o.compound ? 5 : 7))
    hit("hatOpen", "hatOpen", 0.85); // open hat lifting into the next bar
}

// One bar of metronome-style clicks before the band comes in.
function scheduleCountIn(ctx: AudioContext, dest: AudioNode, t0: number, stepDur: number, meter: MeterId) {
  const compound = meter === "6/8";
  const clicks = compound ? [0, 1, 2, 3, 4, 5] : [0, 2, 4, 6];
  const accents = compound ? [0, 3] : [0];
  for (const e of clicks) {
    const t = t0 + e * stepDur;
    const accent = accents.includes(e);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = accent ? 1500 : 1000;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.35, t + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.06);
  }
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
  energyNow: number; // energy level currently sounding (-1 when stopped)
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
  energy: number; // 0..3, used when autoBuild is off
  autoBuild: boolean; // step the BUILD_ARC each pass through the progression
  countIn: number; // bars of clicks before the band comes in (0..2)
  humanize: number; // 0..100 — timing looseness, velocity wobble, ghosts
  walkups: boolean; // bass walks chromatically into the next chord
  fillEvery: number; // a fill every N bars (0 = never)
}): BackingTrack {
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [energyNow, setEnergyNow] = useState(-1);

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
  const globalStepRef = useRef(0); // steps since play started — drives bar-level fills
  const roundRef = useRef(0); // completed passes through the progression — drives auto-build
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const queueRef = useRef<{ index: number; time: number; energy: number }[]>([]);
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
  const energyRef = useRef(opts.energy);
  const autoBuildRef = useRef(opts.autoBuild);
  const countInRef = useRef(opts.countIn);
  const humanizeRef = useRef(opts.humanize);
  const walkupsRef = useRef(opts.walkups);
  const fillEveryRef = useRef(opts.fillEvery);
  useEffect(() => {
    energyRef.current = opts.energy;
  }, [opts.energy]);
  useEffect(() => {
    autoBuildRef.current = opts.autoBuild;
  }, [opts.autoBuild]);
  useEffect(() => {
    countInRef.current = opts.countIn;
  }, [opts.countIn]);
  useEffect(() => {
    humanizeRef.current = opts.humanize;
  }, [opts.humanize]);
  useEffect(() => {
    walkupsRef.current = opts.walkups;
  }, [opts.walkups]);
  useEffect(() => {
    fillEveryRef.current = opts.fillEvery;
  }, [opts.fillEvery]);
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
    // Gentle mastering glue — the default 12:1 ratio pumps audibly.
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    comp.attack.value = 0.005;
    comp.release.value = 0.2;
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
    globalStepRef.current = 0;
    roundRef.current = 0;
    // 0–2 bars of clicks before the band comes in, so you can find the tempo.
    const t0 = ctx.currentTime + 0.1;
    const stepDur = 60 / bpmRef.current / 2;
    const bars = clamp(Math.round(countInRef.current), 0, 2);
    const barDur = EIGHTHS[meterRef.current] * stepDur;
    if (bars > 0 && masterRef.current) {
      for (let b = 0; b < bars; b++) {
        scheduleCountIn(ctx, masterRef.current, t0 + b * barDur, stepDur, meterRef.current);
      }
    }
    nextTimeRef.current = t0 + bars * barDur;
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
        // Energy — the manual level, or the auto-build arc stepping each pass.
        const level = autoBuildRef.current
          ? BUILD_ARC[roundRef.current % BUILD_ARC.length]
          : clamp(Math.round(energyRef.current), 0, 3);
        const E = ENERGY_CONF[level];
        const h = clamp(humanizeRef.current, 0, 100) / 100;
        // Within-bar dynamics curve (skip strum — it has its own shape).
        const contour = (meter === "6/8" ? CONTOUR_68 : CONTOUR_44)[eighth] ?? 1;

        if (step === 0) queueRef.current.push({ index, time: gridTime, energy: level });

        // Play a chord (or one arp tone) across every active layer.
        const eachLayer = (cb: (node: InstNode, s: InstSettings) => void) => {
          for (const id of activeIdsRef.current) {
            const node = nodes.get(id);
            const s = settingsRef.current[id];
            if (node && s) cb(node, s);
          }
        };
        // The voiced midi notes (voice-led upstream); pcs are the fallback.
        const chordNotes = chord.notes ?? chord.pcs.map((pc) => 60 + pc);
        const playChord = (t0: number, dur: number, velScale: number) => {
          if (mix.chords <= 0) return;
          // Humanize: hits drift off the grid and no two land at the same
          // strength — both scale with the humanize amount.
          const t = t0 + (Math.random() - 0.5) * 0.008 * h;
          const human = 1 + (Math.random() - 0.5) * 0.16 * h;
          const velocity = clamp(Math.round(110 * mix.chords * velScale * E.vel * human), 1, 127);
          eachLayer((node, s) => {
            const atk = toAttack(s.attack);
            if (atk > 0.02 && feel !== "arpeggio") {
              node.bus.gain.setValueAtTime(0.0001, t);
              node.bus.gain.linearRampToValueAtTime(1, t + atk);
            }
            const rel = toRelease(s.release);
            const cutoff = toCutoff(s.tone);
            const transpose = s.octave * 12;
            let i = 0;
            for (const note of chordNotes) {
              // Strums rake across the notes; everything else rolls slightly
              // (real hands never strike a chord as one block).
              const nt = t + i++ * (feel === "strum" ? 0.012 : 0.007 * h + Math.random() * 0.003 * h);
              node.inst.start({ note: note + transpose, time: nt, duration: dur, velocity, ampRelease: rel, lpfCutoffHz: cutoff });
            }
          });
        };

        const compound = meter === "6/8";
        if (feel === "sustained") {
          if (step === 0) playChord(gridTime, stepsPerChord * stepDur, 1);
        } else if (feel === "pulse") {
          // Quarters in 4/4; the two dotted-quarter pulses (0, 3) in 6/8.
          const onPulse = compound ? eighth === 0 || eighth === 3 : eighth % 2 === 0;
          if (onPulse) playChord(time, (compound ? 3 : 2) * stepDur * 0.9, contour);
        } else if (feel === "strum") {
          const sv = (compound ? STRUM_68 : STRUM_44)[eighth];
          if (sv) playChord(time, stepDur * (compound ? 1.4 : 1.6), sv);
        } else if (feel === "offbeat") {
          const off = compound ? eighth === 2 || eighth === 5 : eighth % 2 === 1;
          if (off) playChord(time, stepDur * 0.6, contour);
        } else if (mix.chords > 0) {
          // arpeggio — one voiced note per eighth, climbing an octave each pass
          const n = chordNotes.length;
          const note = chordNotes[step % n];
          const oct = Math.floor(step / n) % 2 ? 12 : 0;
          const human = 1 + (Math.random() - 0.5) * 0.16 * h;
          const velocity = clamp(Math.round(110 * mix.chords * E.vel * contour * human), 1, 127);
          eachLayer((node, s) => {
            node.inst.start({ note: note + oct + s.octave * 12, time, duration: stepDur * 0.9, velocity, ampRelease: toRelease(s.release), lpfCutoffHz: toCutoff(s.tone) });
          });
        }

        // Bass — style-specific lines (pump, funk syncopation, bossa, …),
        // thinned out at low energy down to a whole-note root.
        const bass = bassInstRef.current;
        if (bass && mix.bass > 0) {
          const bHuman = 1 + (Math.random() - 0.5) * 0.14 * h;
          const bTime = time + (Math.random() - 0.5) * 0.006 * h;
          // On the last eighth before a chord change, walk a half-step into
          // the next root — the classic bass player's connective move.
          const lastStep = step === stepsPerChord - 1;
          if (walkupsRef.current && E.bassBusy >= 1 && lastStep && chords.length > 1) {
            const next = chords[(index + 1) % chords.length];
            const target = next.bass ?? next.pcs[0];
            const bvel = clamp(Math.round(110 * mix.bass * E.vel * 0.7 * bHuman), 1, 127);
            bass.start({ note: 35 + target, time: bTime, duration: stepDur * 0.9, velocity: bvel });
          } else {
            const table = compound ? BASS_68 : BASS_44;
            const steps =
              E.bassBusy === 0
                ? table.ballad
                : (table[BASS_FOR_DRUMS[drumsRef.current]] ?? table.default);
            const st = steps.find((s) => s.e === eighth && (s.busy ?? 0) <= E.bassBusy);
            if (st) {
              // Slash chords put a different note in the bass (e.g. D/F# → F#).
              const rootPc = chord.bass ?? chord.pcs[0];
              const pc =
                st.tone === "fifth"
                  ? (chord.pcs[2] ?? rootPc)
                  : st.tone === "third"
                    ? (chord.pcs[1] ?? rootPc)
                    : rootPc;
              const bvel = clamp(Math.round(110 * mix.bass * E.vel * (st.vel ?? 1) * bHuman), 1, 127);
              bass.start({
                note: 36 + pc + (st.tone === "octave" ? 12 : 0),
                time: bTime,
                duration: st.len * stepDur * 0.95,
                velocity: bvel,
              });
            }
          }
        }

        // Drums — each piece plays from its own kit (per-piece kit selection).
        const kits = kitsRef.current;
        if (kits.size && mix.drums > 0 && drumsRef.current !== "none") {
          const bar = Math.floor(step / eighthsPerBar);
          const isLoopStart = index === 0 && bar === 0;
          // A fill every N bars (alternating toms / snare roll), then a crash
          // landing on the bar after it.
          const fe = fillEveryRef.current;
          const globalBar = Math.floor(globalStepRef.current / eighthsPerBar);
          const isFillBar = E.fills && fe > 0 && globalBar % fe === fe - 1;
          const fillKind: FillKind = isFillBar
            ? Math.floor(globalBar / fe) % 2
              ? "snare"
              : "tom"
            : null;
          const crashBar = isLoopStart || (E.fills && fe > 0 && globalBar > 0 && globalBar % fe === 0);
          scheduleDrums({
            kits,
            pieceKits: pieceKitsRef.current,
            drumMix: drumMixRef.current,
            table: compound ? DRUM_PATTERNS_68 : DRUM_PATTERNS,
            tomFill: compound ? TOM_FILL_68 : TOM_FILL_44,
            snareFill: compound ? SNARE_FILL_68 : SNARE_FILL_44,
            fillFrom: compound ? 3 : 4,
            pattern: drumsRef.current,
            eighth,
            crashBar,
            fillKind,
            compound,
            density: E.drums,
            time,
            vel: mix.drums * E.vel,
            h,
          });
        }

        nextTimeRef.current += stepDur;
        globalStepRef.current += 1;
        stepInChordRef.current += 1;
        if (stepInChordRef.current >= stepsPerChord) {
          stepInChordRef.current = 0;
          const next = (index + 1) % chords.length;
          indexRef.current = next;
          if (next === 0) roundRef.current += 1; // full pass — auto-build steps the arc
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
        setEnergyNow(q[0].energy);
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
    setEnergyNow(-1);
  }, []);

  const toggle = useCallback(() => {
    if (runningRef.current) stop();
    else start();
  }, [start, stop]);

  return { running, loading, currentIndex, energyNow, toggle };
}
