import { Disc3 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { BackingTrack } from "./backing-track";

export const metadata = { title: "Backing Track · Worship Hub" };

export default function BackingTrackPage() {
  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        icon={Disc3}
        title="Backing Track"
        subtitle="Loop a progression in any key · jam and solo over it"
        back={{ href: "/games", label: "All games" }}
      />
      <BackingTrack />
    </div>
  );
}
