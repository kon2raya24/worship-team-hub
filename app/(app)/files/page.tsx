import { Files as FilesIcon, FileAudio, FileText, Image as ImageIcon, Music2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isLeader } from "@/lib/auth";
import { SubmitButton } from "@/components/submit-button";
import { TextSubmit } from "@/components/text-submit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileLink } from "@/components/file-link";
import { PageHeader } from "@/components/page-header";
import { FormSelect } from "@/components/form-select";
import { uploadFile, deleteFile } from "./actions";

const kindIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  audio: FileAudio,
  pdf: FileText,
  slide: ImageIcon,
  midi: Music2,
  other: FilesIcon,
};

const kindColors: Record<string, string> = {
  audio: "text-[#00e8ff]",
  pdf: "text-[#ff3aa3]",
  slide: "text-[#ffb547]",
  midi: "text-[#8b5cf6]",
  other: "text-muted-foreground",
};

export default async function FilesPage() {
  const profile = await requireProfile();
  const canEdit = isLeader(profile);
  const supabase = await createClient();

  const [{ data: files }, { data: songs }] = await Promise.all([
    supabase
      .from("files")
      .select(
        "id, display_name, storage_path, kind, created_at, song_id, songs(title)"
      )
      .order("created_at", { ascending: false }),
    canEdit
      ? supabase.from("songs").select("id, title").order("title")
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  return (
    <div className="space-y-6 fade-in max-w-4xl">
      <PageHeader
        icon={FilesIcon}
        title="Files"
        subtitle={`${(files ?? []).length} item${
          (files ?? []).length === 1 ? "" : "s"
        }`}
      />

      {canEdit && (
        <form action={uploadFile} className="glass p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="file">File <span className="text-muted-foreground">(max 50 MB)</span></Label>
            <Input id="file" name="file" type="file" required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="display_name">Display name (optional)</Label>
              <Input
                id="display_name"
                name="display_name"
                placeholder="Leave blank to use filename"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="song_id">Attach to song (optional)</Label>
              <FormSelect
                id="song_id"
                name="song_id"
                defaultValue=""
                options={[
                  { value: "", label: "General library" },
                  ...(songs ?? []).map((s) => ({ value: s.id, label: s.title })),
                ]}
              />
            </div>
          </div>
          <SubmitButton pendingLabel="Uploading…" className="gap-1.5">
            <Upload className="size-4" /> Upload
          </SubmitButton>
        </form>
      )}

      <ul className="space-y-2">
        {(files ?? []).map((f) => {
          const songTitle =
            (f.songs as { title?: string } | null)?.title ?? null;
          const Icon = kindIcons[f.kind] ?? FilesIcon;
          const color = kindColors[f.kind] ?? "text-muted-foreground";
          return (
            <li
              key={f.id}
              className="glass p-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`inline-flex items-center justify-center size-9 rounded-lg bg-tint-1 ring-1 ring-border ${color}`}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <FileLink storagePath={f.storage_path} label={f.display_name} />
                  <div className="text-xs text-muted-foreground flex gap-2 items-center mt-0.5">
                    <span className="font-mono uppercase text-[10px] tracking-wider">
                      {f.kind}
                    </span>
                    {songTitle && <span>· {songTitle}</span>}
                    <span>· {new Date(f.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              {canEdit && (
                <form action={deleteFile.bind(null, f.id)}>
                  <TextSubmit danger pendingLabel="…">Delete</TextSubmit>
                </form>
              )}
            </li>
          );
        })}
        {(files ?? []).length === 0 && (
          <li className="glass p-8 text-center text-muted-foreground">No files yet.</li>
        )}
      </ul>
    </div>
  );
}
