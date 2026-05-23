"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireLeader } from "@/lib/auth";

function s(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

export async function assignMember(formData: FormData) {
  await requireLeader();
  const supabase = await createClient();

  const service_date = s(formData.get("service_date"));
  const user_id = s(formData.get("user_id"));
  const role = s(formData.get("role"));
  if (!service_date || !user_id || !role) throw new Error("Missing field");

  const { error } = await supabase.from("schedule_assignments").insert({
    service_date,
    user_id,
    role,
  });
  if (error && !error.message.includes("duplicate")) throw new Error(error.message);
  revalidatePath("/schedule");
}

export async function unassign(id: string) {
  await requireLeader();
  const supabase = await createClient();
  const { error } = await supabase.from("schedule_assignments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/schedule");
}
