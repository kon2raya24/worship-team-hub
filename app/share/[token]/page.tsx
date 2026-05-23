import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { ChordViewer } from "@/components/chord-viewer";

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
  if (link.expires_at && new Date(link.expires_at) < new Date()) notFound();

  if (link.resource_type === "song") {
    const { data: song } = await admin
      .from("songs")
      .select("title, artist, original_key, bpm, chordpro_body")
      .eq("id", link.resource_id)
      .maybeSingle();
    if (!song) notFound();

    return (
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">{song.title}</h1>
          <div className="text-zinc-500 text-sm flex gap-3 flex-wrap mt-1">
            {song.artist && <span>{song.artist}</span>}
            {song.original_key && <span>Key {song.original_key}</span>}
            {song.bpm && <span>{song.bpm} BPM</span>}
          </div>
        </header>
        <ChordViewer body={song.chordpro_body} />
        <Footer />
      </main>
    );
  }

  const { data: setlist } = await admin
    .from("setlists")
    .select("service_date, theme, notes")
    .eq("id", link.resource_id)
    .maybeSingle();
  if (!setlist) notFound();

  const { data: rows } = await admin
    .from("setlist_songs")
    .select("song_id, played_in_key, position, songs(title, artist, original_key)")
    .eq("setlist_id", link.resource_id)
    .order("position");

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{fmt(setlist.service_date)}</h1>
        {setlist.theme && <p className="text-zinc-500">{setlist.theme}</p>}
      </header>
      {setlist.notes && (
        <div className="border rounded-md p-3 text-sm whitespace-pre-wrap">{setlist.notes}</div>
      )}
      <ol className="space-y-1 list-decimal list-inside">
        {(rows ?? []).map((r) => {
          const song = r.songs as {
            title?: string;
            artist?: string | null;
            original_key?: string | null;
          } | null;
          return (
            <li key={r.song_id}>
              <span className="font-medium">{song?.title ?? "(deleted)"}</span>
              <span className="text-zinc-500 text-sm">
                {r.played_in_key
                  ? ` · key ${r.played_in_key}`
                  : song?.original_key
                  ? ` · key ${song.original_key}`
                  : ""}
                {song?.artist ? ` · ${song.artist}` : ""}
              </span>
            </li>
          );
        })}
      </ol>
      <Footer />
    </main>
  );
}

function Footer() {
  return (
    <footer className="text-xs text-zinc-400 pt-8 border-t mt-8">
      Shared from <Link href="/" className="underline">Worship Hub</Link> · read-only
    </footer>
  );
}
