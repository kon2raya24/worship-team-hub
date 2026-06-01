import { notFound, redirect } from "next/navigation";
import { ListMusic, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireLeader } from "@/lib/auth";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { FormSelect } from "@/components/form-select";
import {
  SetlistSongs,
  type SetlistSongRow,
} from "@/components/setlist-songs";
import { updateSetlist, addSongToSetlist } from "../../actions";

type Params = Promise<{ id: string }>;

export default async function EditSetlistPage({ params }: { params: Params }) {
  await requireLeader();
  const { id } = await params;
  const supabase = await createClient();

  const { data: setlist } = await supabase
    .from("setlists")
    .select("service_date, theme, notes")
    .eq("id", id)
    .maybeSingle();

  if (!setlist) notFound();

  const { data: setlistSongs } = await supabase
    .from("setlist_songs")
    .select("song_id, played_in_key, position, songs(title, artist, original_key)")
    .eq("setlist_id", id)
    .order("position", { ascending: true });

  const rows: SetlistSongRow[] = (setlistSongs ?? []).map((r) => {
    const song = r.songs as {
      title?: string;
      artist?: string | null;
      original_key?: string | null;
    } | null;
    return {
      song_id: r.song_id,
      played_in_key: r.played_in_key,
      title: song?.title ?? "(deleted)",
      artist: song?.artist ?? null,
      original_key: song?.original_key ?? null,
    };
  });

  const { data: allSongs } = await supabase
    .from("songs")
    .select("id, title, original_key")
    .order("title");
  const existingIds = new Set(rows.map((r) => r.song_id));
  const availableSongs = (allSongs ?? []).filter((s) => !existingIds.has(s.id));

  async function save(formData: FormData) {
    "use server";
    await updateSetlist(id, formData);
    redirect(`/setlists/${id}`);
  }

  return (
    <div className="space-y-6 fade-in max-w-3xl">
      <PageHeader
        icon={ListMusic}
        title="Edit setlist"
        subtitle="Update details, reorder songs, or add new ones"
        back={{ href: `/setlists/${id}`, label: "Back to setlist" }}
      />

      {/* Details */}
      <form action={save} className="glass p-6 space-y-4">
        <h2 className="font-display font-semibold text-base">Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="service_date">Service date</Label>
            <Input
              id="service_date"
              name="service_date"
              type="date"
              required
              defaultValue={setlist.service_date}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="theme">Theme</Label>
            <Input id="theme" name="theme" defaultValue={setlist.theme ?? ""} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={setlist.notes ?? ""}
            className="resize-none"
          />
        </div>
        <SubmitButton pendingLabel="Saving…">Save details</SubmitButton>
      </form>

      {/* Songs */}
      <section className="glass p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ListMusic className="size-4 text-accent" />
          <h2 className="font-display font-semibold text-base">Songs</h2>
          <span className="ml-auto text-xs text-muted-foreground">
            {rows.length} song{rows.length === 1 ? "" : "s"}
          </span>
        </div>
        <SetlistSongs setlistId={id} songs={rows} canEdit />
      </section>

      {/* Add a song */}
      {availableSongs.length > 0 ? (
        <section className="glass p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Plus className="size-4 text-[#8b5cf6]" />
            <h2 className="font-display font-semibold text-base">Add a song</h2>
          </div>
          <form
            action={addSongToSetlist.bind(null, id)}
            className="grid sm:grid-cols-[1fr_140px_auto] gap-3 items-end"
          >
            <div className="space-y-1.5">
              <Label htmlFor="song_id">Song</Label>
              <FormSelect
                id="song_id"
                name="song_id"
                required
                placeholder="Select a song…"
                options={availableSongs.map((s) => ({
                  value: s.id,
                  label: `${s.title}${s.original_key ? ` (${s.original_key})` : ""}`,
                }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="played_in_key">Play in key</Label>
              <Input
                id="played_in_key"
                name="played_in_key"
                placeholder="e.g. A"
              />
            </div>
            <SubmitButton pendingLabel="Adding…">Add</SubmitButton>
          </form>
        </section>
      ) : (
        <p className="glass p-4 text-sm text-muted-foreground text-center">
          Every song in your library is already in this setlist.
        </p>
      )}
    </div>
  );
}
