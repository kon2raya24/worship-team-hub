"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireLeader } from "@/lib/auth";

function s(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

export async function createAnnouncement(formData: FormData) {
  const leader = await requireLeader();
  const supabase = await createClient();

  const title = s(formData.get("title"));
  const body = s(formData.get("body"));
  if (!title || !body) throw new Error("Title and body required");

  const { error } = await supabase.from("announcements").insert({
    title,
    body,
    pinned: formData.get("pinned") === "on",
    author_id: leader.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/announcements");
  revalidatePath("/");
}

export async function deleteAnnouncement(id: string) {
  await requireLeader();
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/announcements");
  revalidatePath("/");
}

export async function togglePin(id: string, currentlyPinned: boolean) {
  await requireLeader();
  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .update({ pinned: !currentlyPinned })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/announcements");
  revalidatePath("/");
}
