import Link from "next/link";
import { requireLeader } from "@/lib/auth";
import { createSetlist } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function nextSunday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 7 : 7 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export default async function NewSetlistPage() {
  await requireLeader();

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <Link href="/setlists" className="text-sm text-zinc-500 hover:underline">
          ← Setlists
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New setlist</h1>
      </div>
      <form action={createSetlist} className="space-y-4">
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
          <Textarea id="notes" name="notes" rows={3} />
        </div>
        <Button type="submit">Create setlist</Button>
      </form>
    </div>
  );
}
