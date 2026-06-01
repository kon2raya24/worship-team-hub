import { Megaphone, Pin } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isLeader } from "@/lib/auth";
import { SubmitButton } from "@/components/submit-button";
import { TextSubmit } from "@/components/text-submit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import {
  createAnnouncement,
  deleteAnnouncement,
  togglePin,
} from "./actions";

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
    <div className="space-y-6 fade-in max-w-3xl">
      <PageHeader
        icon={Megaphone}
        title="Announcements"
        subtitle={`${(items ?? []).length} post${
          (items ?? []).length === 1 ? "" : "s"
        }`}
      />

      {canEdit && (
        <form action={createAnnouncement} className="glass p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">
              Body{" "}
              <span className="font-normal text-muted-foreground">· markdown supported</span>
            </Label>
            <Textarea id="body" name="body" rows={3} required className="resize-none" />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input
              type="checkbox"
              name="pinned"
              className="size-4 rounded border-hairline-strong bg-tint-1 accent-primary"
            />
            Pin to dashboard
          </label>
          <SubmitButton pendingLabel="Posting…">Post</SubmitButton>
        </form>
      )}

      <ul className="space-y-3">
        {(items ?? []).map((a) => {
          const author =
            (a.profiles as { display_name?: string } | null)?.display_name ??
            "Team";
          return (
            <li key={a.id} className="glass p-4">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="font-display text-base font-semibold flex items-center gap-2 text-foreground/95">
                    {a.title}
                    {a.pinned && (
                      <span className="inline-flex items-center gap-1 text-chart-3 text-[10px] font-mono uppercase tracking-wider">
                        <Pin className="size-3" /> Pinned
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {author} · {new Date(a.created_at).toLocaleDateString()}
                  </div>
                  <div className="prose dark:prose-invert prose-sm max-w-none mt-2 prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground/85 prose-li:text-foreground/85 prose-strong:text-foreground prose-a:text-accent">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{a.body}</ReactMarkdown>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-3 shrink-0">
                    <form action={togglePin.bind(null, a.id, a.pinned)}>
                      <TextSubmit pendingLabel="…">
                        {a.pinned ? "Unpin" : "Pin"}
                      </TextSubmit>
                    </form>
                    <form action={deleteAnnouncement.bind(null, a.id)}>
                      <TextSubmit danger pendingLabel="…">Delete</TextSubmit>
                    </form>
                  </div>
                )}
              </div>
            </li>
          );
        })}
        {(items ?? []).length === 0 && (
          <li className="glass p-8 text-center text-muted-foreground">
            No announcements yet.
          </li>
        )}
      </ul>
    </div>
  );
}
