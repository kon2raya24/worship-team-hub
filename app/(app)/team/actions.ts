"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireLeader } from "@/lib/auth";

export async function setRole(userId: string, role: "leader" | "member") {
  const caller = await requireLeader();
  const supabase = await createClient();

  // Never let the team end up with zero leaders — there's no in-app recovery.
  // (The DB trigger in migration 0005 is the authoritative guard; this is for
  // a clear error message before we hit it.)
  if (role === "member") {
    if (userId === caller.id) {
      throw new Error("You can't remove your own editor access.");
    }
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "leader");
    if ((count ?? 0) <= 1) {
      throw new Error("At least one editor must remain.");
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/team");
}
