"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ListMusic,
  WifiOff,
  RefreshCw,
  Calendar,
  Check,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  listOfflineSetlists,
  saveSetlists,
  getLastSync,
  type OfflineSetlist,
  type OfflineSetlistSong,
} from "@/lib/offline-songs";

type SetlistSongRow = {
  song_id: string;
  position: number;
  played_in_key: string | null;
  songs: {
    title: string | null;
    artist: string | null;
    original_key: string | null;
  } | null;
};

type SetlistRow = {
  id: string;
  service_date: string;
  theme: string | null;
  notes: string | null;
  setlist_songs: SetlistSongRow[] | null;
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OfflineSetlistsPage() {
  const [setlists, setSetlists] = useState<OfflineSetlist[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    refresh();
    const on = () => {
      setIsOnline(true);
      // Coming back online: pull fresh data so song IDs that have been
      // deleted server-side stop linking to dead pages.
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
    setSetlists(await listOfflineSetlists());
    setLastSync(await getLastSync());
  }

  async function syncNow() {
    setSyncing(true);
    try {
      const supabase = createClient();
      const past = new Date();
      past.setDate(past.getDate() - 28);
      const cutoff = past.toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("setlists")
        .select(
          "id, service_date, theme, notes, setlist_songs(song_id, position, played_in_key, songs(title, artist, original_key))"
        )
        .gte("service_date", cutoff)
        .order("service_date", { ascending: true });
      if (!error && data) {
        const offline: OfflineSetlist[] = (data as unknown as SetlistRow[]).map((row) => ({
          id: row.id,
          service_date: row.service_date,
          theme: row.theme,
          notes: row.notes,
          songs: (row.setlist_songs ?? [])
            .slice()
            .sort((a, b) => a.position - b.position)
            .map<OfflineSetlistSong>((s) => ({
              song_id: s.song_id,
              position: s.position,
              played_in_key: s.played_in_key,
              title: s.songs?.title ?? "(deleted)",
              artist: s.songs?.artist ?? null,
              original_key: s.songs?.original_key ?? null,
            })),
        }));
        await saveSetlists(offline);
        await refresh();
      }
    } finally {
      setSyncing(false);
    }
  }

  const open = openId ? setlists.find((s) => s.id === openId) ?? null : null;

  if (open) {
    return <OfflineSetlistView setlist={open} onBack={() => setOpenId(null)} />;
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = setlists.filter((s) => s.service_date >= today);
  const past = setlists
    .filter((s) => s.service_date < today)
    .slice()
    .reverse();

  return (
    <div className="space-y-5 fade-in">
      <header className="space-y-2">
        <Link
          href="/setlists"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Setlists
        </Link>
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center justify-center size-11 rounded-lg bg-[#8b5cf6]/15 text-[#8b5cf6] ring-1 ring-[#8b5cf6]/30 shrink-0">
            <WifiOff className="size-5" />
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-tight">
              Offline setlists
            </h1>
            <p className="text-sm text-muted-foreground">
              {setlists.length} setlist{setlists.length === 1 ? "" : "s"} cached
              on this device · works without internet
            </p>
          </div>
        </div>
      </header>

      <div className="glass p-4 flex items-center gap-3 flex-wrap text-sm">
        <span
          className={`inline-flex items-center gap-1.5 ${
            isOnline ? "text-[#8eff6a]" : "text-[#ffb547]"
          }`}
        >
          <span
            className={`size-2 rounded-full ${
              isOnline ? "bg-[#8eff6a]" : "bg-[#ffb547]"
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
          <RefreshCw
            className={`size-3.5 ${syncing ? "animate-spin" : ""}`}
          />
          {syncing ? "Syncing…" : "Sync now"}
        </button>
      </div>

      {setlists.length === 0 ? (
        <div className="glass p-8 text-center text-muted-foreground">
          No setlists cached yet. Tap Sync now while online.
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Upcoming
              </h2>
              <SetlistGrid rows={upcoming} onOpen={setOpenId} />
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recent
              </h2>
              <SetlistGrid rows={past} onOpen={setOpenId} muted />
            </section>
          )}
        </>
      )}
    </div>
  );
}

function SetlistGrid({
  rows,
  onOpen,
  muted = false,
}: {
  rows: OfflineSetlist[];
  onOpen: (id: string) => void;
  muted?: boolean;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((r) => (
        <li key={r.id}>
          <button
            type="button"
            onClick={() => onOpen(r.id)}
            className={`card-hover w-full text-left rounded-lg bg-card ring-1 ring-border/70 hover:ring-primary/40 p-5 transition-all ${
              muted ? "opacity-80 hover:opacity-100" : ""
            }`}
          >
            <div className="flex items-center gap-2 text-primary">
              <Calendar className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wider">
                {new Date(r.service_date).toLocaleDateString(undefined, {
                  weekday: "short",
                })}
              </span>
            </div>
            <p className="mt-1 text-xl font-heading font-semibold leading-tight">
              {fmtDate(r.service_date)}
            </p>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {r.theme ?? "Theme to be announced"}
            </p>
            <p className="mt-3 text-[10px] text-[#8eff6a] font-mono uppercase tracking-wider inline-flex items-center gap-1">
              <Check className="size-3" />
              {r.songs.length} song{r.songs.length === 1 ? "" : "s"} · cached
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}

function OfflineSetlistView({
  setlist,
  onBack,
}: {
  setlist: OfflineSetlist;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6 fade-in">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3" /> Offline setlists
      </button>

      <div className="space-y-1">
        <p className="text-[10px] font-mono uppercase tracking-wider text-[#8eff6a] inline-flex items-center gap-1">
          <ListMusic className="size-3" /> Cached on this device
        </p>
        <h1 className="text-2xl md:text-4xl font-display font-semibold tracking-tight leading-tight">
          {fmtDate(setlist.service_date)}
        </h1>
        {setlist.theme && (
          <p className="text-foreground/80 mt-1">{setlist.theme}</p>
        )}
      </div>

      {setlist.notes && (
        <div className="glass p-4 flex gap-3">
          <FileText className="size-4 text-[#ffb547] mt-0.5 shrink-0" />
          <p className="text-sm whitespace-pre-wrap text-foreground/85">
            {setlist.notes}
          </p>
        </div>
      )}

      <section className="glass p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ListMusic className="size-4 text-accent" />
          <h2 className="font-display font-semibold text-base">Songs</h2>
          <span className="ml-auto text-xs text-muted-foreground">
            {setlist.songs.length} song{setlist.songs.length === 1 ? "" : "s"}
          </span>
        </div>
        {setlist.songs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No songs in this setlist.</p>
        ) : (
          <ul className="divide-y divide-border">
            {setlist.songs.map((s, i) => {
              const isDeleted = s.title === "(deleted)";
              const Row = (
                <>
                  <p
                    className={`font-medium leading-snug truncate transition-colors ${
                      isDeleted
                        ? "line-through text-muted-foreground"
                        : "group-hover/song:text-primary"
                    }`}
                  >
                    {s.title}
                  </p>
                  {s.artist && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {s.artist}
                    </p>
                  )}
                  {isDeleted && (
                    <p className="text-[10px] uppercase tracking-wider text-[#ffb547] mt-0.5 font-mono">
                      Removed from library
                    </p>
                  )}
                </>
              );
              return (
                <li
                  key={s.song_id}
                  className={`py-3 flex items-center gap-3 ${
                    isDeleted ? "opacity-60" : ""
                  }`}
                >
                  <span className="text-xs font-mono text-muted-foreground w-6 text-right">
                    {i + 1}
                  </span>
                  {isDeleted ? (
                    <div
                      className="flex-1 min-w-0"
                      aria-label="This song was removed from the library"
                    >
                      {Row}
                    </div>
                  ) : (
                    <Link
                      href={`/songs/offline?id=${s.song_id}`}
                      className="flex-1 min-w-0 group/song"
                    >
                      {Row}
                    </Link>
                  )}
                  {!isDeleted && (s.played_in_key ?? s.original_key) && (
                    <span className="shrink-0 inline-flex items-center justify-center min-w-9 h-7 px-2 rounded-md bg-accent/10 text-accent text-xs font-mono font-semibold">
                      {s.played_in_key ?? s.original_key}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
