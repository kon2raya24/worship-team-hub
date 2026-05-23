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

export async function createDevotion(formData: FormData) {
  const leader = await requireLeader();
  const supabase = await createClient();

  const title = s(formData.get("title"));
  const body = s(formData.get("body"));
  if (!title || !body) throw new Error("Title and body required");

  const { data, error } = await supabase
    .from("devotions")
    .insert({
      title,
      body,
      scripture_ref: s(formData.get("scripture_ref")),
      author_id: leader.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/devotions");
  redirect(`/devotions/${data.id}`);
}

export async function deleteDevotion(id: string) {
  await requireLeader();
  const supabase = await createClient();
  const { error } = await supabase.from("devotions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/devotions");
  redirect("/devotions");
}

export async function upsertBiblePlan(formData: FormData) {
  await requireLeader();
  const supabase = await createClient();

  const week_of = s(formData.get("week_of"));
  const passages_raw = s(formData.get("passages"));
  if (!week_of) throw new Error("Week date required");

  const passages = (passages_raw ?? "")
    .split(/[,\n]/)
    .map((p) => p.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("bible_plan")
    .upsert(
      {
        week_of,
        passages,
        notes: s(formData.get("notes")),
      },
      { onConflict: "week_of" }
    );

  if (error) throw new Error(error.message);
  revalidatePath("/devotions");
}
