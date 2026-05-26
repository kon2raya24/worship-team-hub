import { Hash } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { NashvilleGame } from "./nashville-game";

export const metadata = { title: "Nashville Number Trainer · Worship Hub" };

export default function NashvillePage() {
  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        icon={Hash}
        title="Nashville Number Trainer"
        subtitle="10 rounds · chords ↔ Roman numerals in any key"
        back={{ href: "/games", label: "All games" }}
      />
      <NashvilleGame />
    </div>
  );
}
