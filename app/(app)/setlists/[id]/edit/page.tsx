import { notFound, redirect } from "next/navigation";
import { ListMusic } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireLeader } from "@/lib/auth";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
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
    <div className="space-y-6 fade-in max-w-xl">
      <PageHeader
        icon={ListMusic}
        title="Edit setlist"
        back={{ href: `/setlists/${id}`, label: "Back to setlist" }}
      />

      <form action={save} className="glass p-6 space-y-4">
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
          <Textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={setlist.notes ?? ""}
            className="resize-none"
          />
        </div>
        <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
      </form>
    </div>
  );
}
