import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isLeader } from "@/lib/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SearchParams = Promise<{ q?: string; tag?: string }>;

export default async function SongsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const profile = await requireProfile();
  const { q, tag } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("songs")
    .select("id, title, artist, original_key, bpm, tags")
    .order("title", { ascending: true });

  if (q) query = query.ilike("title", `%${q}%`);
  if (tag) query = query.contains("tags", [tag]);

  const { data: songs } = await query;

  const allTags = Array.from(
    new Set((songs ?? []).flatMap((s) => s.tags ?? []))
  ).sort();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold tracking-tight">Songs</h1>
        {isLeader(profile) && (
          <Link href="/songs/new" className={buttonVariants()}>
            New song
          </Link>
        )}
      </div>

      <form className="flex gap-2 flex-wrap" action="/songs" method="get">
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by title"
          className="max-w-xs"
        />
        {tag && <input type="hidden" name="tag" value={tag} />}
        <Button type="submit" variant="outline">
          Search
        </Button>
        {(q || tag) && (
          <Link href="/songs" className={buttonVariants({ variant: "ghost" })}>
            Clear
          </Link>
        )}
      </form>

      {allTags.length > 0 && (
        <div className="flex gap-2 flex-wrap text-sm">
          {allTags.map((t) => (
            <Link
              key={t}
              href={`/songs?tag=${encodeURIComponent(t)}`}
              className={tag === t ? "" : "opacity-60 hover:opacity-100"}
            >
              <Badge variant={tag === t ? "default" : "secondary"}>{t}</Badge>
            </Link>
          ))}
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>BPM</TableHead>
            <TableHead>Tags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(songs ?? []).map((s) => (
            <TableRow key={s.id}>
              <TableCell>
                <Link href={`/songs/${s.id}`} className="font-medium hover:underline">
                  {s.title}
                </Link>
              </TableCell>
              <TableCell className="text-zinc-500">{s.artist ?? "—"}</TableCell>
              <TableCell>{s.original_key ?? "—"}</TableCell>
              <TableCell>{s.bpm ?? "—"}</TableCell>
              <TableCell className="space-x-1">
                {(s.tags ?? []).map((t: string) => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
              </TableCell>
            </TableRow>
          ))}
          {(songs ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-zinc-500 py-8">
                No songs yet.{" "}
                {isLeader(profile) && (
                  <Link href="/songs/new" className="underline">
                    Add the first one
                  </Link>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
