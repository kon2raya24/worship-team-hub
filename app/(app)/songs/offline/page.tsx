"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Music, WifiOff, Search, RefreshCw, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getLastSync,
  listOfflineSongs,
  saveSongs,
  type OfflineSong,
} from "@/lib/offline-songs";
import { Input } from "@/components/ui/input";

export default function OfflineSongsPage() {
  return (
    <Suspense fallback={null}>
      <OfflineSongs />
    </Suspense>
  );
}

function OfflineSongs() {
  const searchParams = useSearchParams();
  const initialOpenId = searchParams.get("id");
  const [songs, setSongs] = useState<OfflineSong[]>([]);
  const [q, setQ] = useState("");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(initialOpenId);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    refresh();
    const on = () => {
      setIsOnline(true);
      syncNow();
    };
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    setSongs(await listOfflineSongs());
    setLastSync(await getLastSync());
  }

  async function syncNow() {
    setSyncing(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("songs")
        .select(
          "id, title, artist, original_key, bpm, tags, chordpro_body, reference_url"
        )
        .order("title");
      if (!error && data) {
        await saveSongs(data as OfflineSong[]);
        await refresh();
      }
    } finally {
      setSyncing(false);
    }
  }

  const filtered = useMemo(() => {
    if (!q.trim()) return songs;
    const needle = q.toLowerCase();
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(needle) ||
        (s.artist ?? "").toLowerCase().includes(needle) ||
        s.chordpro_body.toLowerCase().includes(needle)
    );
  }, [q, songs]);

  const openSong = openId ? songs.find((s) => s.id === openId) : null;

  if (openSong) {
    return (
      <OfflineSongView song={openSong} onBack={() => setOpenId(null)} />
    );
  }

  return (
    <div className="space-y-5 fade-in">
      <header className="space-y-2">
        <Link
          href="/songs"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Songs
        </Link>
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center justify-center size-11 rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30 shrink-0">
            <WifiOff className="size-5" />
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-tight">
              Offline library
            </h1>
            <p className="text-sm text-muted-foreground">
              {songs.length} song{songs.length === 1 ? "" : "s"} cached on this
              device · works without internet
            </p>
          </div>
        </div>
      </header>

      <div className="glass p-4 flex items-center gap-3 flex-wrap text-sm">
        <span
          className={`inline-flex items-center gap-1.5 ${
            isOnline ? "text-chart-5" : "text-chart-4"
          }`}
        >
          <span
            className={`size-2 rounded-full ${
              isOnline ? "bg-chart-5" : "bg-chart-4"
            }`}
          />
          {isOnline ? "Online" : "Offline"}
        </span>
        <span className="text-muted-foreground">
          Last sync:{" "}
          {lastSync ? new Date(lastSync).toLocaleString() : "never"}
        </span>
        <button
          type="button"
          onClick={syncNow}
          disabled={syncing || !isOnline}
          className="ml-auto inline-flex items-center gap-1.5 px-3 h-8 rounded-md bg-tint-2 border border-border text-sm text-foreground/90 hover:bg-tint-3 disabled:opacity-50 disabled:pointer-events-none"
        >
          {syncing ? (
            <RefreshCw className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          {syncing ? "Syncing…" : "Sync now"}
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, artist, or lyrics…"
          className="pl-9 h-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="glass p-8 text-center text-muted-foreground">
          {songs.length === 0
            ? "No songs cached yet. Tap Sync now while online."
            : "No songs match that search."}
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setOpenId(s.id)}
                className="card-hover w-full text-left rounded-lg bg-card ring-1 ring-border/70 hover:ring-primary/40 p-4 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-semibold text-base leading-snug truncate">
                    {s.title}
                  </h3>
                  {s.original_key && (
                    <span className="shrink-0 inline-flex items-center justify-center min-w-9 h-7 px-2 rounded-md bg-primary/10 text-primary text-xs font-mono font-semibold">
                      {s.original_key}
                    </span>
                  )}
                </div>
                {s.artist && (
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {s.artist}
                  </p>
                )}
                <p className="mt-2 text-[10px] text-chart-5 font-mono uppercase tracking-wider inline-flex items-center gap-1">
                  <Check className="size-3" /> Available offline
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { ChordViewer } from "@/components/chord-viewer";

function OfflineSongView({
  song,
  onBack,
}: {
  song: OfflineSong;
  onBack: () => void;
}) {
  return (
    <div className="space-y-5 fade-in">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Offline library
      </button>
      <div className="space-y-1">
        <p className="text-[10px] font-mono uppercase tracking-wider text-chart-5 inline-flex items-center gap-1">
          <Music className="size-3" /> Cached on this device
        </p>
        <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-tight leading-tight">
          {song.title}
        </h1>
        <div className="flex flex-wrap gap-x-3 gap-y-1 items-center text-sm text-muted-foreground">
          {song.artist && <span>{song.artist}</span>}
          {song.original_key && (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1 rounded-full bg-accent" />
              Key {song.original_key}
            </span>
          )}
          {song.bpm && (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1 rounded-full bg-primary" />
              {song.bpm} BPM
            </span>
          )}
        </div>
      </div>
      <ChordViewer
        body={song.chordpro_body}
        persistKey={song.id}
        originalKey={song.original_key}
      />
    </div>
  );
}
