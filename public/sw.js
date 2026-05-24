/* Worship Hub service worker
 * Strategy:
 *   - APP SHELL: static assets (JS/CSS/fonts/images) → cache-first.
 *   - SUPABASE REST: stale-while-revalidate for /rest/v1/* so the songs
 *     list comes from cache when offline but updates on next online open.
 *   - NAV: network-first, fall back to a cached /offline page on failure.
 *   - SKIP auth + write paths entirely (always network).
 *   - PUSH: shows a notification when a push message arrives.
 *   - BACKGROUND SYNC: registers a retry queue for failed writes.
 */

const VERSION = "v3";
const SHELL_CACHE = `worship-shell-${VERSION}`;
const API_CACHE = `worship-api-${VERSION}`;
const OFFLINE_URL = "/offline";

const SHELL_FILES = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((c) => c.addAll(SHELL_FILES).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((names) =>
        Promise.all(
          names
            .filter((n) => !n.endsWith(VERSION))
            .map((n) => caches.delete(n))
        )
      ),
      self.clients.claim(),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never cache auth flows or server actions.
  if (
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/signup") ||
    url.pathname.startsWith("/reset-password") ||
    url.pathname.startsWith("/forgot-password")
  ) {
    return; // let the network handle it
  }

  // Supabase REST → stale-while-revalidate (so songs work offline).
  if (
    url.hostname.endsWith(".supabase.co") &&
    url.pathname.startsWith("/rest/v1/")
  ) {
    event.respondWith(staleWhileRevalidate(req, API_CACHE));
    return;
  }

  // Static Next.js assets → cache-first.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:woff2?|png|jpg|jpeg|svg|webp|ico|css|js)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(req, SHELL_CACHE));
    return;
  }

  // Navigations → network-first with offline fallback.
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req, SHELL_CACHE));
    return;
  }
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return cached || Response.error();
  }
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    const offline = await cache.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response("Offline", { status: 503 });
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => null);
  return cached || (await fetchPromise) || new Response("Offline", { status: 503 });
}

// ============ PUSH NOTIFICATIONS ============
// Server sends `{ "title": "...", "body": "...", "url": "/setlists/..." }`.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Worship Hub", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Worship Hub";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data.url || "/" },
    tag: data.tag || "worship-hub",
    renotify: !!data.renotify,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus an existing window if one is already open at our origin.
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// ============ BACKGROUND SYNC ============
// We register the "retry-writes" tag from the client when a write fails;
// the SW will re-attempt when the device gets back online. (Stub for now —
// the actual queue is handled at the app level.)
self.addEventListener("sync", (event) => {
  if (event.tag === "retry-writes") {
    event.waitUntil(
      self.clients.matchAll().then((clients) =>
        clients.forEach((c) =>
          c.postMessage({ type: "sync", tag: event.tag })
        )
      )
    );
  }
});

// ============ MESSAGE PASSING ============
// Lets the app trigger SW updates without a full reload.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
