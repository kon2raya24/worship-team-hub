import { createClient } from "@/lib/supabase/server";
import { requireProfile, isLeader } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { addPrayer, togglePrayer, deletePrayer } from "./actions";

export default async function PrayerPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("prayer_requests")
    .select("id, body, is_answered, created_at, author_id, profiles(display_name)")
    .order("is_answered", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Prayer requests</h1>

      <form action={addPrayer} className="space-y-2">
        <Textarea
          name="body"
          rows={3}
          required
          placeholder="What can the team pray about?"
        />
        <Button type="submit">Post request</Button>
      </form>

      <ul className="space-y-2">
        {(requests ?? []).map((r) => {
          const author =
            (r.profiles as { display_name?: string } | null)?.display_name ?? "Member";
          const canEdit = r.author_id === profile.id || isLeader(profile);
          return (
            <li
              key={r.id}
              className={`border rounded-md p-3 ${
                r.is_answered ? "opacity-60 bg-zinc-50 dark:bg-zinc-900" : ""
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <div className="text-xs text-zinc-500 flex gap-2 items-center">
                    <span>{author}</span>
                    <span>·</span>
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    {r.is_answered && <Badge variant="secondary">Answered</Badge>}
                  </div>
                  <p className="whitespace-pre-wrap mt-1">{r.body}</p>
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <form action={togglePrayer.bind(null, r.id, r.is_answered)}>
                      <Button type="submit" size="sm" variant="outline">
                        {r.is_answered ? "Mark open" : "Mark answered"}
                      </Button>
                    </form>
                    <form action={deletePrayer.bind(null, r.id)}>
                      <Button
                        type="submit"
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                      >
                        Delete
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            </li>
          );
        })}
        {(requests ?? []).length === 0 && (
          <li className="text-sm text-zinc-500">No prayer requests yet.</li>
        )}
      </ul>
    </div>
  );
}
