import { Heart, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isLeader } from "@/lib/auth";
import { SubmitButton } from "@/components/submit-button";
import { TextSubmit } from "@/components/text-submit";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { PrayerToggle } from "@/components/prayer-toggle";
import { addPrayer, deletePrayer } from "./actions";

export default async function PrayerPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("prayer_requests")
    .select("id, body, is_answered, created_at, author_id, profiles(display_name)")
    .order("is_answered", { ascending: true })
    .order("created_at", { ascending: false });

  const openCount = (requests ?? []).filter((r) => !r.is_answered).length;

  return (
    <div className="space-y-6 fade-in max-w-3xl">
      <PageHeader
        icon={Heart}
        title="Prayer wall"
        subtitle={`${openCount} open · ${(requests ?? []).length} total`}
      />

      <form action={addPrayer} className="glass p-5 space-y-3">
        <Textarea
          name="body"
          rows={3}
          required
          placeholder="What can the team pray about?"
          className="bg-white/[0.04] border-white/[0.1] resize-none"
        />
        <SubmitButton pendingLabel="Posting…">Post request</SubmitButton>
      </form>

      <ul className="space-y-3">
        {(requests ?? []).map((r) => {
          const author =
            (r.profiles as { display_name?: string } | null)?.display_name ??
            "Member";
          const canEdit = r.author_id === profile.id || isLeader(profile);
          return (
            <li
              key={r.id}
              className={`glass p-4 ${
                r.is_answered ? "opacity-60" : ""
              }`}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[#8a92b4] flex gap-2 items-center">
                    <span className="text-white/80">{author}</span>
                    <span>·</span>
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    {r.is_answered && (
                      <span className="inline-flex items-center gap-1 text-[#8eff6a] text-[10px] font-mono uppercase tracking-wider ml-1">
                        <CheckCircle2 className="size-3" /> Answered
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap mt-1.5 text-[15px] text-white/90 leading-relaxed">
                    {r.body}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex gap-3 shrink-0 items-center">
                    <PrayerToggle id={r.id} isAnswered={r.is_answered} />
                    <form action={deletePrayer.bind(null, r.id)}>
                      <TextSubmit danger pendingLabel="…">Delete</TextSubmit>
                    </form>
                  </div>
                )}
              </div>
            </li>
          );
        })}
        {(requests ?? []).length === 0 && (
          <li className="glass p-8 text-center text-[#8a92b4]">
            No prayer requests yet.
          </li>
        )}
      </ul>
    </div>
  );
}
