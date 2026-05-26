import { Repeat2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RelativeGame } from "./relative-game";

export const metadata = { title: "Relative Key · Worship Hub" };

export default function RelativePage() {
  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        icon={Repeat2}
        title="Relative Key"
        subtitle="10 rounds · major ↔ minor pairings"
        back={{ href: "/games", label: "All games" }}
      />
      <RelativeGame />
    </div>
  );
}
