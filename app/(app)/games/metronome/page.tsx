import { AudioLines } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Metronome } from "./metronome";

export const metadata = { title: "Metronome · Worship Hub" };

export default function MetronomePage() {
  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        icon={AudioLines}
        title="Metronome"
        subtitle="Keep the band locked in · tap, set a meter, hit start"
        back={{ href: "/games", label: "All games" }}
      />
      <Metronome />
    </div>
  );
}
