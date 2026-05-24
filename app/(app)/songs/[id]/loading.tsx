import { ArrowLeft, Music } from "lucide-react";

export default function SongLoading() {
  return (
    <div className="space-y-6 fade-in">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 text-xs text-[#8a92b4]">
          <ArrowLeft className="size-3" /> Songs
        </div>
        <div className="space-y-2">
          <div className="h-9 w-3/4 rounded-md bg-white/[0.06] animate-pulse" />
          <div className="h-4 w-1/2 rounded-md bg-white/[0.04] animate-pulse" />
        </div>
      </div>

      <div className="glass p-6 space-y-3 relative">
        <div className="flex items-center gap-2 text-xs text-[#8a92b4]">
          <span className="inline-flex items-center justify-center size-4 rounded-full border-2 border-[#00e8ff]/40 border-t-[#00e8ff] animate-spin" />
          <span className="inline-flex items-center gap-1.5">
            <Music className="size-3.5" /> Loading chord chart…
          </span>
        </div>
        <div className="space-y-2 pt-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-4 rounded-sm bg-white/[0.04] animate-pulse"
              style={{ width: `${60 + ((i * 13) % 35)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
