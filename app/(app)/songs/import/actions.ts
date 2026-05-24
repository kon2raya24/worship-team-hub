"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireLeader } from "@/lib/auth";
import { parseSingleChordPro, splitChordProBlocks } from "@/lib/chordpro-parse";

export async function importSongs(formData: FormData) {
  const leader = await requireLeader();
  const supabase = await createClient();

  const raw = String(formData.get("paste") ?? "").trim();
  if (!raw) {
    redirect("/songs/import?error=Paste%20is%20empty");
  }

  const skipExisting = formData.get("skip_existing") === "on";

  const blocks = splitChordProBlocks(raw);
  const parsed = blocks
    .map(parseSingleChordPro)
    .filter((p) => p.body.length > 0);

  if (parsed.length === 0) {
    redirect("/songs/import?error=Couldn%27t%20parse%20anything");
  }

  // Existing titles (case-insensitive).
  let skipped = 0;
  let toInsert = parsed.map((p) => ({
    title: p.title?.trim() || "Untitled",
    artist: p.artist,
    original_key: p.original_key,
    bpm: p.bpm,
    chordpro_body: p.body,
    tags: ["imported"],
    created_by: leader.id,
  }));

  if (skipExisting) {
    const titles = toInsert.map((s) => s.title);
    const { data: existing } = await supabase
      .from("songs")
      .select("title")
      .in("title", titles);
    const have = new Set((existing ?? []).map((s) => s.title.toLowerCase()));
    const before = toInsert.length;
    toInsert = toInsert.filter((s) => !have.has(s.title.toLowerCase()));
    skipped = before - toInsert.length;
  }

  if (toInsert.length === 0) {
    redirect(`/songs/import?skipped=${skipped}&added=0`);
  }

  const { data, error } = await supabase
    .from("songs")
    .insert(toInsert)
    .select("id");

  if (error) {
    redirect(`/songs/import?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/songs");
  redirect(`/songs/import?added=${data.length}&skipped=${skipped}`);
}
