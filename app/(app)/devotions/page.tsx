import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isLeader } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Devotions</h1>
        {canEdit && (
          <Link href="/devotions/new" className={buttonVariants()}>
            New devotion
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>This week&apos;s reading plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentPlan ? (
            <>
              <p className="text-sm text-zinc-500">
                Week of {new Date(currentPlan.week_of).toLocaleDateString()}
              </p>
              <ul className="list-disc list-inside text-sm space-y-0.5">
                {currentPlan.passages.map((p: string) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              {currentPlan.notes && (
                <p className="text-sm whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                  {currentPlan.notes}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-zinc-500">No plan posted yet.</p>
          )}

          {canEdit && (
            <details className="text-sm">
              <summary className="cursor-pointer text-zinc-500">
                Add / update plan
              </summary>
              <form action={upsertBiblePlan} className="space-y-3 pt-3">
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
                  <Label htmlFor="passages">Passages (comma or newline separated)</Label>
                  <Textarea
                    id="passages"
                    name="passages"
                    rows={3}
                    placeholder="Psalm 23, John 14:1-6, Romans 8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={2} />
                </div>
                <Button type="submit" size="sm">
                  Save plan
                </Button>
              </form>
            </details>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Posts</h2>
        {(devotions ?? []).length === 0 ? (
          <p className="text-sm text-zinc-500">No devotions posted yet.</p>
        ) : (
          <ul className="space-y-2">
            {(devotions ?? []).map((d) => (
              <li key={d.id} className="border rounded-md p-3">
                <Link href={`/devotions/${d.id}`} className="font-medium hover:underline">
                  {d.title}
                </Link>
                <div className="text-xs text-zinc-500">
                  {d.scripture_ref ? `${d.scripture_ref} · ` : ""}
                  {new Date(d.published_at).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
