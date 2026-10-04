-- =====================================================================
--  006 — Private clubs, members-only club posts, private matches. Safe to re-run.
--
--  • Club posts (and their likes/comments) are visible only to club members.
--  • Clubs are Public (anyone can join) or Private (joining needs a password).
--  • Matches are Public (listed in "Open matches", anyone can join) or Private
--    (scan the QR code and enter the password).
--  • Passwords are stored as bcrypt hashes in tables nobody can read via the API.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 1. Club posts are members-only
-- ---------------------------------------------------------------------
drop policy if exists "signed-in users read posts" on public.posts;
drop policy if exists "read feed and own club posts" on public.posts;
create policy "read feed and own club posts" on public.posts for select to authenticated
  using (club_id is null or author_id = auth.uid() or public.is_club_member(club_id));

-- Likes and comments follow the post: if you can't see the post, you can't see them.
drop policy if exists "signed-in users read likes" on public.likes;
drop policy if exists "read likes on visible posts" on public.likes;
create policy "read likes on visible posts" on public.likes for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));

drop policy if exists "signed-in users read comments" on public.comments;
drop policy if exists "read comments on visible posts" on public.comments;
create policy "read comments on visible posts" on public.comments for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));

-- Only people who can see a post can like or comment on it.
drop policy if exists "users like" on public.likes;
create policy "users like" on public.likes for insert to authenticated
  with check (auth.uid() = user_id and exists (select 1 from public.posts p where p.id = post_id));
drop policy if exists "users comment" on public.comments;
create policy "users comment" on public.comments for insert to authenticated
  with check (auth.uid() = author_id and exists (select 1 from public.posts p where p.id = post_id));

-- ---------------------------------------------------------------------
-- 2. Public / private clubs
-- ---------------------------------------------------------------------
alter table public.clubs add column if not exists visibility text not null default 'public';
alter table public.clubs drop constraint if exists clubs_visibility_check;
alter table public.clubs add constraint clubs_visibility_check check (visibility in ('public', 'private'));

create table if not exists public.club_secrets (
  club_id        uuid primary key references public.clubs (id) on delete cascade,
  password_hash  text not null
);
alter table public.club_secrets enable row level security;
revoke all on public.club_secrets from anon, authenticated;

-- Direct joins only for public clubs; private clubs go through join_club().
drop policy if exists "users join clubs" on public.club_members;
create policy "users join clubs" on public.club_members for insert to authenticated
  with check (
    auth.uid() = user_id and role = 'member'
    and exists (select 1 from public.clubs c where c.id = club_id and c.visibility = 'public')
  );

-- Clubs can only become private through create_club / set_club_password (which store a password),
-- so players may insert/update every club column except visibility.
revoke insert, update on public.clubs from anon, authenticated;
grant insert (name, slug, description, location, cover_url, owner_id) on public.clubs to authenticated;
grant update (name, description, location, cover_url) on public.clubs to authenticated;

create or replace function public.create_club(
  p_name text,
  p_slug text,
  p_description text default '',
  p_location text default '',
  p_cover_url text default null,
  p_visibility text default 'public',
  p_password text default null
) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id uuid;
  v_slug text := lower(btrim(coalesce(p_slug, '')));
begin
  if auth.uid() is null then
    raise exception 'Please log in first.';
  end if;
  if char_length(btrim(coalesce(p_name, ''))) < 3 then
    raise exception 'Club name must be at least 3 characters.';
  end if;
  if p_visibility not in ('public', 'private') then
    raise exception 'Choose public or private.';
  end if;
  if p_visibility = 'private' and char_length(coalesce(p_password, '')) not between 4 and 50 then
    raise exception 'Private clubs need a password of 4 to 50 characters.';
  end if;
  if p_cover_url is not null and position(('/media/' || auth.uid()::text || '/') in p_cover_url) = 0 then
    raise exception 'Invalid cover image.';
  end if;
  if exists (select 1 from public.clubs where slug = v_slug) then
    v_slug := left(v_slug, 50) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
  end if;

  insert into public.clubs (name, slug, description, location, cover_url, owner_id, visibility)
  values (left(btrim(p_name), 80), v_slug, left(btrim(coalesce(p_description, '')), 1000),
          left(btrim(coalesce(p_location, '')), 120), p_cover_url, auth.uid(), p_visibility)
  returning id into v_id;

  if p_visibility = 'private' then
    insert into public.club_secrets (club_id, password_hash) values (v_id, crypt(p_password, gen_salt('bf')));
  end if;
  return v_slug;
end;
$$;

create or replace function public.set_club_password(p_club_id uuid, p_password text)
returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from public.clubs where id = p_club_id and owner_id = auth.uid()) then
    raise exception 'Only the club owner can change this.';
  end if;
  if char_length(coalesce(p_password, '')) not between 4 and 50 then
    raise exception 'Password must be 4 to 50 characters.';
  end if;
  insert into public.club_secrets (club_id, password_hash) values (p_club_id, crypt(p_password, gen_salt('bf')))
  on conflict (club_id) do update set password_hash = excluded.password_hash;
  update public.clubs set visibility = 'private' where id = p_club_id;
end;
$$;

-- Join any club; private clubs need the right password.
create or replace function public.join_club(p_club_id uuid, p_password text default null)
returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_visibility text;
  v_hash text;
begin
  if auth.uid() is null then
    raise exception 'Please log in first.';
  end if;
  select visibility into v_visibility from public.clubs where id = p_club_id;
  if v_visibility is null then
    raise exception 'Club not found.';
  end if;
  if v_visibility = 'private' then
    select password_hash into v_hash from public.club_secrets where club_id = p_club_id;
    if v_hash is null or p_password is null or crypt(p_password, v_hash) <> v_hash then
      raise exception 'Wrong club password.';
    end if;
  end if;
  insert into public.club_members (club_id, user_id, role) values (p_club_id, auth.uid(), 'member')
  on conflict do nothing;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. Public / private matches
-- ---------------------------------------------------------------------
alter table public.matches add column if not exists visibility text not null default 'private';
alter table public.matches drop constraint if exists matches_visibility_check;
alter table public.matches add constraint matches_visibility_check check (visibility in ('public', 'private'));
alter table public.match_codes add column if not exists password_hash text;
create index if not exists matches_open_idx on public.matches (created_at desc) where status = 'waiting' and visibility = 'public';

drop function if exists public.create_match(text, uuid, text, text);
create or replace function public.create_match(
  p_format text,
  p_court_id uuid default null,
  p_location text default '',
  p_notes text default '',
  p_visibility text default 'public',
  p_password text default null
) returns table (match_id uuid, code text)
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id uuid;
  v_code text := replace(gen_random_uuid()::text, '-', '');
begin
  if auth.uid() is null then
    raise exception 'Please log in first.';
  end if;
  if p_format not in ('singles', 'doubles') then
    raise exception 'Choose singles or doubles.';
  end if;
  if p_visibility not in ('public', 'private') then
    raise exception 'Choose public or private.';
  end if;
  if p_visibility = 'private' and char_length(coalesce(p_password, '')) not between 4 and 50 then
    raise exception 'Private matches need a password of 4 to 50 characters.';
  end if;
  if (select count(*) from public.matches where host_id = auth.uid() and status = 'waiting') >= 3 then
    raise exception 'You already have 3 matches waiting for players. Cancel one first.';
  end if;

  insert into public.matches (host_id, format, court_id, location, notes, visibility)
  values (auth.uid(), p_format, p_court_id, left(btrim(coalesce(p_location, '')), 120), left(btrim(coalesce(p_notes, '')), 300), p_visibility)
  returning id into v_id;

  insert into public.match_codes (match_id, code, password_hash)
  values (v_id, v_code, case when p_visibility = 'private' then crypt(p_password, gen_salt('bf')) end);
  insert into public.match_players (match_id, user_id, team, status) values (v_id, auth.uid(), 1, 'joined');

  return query select v_id, v_code;
end;
$$;

-- Shared join logic: fills team 2 first, then any open team-1 slot.
create or replace function public.match_take_slot(p_match_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  m public.matches;
  v_size integer;
  v_team smallint;
begin
  select * into m from public.matches where id = p_match_id for update;
  if exists (select 1 from public.match_players where match_id = m.id and user_id = auth.uid()) then
    update public.match_players set status = 'joined', joined_at = now()
    where match_id = m.id and user_id = auth.uid() and status = 'invited' and m.status = 'waiting';
    return m.id;
  end if;
  if m.status <> 'waiting' then
    raise exception 'This match has already started or ended.';
  end if;
  v_size := public.match_team_size(m.format);
  if (select count(*) from public.match_players where match_id = m.id and team = 2) < v_size then
    v_team := 2;
  elsif (select count(*) from public.match_players where match_id = m.id and team = 1) < v_size then
    v_team := 1;
  else
    raise exception 'This match is already full.';
  end if;
  insert into public.match_players (match_id, user_id, team, status) values (m.id, auth.uid(), v_team, 'joined');
  return m.id;
end;
$$;

drop function if exists public.join_match(text);
create or replace function public.join_match(p_code text, p_password text default null)
returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_match_id uuid;
  v_hash text;
  v_visibility text;
begin
  if auth.uid() is null then
    raise exception 'Please log in first.';
  end if;
  select c.match_id, c.password_hash, m.visibility into v_match_id, v_hash, v_visibility
  from public.match_codes c join public.matches m on m.id = c.match_id
  where c.code = btrim(p_code);
  if v_match_id is null then
    raise exception 'That QR code is not a valid Pickl match.';
  end if;
  -- Players who were invited by @username or QR don't need the password.
  -- (Matches created before passwords existed have no hash and only need the QR code.)
  if v_visibility = 'private' and v_hash is not null
     and not exists (select 1 from public.match_players where match_id = v_match_id and user_id = auth.uid()) then
    if p_password is null or p_password = '' then
      raise exception 'PASSWORD_REQUIRED: This match is private. Enter the match password.';
    end if;
    if crypt(p_password, v_hash) <> v_hash then
      raise exception 'Wrong match password.';
    end if;
  end if;
  return public.match_take_slot(v_match_id);
end;
$$;

-- Join a public match straight from the "Open matches" list.
create or replace function public.join_public_match(p_match_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Please log in first.';
  end if;
  if not exists (select 1 from public.matches where id = p_match_id and visibility = 'public') then
    raise exception 'This match is private. Ask the host for the QR code and password.';
  end if;
  return public.match_take_slot(p_match_id);
end;
$$;

-- ---------------------------------------------------------------------
-- 4. Permissions
-- ---------------------------------------------------------------------
revoke all on public.club_secrets, public.match_codes from anon, authenticated;
revoke execute on function public.match_take_slot(uuid) from public, anon, authenticated;

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.create_club(text, text, text, text, text, text, text)',
    'public.set_club_password(uuid, text)',
    'public.join_club(uuid, text)',
    'public.create_match(text, uuid, text, text, text, text)',
    'public.join_match(text, text)',
    'public.join_public_match(uuid)'
  ] loop
    execute 'revoke execute on function ' || f || ' from public, anon';
    execute 'grant execute on function ' || f || ' to authenticated';
  end loop;
end;
$$;
