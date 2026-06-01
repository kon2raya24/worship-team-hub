import Link from "next/link";
import {
  Music,
  Heart,
  Mic2,
  Megaphone,
  Calendar,
  BookOpen,
  ArrowRight,
  Pin,
  Gamepad2,
  ArrowRightLeft,
  KeyRound,
  Timer,
  Hash,
  Guitar,
  Ruler,
  CircleDot,
  Repeat2,
  ListMusic,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { TimeGreeting } from "@/components/time-greeting";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}


export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    nextSetlistRes,
    pinnedRes,
    latestDevotionRes,
    openPrayersRes,
    songsCountRes,
    upcomingScheduleRes,
  ] = await Promise.all([
    supabase
      .from("setlists")
      .select("id, service_date, theme")
      .gte("service_date", today)
      .order("service_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("announcements")
      .select("id, title, body, created_at")
      .eq("pinned", true)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("devotions")
      .select("id, title, scripture_ref, published_at")
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("prayer_requests")
      .select("id", { count: "exact", head: true })
      .eq("is_answered", false),
    supabase.from("songs").select("id", { count: "exact", head: true }),
    supabase
      .from("schedule_assignments")
      .select("service_date, role")
      .eq("user_id", profile.id)
      .gte("service_date", today)
      .order("service_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const nextSetlist = nextSetlistRes.data;
  const pinned = pinnedRes.data ?? [];
  const latestDevotion = latestDevotionRes.data;
  const openPrayerCount = openPrayersRes.count ?? 0;
  const songsCount = songsCountRes.count ?? 0;
  const mySchedule = upcomingScheduleRes.data;
  const firstName = profile.display_name.split(" ")[0];

  return (
    <div className="space-y-6 fade-in">
      {/* Hero — glass aurora panel */}
      <section className="glass aurora-bg p-5 sm:p-7 md:p-10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-5 md:gap-6">
          <div className="space-y-3">
            <TimeGreeting />
            <h1 className="font-display text-2xl sm:text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1] md:leading-[1.05] max-w-2xl">
              {firstName},{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent via-primary to-chart-3">
                let everything that has breath
              </span>{" "}
              praise the Lord.
            </h1>
            <p className="text-sm text-foreground/70 max-w-xl">
              — Psalm 150:6. Here&apos;s what your worship team is up to today.
            </p>
          </div>

          {nextSetlist && (
            <Link
              href={`/setlists/${nextSetlist.id}`}
              className="shrink-0 inline-flex items-center gap-3 px-4 py-3 rounded-lg bg-tint-2 border border-hairline-strong hover:bg-tint-3 transition-colors"
            >
              <span className="live-dot" />
              <div className="text-left">
                <div className="eyebrow text-foreground/80">Next service</div>
                <div className="font-display text-base">
                  {formatDate(nextSetlist.service_date)}
                </div>
              </div>
              <ArrowRight className="size-4 text-foreground/80" />
            </Link>
          )}
        </div>
      </section>

      {/* Quick Actions — mobile-only row. The bottom tab bar covers the
          same four destinations but with finer "what for" context here. */}
      <div className="md:hidden grid grid-cols-4 gap-2">
        <QuickAction
          href="/songs"
          label="Library"
          Icon={Music}
          color="#8b5cf6"
        />
        <QuickAction
          href={nextSetlist ? `/setlists/${nextSetlist.id}` : "/setlists"}
          label={nextSetlist ? "Today" : "Setlists"}
          Icon={ListMusic}
          color="#00e8ff"
        />
        <QuickAction
          href="/schedule"
          label="Schedule"
          Icon={Calendar}
          color="#7dd3fc"
        />
        <QuickAction
          href="/prayer"
          label="Prayer"
          Icon={Heart}
          color="#ff3aa3"
        />
      </div>

      {/* Stat grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Song Library"
          value={songsCount}
          icon={<Music className="size-5" />}
          href="/songs"
          accent="violet"
        />
        <StatCard
          label="Open Prayers"
          value={openPrayerCount}
          icon={<Heart className="size-5" />}
          href="/prayer"
          accent={openPrayerCount > 0 ? "magenta" : "violet"}
        />
        <StatCard
          label="Your Next Role"
          value={mySchedule ? mySchedule.role : "—"}
          sub={mySchedule ? formatDate(mySchedule.service_date) : "Not assigned"}
          icon={<Mic2 className="size-5" />}
          href="/schedule"
          accent="cyan"
        />
        <StatCard
          label="Pinned"
          value={pinned.length}
          icon={<Pin className="size-5" />}
          href="/announcements"
          accent="amber"
        />
      </div>

      {/* Featured */}
      <div className="grid gap-4 md:grid-cols-2">
        <FeatureCard
          icon={<Calendar className="size-5" />}
          eyebrow="Next Sunday"
          title={nextSetlist ? formatDate(nextSetlist.service_date) : "No setlist yet"}
          body={
            nextSetlist
              ? nextSetlist.theme ?? "Theme to be announced"
              : "Plan a setlist to get the band ready."
          }
          href={nextSetlist ? `/setlists/${nextSetlist.id}` : "/setlists/new"}
          cta={nextSetlist ? "Open setlist" : "Create setlist"}
          accent="cyan"
        />
        <FeatureCard
          icon={<BookOpen className="size-5" />}
          eyebrow="Latest Devotion"
          title={latestDevotion?.title ?? "No devotions yet"}
          body={
            latestDevotion?.scripture_ref ??
            "Share the first devotion with your team."
          }
          href={
            latestDevotion ? `/devotions/${latestDevotion.id}` : "/devotions/new"
          }
          cta={latestDevotion ? "Read devotion" : "Write one"}
          accent="violet"
        />
      </div>

      {/* Practice — gives mobile users one-tap access to the games from the
          Home tab (otherwise Games lives behind the More sheet). */}
      <section className="glass p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center justify-center size-8 rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
            <Gamepad2 className="size-4" />
          </span>
          <h2 className="font-display font-semibold text-lg">Practice</h2>
          <Link
            href="/games"
            className="ml-auto text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            All games <ArrowRight className="size-3" />
          </Link>
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {GAME_TILES.map(({ href, title, Icon, color }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex flex-col items-center justify-center text-center gap-2 p-3 rounded-lg border border-border bg-tint-1 text-foreground/80 hover:bg-tint-2 hover:border-hairline-strong active:bg-tint-2 transition-colors min-h-[88px]"
              >
                <span
                  className="inline-flex items-center justify-center size-9 rounded-md ring-1 ring-current/20"
                  style={{ color }}
                >
                  <Icon className="size-5" />
                </span>
                <span className="text-xs font-medium leading-tight text-foreground/90">
                  {title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Pinned announcements */}
      <section className="glass p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center justify-center size-8 rounded-lg bg-chart-3/15 text-chart-3 ring-1 ring-chart-3/30">
            <Megaphone className="size-4" />
          </span>
          <h2 className="font-display font-semibold text-lg">
            Pinned announcements
          </h2>
          <Link
            href="/announcements"
            className="ml-auto text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            All news <ArrowRight className="size-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {pinned.length > 0 ? (
            pinned.map((a) => (
              <div
                key={a.id}
                className="border-l-2 border-chart-3/60 pl-3 py-1"
              >
                <div className="font-medium text-foreground/90">{a.title}</div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {a.body}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nothing pinned right now.</p>
          )}
        </div>
      </section>
    </div>
  );
}

const ACCENTS: Record<
  string,
  { ring: string; bg: string; text: string; glow: string }
> = {
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
};

function StatCard({
  label,
  value,
  sub,
  href,
  icon,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  href: string;
  icon: React.ReactNode;
  accent: keyof typeof ACCENTS;
}) {
  const a = ACCENTS[accent];
  return (
    <Link
      href={href}
      className={`glass card-hover block p-5 ring-1 ${a.ring} ${a.glow} transition-all`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex items-center justify-center size-10 rounded-md ${a.bg} ${a.text} ring-1 ring-current/30`}
        >
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="eyebrow">{label}</p>
          <p className="font-display text-2xl mt-1 truncate text-foreground/95">
            {value}
          </p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>}
        </div>
      </div>
    </Link>
  );
}

function FeatureCard({
  icon,
  eyebrow,
  title,
  body,
  href,
  cta,
  accent,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  accent: keyof typeof ACCENTS;
}) {
  const a = ACCENTS[accent];
  return (
    <Link
      href={href}
      className={`glass card-hover group/feature block p-6 ring-1 ${a.ring} ${a.glow} transition-all`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center justify-center size-9 rounded-md ${a.bg} ${a.text} ring-1 ring-current/30`}
        >
          {icon}
        </span>
        <span className="eyebrow">{eyebrow}</span>
      </div>
      <h3 className="mt-4 text-xl font-display font-semibold text-foreground/95">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{body}</p>
      <p
        className={`mt-4 inline-flex items-center gap-1 text-sm font-medium ${a.text} group-hover/feature:gap-2 transition-all`}
      >
        {cta} <ArrowRight className="size-3.5" />
      </p>
    </Link>
  );
}

function QuickAction({
  href,
  label,
  Icon,
  color,
}: {
  href: string;
  label: string;
  Icon: LucideIcon;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-lg border border-border bg-tint-1 text-foreground/80 active:bg-tint-2 transition-colors min-h-[68px]"
    >
      <span
        className="inline-flex items-center justify-center size-9 rounded-md ring-1 ring-current/20"
        style={{ color }}
      >
        <Icon className="size-5" />
      </span>
      <span className="text-[11px] font-medium text-foreground/90 leading-tight">
        {label}
      </span>
    </Link>
  );
}

const GAME_TILES: {
  href: string;
  title: string;
  Icon: LucideIcon;
  color: string;
}[] = [
  { href: "/games/transpose", title: "Transpose", Icon: ArrowRightLeft, color: "#8b5cf6" },
  { href: "/games/nashville", title: "Nashville", Icon: Hash, color: "#ffb547" },
  { href: "/games/capo", title: "Capo math", Icon: Guitar, color: "#8eff6a" },
  { href: "/games/keys", title: "Key signatures", Icon: KeyRound, color: "#00e8ff" },
  { href: "/games/bpm", title: "BPM tapper", Icon: Timer, color: "#ff3aa3" },
  { href: "/games/intervals", title: "Intervals", Icon: Ruler, color: "#ff7eb6" },
  { href: "/games/chord-tones", title: "Chord tones", Icon: CircleDot, color: "#7dd3fc" },
  { href: "/games/relative", title: "Relative key", Icon: Repeat2, color: "#c4b5fd" },
];
