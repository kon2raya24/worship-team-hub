-- Worship Team Hub — initial schema
-- Run this in the Supabase SQL editor for a fresh project.

create extension if not exists "pgcrypto";

-- ============================================================
-- profiles: extends auth.users with display name + role
-- ============================================================
create type user_role as enum ('leader', 'member');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role user_role not null default 'member',
  instruments text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Auto-create a profile row when a new auth.user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used by RLS policies below.
create or replace function public.is_leader()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'leader'
  );
$$;

-- ============================================================
-- songs + per-song notes
-- ============================================================
create table public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  original_key text,
  bpm int,
  tags text[] not null default '{}',
  chordpro_body text not null default '',
  reference_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index songs_title_idx on public.songs using gin (to_tsvector('english', title));
create index songs_tags_idx on public.songs using gin (tags);

create table public.song_notes (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- setlists
-- ============================================================
create table public.setlists (
  id uuid primary key default gen_random_uuid(),
  service_date date not null,
  theme text,
  leader_id uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.setlist_songs (
  setlist_id uuid not null references public.setlists(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  played_in_key text,
  position int not null,
  primary key (setlist_id, song_id)
);

create index setlist_songs_position_idx on public.setlist_songs (setlist_id, position);

-- ============================================================
-- Sunday schedule / roster
-- ============================================================
create table public.schedule_assignments (
  id uuid primary key default gen_random_uuid(),
  service_date date not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null, -- e.g. 'lead_vocal', 'acoustic', 'bass', 'drums', 'keys'
  created_at timestamptz not null default now(),
  unique (service_date, user_id, role)
);

create index schedule_service_date_idx on public.schedule_assignments (service_date);

-- ============================================================
-- devotions + bible plan
-- ============================================================
create table public.devotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null, -- markdown
  scripture_ref text,
  author_id uuid references public.profiles(id) on delete set null,
  published_at timestamptz not null default now()
);

create table public.bible_plan (
  id uuid primary key default gen_random_uuid(),
  week_of date not null unique,
  passages text[] not null default '{}',
  notes text
);

-- ============================================================
-- prayer requests + announcements
-- ============================================================
create table public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  is_answered boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  title text not null,
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- files (metadata; binary lives in Supabase Storage bucket 'files')
-- ============================================================
create type file_kind as enum ('audio', 'pdf', 'slide', 'midi', 'other');

create table public.files (
  id uuid primary key default gen_random_uuid(),
  song_id uuid references public.songs(id) on delete set null,
  storage_path text not null,
  kind file_kind not null default 'other',
  display_name text not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- share links (public read-only access by token)
-- ============================================================
create type share_resource_type as enum ('song', 'setlist');

create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  resource_type share_resource_type not null,
  resource_id uuid not null,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  expires_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index share_links_token_idx on public.share_links (token);

-- ============================================================
-- Row-Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.songs enable row level security;
alter table public.song_notes enable row level security;
alter table public.setlists enable row level security;
alter table public.setlist_songs enable row level security;
alter table public.schedule_assignments enable row level security;
alter table public.devotions enable row level security;
alter table public.bible_plan enable row level security;
alter table public.prayer_requests enable row level security;
alter table public.announcements enable row level security;
alter table public.files enable row level security;
alter table public.share_links enable row level security;

-- profiles: authenticated users can see all team members; users edit their own row;
-- leaders can change roles/instruments for anyone.
create policy "profiles read all (authenticated)" on public.profiles
  for select to authenticated using (true);
create policy "profiles update self" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles leader full" on public.profiles
  for all to authenticated using (public.is_leader()) with check (public.is_leader());

-- songs: all team members can read; leaders write.
create policy "songs read (authenticated)" on public.songs
  for select to authenticated using (true);
create policy "songs leader write" on public.songs
  for all to authenticated using (public.is_leader()) with check (public.is_leader());

-- song_notes: anyone authenticated can read and add notes; only author or leader can delete/update.
create policy "song_notes read (authenticated)" on public.song_notes
  for select to authenticated using (true);
create policy "song_notes insert self" on public.song_notes
  for insert to authenticated with check (author_id = auth.uid());
create policy "song_notes update own or leader" on public.song_notes
  for update to authenticated
  using (author_id = auth.uid() or public.is_leader())
  with check (author_id = auth.uid() or public.is_leader());
create policy "song_notes delete own or leader" on public.song_notes
  for delete to authenticated
  using (author_id = auth.uid() or public.is_leader());

-- setlists + setlist_songs: members read; leaders write.
create policy "setlists read (authenticated)" on public.setlists
  for select to authenticated using (true);
create policy "setlists leader write" on public.setlists
  for all to authenticated using (public.is_leader()) with check (public.is_leader());

create policy "setlist_songs read (authenticated)" on public.setlist_songs
  for select to authenticated using (true);
create policy "setlist_songs leader write" on public.setlist_songs
  for all to authenticated using (public.is_leader()) with check (public.is_leader());

-- schedule: everyone reads; leaders edit.
create policy "schedule read (authenticated)" on public.schedule_assignments
  for select to authenticated using (true);
create policy "schedule leader write" on public.schedule_assignments
  for all to authenticated using (public.is_leader()) with check (public.is_leader());

-- devotions + bible plan: members read; leaders write.
create policy "devotions read (authenticated)" on public.devotions
  for select to authenticated using (true);
create policy "devotions leader write" on public.devotions
  for all to authenticated using (public.is_leader()) with check (public.is_leader());

create policy "bible_plan read (authenticated)" on public.bible_plan
  for select to authenticated using (true);
create policy "bible_plan leader write" on public.bible_plan
  for all to authenticated using (public.is_leader()) with check (public.is_leader());

-- prayer_requests: any team member can read + post; mark answered = update author or leader.
create policy "prayer read (authenticated)" on public.prayer_requests
  for select to authenticated using (true);
create policy "prayer insert self" on public.prayer_requests
  for insert to authenticated with check (author_id = auth.uid());
create policy "prayer update own or leader" on public.prayer_requests
  for update to authenticated
  using (author_id = auth.uid() or public.is_leader())
  with check (author_id = auth.uid() or public.is_leader());
create policy "prayer delete own or leader" on public.prayer_requests
  for delete to authenticated
  using (author_id = auth.uid() or public.is_leader());

-- announcements: members read; leaders write.
create policy "announcements read (authenticated)" on public.announcements
  for select to authenticated using (true);
create policy "announcements leader write" on public.announcements
  for all to authenticated using (public.is_leader()) with check (public.is_leader());

-- files: members read; leaders write (anyone uploading must be authenticated; in MVP only leaders upload).
create policy "files read (authenticated)" on public.files
  for select to authenticated using (true);
create policy "files leader write" on public.files
  for all to authenticated using (public.is_leader()) with check (public.is_leader());

-- share_links:
--   * Authenticated leaders manage them.
--   * The PUBLIC role can SELECT by token (used by the unauthenticated /share/[token] route).
create policy "share_links anon read" on public.share_links
  for select to anon using (true);
create policy "share_links authed read" on public.share_links
  for select to authenticated using (true);
create policy "share_links leader write" on public.share_links
  for all to authenticated using (public.is_leader()) with check (public.is_leader());

-- ============================================================
-- Storage bucket for file uploads (run separately if needed)
-- ============================================================
-- In the Supabase dashboard, create a bucket named 'files' (private).
-- Then add these storage policies:
--
--   create policy "files bucket read (authenticated)"
--     on storage.objects for select to authenticated
--     using (bucket_id = 'files');
--
--   create policy "files bucket leader write"
--     on storage.objects for insert to authenticated
--     with check (bucket_id = 'files' and public.is_leader());
--
--   create policy "files bucket leader delete"
--     on storage.objects for delete to authenticated
--     using (bucket_id = 'files' and public.is_leader());
