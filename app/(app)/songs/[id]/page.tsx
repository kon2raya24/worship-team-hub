import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, StickyNote } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isLeader } from "@/lib/auth";
import { ChordViewer } from "@/components/chord-viewer";
import { renderTransposedHtml } from "@/lib/chordpro";
import { MediaEmbed } from "@/components/media-embed";
import { buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { TextSubmit } from "@/components/text-submit";
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
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="space-y-3 print:hidden">
        <Link
          href="/songs"
          className="inline-flex items-center gap-1.5 text-xs text-[#8a92b4] hover:text-white transition-colors"
        >
          <ArrowLeft className="size-3" /> Songs
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl md:text-4xl font-display font-semibold tracking-tight leading-tight">
            {song.title}
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 items-center text-sm text-[#8a92b4]">
            {song.artist && <span>{song.artist}</span>}
            {song.original_key && (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-[#00e8ff]" />
                Key {song.original_key}
              </span>
            )}
            {song.bpm && (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-[#8b5cf6]" />
                {song.bpm} BPM
              </span>
            )}
            {song.reference_url && (
              <a
                href={song.reference_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#00e8ff] hover:underline"
              >
                Reference <ExternalLink className="size-3" />
              </a>
            )}
          </div>
          {(song.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {(song.tags ?? []).map((t: string) => (
                <span
                  key={t}
                  className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[#c8cee6]"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {isLeader(profile) && (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center pt-1">
            <div className="flex gap-2">
              <Link
                href={`/songs/${song.id}/edit`}
                className={buttonVariants({ variant: "outline", size: "sm" }) + " flex-1 sm:flex-initial"}
              >
                Edit
              </Link>
              <form action={deleteSong.bind(null, song.id)} className="flex-1 sm:flex-initial">
                <SubmitButton
                  size="sm"
                  variant="outline"
                  className="w-full text-red-400 hover:text-red-300"
                  pendingLabel="Deleting…"
                >
                  Delete
                </SubmitButton>
              </form>
            </div>
            <div className="sm:ml-auto sm:max-w-md sm:w-full">
              <ShareButton resourceType="song" resourceId={song.id} />
            </div>
          </div>
        )}
      </div>

      {isLeader(profile) &&
        (!song.chordpro_body || song.chordpro_body.trim().length < 40) && (
          <div className="glass p-4 flex items-start gap-3 border border-[#ffb547]/30 print:hidden">
            <span className="text-lg leading-none">✨</span>
            <div className="text-sm flex-1">
              <div className="font-semibold text-white/95">
                No chords yet — add them now.
              </div>
              <p className="text-[#c8cee6]/80 mt-0.5">
                Open <Link href={`/songs/${song.id}/edit`} className="text-[#00e8ff] hover:underline">Edit</Link>,
                paste a chord-above-lyrics chart into the body field, then click{" "}
                <span className="font-mono text-[#00e8ff]">Convert chord lines</span>.
              </p>
            </div>
          </div>
        )}

      <ChordViewer
        body={song.chordpro_body}
        initialHtml={renderTransposedHtml(song.chordpro_body, 0)}
        persistKey={song.id}
        originalKey={song.original_key}
      />

      {song.reference_url && <MediaEmbed url={song.reference_url} />}

      {/* Practice notes */}
      <section className="glass p-5 space-y-4 print:hidden">
        <div className="flex items-center gap-2">
          <StickyNote className="size-4 text-[#ffb547]" />
          <h2 className="font-display font-semibold text-base">Practice notes</h2>
          <span className="ml-auto text-xs text-[#8a92b4]">
            {(notes ?? []).length}
          </span>
        </div>

        <form action={addNote} className="space-y-2">
          <textarea
            name="body"
            rows={2}
            required
            placeholder="Add a note (e.g. slow intro, build at chorus)"
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] p-2.5 text-sm placeholder:text-[#8a92b4] focus:outline-none focus:border-[#8b5cf6]/40 focus:ring-2 focus:ring-[#8b5cf6]/20 transition-colors resize-none"
          />
          <SubmitButton size="sm" pendingLabel="Adding…">
            Add note
          </SubmitButton>
        </form>

        {(notes ?? []).length > 0 ? (
          <div className="space-y-2">
            {(notes ?? []).map((n) => {
              const authorName =
                (n.profiles as { display_name?: string } | null)?.display_name ??
                "Team";
              const canDelete = n.author_id === profile.id || isLeader(profile);
              return (
                <div
                  key={n.id}
                  className="rounded-lg bg-white/[0.025] border border-white/[0.06] p-3 text-sm flex justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-[#8a92b4] text-xs">
                      <span className="text-white/80">{authorName}</span> ·{" "}
                      {new Date(n.created_at).toLocaleDateString()}
                    </div>
                    <div className="whitespace-pre-wrap mt-1 text-white/90">
                      {n.body}
                    </div>
                  </div>
                  {canDelete && (
                    <form action={deleteSongNote.bind(null, n.id, id)}>
                      <TextSubmit danger pendingLabel="…">Delete</TextSubmit>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[#8a92b4]">No notes yet.</p>
        )}
      </section>
    </div>
  );
}
