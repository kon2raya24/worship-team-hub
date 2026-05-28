-- ============================================================
-- 0002 · Enforce AAL2 (completed 2FA) for data access — at the database
-- layer, not just the app's /mfa page (closes review finding H2).
--
-- OPT-IN & SAFE TO APPLY ANYTIME: the helper returns TRUE for anyone who has
-- NOT enrolled a verified factor, so this is a no-op for the whole team until
-- an individual turns on 2FA. Once a user has a verified factor, their session
-- must be AAL2 (i.e. they completed the TOTP step) to read/write team data —
-- so a stolen password (AAL1 only) can no longer hit PostgREST directly and
-- bypass the /mfa step.
-- ============================================================

-- TRUE when the caller's assurance level is sufficient:
--   * has >= 1 verified factor  -> require aal2
--   * otherwise                 -> always allowed
-- SECURITY DEFINER so it may read auth.mfa_factors (not selectable by the
-- authenticated role directly). STABLE: evaluated once per statement.
create or replace function public.mfa_ok()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1 from auth.mfa_factors f
      where f.user_id = (select auth.uid()) and f.status = 'verified'
    )
    then coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
    else true
  end;
$$;

revoke all on function public.mfa_ok() from public;
grant execute on function public.mfa_ok() to authenticated;

-- Restrictive policies AND with the existing permissive rules: access now
-- needs BOTH the normal read/write permission AND a sufficient AAL.
create policy "songs require aal2" on public.songs
  as restrictive for all to authenticated
  using (public.mfa_ok()) with check (public.mfa_ok());

create policy "song_notes require aal2" on public.song_notes
  as restrictive for all to authenticated
  using (public.mfa_ok()) with check (public.mfa_ok());

create policy "setlists require aal2" on public.setlists
  as restrictive for all to authenticated
  using (public.mfa_ok()) with check (public.mfa_ok());

create policy "setlist_songs require aal2" on public.setlist_songs
  as restrictive for all to authenticated
  using (public.mfa_ok()) with check (public.mfa_ok());

create policy "schedule require aal2" on public.schedule_assignments
  as restrictive for all to authenticated
  using (public.mfa_ok()) with check (public.mfa_ok());

create policy "devotions require aal2" on public.devotions
  as restrictive for all to authenticated
  using (public.mfa_ok()) with check (public.mfa_ok());

create policy "bible_plan require aal2" on public.bible_plan
  as restrictive for all to authenticated
  using (public.mfa_ok()) with check (public.mfa_ok());

create policy "prayer require aal2" on public.prayer_requests
  as restrictive for all to authenticated
  using (public.mfa_ok()) with check (public.mfa_ok());

create policy "announcements require aal2" on public.announcements
  as restrictive for all to authenticated
  using (public.mfa_ok()) with check (public.mfa_ok());

create policy "files require aal2" on public.files
  as restrictive for all to authenticated
  using (public.mfa_ok()) with check (public.mfa_ok());

-- ------------------------------------------------------------
-- ROLLBACK (run if anything misbehaves):
--   drop policy "songs require aal2" on public.songs;
--   drop policy "song_notes require aal2" on public.song_notes;
--   drop policy "setlists require aal2" on public.setlists;
--   drop policy "setlist_songs require aal2" on public.setlist_songs;
--   drop policy "schedule require aal2" on public.schedule_assignments;
--   drop policy "devotions require aal2" on public.devotions;
--   drop policy "bible_plan require aal2" on public.bible_plan;
--   drop policy "prayer require aal2" on public.prayer_requests;
--   drop policy "announcements require aal2" on public.announcements;
--   drop policy "files require aal2" on public.files;
--   drop function public.mfa_ok();
-- ------------------------------------------------------------
