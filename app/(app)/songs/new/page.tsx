import Link from "next/link";
import { requireLeader } from "@/lib/auth";
import { createSong } from "../actions";
import { SongForm } from "@/components/song-form";

export default async function NewSongPage() {
  await requireLeader();

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <Link href="/songs" className="text-sm text-zinc-500 hover:underline">
          ← Songs
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New song</h1>
      </div>
      <SongForm action={createSong} submitLabel="Create song" />
    </div>
  );
}
