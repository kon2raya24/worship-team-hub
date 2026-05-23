import { notFound } from "next/navigation";
import { Music } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireLeader } from "@/lib/auth";
import { SongForm } from "@/components/song-form";
import { PageHeader } from "@/components/page-header";
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
    <div className="space-y-6 fade-in max-w-3xl">
      <PageHeader
        icon={Music}
        title={`Edit · ${song.title}`}
        back={{ href: `/songs/${id}`, label: "Back to song" }}
      />
      <div className="glass p-6">
        <SongForm action={action} song={song} submitLabel="Save changes" />
      </div>
    </div>
  );
}
