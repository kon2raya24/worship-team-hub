"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function s(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

export async function addPrayer(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const body = s(formData.get("body"));
  if (!body) return;

  const { error } = await supabase
    .from("prayer_requests")
    .insert({ author_id: user.id, body });
  if (error) throw new Error(error.message);
  revalidatePath("/prayer");
}

export async function togglePrayer(id: string, currentlyAnswered: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("prayer_requests")
    .update({ is_answered: !currentlyAnswered })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/prayer");
}

export async function deletePrayer(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("prayer_requests").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/prayer");
}
