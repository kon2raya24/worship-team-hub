import { Ruler } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { IntervalsGame } from "./intervals-game";

export const metadata = { title: "Interval Trainer · Worship Hub" };

export default function IntervalsPage() {
  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        icon={Ruler}
        title="Interval Trainer"
        subtitle="10 rounds · name the interval or name the note"
        back={{ href: "/games", label: "All games" }}
      />
      <IntervalsGame />
    </div>
  );
}
