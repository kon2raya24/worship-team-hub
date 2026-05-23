"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireLeader } from "@/lib/auth";

function parseTags(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

function s(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

export async function createSong(formData: FormData) {
  const leader = await requireLeader();
  const supabase = await createClient();

  const title = s(formData.get("title"));
  if (!title) throw new Error("Title is required");

  const bpmRaw = s(formData.get("bpm"));
  const bpm = bpmRaw ? Number(bpmRaw) : null;

  const { data, error } = await supabase
    .from("songs")
    .insert({
      title,
      artist: s(formData.get("artist")),
      original_key: s(formData.get("original_key")),
      bpm: Number.isFinite(bpm as number) ? bpm : null,
      tags: parseTags(formData.get("tags")),
      chordpro_body: s(formData.get("chordpro_body")) ?? "",
      reference_url: s(formData.get("reference_url")),
      created_by: leader.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/songs");
  redirect(`/songs/${data.id}`);
}

export async function updateSong(id: string, formData: FormData) {
  await requireLeader();
  const supabase = await createClient();

  const title = s(formData.get("title"));
  if (!title) throw new Error("Title is required");

  const bpmRaw = s(formData.get("bpm"));
  const bpm = bpmRaw ? Number(bpmRaw) : null;

  const { error } = await supabase
    .from("songs")
    .update({
      title,
      artist: s(formData.get("artist")),
      original_key: s(formData.get("original_key")),
      bpm: Number.isFinite(bpm as number) ? bpm : null,
      tags: parseTags(formData.get("tags")),
      chordpro_body: s(formData.get("chordpro_body")) ?? "",
      reference_url: s(formData.get("reference_url")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/songs");
  revalidatePath(`/songs/${id}`);
  redirect(`/songs/${id}`);
}

export async function deleteSong(id: string) {
  await requireLeader();
  const supabase = await createClient();
  const { error } = await supabase.from("songs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/songs");
  redirect("/songs");
}

export async function addSongNote(songId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const body = s(formData.get("body"));
  if (!body) return;

  const { error } = await supabase.from("song_notes").insert({
    song_id: songId,
    author_id: user.id,
    body,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/songs/${songId}`);
}

export async function deleteSongNote(noteId: string, songId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("song_notes").delete().eq("id", noteId);
  if (error) throw new Error(error.message);
  revalidatePath(`/songs/${songId}`);
}
