import Link from "next/link";
import {
  Gamepad2,
  ArrowRightLeft,
  KeyRound,
  Timer,
  ArrowRight,
  Hash,
  Guitar,
  Ruler,
  CircleDot,
  Repeat2,
  AudioLines,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Games · Worship Hub" };

const GAMES = [
  {
    href: "/games/fretboard",
    title: "Fretboard Explorer",
    blurb:
      "See any scale across the whole neck, in any key. Toggle note names, intervals, or hide labels for visual practice. 20+ scales — pentatonics, modes, blues, harmonic minor, and more.",
    icon: Guitar,
    accent: "teal" as const,
    eyebrow: "Practice tool",
  },
  {
    href: "/games/metronome",
    title: "Metronome",
    blurb:
      "A click that won't drift. Set the meter, tap along to find a song's tempo, and hit start — the downbeat is accented so the band knows where bar one is.",
    icon: AudioLines,
    accent: "orange" as const,
    eyebrow: "Practice tool",
  },
  {
    href: "/games/transpose",
    title: "Transpose Trainer",
    blurb:
      "A progression appears in one key. Play it back in the target key. Sharpens the muscle every guitarist + keys player on the team uses every Sunday.",
    icon: ArrowRightLeft,
    accent: "violet" as const,
  },
  {
    href: "/games/nashville",
    title: "Nashville Number Trainer",
    blurb:
      "\"Go to the IV — now the vi.\" Read chord charts in Roman numerals, or translate the leader's number cues to actual chords on the fly.",
    icon: Hash,
    accent: "amber" as const,
  },
  {
    href: "/games/capo",
    title: "Capo Calculator",
    blurb:
      "Leader switches the key two minutes before service. C shape at fret 5 — what's that sounding? Trains the math you need on stage with a capo.",
    icon: Guitar,
    accent: "green" as const,
  },
  {
    href: "/games/keys",
    title: "Key Signature Quiz",
    blurb:
      "How many sharps in E? How many flats in Eb? Quick-fire rounds — a 60-second warm-up before practice.",
    icon: KeyRound,
    accent: "cyan" as const,
  },
  {
    href: "/games/bpm",
    title: "BPM Tapper",
    blurb:
      "Tap to a tempo and see how close you stay to the target. Great for drummers, click-track-leaders, and anyone who needs to keep the band locked in.",
    icon: Timer,
    accent: "magenta" as const,
  },
  {
    href: "/games/intervals",
    title: "Interval Trainer",
    blurb:
      "What's a P5 above G? What interval is C → E? The alphabet of melody and harmony — useful for vocalists picking out parts on the fly.",
    icon: Ruler,
    accent: "pink" as const,
  },
  {
    href: "/games/chord-tones",
    title: "Chord Tones",
    blurb:
      "The 3rd of A. The ♭7th of G7. The 5th of F. Drills the harmony notes singers and string players need at fingertip speed.",
    icon: CircleDot,
    accent: "sky" as const,
  },
  {
    href: "/games/relative",
    title: "Relative Key",
    blurb:
      "Major → minor and back. Em is the relative minor of which key? Knowing relatives unlocks half of every worship reharmonization.",
    icon: Repeat2,
    accent: "violet-2" as const,
  },
];

const ACCENTS = {
  violet: {
    ring: "ring-primary/30 hover:ring-primary/60",
    bg: "bg-primary/15",
    text: "text-primary",
    glow: "hover:shadow-[0_0_24px_rgba(139,92,246,0.35)]",
  },
  cyan: {
    ring: "ring-accent/30 hover:ring-accent/60",
    bg: "bg-accent/15",
    text: "text-accent",
    glow: "hover:shadow-[0_0_24px_rgba(0,232,255,0.35)]",
  },
  magenta: {
    ring: "ring-chart-3/30 hover:ring-chart-3/60",
    bg: "bg-chart-3/15",
    text: "text-chart-3",
    glow: "hover:shadow-[0_0_24px_rgba(255,58,163,0.35)]",
  },
  amber: {
    ring: "ring-chart-4/30 hover:ring-chart-4/60",
    bg: "bg-chart-4/15",
    text: "text-chart-4",
    glow: "hover:shadow-[0_0_24px_rgba(255,181,71,0.35)]",
  },
  green: {
    ring: "ring-chart-5/30 hover:ring-chart-5/60",
    bg: "bg-chart-5/15",
    text: "text-chart-5",
    glow: "hover:shadow-[0_0_24px_rgba(142,255,106,0.35)]",
  },
  pink: {
    ring: "ring-[#ff7eb6]/30 hover:ring-[#ff7eb6]/60",
    bg: "bg-[#ff7eb6]/15",
    text: "text-[#ff7eb6]",
    glow: "hover:shadow-[0_0_24px_rgba(255,126,182,0.35)]",
  },
  sky: {
    ring: "ring-[#7dd3fc]/30 hover:ring-[#7dd3fc]/60",
    bg: "bg-[#7dd3fc]/15",
    text: "text-[#7dd3fc]",
    glow: "hover:shadow-[0_0_24px_rgba(125,211,252,0.35)]",
  },
  "violet-2": {
    ring: "ring-[#c4b5fd]/30 hover:ring-[#c4b5fd]/60",
    bg: "bg-[#c4b5fd]/15",
    text: "text-[#c4b5fd]",
    glow: "hover:shadow-[0_0_24px_rgba(196,181,253,0.35)]",
  },
  teal: {
    ring: "ring-[#5eead4]/30 hover:ring-[#5eead4]/60",
    bg: "bg-[#5eead4]/15",
    text: "text-[#5eead4]",
    glow: "hover:shadow-[0_0_24px_rgba(94,234,212,0.35)]",
  },
  orange: {
    ring: "ring-[#fb923c]/30 hover:ring-[#fb923c]/60",
    bg: "bg-[#fb923c]/15",
    text: "text-[#fb923c]",
    glow: "hover:shadow-[0_0_24px_rgba(251,146,60,0.35)]",
  },
} as const;

export default function GamesIndex() {
  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        icon={Gamepad2}
        title="Games"
        subtitle="Music-theory drills for the worship team"
      />

      <div className="grid gap-4 md:grid-cols-2">
        {GAMES.map((g) => {
          const a = ACCENTS[g.accent];
          const Icon = g.icon;
          return (
            <Link
              key={g.href}
              href={g.href}
              className={`glass card-hover group/feature block p-6 ring-1 ${a.ring} ${a.glow} transition-all`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center justify-center size-9 rounded-md ${a.bg} ${a.text} ring-1 ring-current/30`}
                >
                  <Icon className="size-5" />
                </span>
                <span className="eyebrow">{"eyebrow" in g ? g.eyebrow : "Mini-game"}</span>
              </div>
              <h3 className="mt-4 text-xl font-display font-semibold text-foreground/95">
                {g.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {g.blurb}
              </p>
              <p
                className={`mt-4 inline-flex items-center gap-1 text-sm font-medium ${a.text} group-hover/feature:gap-2 transition-all`}
              >
                Play <ArrowRight className="size-3.5" />
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
