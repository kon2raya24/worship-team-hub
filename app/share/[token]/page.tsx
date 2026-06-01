import { notFound } from "next/navigation";
import Link from "next/link";
import { ListMusic, Calendar, Music } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { ChordViewer } from "@/components/chord-viewer";
import { renderTransposedHtml } from "@/lib/chordpro";

type Params = Promise<{ token: string }>;

function fmt(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function SharePage({ params }: { params: Params }) {
  const { token } = await params;
  const admin = createServiceClient();

  const { data: link } = await admin
    .from("share_links")
    .select("resource_type, resource_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!link) notFound();
  // Compare as ISO strings to avoid local-clock-skew false-positives.
  if (link.expires_at && link.expires_at < new Date().toISOString()) notFound();

  return (
    <div className="min-h-screen">
      <ShareHeader />
      <main className="mx-auto max-w-4xl px-3 sm:px-4 py-6 md:py-12 space-y-6 fade-in">
        {link.resource_type === "song" ? (
          <SongShare admin={admin} id={link.resource_id} />
        ) : (
          <SetlistShare admin={admin} id={link.resource_id} />
        )}
        <ShareFooter />
      </main>
    </div>
  );
}

function ShareHeader() {
  return (
    <header className="border-b border-border bg-sidebar/70 backdrop-blur-md print:hidden">
      <div className="mx-auto max-w-4xl px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2.5 group min-w-0">
          <span className="brand-mark inline-block size-7 shrink-0" />
          <span className="font-display font-semibold tracking-wide text-sm truncate">
            Worship Hub
          </span>
        </Link>
        <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.14em] sm:tracking-[0.18em] px-1.5 sm:px-2 py-1 rounded border border-accent/35 bg-accent/10 text-accent font-semibold shrink-0">
          <span className="sm:hidden">Shared</span>
          <span className="hidden sm:inline">Shared · Read only</span>
        </span>
      </div>
    </header>
  );
}

function ShareFooter() {
  return (
    <footer className="pt-8 border-t border-border text-xs text-muted-foreground flex items-center justify-between flex-wrap gap-2 print:hidden">
      <span>
        Shared from{" "}
        <Link href="/" className="text-accent hover:underline">
          Worship Hub
        </Link>
      </span>
      <span>This link is read-only.</span>
    </footer>
  );
}

async function SongShare({
  admin,
  id,
}: {
  admin: ReturnType<typeof createServiceClient>;
  id: string;
}) {
  const { data: song } = await admin
    .from("songs")
    .select("title, artist, original_key, bpm, chordpro_body")
    .eq("id", id)
    .maybeSingle();
  if (!song) notFound();

  return (
    <>
      <div className="space-y-3">
        <p className="eyebrow flex items-center gap-1.5">
          <Music className="size-3" /> Chord chart
        </p>
        <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight leading-tight">
          {song.title}
        </h1>
        <div className="flex flex-wrap gap-x-3 gap-y-1 items-center text-sm text-muted-foreground">
          {song.artist && <span>{song.artist}</span>}
          {song.original_key && (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1 rounded-full bg-accent" />
              Key {song.original_key}
            </span>
          )}
          {song.bpm && (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1 rounded-full bg-primary" />
              {song.bpm} BPM
            </span>
          )}
        </div>
      </div>
      <ChordViewer
        body={song.chordpro_body}
        initialHtml={renderTransposedHtml(song.chordpro_body, 0)}
        persistKey={`shared:${id}`}
        originalKey={song.original_key}
      />
    </>
  );
}

async function SetlistShare({
  admin,
  id,
}: {
  admin: ReturnType<typeof createServiceClient>;
  id: string;
}) {
  const { data: setlist } = await admin
    .from("setlists")
    .select("service_date, theme")
    .eq("id", id)
    .maybeSingle();
  if (!setlist) notFound();

  const { data: rows } = await admin
    .from("setlist_songs")
    .select("song_id, played_in_key, position, songs(title, artist, original_key)")
    .eq("setlist_id", id)
    .order("position");

  return (
    <>
      <div className="space-y-3">
        <p className="eyebrow flex items-center gap-1.5">
          <ListMusic className="size-3" /> Setlist
        </p>
        <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight leading-tight">
          {fmt(setlist.service_date)}
        </h1>
        {setlist.theme && <p className="text-foreground/80">{setlist.theme}</p>}
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Calendar className="size-3" />{" "}
          {new Date(setlist.service_date).toLocaleDateString(undefined, {
            weekday: "long",
          })}
        </p>
      </div>

      <ol className="space-y-1.5">
        {(rows ?? []).map((r, i) => {
          const song = r.songs as {
            title?: string;
            artist?: string | null;
            original_key?: string | null;
          } | null;
          return (
            <li
              key={r.song_id}
              className="glass p-4 flex items-center gap-3"
            >
              <span className="font-mono text-xs tabular-nums text-muted-foreground w-6 text-center">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-base text-foreground/95">
                  {song?.title ?? "(deleted)"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {song?.artist}
                  {song?.artist && (r.played_in_key || song?.original_key) && " · "}
                  {r.played_in_key
                    ? `Key ${r.played_in_key}`
                    : song?.original_key
                      ? `Key ${song.original_key}`
                      : ""}
                </div>
              </div>
              {(r.played_in_key || song?.original_key) && (
                <span className="font-mono text-xs px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20">
                  {r.played_in_key ?? song?.original_key}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}
