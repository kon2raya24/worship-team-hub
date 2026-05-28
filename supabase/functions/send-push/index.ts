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

import { createClient } from "jsr:@supabase/supabase-js@2";

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

Deno.serve(async (req) => {
  try {
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

    const saRaw = Deno.env.get("FCM_SERVICE_ACCOUNT");
    if (!saRaw) {
      return new Response(JSON.stringify({ skipped: "FCM not configured" }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    const sa = JSON.parse(saRaw);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let q = supabase.from("device_tokens").select("token");
    if (msg.userIds && msg.userIds.length > 0) {
      q = q.in("user_id", msg.userIds);
    }
    const { data: rows, error } = await q;
    if (error) throw error;
    const tokens = (rows ?? []).map((r) => r.token as string);
    if (tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const accessToken = await getAccessToken(sa);
    const endpoint = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
    let sent = 0;
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
    }
    return new Response(JSON.stringify({ sent, cleaned: stale.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
