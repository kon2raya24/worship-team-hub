import Link from "next/link";
import { BookOpen, Plus, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isLeader } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { upsertBiblePlan } from "./actions";

function startOfWeek(): string {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export default async function DevotionsPage() {
  const profile = await requireProfile();
  const canEdit = isLeader(profile);
  const supabase = await createClient();

  const [{ data: devotions }, { data: plans }] = await Promise.all([
    supabase
      .from("devotions")
      .select("id, title, scripture_ref, published_at")
      .order("published_at", { ascending: false }),
    supabase
      .from("bible_plan")
      .select("id, week_of, passages, notes")
      .order("week_of", { ascending: false })
      .limit(4),
  ]);

  const currentPlan = (plans ?? [])[0];

  return (
    <div className="space-y-6 fade-in max-w-4xl">
      <PageHeader
        icon={BookOpen}
        title="Devotions"
        subtitle="Weekly readings and team devotionals"
        action={
          canEdit && (
            <Link
              href="/devotions/new"
              className={buttonVariants() + " gap-1.5"}
            >
              <Plus className="size-4" /> New devotion
            </Link>
          )
        }
      />

      <div className="glass p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-4 text-chart-4" />
          <p className="eyebrow">This week&apos;s reading plan</p>
        </div>
        {currentPlan ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Week of {new Date(currentPlan.week_of).toLocaleDateString()}
            </p>
            <ul className="space-y-1.5">
              {currentPlan.passages.map((p: string) => (
                <li
                  key={p}
                  className="text-[15px] text-foreground/90 flex items-start gap-2"
                >
                  <span className="text-accent mt-1">▸</span> {p}
                </li>
              ))}
            </ul>
            {currentPlan.notes && (
              <p className="text-sm whitespace-pre-wrap text-foreground/80 mt-2">
                {currentPlan.notes}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No plan posted yet.</p>
        )}

        {canEdit && (
          <details className="text-sm mt-4">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              {currentPlan ? "Update plan" : "Add plan"}
            </summary>
            <form action={upsertBiblePlan} className="space-y-3 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="week_of">Week of</Label>
                <Input
                  id="week_of"
                  name="week_of"
                  type="date"
                  required
                  defaultValue={startOfWeek()}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="passages">
                  Passages <span className="text-muted-foreground">(comma or newline separated)</span>
                </Label>
                <Textarea
                  id="passages"
                  name="passages"
                  rows={3}
                  placeholder="Psalm 23, John 14:1-6, Romans 8"
                  className="resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={2} className="resize-none" />
              </div>
              <SubmitButton size="sm" pendingLabel="Saving…">
                Save plan
              </SubmitButton>
            </form>
          </details>
        )}
      </div>

      <section className="space-y-2">
        <h2 className="eyebrow">Posts</h2>
        {(devotions ?? []).length === 0 ? (
          <p className="glass p-8 text-center text-muted-foreground">
            No devotions posted yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {(devotions ?? []).map((d) => (
              <li key={d.id} className="glass p-4 card-hover">
                <Link href={`/devotions/${d.id}`} className="block group/dev">
                  <div className="font-display font-semibold text-base text-foreground/95 group-hover/dev:text-accent transition-colors">
                    {d.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {d.scripture_ref ? `${d.scripture_ref} · ` : ""}
                    {new Date(d.published_at).toLocaleDateString()}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
