import Link from "next/link";
import { WifiOff, Music } from "lucide-react";

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass max-w-md w-full p-8 text-center space-y-4">
        <span className="inline-flex items-center justify-center size-14 rounded-lg bg-[#8b5cf6]/15 text-[#8b5cf6] ring-1 ring-[#8b5cf6]/30 mx-auto">
          <WifiOff className="size-6" />
        </span>
        <h1 className="font-display text-2xl font-semibold">You&apos;re offline</h1>
        <p className="text-sm text-[#8a92b4]">
          Most of Worship Hub needs an internet connection. But your synced
          songs are still available — open the offline library below.
        </p>
        <div className="pt-2 flex flex-col gap-2 items-center">
          <Link
            href="/songs/offline"
            className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-white hover:bg-[#8b5cf6]/30 transition-colors"
          >
            <Music className="size-4" /> Open offline library
          </Link>
          <p className="text-xs text-[#8a92b4]">
            Reconnect to use setlists, schedule, prayer and uploads.
          </p>
        </div>
      </div>
    </div>
  );
}
