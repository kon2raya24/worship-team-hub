-- ============================================================
-- 0003 · Push notifications — device token registry.
-- The mobile app stores its FCM token here on launch/login; the send-push
-- Edge Function reads tokens by user to deliver notifications.
-- ============================================================

create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null unique,
  platform text not null default 'android',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists device_tokens_user_idx
  on public.device_tokens (user_id);

alter table public.device_tokens enable row level security;

-- A user manages only their own device tokens. (No AAL2 restriction here on
-- purpose: token registration runs right after sign-in, and a token is not
-- sensitive team data — it's just where to reach this user's device.)
create policy "device_tokens self" on public.device_tokens
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
