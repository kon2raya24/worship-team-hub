import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isLeader } from "@/lib/auth";
import { ChordViewer } from "@/components/chord-viewer";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShareButton } from "@/components/share-button";
import { addSongNote, deleteSongNote, deleteSong } from "../actions";

type Params = Promise<{ id: string }>;

export default async function SongDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: song } = await supabase
    .from("songs")
    .select("id, title, artist, original_key, bpm, tags, chordpro_body, reference_url")
    .eq("id", id)
    .maybeSingle();

  if (!song) notFound();

  const { data: notes } = await supabase
    .from("song_notes")
    .select("id, body, created_at, author_id, profiles(display_name)")
    .eq("song_id", id)
    .order("created_at", { ascending: false });

  const addNote = addSongNote.bind(null, id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap print:hidden">
        <div>
          <Link href="/songs" className="text-sm text-zinc-500 hover:underline">
            ← Songs
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{song.title}</h1>
          <div className="text-zinc-500 text-sm flex gap-3 flex-wrap mt-1">
            {song.artist && <span>{song.artist}</span>}
            {song.original_key && <span>Key {song.original_key}</span>}
            {song.bpm && <span>{song.bpm} BPM</span>}
            {song.reference_url && (
              <a
                href={song.reference_url}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Reference
              </a>
            )}
          </div>
          <div className="flex gap-1 mt-2">
            {(song.tags ?? []).map((t: string) => (
              <Badge key={t} variant="outline">
                {t}
              </Badge>
            ))}
          </div>
        </div>
        {isLeader(profile) && (
          <div className="flex flex-col gap-2 items-stretch">
            <div className="flex gap-2 justify-end">
              <Link
                href={`/songs/${song.id}/edit`}
                className={buttonVariants({ variant: "outline" })}
              >
                Edit
              </Link>
              <form action={deleteSong.bind(null, song.id)}>
                <Button
                  type="submit"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </form>
            </div>
            <ShareButton resourceType="song" resourceId={song.id} />
          </div>
        )}
      </div>

      <ChordViewer body={song.chordpro_body} />

      <Separator className="print:hidden" />

      <section className="space-y-3 print:hidden">
        <h2 className="text-lg font-medium">Practice notes</h2>

        <form action={addNote} className="space-y-2">
          <textarea
            name="body"
            rows={2}
            required
            placeholder="Add a note (e.g. slow intro, build at chorus)"
            className="w-full border rounded-md p-2 text-sm bg-transparent"
          />
          <Button type="submit" size="sm">
            Add note
          </Button>
        </form>

        <div className="space-y-2">
          {(notes ?? []).map((n) => {
            const authorName =
              (n.profiles as { display_name?: string } | null)?.display_name ?? "Team";
            const canDelete = n.author_id === profile.id || isLeader(profile);
            return (
              <div
                key={n.id}
                className="border rounded-md p-3 text-sm flex justify-between gap-3"
              >
                <div>
                  <div className="text-zinc-500 text-xs">
                    {authorName} ·{" "}
                    {new Date(n.created_at).toLocaleDateString()}
                  </div>
                  <div className="whitespace-pre-wrap">{n.body}</div>
                </div>
                {canDelete && (
                  <form action={deleteSongNote.bind(null, n.id, id)}>
                    <button
                      type="submit"
                      className="text-xs text-zinc-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </form>
                )}
              </div>
            );
          })}
          {(notes ?? []).length === 0 && (
            <p className="text-sm text-zinc-500">No notes yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
