"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireLeader } from "@/lib/auth";

const BUCKET = "files";

function s(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function inferKind(mime: string): "audio" | "pdf" | "slide" | "midi" | "other" {
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "pdf";
  if (mime === "audio/midi" || mime === "audio/x-midi") return "midi";
  if (
    mime === "application/vnd.ms-powerpoint" ||
    mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  )
    return "slide";
  return "other";
}

export async function uploadFile(formData: FormData) {
  const leader = await requireLeader();
  const supabase = await createClient();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Pick a file");
  if (file.size > 50 * 1024 * 1024) throw new Error("Max file size is 50 MB");

  const displayName = s(formData.get("display_name")) ?? file.name;
  const songId = s(formData.get("song_id"));

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${leader.id}/${Date.now()}-${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

  const { error: insErr } = await supabase.from("files").insert({
    song_id: songId,
    storage_path: storagePath,
    kind: inferKind(file.type),
    display_name: displayName,
    uploaded_by: leader.id,
  });
  if (insErr) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw new Error(`Record failed: ${insErr.message}`);
  }

  revalidatePath("/files");
  if (songId) revalidatePath(`/songs/${songId}`);
}

export async function deleteFile(id: string) {
  await requireLeader();
  const supabase = await createClient();

  const { data: file } = await supabase
    .from("files")
    .select("storage_path, song_id")
    .eq("id", id)
    .single();
  if (!file) return;

  await supabase.storage.from(BUCKET).remove([file.storage_path]);
  await supabase.from("files").delete().eq("id", id);

  revalidatePath("/files");
  if (file.song_id) revalidatePath(`/songs/${file.song_id}`);
}

export async function getSignedUrl(storagePath: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 60 * 30);
  return data?.signedUrl ?? null;
}
