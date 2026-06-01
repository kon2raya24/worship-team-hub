import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ListMusic, Plus, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isLeader } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SetlistSongs, type SetlistSongRow } from "@/components/setlist-songs";
import { ShareButton } from "@/components/share-button";
import { FormSelect } from "@/components/form-select";
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

  const { data: allSongs } = canEdit
    ? await supabase.from("songs").select("id, title, original_key").order("title")
    : { data: [] };

  const existingIds = new Set(rows.map((r) => r.song_id));
  const availableSongs = (allSongs ?? []).filter((s) => !existingIds.has(s.id));

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="space-y-3 print:hidden">
        <Link
          href="/setlists"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3" /> Setlists
        </Link>
        <div className="min-w-0">
          <p className="eyebrow">Service</p>
          <h1 className="text-2xl md:text-4xl font-display font-semibold tracking-tight leading-tight mt-1">
            {fmt(setlist.service_date)}
          </h1>
          {setlist.theme && (
            <p className="text-foreground/80 mt-1">{setlist.theme}</p>
          )}
        </div>
        {canEdit && (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center pt-1">
            <div className="flex gap-2">
              <Link
                href={`/setlists/${id}/edit`}
                className={
                  buttonVariants({ variant: "outline", size: "sm" }) +
                  " flex-1 sm:flex-initial"
                }
              >
                Edit details
              </Link>
              <form
                action={deleteSetlist.bind(null, id)}
                className="flex-1 sm:flex-initial"
              >
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
              <ShareButton resourceType="setlist" resourceId={id} />
            </div>
          </div>
        )}
      </div>

      {setlist.notes && (
        <div className="glass p-4 flex gap-3">
          <FileText className="size-4 text-chart-4 mt-0.5 shrink-0" />
          <p className="text-sm whitespace-pre-wrap text-foreground/85">
            {setlist.notes}
          </p>
        </div>
      )}

      <section className="glass p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ListMusic className="size-4 text-accent" />
          <h2 className="font-display font-semibold text-base">Songs</h2>
          <span className="ml-auto text-xs text-muted-foreground">
            {rows.length} song{rows.length === 1 ? "" : "s"}
          </span>
        </div>
        <SetlistSongs setlistId={id} songs={rows} canEdit={canEdit} />
      </section>

      {canEdit && availableSongs.length > 0 && (
        <section className="glass p-5 space-y-4 print:hidden">
          <div className="flex items-center gap-2">
            <Plus className="size-4 text-primary" />
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
      )}
    </div>
  );
}
