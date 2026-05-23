import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isLeader } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SetlistSongs, type SetlistSongRow } from "@/components/setlist-songs";
import { ShareButton } from "@/components/share-button";
import { addSongToSetlist, deleteSetlist } from "../actions";

type Params = Promise<{ id: string }>;

function fmt(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function SetlistDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const profile = await requireProfile();
  const canEdit = isLeader(profile);
  const supabase = await createClient();

  const { data: setlist } = await supabase
    .from("setlists")
    .select("id, service_date, theme, notes")
    .eq("id", id)
    .maybeSingle();

  if (!setlist) notFound();

  const { data: setlistSongs } = await supabase
    .from("setlist_songs")
    .select("song_id, played_in_key, position, songs(title, artist, original_key)")
    .eq("setlist_id", id)
    .order("position", { ascending: true });

  const rows: SetlistSongRow[] = (setlistSongs ?? []).map((r) => {
    const song = r.songs as { title?: string; artist?: string | null; original_key?: string | null } | null;
    return {
      song_id: r.song_id,
      played_in_key: r.played_in_key,
      title: song?.title ?? "(deleted)",
      artist: song?.artist ?? null,
      original_key: song?.original_key ?? null,
    };
  });

  const { data: allSongs } = canEdit
    ? await supabase.from("songs").select("id, title, original_key").order("title")
    : { data: [] };

  const existingIds = new Set(rows.map((r) => r.song_id));
  const availableSongs = (allSongs ?? []).filter((s) => !existingIds.has(s.id));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap print:hidden">
        <div>
          <Link href="/setlists" className="text-sm text-zinc-500 hover:underline">
            ← Setlists
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{fmt(setlist.service_date)}</h1>
          {setlist.theme && <p className="text-zinc-500">{setlist.theme}</p>}
        </div>
        {canEdit && (
          <div className="flex flex-col gap-2 items-stretch min-w-[18rem]">
            <div className="flex gap-2 justify-end">
              <Link
                href={`/setlists/${id}/edit`}
                className={buttonVariants({ variant: "outline" })}
              >
                Edit details
              </Link>
              <form action={deleteSetlist.bind(null, id)}>
                <Button
                  type="submit"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </form>
            </div>
            <ShareButton resourceType="setlist" resourceId={id} />
          </div>
        )}
      </div>

      {setlist.notes && (
        <div className="border rounded-md p-3 text-sm whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-900">
          {setlist.notes}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Songs</h2>
        <SetlistSongs setlistId={id} songs={rows} canEdit={canEdit} />
      </section>

      {canEdit && availableSongs.length > 0 && (
        <>
          <Separator />
          <section className="space-y-3 print:hidden">
            <h2 className="text-lg font-medium">Add a song</h2>
            <form action={addSongToSetlist.bind(null, id)} className="flex flex-wrap gap-2 items-end">
              <div className="space-y-1.5 flex-1 min-w-[16rem]">
                <Label htmlFor="song_id">Song</Label>
                <select
                  id="song_id"
                  name="song_id"
                  required
                  className="w-full border rounded-md p-2 text-sm bg-transparent h-9"
                >
                  <option value="">Select…</option>
                  {availableSongs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} {s.original_key ? `(${s.original_key})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="played_in_key">Play in key (optional)</Label>
                <Input id="played_in_key" name="played_in_key" placeholder="e.g. A" className="w-32" />
              </div>
              <Button type="submit">Add</Button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
