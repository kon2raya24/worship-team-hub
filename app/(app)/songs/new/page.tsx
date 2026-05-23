import { Music } from "lucide-react";
import { requireLeader } from "@/lib/auth";
import { createSong } from "../actions";
import { SongForm } from "@/components/song-form";
import { PageHeader } from "@/components/page-header";

export default async function NewSongPage() {
  await requireLeader();

  return (
    <div className="space-y-6 fade-in max-w-3xl">
      <PageHeader
        icon={Music}
        title="New song"
        subtitle="Add a song to the library"
        back={{ href: "/songs", label: "Songs" }}
      />
      <div className="glass p-6">
        <SongForm action={createSong} submitLabel="Create song" />
      </div>
    </div>
  );
}
