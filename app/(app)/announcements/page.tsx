import { createClient } from "@/lib/supabase/server";
import { requireProfile, isLeader } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createAnnouncement, deleteAnnouncement, togglePin } from "./actions";

export default async function AnnouncementsPage() {
  const profile = await requireProfile();
  const canEdit = isLeader(profile);
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("announcements")
    .select("id, title, body, pinned, created_at, profiles(display_name)")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>

      {canEdit && (
        <form
          action={createAnnouncement}
          className="space-y-3 border rounded-md p-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">Body</Label>
            <Textarea id="body" name="body" rows={3} required />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="pinned" /> Pin to dashboard
          </label>
          <Button type="submit">Post</Button>
        </form>
      )}

      <ul className="space-y-3">
        {(items ?? []).map((a) => {
          const author =
            (a.profiles as { display_name?: string } | null)?.display_name ?? "Team";
          return (
            <li key={a.id} className="border rounded-md p-3">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {a.title}
                    {a.pinned && <Badge variant="secondary">Pinned</Badge>}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {author} · {new Date(a.created_at).toLocaleDateString()}
                  </div>
                  <p className="whitespace-pre-wrap mt-2 text-sm">{a.body}</p>
                </div>
                {canEdit && (
                  <div className="flex gap-2 shrink-0">
                    <form action={togglePin.bind(null, a.id, a.pinned)}>
                      <Button type="submit" size="sm" variant="outline">
                        {a.pinned ? "Unpin" : "Pin"}
                      </Button>
                    </form>
                    <form action={deleteAnnouncement.bind(null, a.id)}>
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
        {(items ?? []).length === 0 && (
          <li className="text-sm text-zinc-500">No announcements yet.</li>
        )}
      </ul>
    </div>
  );
}
