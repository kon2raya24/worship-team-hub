"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import { ROOTS, SCALES, type ScaleDef } from "@/lib/fretboard";
import { buildDiatonicChords } from "@/lib/fretboard-chords";
import {
  useBackingTrack,
  type DrumId,
  type DrumMix,
  type DrumMixEntry,
  type DrumPiece,
  type FeelId,
  type InstSettings,
  type SoundId,
} from "@/lib/use-backing-track";

const QUALITIES = [
  { id: "major", label: "Major" },
  { id: "natural-minor", label: "Minor" },
] as const;
type QualityId = (typeof QUALITIES)[number]["id"];

const PROGRESSIONS = [
  { id: "pop", label: "Pop", degrees: [1, 5, 6, 4] },
  { id: "axis", label: "Axis", degrees: [6, 4, 1, 5] },
  { id: "worship", label: "Worship", degrees: [1, 4, 6, 5] },
  { id: "classic", label: "Classic", degrees: [1, 4, 5] },
  { id: "fifties", label: "'50s", degrees: [1, 6, 4, 5] },
  { id: "turnaround", label: "Turnaround", degrees: [1, 6, 2, 5] },
  { id: "twofiveone", label: "ii–V–I", degrees: [2, 5, 1] },
  { id: "andalusian", label: "Andalusian", degrees: [1, 7, 6, 5] },
  { id: "canon", label: "Canon", degrees: [1, 5, 6, 3, 4, 1, 4, 5] },
  { id: "blues", label: "12-bar blues", degrees: [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 5] },
];

const SOUNDS: { id: SoundId; label: string; icon: string }[] = [
  { id: "pad", label: "Pad", icon: "🌊" },
  { id: "epiano", label: "E-Piano", icon: "🎵" },
  { id: "piano", label: "Piano", icon: "🎹" },
  { id: "organ", label: "Organ", icon: "🪗" },
  { id: "strings", label: "Strings", icon: "🎻" },
  { id: "synth", label: "Synth", icon: "🎛️" },
  { id: "brass", label: "Brass", icon: "🎺" },
  { id: "flute", label: "Flute", icon: "🪈" },
  { id: "choir", label: "Choir", icon: "🎤" },
  { id: "pluck", label: "Pluck", icon: "🎸" },
  { id: "marimba", label: "Marimba", icon: "🎶" },
  { id: "bell", label: "Bell", icon: "🔔" },
];
const FEELS: { id: FeelId; label: string }[] = [
  { id: "sustained", label: "Sustained" },
  { id: "pulse", label: "Pulse" },
  { id: "arpeggio", label: "Arpeggio" },
  { id: "strum", label: "Strum" },
  { id: "offbeat", label: "Offbeat" },
];
const DRUMS: { id: DrumId; label: string }[] = [
  { id: "none", label: "Off" },
  { id: "pop", label: "Pop" },
  { id: "rock", label: "Rock" },
  { id: "ballad", label: "Ballad" },
  { id: "funk", label: "Funk" },
  { id: "dance", label: "Dance" },
  { id: "halftime", label: "Half-time" },
  { id: "ride", label: "Ride" },
];
const DRUM_KITS = ["TR-808", "Casio-RZ1", "LM-2", "MFB-512", "Roland CR-8000"];
const DRUM_PIECES: { key: DrumPiece; label: string }[] = [
  { key: "kick", label: "Kick" },
  { key: "snare", label: "Snare" },
  { key: "hatClosed", label: "Hi-Hat" },
  { key: "hatOpen", label: "Open Hat" },
  { key: "crash", label: "Crash" },
  { key: "ride", label: "Ride" },
  { key: "clap", label: "Clap" },
  { key: "rim", label: "Rim" },
  { key: "tom", label: "Toms" },
];
const DEFAULT_DRUM_MIX: DrumMix = Object.fromEntries(
  DRUM_PIECES.map((p) => [p.key, { volume: 80, enabled: true }]),
) as DrumMix;

// "D/F#" when a slash bass is set, otherwise just the chord name.
function slashName(c: { name: string; pcs: number[]; notes: string[]; bass?: number }): string {
  if (c.bass == null) return c.name;
  const i = c.pcs.indexOf(c.bass);
  return i >= 0 ? `${c.name}/${c.notes[i]}` : c.name;
}

const chipBase = "rounded-lg px-3 py-1.5 text-sm font-medium ring-1 transition-colors";
const chipOn = "bg-primary/15 text-primary ring-primary/40";
const chipOff = "bg-tint-1 text-foreground/80 ring-border hover:bg-tint-2 hover:text-foreground";

const DEFAULT_INST: InstSettings = {
  volume: 80,
  octave: 0,
  attack: 0,
  release: 40,
  tone: 100,
  reverb: 15,
  pan: 0,
};
// Per-instrument channel-strip controls (each its own slider).
const INST_CONTROLS: { key: keyof InstSettings; label: string; min: number; max: number; fmt: (v: number) => string }[] = [
  { key: "volume", label: "Volume", min: 0, max: 100, fmt: (v) => `${v}%` },
  { key: "octave", label: "Octave", min: -2, max: 2, fmt: (v) => (v > 0 ? `+${v}` : `${v}`) },
  { key: "attack", label: "Attack", min: 0, max: 100, fmt: (v) => `${v}%` },
  { key: "release", label: "Release", min: 0, max: 100, fmt: (v) => `${v}%` },
  { key: "tone", label: "Tone", min: 0, max: 100, fmt: (v) => `${v}%` },
  { key: "reverb", label: "Reverb", min: 0, max: 100, fmt: (v) => `${v}%` },
  { key: "pan", label: "Pan", min: -100, max: 100, fmt: (v) => (v === 0 ? "C" : v < 0 ? `L${-v}` : `R${v}`) },
];

export function BackingTrack() {
  const [root, setRoot] = useState("G");
  const [qualityId, setQualityId] = useState<QualityId>("major");
  const [progId, setProgId] = useState("pop");
  const [customChords, setCustomChords] = useState<{ degree: number; bass?: number }[]>([]);
  const [bpm, setBpm] = useState(90);
  const [barsPerChord, setBarsPerChord] = useState(1);
  const [activeSounds, setActiveSounds] = useState<SoundId[]>(["piano"]);
  const [editSound, setEditSound] = useState<SoundId>("piano"); // which layer's settings show
  const [feel, setFeel] = useState<FeelId>("pulse");
  const [drums, setDrums] = useState<DrumId>("pop");
  const [drumKit, setDrumKit] = useState(DRUM_KITS[0]);
  const [drumMix, setDrumMix] = useState<DrumMix>(DEFAULT_DRUM_MIX);
  const updatePiece = (key: DrumPiece, patch: Partial<DrumMixEntry>) =>
    setDrumMix((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  const [swing, setSwing] = useState(0);
  const [mixChords, setMixChords] = useState(80);
  const [mixBass, setMixBass] = useState(80);
  const [mixDrums, setMixDrums] = useState(70);
  // Each instrument keeps its own channel-strip settings.
  const [instSettings, setInstSettings] = useState<Record<SoundId, InstSettings>>(
    () => Object.fromEntries(SOUNDS.map((s) => [s.id, { ...DEFAULT_INST }])) as Record<SoundId, InstSettings>,
  );
  const activeInst = instSettings[editSound];
  const updateInst = (key: keyof InstSettings, value: number) =>
    setInstSettings((prev) => ({ ...prev, [editSound]: { ...prev[editSound], [key]: value } }));
  // Toggle a layer on/off. At least one instrument must stay active.
  const toggleSound = (id: SoundId) =>
    setActiveSounds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // keep the last one
        const next = prev.filter((s) => s !== id);
        if (editSound === id) setEditSound(next[0]);
        return next;
      }
      setEditSound(id);
      return [...prev, id];
    });

  const scale = useMemo<ScaleDef>(
    () => SCALES.find((s) => s.id === qualityId) ?? SCALES[0],
    [qualityId],
  );
  // Every diatonic chord in the key — the palette for the custom builder.
  const allChords = useMemo(() => buildDiatonicChords(root, scale), [root, scale]);
  // A progression is a list of {degree, optional slash bass}. Presets have no bass.
  const progItems = useMemo<{ degree: number; bass?: number }[]>(
    () =>
      progId === "custom"
        ? customChords
        : (PROGRESSIONS.find((p) => p.id === progId)?.degrees ?? PROGRESSIONS[0].degrees).map((d) => ({
            degree: d,
          })),
    [progId, customChords],
  );
  // Resolve to real diatonic chords in this key, carrying any slash bass.
  const progChords = useMemo(() => {
    const out: ((typeof allChords)[number] & { bass?: number })[] = [];
    for (const item of progItems) {
      const c = allChords.find((x) => x.degree === item.degree);
      if (c) out.push({ ...c, bass: item.bass });
    }
    return out;
  }, [allChords, progItems]);
  // Switching to Custom seeds the sequence from the current preset, then it's free to edit.
  const chooseProg = (id: string) => {
    if (id === "custom" && customChords.length === 0) setCustomChords(progItems.map((it) => ({ ...it })));
    setProgId(id);
  };
  const addChord = (degree: number, bass?: number) =>
    setCustomChords((prev) => [...prev, { degree, bass }]);
  const voices = useMemo(() => progChords.map((c) => ({ pcs: c.pcs, bass: c.bass })), [progChords]);
  const mix = useMemo(
    () => ({ chords: mixChords / 100, bass: mixBass / 100, drums: mixDrums / 100 }),
    [mixChords, mixBass, mixDrums],
  );
  // The active layers with their settings — drives which instruments play together.
  const instruments = useMemo(
    () => activeSounds.map((id) => ({ id, settings: instSettings[id] })),
    [activeSounds, instSettings],
  );

  const track = useBackingTrack({
    chords: voices,
    bpm,
    barsPerChord,
    instruments,
    feel,
    drums,
    drumKit,
    drumMix,
    swing,
    mix,
  });
  const { toggle } = track;

  // Spacebar starts/stops.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <div className="space-y-5">
      {/* Setup */}
      <div className="glass space-y-4 rounded-2xl p-4 ring-1 ring-border sm:p-5">
        {/* Key */}
        <div className="space-y-1.5">
          <span className="eyebrow">Key</span>
          <div className="flex flex-wrap gap-1.5">
            {ROOTS.map((r) => {
              const active = r === root;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoot(r)}
                  aria-pressed={active}
                  className={
                    "min-w-[44px] rounded-lg px-3 py-2 text-sm font-mono font-semibold transition-colors " +
                    (active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-tint-1 text-foreground/80 ring-1 ring-border hover:bg-tint-2 hover:text-foreground")
                  }
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Quality */}
          <div className="space-y-1.5">
            <span className="eyebrow">Tonality</span>
            <div className="flex rounded-xl bg-tint-1 p-1 ring-1 ring-border sm:w-fit">
              {QUALITIES.map((q) => {
                const active = q.id === qualityId;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setQualityId(q.id)}
                    aria-pressed={active}
                    className={
                      "flex-1 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none " +
                      (active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    {q.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progression */}
          <div className="space-y-1.5">
            <span className="eyebrow">Progression</span>
            <div className="flex flex-wrap gap-1.5">
              {PROGRESSIONS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => chooseProg(p.id)}
                  aria-pressed={p.id === progId}
                  className={`${chipBase} ${p.id === progId ? chipOn : chipOff}`}
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => chooseProg("custom")}
                aria-pressed={progId === "custom"}
                className={`${chipBase} ${progId === "custom" ? chipOn : chipOff}`}
              >
                + Custom
              </button>
            </div>
          </div>
        </div>

        {/* Custom progression builder */}
        {progId === "custom" && (
          <div className="space-y-2.5 rounded-xl bg-tint-1/40 p-3 ring-1 ring-border">
            <span className="eyebrow">
              Build your progression — tap a chord (or a slash inversion) to add it
            </span>
            <div className="flex flex-wrap gap-2">
              {allChords.map((c) => {
                const variants: { bass?: number; label: string }[] = [
                  { bass: undefined, label: c.name },
                  { bass: c.pcs[1], label: `${c.name}/${c.notes[1]}` },
                  { bass: c.pcs[2], label: `${c.name}/${c.notes[2]}` },
                ];
                return (
                  <div
                    key={c.degree}
                    className="inline-flex items-center gap-0.5 rounded-lg bg-tint-1 p-0.5 ring-1 ring-border"
                  >
                    {variants.map((v, vi) => (
                      <button
                        key={vi}
                        type="button"
                        onClick={() => addChord(c.degree, v.bass)}
                        className={
                          "rounded-md px-2 py-1 text-sm transition-colors hover:bg-tint-2 " +
                          (vi === 0 ? "font-medium text-foreground/90" : "text-muted-foreground")
                        }
                        title={`Add ${v.label}`}
                      >
                        {vi === 0 ? v.label : `/${c.notes[vi]}`}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
            {customChords.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Sequence:</span>
                {customChords.map((item, i) => {
                  const c = allChords.find((x) => x.degree === item.degree);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCustomChords((arr) => arr.filter((_, j) => j !== i))}
                      className="group inline-flex items-center gap-1 rounded-lg bg-primary/15 px-2.5 py-1 text-sm font-medium text-primary ring-1 ring-primary/40"
                      title="Remove"
                    >
                      {c ? slashName({ ...c, bass: item.bass }) : item.degree}
                      <span className="text-primary/50 group-hover:text-primary">✕</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setCustomChords([])}
                  className="ml-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tap a chord to add it, or a /note for a slash bass (e.g. D/F#). Tap a chord in your
                sequence to remove it.
              </p>
            )}
          </div>
        )}

        {/* Tempo */}
        <div className="space-y-1.5">
          <span className="eyebrow">Tempo — {bpm} BPM</span>
          <input
            type="range"
            min={50}
            max={200}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            aria-label="Tempo in beats per minute"
            className="w-full accent-primary"
          />
        </div>

        {/* Bars per chord */}
        <div className="space-y-1.5">
          <span className="eyebrow">Bars per chord</span>
          <div className="inline-flex rounded-xl bg-tint-1 p-1 ring-1 ring-border">
            {[1, 2].map((n) => {
              const active = n === barsPerChord;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setBarsPerChord(n)}
                  aria-pressed={active}
                  className={
                    "min-w-[44px] rounded-lg px-3 py-1.5 text-sm font-medium tabular-nums transition-colors " +
                    (active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Instruments — layer one or more, each with its own channel strip */}
      <div className="glass space-y-3 rounded-2xl p-4 ring-1 ring-border sm:p-5">
        <div className="flex items-center justify-between">
          <span className="eyebrow">Instruments — tap to layer</span>
          {track.loading && <span className="text-xs text-muted-foreground">loading…</span>}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {SOUNDS.map((s) => {
            const active = activeSounds.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSound(s.id)}
                aria-pressed={active}
                className={
                  "relative flex flex-col items-center gap-1 rounded-xl p-3 ring-1 transition-all " +
                  (active
                    ? "scale-[1.03] bg-primary/15 ring-primary/60"
                    : "bg-tint-1 ring-border hover:bg-tint-2")
                }
              >
                {active && (
                  <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    ✓
                  </span>
                )}
                <span className="text-2xl leading-none" aria-hidden>
                  {s.icon}
                </span>
                <span
                  className={
                    "text-xs font-medium " + (active ? "text-primary" : "text-foreground/80")
                  }
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Per-layer channel strip — pick which layer to tweak */}
        <div className="space-y-2.5 border-t border-border pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="eyebrow mr-1">Editing</span>
            {activeSounds.map((id) => {
              const s = SOUNDS.find((x) => x.id === id)!;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setEditSound(id)}
                  aria-pressed={id === editSound}
                  className={`${chipBase} ${id === editSound ? chipOn : chipOff}`}
                >
                  <span aria-hidden>{s.icon}</span> {s.label}
                </button>
              );
            })}
          </div>
          <div className="grid gap-x-5 gap-y-2.5 sm:grid-cols-2">
            {INST_CONTROLS.map((ctrl) => (
              <label key={ctrl.key} className="flex items-center gap-3 text-sm">
                <span className="w-16 shrink-0 text-muted-foreground">{ctrl.label}</span>
                <input
                  type="range"
                  min={ctrl.min}
                  max={ctrl.max}
                  value={activeInst[ctrl.key]}
                  onChange={(e) => updateInst(ctrl.key, Number(e.target.value))}
                  aria-label={`${ctrl.label} for ${editSound}`}
                  className="w-full accent-primary"
                />
                <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-foreground/70">
                  {ctrl.fmt(activeInst[ctrl.key])}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Feel, drums, swing, mix */}
      <div className="glass space-y-4 rounded-2xl p-4 ring-1 ring-border sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <span className="eyebrow">Feel</span>
            <div className="flex flex-wrap gap-1.5">
              {FEELS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFeel(f.id)}
                  aria-pressed={f.id === feel}
                  className={`${chipBase} ${f.id === feel ? chipOn : chipOff}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="eyebrow">Drums</span>
            <div className="flex flex-wrap gap-1.5">
              {DRUMS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDrums(d.id)}
                  aria-pressed={d.id === drums}
                  className={`${chipBase} ${d.id === drums ? chipOn : chipOff}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Drum kit */}
        {drums !== "none" && (
          <div className="space-y-1.5">
            <span className="eyebrow">Drum kit</span>
            <div className="flex flex-wrap gap-1.5">
              {DRUM_KITS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setDrumKit(k)}
                  aria-pressed={k === drumKit}
                  className={`${chipBase} ${k === drumKit ? chipOn : chipOff}`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Drum mixer — one component per kit piece */}
        {drums !== "none" && (
          <div className="space-y-1.5">
            <span className="eyebrow">Drum mixer</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DRUM_PIECES.map((piece) => {
                const m = drumMix[piece.key];
                return (
                  <div key={piece.key} className="rounded-xl bg-tint-1 p-2.5 ring-1 ring-border">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground/90">{piece.label}</span>
                      <button
                        type="button"
                        onClick={() => updatePiece(piece.key, { enabled: !m.enabled })}
                        aria-pressed={m.enabled}
                        className={
                          "rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 transition-colors " +
                          (m.enabled
                            ? "bg-primary/15 text-primary ring-primary/40"
                            : "bg-tint-2 text-muted-foreground ring-border")
                        }
                      >
                        {m.enabled ? "On" : "Off"}
                      </button>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={m.volume}
                      onChange={(e) => updatePiece(piece.key, { volume: Number(e.target.value) })}
                      disabled={!m.enabled}
                      aria-label={`${piece.label} volume`}
                      className="w-full accent-primary disabled:opacity-40"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Swing */}
        <div className="space-y-1.5">
          <span className="eyebrow">Swing — {swing === 0 ? "straight" : `${swing}%`}</span>
          <input
            type="range"
            min={0}
            max={60}
            value={swing}
            onChange={(e) => setSwing(Number(e.target.value))}
            aria-label="Swing amount"
            className="w-full max-w-md accent-primary"
          />
        </div>

        {/* Mix */}
        <div className="space-y-1.5">
          <span className="eyebrow">Mix</span>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["Chords", mixChords, setMixChords],
                ["Bass", mixBass, setMixBass],
                ["Drums", mixDrums, setMixDrums],
              ] as const
            ).map(([label, value, set]) => (
              <label key={label} className="flex items-center gap-3 text-sm">
                <span className="w-14 shrink-0 text-muted-foreground">{label}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={value}
                  onChange={(e) => set(Number(e.target.value))}
                  aria-label={`${label} volume`}
                  className="w-full accent-primary"
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Transport */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={toggle}
          disabled={track.loading && !track.running}
          aria-pressed={track.running}
          className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {track.running ? <Pause className="size-4" /> : <Play className="size-4" />}
          {track.loading && !track.running ? "Loading…" : track.running ? "Stop" : "Play"}
        </button>
      </div>

      {/* Progression chords — current one lit */}
      <div className="space-y-2">
        <span className="eyebrow">
          {root} {scale.name} · {progChords.map((c) => c.roman).join(" – ")}
        </span>
        <div className="flex flex-wrap gap-2">
          {progChords.map((c, i) => {
            const active = track.currentIndex === i;
            return (
              <div
                key={`${c.degree}-${i}`}
                className={
                  "min-w-[84px] rounded-xl p-3 text-center ring-1 transition-all " +
                  (active ? "bg-primary/15 ring-primary/60 scale-105" : "bg-tint-1 ring-border")
                }
              >
                <div className="eyebrow">{c.roman}</div>
                <div className="font-display text-lg font-semibold text-foreground/95">
                  {slashName(c)}
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">{c.notes.join(" ")}</div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Pick a sound and feel, add drums, then solo over it with the matching{" "}
        {scale.name.toLowerCase()} scale on the{" "}
        <a href="/games/fretboard" className="text-primary hover:underline">
          Fretboard Explorer
        </a>
        . Press{" "}
        <kbd className="rounded border border-border bg-tint-1 px-1.5 py-0.5 font-mono text-xs">
          Space
        </kbd>{" "}
        to play or stop.
      </p>
    </div>
  );
}
