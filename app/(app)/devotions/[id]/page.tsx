import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookMarked } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isLeader } from "@/lib/auth";
import { SubmitButton } from "@/components/submit-button";
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
    (devotion.profiles as { display_name?: string } | null)?.display_name ??
    "Team";

  return (
    <article className="space-y-6 fade-in max-w-3xl">
      <div className="space-y-3">
        <Link
          href="/devotions"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3" /> Devotions
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            {devotion.scripture_ref && (
              <p className="eyebrow flex items-center gap-1.5">
                <BookMarked className="size-3" /> {devotion.scripture_ref}
              </p>
            )}
            <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight leading-tight mt-2">
              {devotion.title}
            </h1>
            <p className="text-xs text-muted-foreground mt-2">
              {author} ·{" "}
              {new Date(devotion.published_at).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          {isLeader(profile) && (
            <form action={deleteDevotion.bind(null, id)}>
              <SubmitButton
                variant="outline"
                className="text-red-400 hover:text-red-300"
                pendingLabel="Deleting…"
              >
                Delete
              </SubmitButton>
            </form>
          )}
        </div>
      </div>

      <div className="glass p-6 md:p-8 prose dark:prose-invert max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground/85 prose-li:text-foreground/85 prose-strong:text-foreground prose-a:text-accent prose-blockquote:border-l-[#8b5cf6] prose-blockquote:text-foreground/80 prose-blockquote:not-italic">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{devotion.body}</ReactMarkdown>
      </div>
    </article>
  );
}
