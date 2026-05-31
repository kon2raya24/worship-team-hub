-- ============================================================
-- 0005 · Security hardening (full-sweep audit fixes)
--
--   1. CRITICAL — a member could promote themselves to 'leader' by PATCHing
--      their own profiles row directly via the public anon key. The
--      "profiles update self" policy only checked id = auth.uid() and placed
--      no constraint on WHICH columns changed. Re-create it so a user may edit
--      their own row but can NEVER change their own role: the WITH CHECK pins
--      role to its committed value (the subquery reads the pre-UPDATE row, so
--      any self role-change fails the check). The separate "profiles leader
--      full" policy still lets real leaders manage everyone's role.
--      Do NOT rely on REVOKE UPDATE(role) instead — column grants are
--      evaluated independently of RLS and leaders are also 'authenticated',
--      so a revoke would also block legitimate leader role management.
--
--   2. Guard against demoting OR deleting the last remaining leader — that
--      would leave the team with no one able to manage roles and no in-app
--      recovery path. Enforced with a BEFORE UPDATE/DELETE trigger so it holds
--      even against direct API calls (the app-level check in team/actions.ts
--      is for nicer error messaging).
--
--   3. share_links was SELECT-able by the anon (and authenticated) role with
--      USING (true) — anyone holding the public anon key could enumerate the
--      entire table and reach every shared song/setlist. The /share/[token]
--      page resolves tokens via the service-role client (which bypasses RLS),
--      so these read policies are unnecessary; drop them. Also give links a
--      default 90-day expiry (the page already enforces expires_at; nothing
--      was ever setting it, so every link was permanent). Adjust or remove the
--      interval below if you want a different lifetime.
-- ============================================================

-- 1. profiles: self-edit name/instruments, but never self role change.
drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

-- 2. Never allow the last leader to be demoted or deleted.
create or replace function public.prevent_last_leader_loss()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'UPDATE' and old.role = 'leader' and new.role is distinct from 'leader')
     or (tg_op = 'DELETE' and old.role = 'leader') then
    if (select count(*) from public.profiles where role = 'leader') <= 1 then
      raise exception 'At least one leader must remain';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists profiles_prevent_last_leader on public.profiles;
create trigger profiles_prevent_last_leader
  before update or delete on public.profiles
  for each row execute function public.prevent_last_leader_loss();

-- 3. share_links: stop exposing tokens to anon/authenticated; default expiry.
drop policy if exists "share_links anon read" on public.share_links;
drop policy if exists "share_links authed read" on public.share_links;
alter table public.share_links
  alter column expires_at set default (now() + interval '90 days');
