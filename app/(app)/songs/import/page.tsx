import Link from "next/link";
import { Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { requireLeader } from "@/lib/auth";
import { SubmitButton } from "@/components/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { ShareReceiver } from "@/components/share-receiver";
import { Suspense } from "react";
import { importSongs } from "./actions";

type SearchParams = Promise<{
  error?: string;
  added?: string;
  skipped?: string;
}>;

export default async function ImportSongsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireLeader();
  const { error, added, skipped } = await searchParams;

  return (
    <div className="space-y-6 fade-in max-w-3xl">
      <PageHeader
        icon={Upload}
        title="Bulk import songs"
        subtitle="Paste one or many ChordPro blocks. Each becomes a song."
        back={{ href: "/songs", label: "Songs" }}
      />

      {added && (
        <div className="glass p-4 flex items-start gap-3 border border-chart-5/30">
          <CheckCircle2 className="size-5 text-chart-5 mt-0.5 shrink-0" />
          <div className="text-sm">
            <div className="font-semibold text-foreground/95">
              Imported {added} song{added === "1" ? "" : "s"}.
            </div>
            {skipped && skipped !== "0" && (
              <div className="text-muted-foreground mt-0.5">
                Skipped {skipped} duplicate{skipped === "1" ? "" : "s"} by title.
              </div>
            )}
            <Link
              href="/songs"
              className="text-accent hover:underline mt-2 inline-block"
            >
              See the library →
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="glass p-4 flex items-start gap-3 border border-destructive/30">
          <AlertTriangle className="size-5 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Suspense fallback={null}>
        <ShareReceiver textareaId="paste" />
      </Suspense>

      <form action={importSongs} className="glass p-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="paste">Paste chord chart</Label>
          <Textarea
            id="paste"
            name="paste"
            rows={18}
            required
            placeholder={`Accepts either format.

— ChordPro (inline) —
{title: Song Title}
{artist: Artist Name}
{key: G}

A[G]mazing how [C]sweet the [G]sound...

— Chord-over-lyrics (auto-converted) —
{title: Song Title}
{artist: Artist Name}
{key: G}

[Verse 1]
    G            C        G
Paste lyrics with chord lines above.

Multiple songs? Separate them with a line of ---`}
            className="font-mono text-sm resize-y bg-background/40"
          />
          <p className="text-xs text-muted-foreground">
            Multiple songs? Separate them with a line containing only{" "}
            <code className="text-accent">---</code>, or each block starts
            with its own <code className="text-accent">{`{title: ...}`}</code> directive.
          </p>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input
              type="checkbox"
              name="auto_convert"
              defaultChecked
              className="size-4 rounded border-border bg-tint-1 accent-primary"
            />
            Auto-convert &ldquo;chord-above-lyrics&rdquo; format to ChordPro
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input
              type="checkbox"
              name="skip_existing"
              defaultChecked
              className="size-4 rounded border-border bg-tint-1 accent-primary"
            />
            Skip songs whose title already exists
          </label>
        </div>

        <SubmitButton pendingLabel="Importing…" className="gap-1.5">
          <Upload className="size-4" /> Import
        </SubmitButton>
      </form>

      {/* Reminder */}
      <div className="glass p-4 text-sm text-foreground/80">
        <strong className="text-foreground/95">Where to get chord charts:</strong>{" "}
        Your church&apos;s <strong>CCLI SongSelect</strong> subscription provides ChordPro/text downloads for almost every modern worship song.{" "}
        <a
          href="https://songselect.ccli.com"
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          songselect.ccli.com
        </a>{" "}
        — pick a song → Chords → Copy. For public-domain hymns, try{" "}
        <a
          href="https://hymnary.org"
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          hymnary.org
        </a>.
      </div>
    </div>
  );
}
