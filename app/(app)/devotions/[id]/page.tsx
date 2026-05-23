import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isLeader } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { deleteDevotion } from "../actions";

type Params = Promise<{ id: string }>;

export default async function DevotionDetail({ params }: { params: Params }) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: devotion } = await supabase
    .from("devotions")
    .select("id, title, body, scripture_ref, published_at, profiles(display_name)")
    .eq("id", id)
    .maybeSingle();

  if (!devotion) notFound();

  const author =
    (devotion.profiles as { display_name?: string } | null)?.display_name ?? "Team";

  return (
    <article className="space-y-4 max-w-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/devotions" className="text-sm text-zinc-500 hover:underline">
            ← Devotions
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{devotion.title}</h1>
          <div className="text-xs text-zinc-500">
            {devotion.scripture_ref ? `${devotion.scripture_ref} · ` : ""}
            {author} · {new Date(devotion.published_at).toLocaleDateString()}
          </div>
        </div>
        {isLeader(profile) && (
          <form action={deleteDevotion.bind(null, id)}>
            <Button type="submit" variant="outline" className="text-red-600">
              Delete
            </Button>
          </form>
        )}
      </div>
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{devotion.body}</ReactMarkdown>
      </div>
    </article>
  );
}
