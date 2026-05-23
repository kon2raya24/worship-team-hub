import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireLeader } from "@/lib/auth";
import { SongForm } from "@/components/song-form";
import { updateSong } from "../../actions";

type Params = Promise<{ id: string }>;

export default async function EditSongPage({ params }: { params: Params }) {
  await requireLeader();
  const { id } = await params;
  const supabase = await createClient();

  const { data: song } = await supabase
    .from("songs")
    .select("id, title, artist, original_key, bpm, tags, chordpro_body, reference_url")
    .eq("id", id)
    .maybeSingle();

  if (!song) notFound();

  const action = updateSong.bind(null, id);

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <Link
          href={`/songs/${id}`}
          className="text-sm text-zinc-500 hover:underline"
        >
          ← Back to song
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Edit song</h1>
      </div>
      <SongForm action={action} song={song} submitLabel="Save changes" />
    </div>
  );
}
