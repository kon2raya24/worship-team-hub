"use client";

// Tiny IndexedDB wrapper for caching the songs library + upcoming setlists
// on-device, so the chord viewer + Sunday setlist keep working without a
// network connection.

export type OfflineSong = {
  id: string;
  title: string;
  artist: string | null;
  original_key: string | null;
  bpm: number | null;
  tags: string[];
  chordpro_body: string;
  reference_url: string | null;
};

export type OfflineSetlistSong = {
  song_id: string;
  position: number;
  played_in_key: string | null;
  title: string;
  artist: string | null;
  original_key: string | null;
};

export type OfflineSetlist = {
  id: string;
  service_date: string;
  theme: string | null;
  notes: string | null;
  songs: OfflineSetlistSong[];
};

const DB_NAME = "worship-hub";
const SONGS = "songs";
const SETLISTS = "setlists";
const META = "meta";
const VERSION = 2;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SONGS)) {
        db.createObjectStore(SONGS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(SETLISTS)) {
        db.createObjectStore(SETLISTS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(META)) {
        db.createObjectStore(META);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(storeName, mode);
        const s = t.objectStore(storeName);
        const r = fn(s);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
        t.oncomplete = () => db.close();
      })
  );
}

// ============ SONGS ============

export async function saveSongs(songs: OfflineSong[]): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction([SONGS, META], "readwrite");
    const s = t.objectStore(SONGS);
    s.clear();
    for (const song of songs) s.put(song);
    t.objectStore(META).put(new Date().toISOString(), "lastSync");
    t.objectStore(META).put(songs.length, "songsCount");
    t.oncomplete = () => {
      db.close();
      resolve();
    };
    t.onerror = () => reject(t.error);
  });
}

export async function listOfflineSongs(): Promise<OfflineSong[]> {
  try {
    return await tx<OfflineSong[]>(SONGS, "readonly", (s) => s.getAll());
  } catch {
    return [];
  }
}

export async function getOfflineSong(id: string): Promise<OfflineSong | null> {
  try {
    const got = await tx<OfflineSong | undefined>(SONGS, "readonly", (s) =>
      s.get(id)
    );
    return got ?? null;
  } catch {
    return null;
  }
}

// ============ SETLISTS ============

export async function saveSetlists(setlists: OfflineSetlist[]): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction([SETLISTS, META], "readwrite");
    const s = t.objectStore(SETLISTS);
    s.clear();
    for (const sl of setlists) s.put(sl);
    t.objectStore(META).put(setlists.length, "setlistsCount");
    t.oncomplete = () => {
      db.close();
      resolve();
    };
    t.onerror = () => reject(t.error);
  });
}

export async function listOfflineSetlists(): Promise<OfflineSetlist[]> {
  try {
    const list = await tx<OfflineSetlist[]>(SETLISTS, "readonly", (s) =>
      s.getAll()
    );
    return list.sort((a, b) => a.service_date.localeCompare(b.service_date));
  } catch {
    return [];
  }
}

export async function getOfflineSetlist(
  id: string
): Promise<OfflineSetlist | null> {
  try {
    const got = await tx<OfflineSetlist | undefined>(SETLISTS, "readonly", (s) =>
      s.get(id)
    );
    return got ?? null;
  } catch {
    return null;
  }
}

// ============ META ============

export async function getLastSync(): Promise<string | null> {
  try {
    const v = await tx<string | undefined>(META, "readonly", (s) =>
      s.get("lastSync")
    );
    return v ?? null;
  } catch {
    return null;
  }
}

export async function getCachedCount(): Promise<number> {
  try {
    const v = await tx<number | undefined>(META, "readonly", (s) =>
      s.get("songsCount")
    );
    return v ?? 0;
  } catch {
    return 0;
  }
}
