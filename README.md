# Worship Team Hub

A team hub for worship leaders: chord charts (with transposition), Sunday setlists, schedule, devotions, prayer requests, announcements, file uploads, and public share links.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · Supabase (Postgres + Auth + Storage) · `chordsheetjs` for ChordPro parsing.

---

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In **SQL Editor**, paste and run [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql). This creates all tables, the `profiles` trigger, and Row-Level Security policies.
3. In **Storage**, create a private bucket named **`files`**. Then go to **Storage → Policies** and add:

   ```sql
   create policy "files bucket read (authenticated)"
     on storage.objects for select to authenticated
     using (bucket_id = 'files');

   create policy "files bucket leader write"
     on storage.objects for insert to authenticated
     with check (bucket_id = 'files' and public.is_leader());

   create policy "files bucket leader delete"
     on storage.objects for delete to authenticated
     using (bucket_id = 'files' and public.is_leader());
   ```

4. In **Authentication → Providers**, enable **Email** (and optionally **Google**).

### 3. Configure environment

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from Supabase Settings → API>
SUPABASE_SERVICE_ROLE_KEY=<service-role key from Supabase Settings → API>
```

> The service-role key is server-only. It's used by the public `/share/[token]` route to render shared chord charts without requiring login.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, then promote your account to leader in Supabase: open **Table Editor → profiles**, change your row's `role` from `member` to `leader`.

---

## Feature map

| Route | Purpose |
|---|---|
| `/` | Dashboard with next setlist, latest devotion, pinned announcements |
| `/songs` | Library — search + tag filter; leader adds/edits |
| `/songs/[id]` | ChordPro viewer with transpose (±semitones), capo, zoom, print, practice notes |
| `/setlists` | Upcoming + past setlists |
| `/setlists/[id]` | Songs list with drag-reorder (leader), per-song "play in key" |
| `/schedule` | Next 4 Sundays roster (leader assigns members to instruments) |
| `/devotions` | Posts + weekly Bible reading plan |
| `/prayer` | Team prayer feed; mark answered |
| `/announcements` | Posts; pin to dashboard |
| `/files` | Upload audio / PDFs / slides / MIDI, optionally attached to a song |
| `/share/[token]` | Public read-only view of a song or setlist (no login) |

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com) → **New Project** → import the repo.
3. Add the three env vars from `.env.local` to **Project Settings → Environment Variables**.
4. Deploy. Vercel auto-deploys on each push to main.

---

## ChordPro quick reference

```
{title: Amazing Grace}
{key: G}

A[G]mazing [G7]grace, how [C]sweet the [G]sound
That [G]saved a [Em]wretch like [D]me
```

- `[Chord]` brackets place chords above lyrics.
- `{directive: value}` lines set song metadata.
- Plain "chords-over-words" text also works as a fallback.
