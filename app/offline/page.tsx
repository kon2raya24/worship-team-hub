import Link from "next/link";
import { WifiOff, Music, ListMusic } from "lucide-react";

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass max-w-md w-full p-8 text-center space-y-4">
        <span className="inline-flex items-center justify-center size-14 rounded-lg bg-[#8b5cf6]/15 text-[#8b5cf6] ring-1 ring-[#8b5cf6]/30 mx-auto">
          <WifiOff className="size-6" />
        </span>
        <h1 className="font-display text-2xl font-semibold">You&apos;re offline</h1>
        <p className="text-sm text-muted-foreground">
          Most of Worship Hub needs an internet connection. But your synced
          songs and recent setlists are still available.
        </p>
        <div className="pt-2 flex flex-col gap-2 items-stretch">
          <Link
            href="/songs/offline"
            className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-white hover:bg-[#8b5cf6]/30 transition-colors"
          >
            <Music className="size-4" /> Open offline songs
          </Link>
          <Link
            href="/setlists/offline"
            className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-tint-2 border border-border text-foreground hover:bg-tint-3 transition-colors"
          >
            <ListMusic className="size-4" /> Open offline setlists
          </Link>
          <p className="text-xs text-muted-foreground pt-1">
            Reconnect to use schedule, prayer, and uploads.
          </p>
        </div>
      </div>
    </div>
  );
}
