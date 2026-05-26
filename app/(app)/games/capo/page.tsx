import { Guitar } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CapoGame } from "./capo-game";

export const metadata = { title: "Capo Calculator · Worship Hub" };

export default function CapoPage() {
  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        icon={Guitar}
        title="Capo Calculator"
        subtitle="10 rounds · shape + capo ↔ sounding key"
        back={{ href: "/games", label: "All games" }}
      />
      <CapoGame />
    </div>
  );
}
