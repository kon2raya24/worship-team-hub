"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createStandaloneClient } from "@supabase/supabase-js";
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

  const currentPassword = String(formData.get("current_password") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!currentPassword) {
    redirect("/settings?error=Enter%20your%20current%20password");
  }
  if (password.length < 8) {
    redirect("/settings?error=Password%20must%20be%20at%20least%208%20characters");
  }
  if (password !== confirm) {
    redirect("/settings?error=Passwords%20don%27t%20match");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    redirect("/settings?error=Couldn%27t%20verify%20your%20account");
  }

  // Reauthenticate with the current password before changing it. Use a
  // throwaway client (no session persistence) so this sign-in check doesn't
  // touch the live session cookies. A wrong current password is rejected,
  // so a borrowed/unlocked session can't silently change the password.
  const verifier = createStandaloneClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { error: reauthError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (reauthError) {
    redirect("/settings?error=Current%20password%20is%20incorrect");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/settings?passwordChanged=1");
}

export async function savePushSubscription(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint: sub.endpoint,
      user_id: profile.id,
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
    { onConflict: "endpoint" },
  );
  if (error) throw new Error(error.message);
}

export async function deletePushSubscription(endpoint: string) {
  await requireProfile();
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}
