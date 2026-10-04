-- Run this once in Supabase → SQL Editor if you already ran schema.sql before.
-- Removes the old username format rule: any username is allowed as long as it
-- isn't blank and isn't already taken.

alter table public.profiles drop constraint if exists profiles_username_check;
alter table public.profiles drop constraint if exists profiles_username_not_blank;
alter table public.profiles
  add constraint profiles_username_not_blank check (char_length(btrim(username)) > 0);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  wanted text := btrim(coalesce(new.raw_user_meta_data ->> 'username', ''));
  final_username text;
begin
  if wanted <> '' and not exists (select 1 from public.profiles where username = wanted) then
    final_username := wanted;
  else
    final_username := 'player_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  insert into public.profiles (id, username, full_name)
  values (new.id, final_username, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;
