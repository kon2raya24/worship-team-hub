import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireLeader } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateSetlist } from "../../actions";

type Params = Promise<{ id: string }>;

export default async function EditSetlistPage({ params }: { params: Params }) {
  await requireLeader();
  const { id } = await params;
  const supabase = await createClient();

  const { data: setlist } = await supabase
    .from("setlists")
    .select("service_date, theme, notes")
    .eq("id", id)
    .maybeSingle();

  if (!setlist) notFound();

  async function save(formData: FormData) {
    "use server";
    await updateSetlist(id, formData);
    redirect(`/setlists/${id}`);
  }

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <Link
          href={`/setlists/${id}`}
          className="text-sm text-zinc-500 hover:underline"
        >
          ← Back to setlist
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Edit setlist</h1>
      </div>
      <form action={save} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="service_date">Service date</Label>
          <Input
            id="service_date"
            name="service_date"
            type="date"
            required
            defaultValue={setlist.service_date}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="theme">Theme</Label>
          <Input id="theme" name="theme" defaultValue={setlist.theme ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={4} defaultValue={setlist.notes ?? ""} />
        </div>
        <Button type="submit">Save changes</Button>
      </form>
    </div>
  );
}
