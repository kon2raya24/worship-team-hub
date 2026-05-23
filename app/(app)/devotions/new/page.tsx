import { BookOpen } from "lucide-react";
import { requireLeader } from "@/lib/auth";
import { createDevotion } from "../actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";

export default async function NewDevotionPage() {
  await requireLeader();
  return (
    <div className="space-y-6 fade-in max-w-2xl">
      <PageHeader
        icon={BookOpen}
        title="New devotion"
        subtitle="Markdown supported"
        back={{ href: "/devotions", label: "Devotions" }}
      />
      <form action={createDevotion} className="glass p-6 space-y-4">
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
          <Label htmlFor="body">Body</Label>
          <Textarea
            id="body"
            name="body"
            rows={14}
            required
            className="font-mono text-sm resize-none"
          />
        </div>
        <SubmitButton pendingLabel="Publishing…">Publish</SubmitButton>
      </form>
    </div>
  );
}
