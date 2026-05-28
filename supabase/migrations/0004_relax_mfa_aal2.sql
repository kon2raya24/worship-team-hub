-- ============================================================
-- 0004 · Roll back the AAL2 data-layer enforcement from 0002.
--
-- 0002 required a 2FA-enrolled user to be AAL2 (completed the code step) to
-- read/write data. That collided with the mobile app's biometric / offline /
-- quick sign-in, which only reach AAL1 — so 2FA-enrolled users silently got
-- no data on the phone. 2FA is still enforced at the LOGIN layer (web proxy
-- redirect to /mfa; mobile /mfa code step on password sign-in); we just stop
-- enforcing it again at the row level.
-- ============================================================

drop policy if exists "songs require aal2" on public.songs;
drop policy if exists "song_notes require aal2" on public.song_notes;
drop policy if exists "setlists require aal2" on public.setlists;
drop policy if exists "setlist_songs require aal2" on public.setlist_songs;
drop policy if exists "schedule require aal2" on public.schedule_assignments;
drop policy if exists "devotions require aal2" on public.devotions;
drop policy if exists "bible_plan require aal2" on public.bible_plan;
drop policy if exists "prayer require aal2" on public.prayer_requests;
drop policy if exists "announcements require aal2" on public.announcements;
drop policy if exists "files require aal2" on public.files;
drop function if exists public.mfa_ok();
