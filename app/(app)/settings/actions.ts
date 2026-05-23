"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

function parseInstruments(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function s(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

export async function updateProfile(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const display_name = s(formData.get("display_name"));
  if (!display_name) throw new Error("Display name required");

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name,
      instruments: parseInstruments(formData.get("instruments")),
    })
    .eq("id", profile.id);

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/", "layout");
}

export async function changePassword(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    redirect("/settings?error=Password%20must%20be%20at%20least%208%20characters");
  }
  if (password !== confirm) {
    redirect("/settings?error=Passwords%20don%27t%20match");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/settings?passwordChanged=1");
}
