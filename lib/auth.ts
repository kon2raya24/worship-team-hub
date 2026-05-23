import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, role, instruments")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
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
