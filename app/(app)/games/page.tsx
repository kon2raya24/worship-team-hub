import Link from "next/link";
import {
  Gamepad2,
  ArrowRightLeft,
  KeyRound,
  Timer,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Games · Worship Hub" };

const GAMES = [
  {
    href: "/games/transpose",
    title: "Transpose Trainer",
    blurb:
      "A progression appears in one key. Play it back in the target key. Sharpens the muscle every guitarist + keys player on the team uses every Sunday.",
    icon: ArrowRightLeft,
    accent: "violet" as const,
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
];

const ACCENTS = {
  violet: {
    ring: "ring-[#8b5cf6]/30 hover:ring-[#8b5cf6]/60",
    bg: "bg-[#8b5cf6]/15",
    text: "text-[#8b5cf6]",
    glow: "hover:shadow-[0_0_24px_rgba(139,92,246,0.35)]",
  },
  cyan: {
    ring: "ring-[#00e8ff]/30 hover:ring-[#00e8ff]/60",
    bg: "bg-[#00e8ff]/15",
    text: "text-[#00e8ff]",
    glow: "hover:shadow-[0_0_24px_rgba(0,232,255,0.35)]",
  },
  magenta: {
    ring: "ring-[#ff3aa3]/30 hover:ring-[#ff3aa3]/60",
    bg: "bg-[#ff3aa3]/15",
    text: "text-[#ff3aa3]",
    glow: "hover:shadow-[0_0_24px_rgba(255,58,163,0.35)]",
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
                <span className="eyebrow">Mini-game</span>
              </div>
              <h3 className="mt-4 text-xl font-display font-semibold text-white/95">
                {g.title}
              </h3>
              <p className="text-sm text-[#8a92b4] mt-1.5 leading-relaxed">
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
