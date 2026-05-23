import Link from "next/link";
import { ListMusic, Plus, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isLeader } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";

function fmt(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function SetlistsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase
      .from("setlists")
      .select("id, service_date, theme")
      .gte("service_date", today)
      .order("service_date", { ascending: true }),
    supabase
      .from("setlists")
      .select("id, service_date, theme")
      .lt("service_date", today)
      .order("service_date", { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="space-y-8 fade-in">
      <PageHeader
        icon={ListMusic}
        title="Setlists"
        subtitle={`${(upcoming ?? []).length} upcoming · ${(past ?? []).length} past`}
        action={
          isLeader(profile) && (
            <Link
              href="/setlists/new"
              className={buttonVariants({ size: "lg" }) + " gap-1.5"}
            >
              <Plus className="size-4" /> New setlist
            </Link>
          )
        }
      />

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Upcoming
        </h2>
        <SetlistGrid rows={upcoming ?? []} empty="No upcoming setlists yet." />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Past
        </h2>
        <SetlistGrid rows={past ?? []} empty="No past setlists yet." muted />
      </section>
    </div>
  );
}

function SetlistGrid({
  rows,
  empty,
  muted = false,
}: {
  rows: { id: string; service_date: string; theme: string | null }[];
  empty: string;
  muted?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border/70 p-6 text-center">
        {empty}
      </p>
    );
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((r) => (
        <li key={r.id}>
          <Link
            href={`/setlists/${r.id}`}
            className={`card-hover group/setlist block rounded-2xl bg-card ring-1 ring-border/70 hover:ring-primary/40 p-5 transition-all ${
              muted ? "opacity-80 hover:opacity-100" : ""
            }`}
          >
            <div className="flex items-center gap-2 text-primary">
              <Calendar className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wider">
                {new Date(r.service_date).toLocaleDateString(undefined, {
                  weekday: "short",
                })}
              </span>
            </div>
            <p className="mt-1 text-xl font-heading font-semibold leading-tight group-hover/setlist:text-primary transition-colors">
              {fmt(r.service_date)}
            </p>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {r.theme ?? "Theme to be announced"}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
