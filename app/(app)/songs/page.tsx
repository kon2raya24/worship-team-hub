import Link from "next/link";
import { Music, Plus, Search, X, Tag, Upload, WifiOff } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isLeader } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type SearchParams = Promise<{ q?: string; tag?: string }>;

export default async function SongsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const profile = await requireProfile();
  const { q, tag } = await searchParams;
  const supabase = await createClient();

  // Search query — match against title, artist, OR lyrics/chord body.
  // Escape characters that have meaning in PostgREST filter values.
  const escapeFilter = (s: string) =>
    s.replace(/[\\,()."']/g, (m) => `\\${m}`);

  let query = supabase
    .from("songs")
    .select("id, title, artist, original_key, bpm, tags, chordpro_body")
    .order("title", { ascending: true });

  if (q) {
    const safe = escapeFilter(q);
    query = query.or(
      `title.ilike.*${safe}*,artist.ilike.*${safe}*,chordpro_body.ilike.*${safe}*`
    );
  }
  if (tag) query = query.contains("tags", [tag]);

  const { data: rawSongs } = await query;
  const songs = (rawSongs ?? []).map((s) => {
    // Decide if the title/artist matched; if not, the body did.
    const needle = q?.toLowerCase() ?? "";
    const inTitle = needle && s.title?.toLowerCase().includes(needle);
    const inArtist =
      needle && (s.artist ?? "").toLowerCase().includes(needle);
    const inBody =
      needle &&
      !inTitle &&
      !inArtist &&
      (s.chordpro_body ?? "").toLowerCase().includes(needle);
    let snippet: string | null = null;
    if (inBody) {
      const body = s.chordpro_body as string;
      const idx = body.toLowerCase().indexOf(needle);
      const start = Math.max(0, idx - 30);
      const end = Math.min(body.length, idx + needle.length + 30);
      snippet = (start > 0 ? "…" : "") +
        body.slice(start, end).replace(/\[[^\]]+\]/g, "").replace(/\s+/g, " ").trim() +
        (end < body.length ? "…" : "");
    }
    return { ...s, _matchedBody: !!inBody, _snippet: snippet };
  });

  const allTags = Array.from(
    new Set((songs ?? []).flatMap((s) => s.tags ?? []))
  ).sort();

  return (
    <div className="space-y-6 fade-in">
      {/* Page header */}
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center justify-center size-11 rounded-lg bg-primary/10 text-primary shrink-0">
            <Music className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-semibold tracking-tight">
              Song library
            </h1>
            <p className="text-sm text-muted-foreground">
              {(songs ?? []).length} song{(songs ?? []).length === 1 ? "" : "s"}
              {tag && ` tagged "${tag}"`}
              {q && ` matching "${q}"`}
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link
            href="/songs/offline"
            className={
              buttonVariants({ variant: "outline" }) +
              " gap-1.5 flex-1 sm:flex-initial"
            }
            title="View songs cached for offline use"
          >
            <WifiOff className="size-4" /> Offline
          </Link>
          {isLeader(profile) && (
            <>
              <Link
                href="/songs/import"
                className={
                  buttonVariants({ variant: "outline" }) +
                  " gap-1.5 flex-1 sm:flex-initial"
                }
              >
                <Upload className="size-4" /> Import
              </Link>
              <Link
                href="/songs/new"
                className={
                  buttonVariants() + " gap-1.5 flex-1 sm:flex-initial"
                }
              >
                <Plus className="size-4" /> New song
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Search + tag filters */}
      <div className="space-y-3">
        <form className="flex gap-2 flex-wrap" action="/songs" method="get">
          <div className="relative flex-1 min-w-[14rem] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search title, artist, or lyrics…"
              className="pl-9 h-10"
            />
          </div>
          {tag && <input type="hidden" name="tag" value={tag} />}
          <button
            type="submit"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Search
          </button>
          {(q || tag) && (
            <Link
              href="/songs"
              className={buttonVariants({ variant: "ghost", size: "lg" }) + " gap-1"}
            >
              <X className="size-3.5" /> Clear
            </Link>
          )}
        </form>

        {allTags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap items-center">
            <Tag className="size-3.5 text-muted-foreground" />
            {allTags.map((t) => (
              <Link
                key={t}
                href={`/songs?tag=${encodeURIComponent(t)}`}
              >
                <Badge
                  variant={tag === t ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 hover:border-primary/40 transition-colors"
                >
                  {t}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Card grid */}
      {(songs ?? []).length === 0 ? (
        <EmptyState
          canAdd={isLeader(profile)}
          message={
            q || tag
              ? "No songs match those filters."
              : "Your library is empty."
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(songs ?? []).map((s) => (
            <li key={s.id}>
              <Link
                href={`/songs/${s.id}`}
                className="card-hover group/song block h-full rounded-lg bg-card ring-1 ring-border/70 hover:ring-primary/40 p-5 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading font-semibold text-base leading-snug truncate group-hover/song:text-primary transition-colors">
                    {s.title}
                  </h3>
                  {s.original_key && (
                    <span className="shrink-0 inline-flex items-center justify-center min-w-9 h-7 px-2 rounded-md bg-primary/10 text-primary text-xs font-mono font-semibold">
                      {s.original_key}
                    </span>
                  )}
                </div>
                {s._snippet && (
                  <p className="mt-2 text-xs text-[#c8cee6]/80 italic line-clamp-2 border-l-2 border-[#00e8ff]/40 pl-2">
                    <span className="not-italic font-mono text-[9px] uppercase tracking-wider text-[#00e8ff] mr-1">
                      lyrics
                    </span>
                    {s._snippet}
                  </p>
                )}
                {s.artist && (
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {s.artist}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  {s.bpm && (
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block size-1.5 rounded-full bg-accent" />
                      {s.bpm} BPM
                    </span>
                  )}
                  {(s.tags ?? []).slice(0, 3).map((t: string) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="text-[10px] py-0 px-1.5 h-4"
                    >
                      {t}
                    </Badge>
                  ))}
                  {(s.tags?.length ?? 0) > 3 && (
                    <span className="text-[10px]">+{(s.tags?.length ?? 0) - 3}</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({
  canAdd,
  message,
}: {
  canAdd: boolean;
  message: string;
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-border/70 p-12 text-center bg-card/50">
      <Music className="size-10 mx-auto text-muted-foreground/60" />
      <p className="mt-4 text-muted-foreground">{message}</p>
      {canAdd && (
        <Link
          href="/songs/new"
          className={buttonVariants() + " mt-4 gap-1.5"}
        >
          <Plus className="size-4" /> Add the first song
        </Link>
      )}
    </div>
  );
}
