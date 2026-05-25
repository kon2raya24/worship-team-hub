import { Timer } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { BpmGame } from "./bpm-game";

export const metadata = { title: "BPM Tapper · Worship Hub" };

export default function BpmPage() {
  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        icon={Timer}
        title="BPM Tapper"
        subtitle="Tap to a beat · see your tempo + how close you are to target"
        back={{ href: "/games", label: "All games" }}
      />
      <BpmGame />
    </div>
  );
}
