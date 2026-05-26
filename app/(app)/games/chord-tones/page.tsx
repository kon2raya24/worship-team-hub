import { CircleDot } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ChordTonesGame } from "./chord-tones-game";

export const metadata = { title: "Chord Tones · Worship Hub" };

export default function ChordTonesPage() {
  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        icon={CircleDot}
        title="Chord Tones"
        subtitle="10 rounds · root, 3rd, 5th, 7th of any chord"
        back={{ href: "/games", label: "All games" }}
      />
      <ChordTonesGame />
    </div>
  );
}
