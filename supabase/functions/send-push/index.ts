// Supabase Edge Function: send-push
//
// Invoked by Database Webhooks (Database → Webhooks) on INSERT into
// schedule_assignments, announcements, setlists, devotions. It reads the new
// row, decides the audience + message per table, then sends FCM pushes and
// prunes dead tokens. Webhooks include the project auth header, so this stays
// non-public (keep "Verify JWT" on).
//
// Deploy:  supabase functions deploy send-push
// Secret:  supabase secrets set FCM_SERVICE_ACCOUNT="$(cat service-account.json)"
// Secret:  supabase secrets set WEBHOOK_SECRET="<long-random-string>"
//          ...and add header `x-webhook-secret: <same-string>` to every DB
//          webhook that calls this function. Without it the request is rejected.

import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Record<string, unknown> | null;
}

const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

function base64url(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64urlBytes(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}
async function getAccessToken(sa: {
  client_email: string;
  private_key: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: FCM_SCOPE,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(
    JSON.stringify(claim),
  )}`;
  const key = await importPrivateKey(sa.private_key);
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${base64urlBytes(new Uint8Array(sig))}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`OAuth token failed: ${res.status}`);
  return (await res.json()).access_token as string;
}

function fmtDate(d: unknown): string {
  if (typeof d !== "string") return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// Map a webhook row to { userIds (null = everyone), title, body }.
function describe(
  table: string,
  r: Record<string, unknown>,
): { userIds: string[] | null; title: string; body: string } | null {
  switch (table) {
    case "schedule_assignments":
      return {
        userIds: r.user_id ? [String(r.user_id)] : null,
        title: "You're on the schedule",
        body: `${String(r.role ?? "")} · ${fmtDate(r.service_date)}`.trim(),
      };
    case "announcements":
      return {
        userIds: null,
        title: "New announcement",
        body: String(r.title ?? "Tap to read"),
      };
    case "setlists":
      return {
        userIds: null,
        title: "New setlist",
        body: [fmtDate(r.service_date), r.theme ? String(r.theme) : ""]
          .filter(Boolean)
          .join(" · "),
      };
    case "devotions":
      return {
        userIds: null,
        title: "New devotion",
        body: String(r.title ?? "Tap to read"),
      };
    default:
      return null;
  }
}

// Where a web-push click should land, per source table.
function urlFor(table: string): string {
  switch (table) {
    case "announcements":
      return "/announcements";
    case "setlists":
      return "/setlists";
    case "devotions":
      return "/devotions";
    case "schedule_assignments":
      return "/schedule";
    default:
      return "/";
  }
}

// Constant-time comparison so a timing side-channel can't leak the secret.
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  try {
    // Verify the request actually came from our DB webhook (configured to send
    // `x-webhook-secret: <WEBHOOK_SECRET>`). Fail closed — this blocks
    // unauthenticated callers even if "Verify JWT" is ever toggled off, which
    // would otherwise let anyone broadcast a push to every registered device.
    const expectedSecret = Deno.env.get("WEBHOOK_SECRET");
    const providedSecret = req.headers.get("x-webhook-secret");
    if (
      !expectedSecret ||
      !providedSecret ||
      !timingSafeEqual(providedSecret, expectedSecret)
    ) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = (await req.json()) as WebhookPayload;
    if (payload.type !== "INSERT" || !payload.record) {
      return new Response(JSON.stringify({ skipped: "not an insert" }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    const msg = describe(payload.table, payload.record);
    if (!msg) {
      return new Response(JSON.stringify({ skipped: "unhandled table" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ---- FCM (mobile / Flutter) ----
    let sent = 0;
    let cleaned = 0;
    const saRaw = Deno.env.get("FCM_SERVICE_ACCOUNT");
    if (saRaw) {
      const sa = JSON.parse(saRaw);
      let q = supabase.from("device_tokens").select("token");
      if (msg.userIds && msg.userIds.length > 0) {
        q = q.in("user_id", msg.userIds);
      }
      const { data: rows, error } = await q;
      if (error) throw error;
      const tokens = (rows ?? []).map((r) => r.token as string);
      if (tokens.length > 0) {
        const accessToken = await getAccessToken(sa);
        const endpoint = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
        const stale: string[] = [];
        for (const token of tokens) {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: {
                token,
                notification: { title: msg.title, body: msg.body },
                data: { table: payload.table },
                android: { priority: "HIGH" },
              },
            }),
          });
          if (res.ok) sent++;
          else if (res.status === 404 || res.status === 400) stale.push(token);
        }
        if (stale.length > 0) {
          await supabase.from("device_tokens").delete().in("token", stale);
          cleaned = stale.length;
        }
      }
    }

    // ---- Web Push (PWA browsers) ----
    let webSent = 0;
    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
    if (vapidPublic && vapidPrivate) {
      webpush.setVapidDetails(
        Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@worship-team-hub.app",
        vapidPublic,
        vapidPrivate,
      );
      let wq = supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth");
      if (msg.userIds && msg.userIds.length > 0) {
        wq = wq.in("user_id", msg.userIds);
      }
      const { data: subs } = await wq;
      const body = JSON.stringify({
        title: msg.title,
        body: msg.body,
        url: urlFor(payload.table),
      });
      const deadEndpoints: string[] = [];
      for (const s of subs ?? []) {
        try {
          await webpush.sendNotification(
            {
              endpoint: s.endpoint as string,
              keys: { p256dh: s.p256dh as string, auth: s.auth as string },
            },
            body,
          );
          webSent++;
        } catch (err) {
          const code = (err as { statusCode?: number })?.statusCode;
          if (code === 404 || code === 410) {
            deadEndpoints.push(s.endpoint as string);
          }
        }
      }
      if (deadEndpoints.length > 0) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .in("endpoint", deadEndpoints);
      }
    }

    return new Response(JSON.stringify({ sent, cleaned, webSent }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
