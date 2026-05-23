import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isLeader } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Setlists</h1>
        {isLeader(profile) && (
          <Link href="/setlists/new" className={buttonVariants()}>
            New setlist
          </Link>
        )}
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium uppercase text-zinc-500">Upcoming</h2>
        <SetlistTable rows={upcoming ?? []} empty="No upcoming setlists." />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium uppercase text-zinc-500">Past</h2>
        <SetlistTable rows={past ?? []} empty="No past setlists yet." />
      </section>
    </div>
  );
}

function SetlistTable({
  rows,
  empty,
}: {
  rows: { id: string; service_date: string; theme: string | null }[];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500">{empty}</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Service date</TableHead>
          <TableHead>Theme</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>
              <Link href={`/setlists/${r.id}`} className="font-medium hover:underline">
                {fmt(r.service_date)}
              </Link>
            </TableCell>
            <TableCell className="text-zinc-500">{r.theme ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
