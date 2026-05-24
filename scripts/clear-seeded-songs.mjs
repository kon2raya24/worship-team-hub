// Delete songs that were seeded by scripts/seed-songs.mjs.
// Identifies them by the "public-domain" tag — only seed songs carry that.
// Won't touch songs your team has added via the import tool or /songs/new.
// Run: node scripts/clear-seeded-songs.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  try {
    const text = readFileSync(".env.local", "utf8");
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) process.env[m[1]] ??= m[2];
    }
  } catch {}
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Find songs that have "public-domain" in tags.
const { data: matches, error: selErr } = await supabase
  .from("songs")
  .select("id, title")
  .contains("tags", ["public-domain"]);

if (selErr) {
  console.error("Lookup failed:", selErr.message);
  process.exit(1);
}

if (!matches || matches.length === 0) {
  console.log("No public-domain seed songs found. Nothing to delete.");
  process.exit(0);
}

console.log(`Found ${matches.length} seed song(s) to delete:`);
for (const s of matches) console.log(`  · ${s.title}`);

const ids = matches.map((s) => s.id);
const { error: delErr } = await supabase.from("songs").delete().in("id", ids);
if (delErr) {
  console.error("Delete failed:", delErr.message);
  process.exit(1);
}
console.log(`\nDeleted ${ids.length} song(s).`);
