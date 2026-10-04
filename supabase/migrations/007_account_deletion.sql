-- =====================================================================
--  007 — "Delete my account". Safe to re-run.
--
--  Deleting the auth user cascades to the profile and everything that
--  belongs to it (posts, comments, likes, follows, clubs owned, club
--  memberships, check-ins, hosted matches, match records, notifications).
--  Courts the user added stay, with created_by set to null.
--  Uploaded photos are removed by the app first, through the Storage API.
-- =====================================================================

create or replace function public.delete_my_account()
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Please log in first.';
  end if;
  delete from auth.users where id = v_uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
