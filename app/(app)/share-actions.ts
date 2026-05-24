"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireLeader } from "@/lib/auth";

export async function createShareLink(
  resourceType: "song" | "setlist",
  resourceId: string
): Promise<string> {
  const leader = await requireLeader();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("share_links")
    .insert({
      resource_type: resourceType,
      resource_id: resourceId,
      created_by: leader.id,
    })
    .select("token")
    .single();

  if (error) throw new Error(error.message);
  if (!data?.token) throw new Error("Failed to create share link");
  revalidatePath(`/${resourceType}s/${resourceId}`);
  return data.token;
}

export async function revokeShareLink(token: string, resourceType: string, resourceId: string) {
  await requireLeader();
  const supabase = await createClient();
  const { error } = await supabase.from("share_links").delete().eq("token", token);
  if (error) throw new Error(error.message);
  revalidatePath(`/${resourceType}s/${resourceId}`);
}
