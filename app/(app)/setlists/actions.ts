"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireLeader } from "@/lib/auth";

function s(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

export async function createSetlist(formData: FormData) {
  const leader = await requireLeader();
  const supabase = await createClient();

  const service_date = s(formData.get("service_date"));
  if (!service_date) throw new Error("Service date is required");

  const { data, error } = await supabase
    .from("setlists")
    .insert({
      service_date,
      theme: s(formData.get("theme")),
      notes: s(formData.get("notes")),
      leader_id: leader.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/setlists");
  redirect(`/setlists/${data.id}`);
}

export async function updateSetlist(id: string, formData: FormData) {
  await requireLeader();
  const supabase = await createClient();
  const service_date = s(formData.get("service_date"));
  if (!service_date) throw new Error("Service date is required");

  const { error } = await supabase
    .from("setlists")
    .update({
      service_date,
      theme: s(formData.get("theme")),
      notes: s(formData.get("notes")),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/setlists");
  revalidatePath(`/setlists/${id}`);
}

export async function deleteSetlist(id: string) {
  await requireLeader();
  const supabase = await createClient();
  const { error } = await supabase.from("setlists").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/setlists");
  redirect("/setlists");
}

export async function addSongToSetlist(setlistId: string, formData: FormData) {
  await requireLeader();
  const supabase = await createClient();

  const song_id = s(formData.get("song_id"));
  if (!song_id) throw new Error("Pick a song");

  const { data: existing } = await supabase
    .from("setlist_songs")
    .select("position")
    .eq("setlist_id", setlistId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPos = (existing?.position ?? 0) + 1;
  const played_in_key = s(formData.get("played_in_key"));

  const { error } = await supabase.from("setlist_songs").insert({
    setlist_id: setlistId,
    song_id,
    played_in_key,
    position: nextPos,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/setlists/${setlistId}`);
}

export async function removeSongFromSetlist(setlistId: string, songId: string) {
  await requireLeader();
  const supabase = await createClient();
  const { error } = await supabase
    .from("setlist_songs")
    .delete()
    .eq("setlist_id", setlistId)
    .eq("song_id", songId);
  if (error) throw new Error(error.message);
  revalidatePath(`/setlists/${setlistId}`);
}

export async function reorderSetlistSongs(
  setlistId: string,
  orderedSongIds: string[]
) {
  await requireLeader();
  const supabase = await createClient();

  // Validate: every song_id the client sent must already belong to this setlist,
  // otherwise the corresponding UPDATE silently no-ops and the client's
  // optimistic UI diverges from the DB.
  const { data: existing, error: existingErr } = await supabase
    .from("setlist_songs")
    .select("song_id")
    .eq("setlist_id", setlistId);
  if (existingErr) throw new Error(existingErr.message);
  const existingIds = new Set((existing ?? []).map((r) => r.song_id));
  for (const id of orderedSongIds) {
    if (!existingIds.has(id))
      throw new Error("Reorder failed: a song is no longer in this setlist");
  }
  if (orderedSongIds.length !== existingIds.size) {
    throw new Error("Reorder failed: the setlist has changed, please refresh");
  }

  const results = await Promise.all(
    orderedSongIds.map((songId, index) =>
      supabase
        .from("setlist_songs")
        .update({ position: index + 1 })
        .eq("setlist_id", setlistId)
        .eq("song_id", songId)
    )
  );
  const firstErr = results.find((r) => r.error);
  if (firstErr?.error) throw new Error(firstErr.error.message);

  revalidatePath(`/setlists/${setlistId}`);
}
