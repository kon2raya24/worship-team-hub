"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  saveSongs,
  saveSetlists,
  type OfflineSong,
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

/**
 * Mounts silently. On each load (online only), fetches the full song
 * library + recent/upcoming setlists and replaces the IndexedDB caches so
 * /songs/offline and /setlists/offline always have fresh data the next
 * time the user goes offline.
 */
export function SongCacheSync() {
  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    const ctrl = new AbortController();
    (async () => {
      const supabase = createClient();

      // Songs library.
      try {
        const { data, error } = await supabase
          .from("songs")
          .select(
            "id, title, artist, original_key, bpm, tags, chordpro_body, reference_url"
          )
          .order("title");
        if (!error && data && !ctrl.signal.aborted) {
          await saveSongs(data as OfflineSong[]);
        }
      } catch {
        /* offline or transient — ignore */
      }

      // Setlists: keep recent 4 past + all upcoming, with their songs joined.
      try {
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
        if (!error && data && !ctrl.signal.aborted) {
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
        }
      } catch {
        /* offline or transient — ignore */
      }
    })();
    return () => ctrl.abort();
  }, []);
  return null;
}
