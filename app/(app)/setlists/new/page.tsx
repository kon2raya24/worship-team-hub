import { ListMusic } from "lucide-react";
import { requireLeader } from "@/lib/auth";
import { createSetlist } from "../actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";

function nextSunday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (7 - day) % 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export default async function NewSetlistPage() {
  await requireLeader();

  return (
    <div className="space-y-6 fade-in max-w-xl">
      <PageHeader
        icon={ListMusic}
        title="New setlist"
        subtitle="Plan a Sunday service"
        back={{ href: "/setlists", label: "Setlists" }}
      />

      <form action={createSetlist} className="glass p-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="service_date">Service date</Label>
          <Input
            id="service_date"
            name="service_date"
            type="date"
            required
            defaultValue={nextSunday()}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="theme">Theme</Label>
          <Input id="theme" name="theme" placeholder="e.g. Thanksgiving" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={3} className="resize-none" />
        </div>
        <SubmitButton pendingLabel="Creating…">Create setlist</SubmitButton>
      </form>
    </div>
  );
}
