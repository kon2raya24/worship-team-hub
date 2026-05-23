import { createClient } from "@/lib/supabase/server";
import { requireProfile, isLeader } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileLink } from "@/components/file-link";
import { uploadFile, deleteFile } from "./actions";

export default async function FilesPage() {
  const profile = await requireProfile();
  const canEdit = isLeader(profile);
  const supabase = await createClient();

  const [{ data: files }, { data: songs }] = await Promise.all([
    supabase
      .from("files")
      .select("id, display_name, storage_path, kind, created_at, song_id, songs(title)")
      .order("created_at", { ascending: false }),
    canEdit
      ? supabase.from("songs").select("id, title").order("title")
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Files</h1>

      {canEdit && (
        <form
          action={uploadFile}
          className="space-y-3 border rounded-md p-4 max-w-xl"
        >
          <div className="space-y-1.5">
            <Label htmlFor="file">File (max 50 MB)</Label>
            <Input id="file" name="file" type="file" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="display_name">Display name (optional)</Label>
            <Input id="display_name" name="display_name" placeholder="Leave blank to use filename" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="song_id">Attach to song (optional)</Label>
            <select
              id="song_id"
              name="song_id"
              className="w-full border rounded-md p-2 text-sm h-9 bg-transparent"
            >
              <option value="">— General library —</option>
              {(songs ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit">Upload</Button>
          <p className="text-xs text-zinc-500">
            Note: uploads require a Supabase Storage bucket named <code>files</code>.
          </p>
        </form>
      )}

      <ul className="space-y-2">
        {(files ?? []).map((f) => {
          const songTitle =
            (f.songs as { title?: string } | null)?.title ?? null;
          return (
            <li key={f.id} className="border rounded-md p-3 flex items-start justify-between gap-3">
              <div>
                <FileLink storagePath={f.storage_path} label={f.display_name} />
                <div className="text-xs text-zinc-500 flex gap-2 items-center mt-1">
                  <Badge variant="outline">{f.kind}</Badge>
                  {songTitle && <span>· {songTitle}</span>}
                  <span>· {new Date(f.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              {canEdit && (
                <form action={deleteFile.bind(null, f.id)}>
                  <Button type="submit" size="sm" variant="ghost" className="text-red-600">
                    Delete
                  </Button>
                </form>
              )}
            </li>
          );
        })}
        {(files ?? []).length === 0 && (
          <li className="text-sm text-zinc-500">No files yet.</li>
        )}
      </ul>
    </div>
  );
}
