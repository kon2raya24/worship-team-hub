import { KeyRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { KeysGame } from "./keys-game";

export const metadata = { title: "Key Signature Quiz · Worship Hub" };

export default function KeysPage() {
  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        icon={KeyRound}
        title="Key Signature Quiz"
        subtitle="10 rounds · how many sharps or flats?"
        back={{ href: "/games", label: "All games" }}
      />
      <KeysGame />
    </div>
  );
}
