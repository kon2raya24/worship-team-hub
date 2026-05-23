import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";

type Song = {
  title: string;
  artist: string | null;
  original_key: string | null;
  bpm: number | null;
  tags: string[];
  chordpro_body: string;
  reference_url: string | null;
};

export function SongForm({
  action,
  song,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void> | void;
  song?: Song;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title *</Label>
          <Input id="title" name="title" required defaultValue={song?.title ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="artist">Artist</Label>
          <Input id="artist" name="artist" defaultValue={song?.artist ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="original_key">Original key</Label>
          <Input
            id="original_key"
            name="original_key"
            placeholder="e.g. G, Bb, F#m"
            defaultValue={song?.original_key ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bpm">BPM</Label>
          <Input
            id="bpm"
            name="bpm"
            type="number"
            min={20}
            max={300}
            defaultValue={song?.bpm ?? ""}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            name="tags"
            placeholder="e.g. worship, christmas, fast"
            defaultValue={(song?.tags ?? []).join(", ")}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="reference_url">Reference URL (YouTube / Spotify)</Label>
          <Input
            id="reference_url"
            name="reference_url"
            type="url"
            placeholder="https://"
            defaultValue={song?.reference_url ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="chordpro_body">ChordPro body</Label>
        <p className="text-xs text-zinc-500">
          Use <code>{`[Chord]`}</code> brackets above words, e.g.{" "}
          <code>{`Amazing [G]grace, how [D]sweet the [G]sound`}</code>. Directives like{" "}
          <code>{`{title: ...}`}</code> and <code>{`{key: G}`}</code> are supported.
        </p>
        <Textarea
          id="chordpro_body"
          name="chordpro_body"
          rows={18}
          className="font-mono text-sm"
          defaultValue={song?.chordpro_body ?? ""}
        />
      </div>

      <div className="flex gap-2">
        <SubmitButton pendingLabel="Saving…">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
