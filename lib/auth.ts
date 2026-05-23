import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type Role = "leader" | "member";

export type Profile = {
  id: string;
  display_name: string;
  role: Role;
  instruments: string[];
};

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, role, instruments")
    .eq("id", user.id)
    .maybeSingle();

  if (data) return data as Profile;

  if (error) {
    console.error("[getProfile] user-scoped query error:", error.message, error.code);
  }

  // Fallback: read with service role (bypasses any RLS/grant issues at this schema).
  // If the row exists, return it; otherwise create it (auto-heal for missing profiles).
  try {
    const admin = createServiceClient();
    const { data: existing } = await admin
      .from("profiles")
      .select("id, display_name, role, instruments")
      .eq("id", user.id)
      .maybeSingle();
    if (existing) return existing as Profile;

    const displayName =
      (user.user_metadata?.display_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "Member";
    const { data: inserted, error: insErr } = await admin
      .from("profiles")
      .insert({ id: user.id, display_name: displayName, role: "member" })
      .select("id, display_name, role, instruments")
      .single();
    if (insErr) {
      console.error("[getProfile] backfill failed:", insErr.message);
      return null;
    }
    return inserted as Profile;
  } catch (e) {
    console.error("[getProfile] admin fallback threw:", e);
    return null;
  }
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireLeader(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "leader") redirect("/");
  return profile;
}

export function isLeader(profile: Profile | null | undefined): boolean {
  return profile?.role === "leader";
}
