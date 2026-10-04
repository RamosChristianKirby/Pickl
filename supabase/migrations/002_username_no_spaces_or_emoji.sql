-- Run this once in Supabase → SQL Editor (after 001_any_username.sql).
-- Usernames: letters (any case), numbers and keyboard symbols. No spaces or emoji. Max 50 chars.

-- 1. Clean up any existing usernames that break the new rule
--    (removes spaces/emoji; falls back to player_xxxxxxxx if nothing usable is left or it's taken).
update public.profiles p
set username = case
  when left(regexp_replace(p.username, '[^!-~]', '', 'g'), 50) <> ''
   and not exists (
     select 1 from public.profiles q
     where q.username = left(regexp_replace(p.username, '[^!-~]', '', 'g'), 50) and q.id <> p.id
   )
  then left(regexp_replace(p.username, '[^!-~]', '', 'g'), 50)
  else 'player_' || substr(replace(p.id::text, '-', ''), 1, 8)
end
where p.username !~ '^[!-~]{1,50}$';

-- 2. Enforce the rule.
alter table public.profiles drop constraint if exists profiles_username_check;
alter table public.profiles drop constraint if exists profiles_username_not_blank;
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles
  add constraint profiles_username_format check (username ~ '^[!-~]{1,50}$');

-- 3. Signup trigger uses the same rule.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  wanted text := btrim(coalesce(new.raw_user_meta_data ->> 'username', ''));
  final_username text;
begin
  if wanted ~ '^[!-~]{1,50}$' and not exists (select 1 from public.profiles where username = wanted) then
    final_username := wanted;
  else
    final_username := 'player_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  insert into public.profiles (id, username, full_name)
  values (new.id, final_username, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;
