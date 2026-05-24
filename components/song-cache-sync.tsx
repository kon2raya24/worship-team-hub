"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveSongs, type OfflineSong } from "@/lib/offline-songs";

/**
 * Mounts silently. On each load (online only), fetches the full song
 * library and replaces the IndexedDB cache so /songs/offline always has
 * fresh data the next time the user goes offline.
 */
export function SongCacheSync() {
  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("songs")
          .select(
            "id, title, artist, original_key, bpm, tags, chordpro_body, reference_url"
          )
          .order("title");
        if (error || !data || ctrl.signal.aborted) return;
        await saveSongs(data as OfflineSong[]);
      } catch {
        /* offline or transient — ignore */
      }
    })();
    return () => ctrl.abort();
  }, []);
  return null;
}
