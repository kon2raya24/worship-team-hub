import Link from "next/link";
import { requireLeader } from "@/lib/auth";
import { createDevotion } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default async function NewDevotionPage() {
  await requireLeader();
  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <Link href="/devotions" className="text-sm text-zinc-500 hover:underline">
          ← Devotions
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New devotion</h1>
      </div>
      <form action={createDevotion} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scripture_ref">Scripture reference</Label>
          <Input
            id="scripture_ref"
            name="scripture_ref"
            placeholder="e.g. Psalm 23:1-6"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="body">Body (Markdown)</Label>
          <Textarea
            id="body"
            name="body"
            rows={14}
            required
            className="font-mono text-sm"
          />
        </div>
        <Button type="submit">Publish</Button>
      </form>
    </div>
  );
}
