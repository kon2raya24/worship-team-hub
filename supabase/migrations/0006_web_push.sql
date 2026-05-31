-- ============================================================
-- 0006 · Web Push subscriptions
--
-- The web PWA's service worker already handles `push` / `notificationclick`,
-- but nothing subscribed the browser, so PWA users got no notifications (only
-- the Flutter app, via FCM, did). This table stores standard Web Push
-- subscriptions; the send-push Edge Function delivers to them with VAPID.
--
-- Setup (one-time):
--   1. Generate VAPID keys:  npx web-push generate-vapid-keys
--   2. Web env:  NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public key>
--   3. Edge Function secrets:
--        supabase secrets set VAPID_PUBLIC_KEY=<public key>
--        supabase secrets set VAPID_PRIVATE_KEY=<private key>
--        supabase secrets set VAPID_SUBJECT="mailto:you@example.com"
-- ============================================================

create table public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- Users manage only their own subscriptions. The send-push function reads
-- them with the service-role key (which bypasses RLS), so no read policy for
-- other roles is needed.
create policy "push_subscriptions self" on public.push_subscriptions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
