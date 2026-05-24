// Create empty song "stubs" — title + artist + tags only, no lyrics.
// You then open each one and paste the chord chart body from your CCLI /
// worshiptogether download. Stays inside copyright since I'm only
// touching factual metadata (titles + artists are not copyrightable).
//
// Run: node scripts/seed-stubs.mjs
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

// Popular contemporary worship — sourced from worshiptogether.com/songs.
// LYRICS ARE NOT INCLUDED — you'll paste the chord chart body yourself
// from your CCLI SongSelect / worshiptogether download for each.
const stubs = [
  { title: "Holy Forever", artist: "Chris Tomlin, Bethel Music, Jenn Johnson" },
  { title: "Gratitude", artist: "Benjamin William Hastings, Brandon Lake, Passion" },
  { title: "Goodness Of God", artist: "Bethel Music, Jenn Johnson" },
  { title: "Who Else", artist: "Gateway Worship" },
  { title: "10,000 Reasons (Bless The Lord)", artist: "Matt Redman" },
  { title: "Praise", artist: "Elevation Worship, Brandon Lake, Chris Brown, Chandler Moore" },
  { title: "What A Beautiful Name", artist: "Hillsong Worship" },
  { title: "Firm Foundation (He Won't)", artist: "Cody Carnes, The Belonging Co" },
  { title: "Oceans (Where Feet May Fail)", artist: "Hillsong UNITED" },
  { title: "The Heart Of Worship", artist: "Matt Redman" },
  { title: "Build My Life", artist: "Pat Barrett, Housefires" },
  { title: "Here I Am To Worship", artist: "Tim Hughes" },
  { title: "Give Me Jesus", artist: "UPPERROOM, Abbie Gamboa" },
  { title: "Mighty Name Of Jesus", artist: "The Belonging Co, Hope Darst" },
  { title: "The Joy", artist: "The Belonging Co" },
];

const { data: leader } = await supabase
  .from("profiles")
  .select("id")
  .eq("role", "leader")
  .limit(1)
  .maybeSingle();
const created_by = leader?.id ?? null;

// Skip songs whose title already exists (case-insensitive match by title).
const titles = stubs.map((s) => s.title);
const { data: existing } = await supabase
  .from("songs")
  .select("title")
  .in("title", titles);
const have = new Set((existing ?? []).map((s) => s.title.toLowerCase()));

const placeholder = `{title: TITLE HERE}
{artist: ARTIST HERE}
{key: }
{tempo: }

{comment: Paste the chord chart from worshiptogether or CCLI here}
{comment: Use [Chord] brackets above lyrics, e.g. A[G]mazing [D]grace}
`;

const toInsert = stubs
  .filter((s) => !have.has(s.title.toLowerCase()))
  .map((s) => ({
    title: s.title,
    artist: s.artist,
    original_key: null,
    bpm: null,
    tags: ["stub", "needs-chords"],
    chordpro_body: placeholder
      .replace("TITLE HERE", s.title)
      .replace("ARTIST HERE", s.artist),
    reference_url: null,
    created_by,
  }));

if (toInsert.length === 0) {
  console.log("All stubs already present. Nothing to insert.");
  process.exit(0);
}

const { data, error } = await supabase
  .from("songs")
  .insert(toInsert)
  .select("id, title");

if (error) {
  console.error("Insert failed:", error.message);
  process.exit(1);
}

console.log(`Seeded ${data.length} stub(s):`);
for (const s of data) console.log(`  · ${s.title}`);
if (have.size > 0)
  console.log(`(${have.size} already existed, skipped)`);
console.log(
  `\nNext: open each one in the app → Edit → paste the chord chart from worshiptogether.`
);
