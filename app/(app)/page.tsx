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
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00e8ff] via-[#8b5cf6] to-[#ff3aa3]">
                let everything that has breath
              </span>{" "}
              praise the Lord.
            </h1>
            <p className="text-sm text-[#c8cee6]/70 max-w-xl">
              — Psalm 150:6. Here&apos;s what your worship team is up to today.
            </p>
          </div>

          {nextSetlist && (
            <Link
              href={`/setlists/${nextSetlist.id}`}
              className="shrink-0 inline-flex items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.06] border border-white/[0.16] hover:bg-white/[0.09] transition-colors"
            >
              <span className="live-dot" />
              <div className="text-left">
                <div className="eyebrow text-[#c8cee6]">Next service</div>
                <div className="font-display text-base">
                  {formatDate(nextSetlist.service_date)}
                </div>
              </div>
              <ArrowRight className="size-4 text-[#c8cee6]" />
            </Link>
          )}
        </div>
      </section>

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

      {/* Pinned announcements */}
      <section className="glass p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center justify-center size-8 rounded-lg bg-[#ff3aa3]/15 text-[#ff3aa3] ring-1 ring-[#ff3aa3]/30">
            <Megaphone className="size-4" />
          </span>
          <h2 className="font-display font-semibold text-lg">
            Pinned announcements
          </h2>
          <Link
            href="/announcements"
            className="ml-auto text-xs text-[#8a92b4] hover:text-white inline-flex items-center gap-1 transition-colors"
          >
            All news <ArrowRight className="size-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {pinned.length > 0 ? (
            pinned.map((a) => (
              <div
                key={a.id}
                className="border-l-2 border-[#ff3aa3]/60 pl-3 py-1"
              >
                <div className="font-medium text-white/90">{a.title}</div>
                <div className="text-sm text-[#8a92b4] whitespace-pre-wrap">
                  {a.body}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-[#8a92b4]">Nothing pinned right now.</p>
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
  amber: {
    ring: "ring-[#ffb547]/30 hover:ring-[#ffb547]/60",
    bg: "bg-[#ffb547]/15",
    text: "text-[#ffb547]",
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
          <p className="font-display text-2xl mt-1 truncate text-white/95">
            {value}
          </p>
          {sub && <p className="text-xs text-[#8a92b4] mt-0.5 truncate">{sub}</p>}
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
      <h3 className="mt-4 text-xl font-display font-semibold text-white/95">
        {title}
      </h3>
      <p className="text-sm text-[#8a92b4] mt-1 line-clamp-2">{body}</p>
      <p
        className={`mt-4 inline-flex items-center gap-1 text-sm font-medium ${a.text} group-hover/feature:gap-2 transition-all`}
      >
        {cta} <ArrowRight className="size-3.5" />
      </p>
    </Link>
  );
}
