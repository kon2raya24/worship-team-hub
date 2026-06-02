import { Gauge } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Tuner } from "./tuner";

export const metadata = { title: "Tuner · Worship Hub" };

export default function TunerPage() {
  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        icon={Gauge}
        title="Tuner"
        subtitle="Tune by ear with your mic · nearest note and cents, live"
        back={{ href: "/games", label: "All games" }}
      />
      <Tuner />
    </div>
  );
}
