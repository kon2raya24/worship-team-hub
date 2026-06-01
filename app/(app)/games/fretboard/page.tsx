import { Guitar } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FretboardExplorer } from "./fretboard-explorer";

export const metadata = { title: "Fretboard Explorer · Worship Hub" };

export default function FretboardPage() {
  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        icon={Guitar}
        title="Fretboard Explorer"
        subtitle="Scales in any key · toggle notes, intervals, or hide"
        back={{ href: "/games", label: "All games" }}
      />
      <FretboardExplorer />
    </div>
  );
}
