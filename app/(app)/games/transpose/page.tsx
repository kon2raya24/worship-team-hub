import { ArrowRightLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { TransposeGame } from "./transpose-game";

export const metadata = { title: "Transpose Trainer · Worship Hub" };

export default function TransposePage() {
  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        icon={ArrowRightLeft}
        title="Transpose Trainer"
        subtitle="5 rounds · transpose the progression to the target key"
        back={{ href: "/games", label: "All games" }}
      />
      <TransposeGame />
    </div>
  );
}
