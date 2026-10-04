-- =====================================================================
--  005 — Pickl Rating + ranked QR matches (mobile app). Safe to re-run.
--
--  • Every player gets a Pickl Rating that starts at 100 (it replaces the
--    old 2.0–5.5 skill level). Ratings can only change through ranked matches.
--  • Matches: the host creates a match and shows a QR code; the opponent
--    scans it to join. Doubles partners are invited by @username and must
--    accept. When the match is done every player taps Done → Win or Lose.
--    Ratings change (+25 winners / −25 losers, never below 0) only when the
--    two teams agree. Conflicting answers mark the match "disputed".
--  • All match changes go through the functions below — players can't
--    write to the match tables directly.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Pickl Rating
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists rating integer not null default 100;
alter table public.profiles drop constraint if exists profiles_rating_check;
alter table public.profiles add constraint profiles_rating_check check (rating >= 0);
create index if not exists profiles_rating_idx on public.profiles (rating desc);

-- Players can edit their own profile, but not their rating (or anything else not listed here).
revoke update on public.profiles from anon, authenticated;
grant update (username, full_name, avatar_url, cover_url, bio, skill_level, play_style, location, paddle)
  on public.profiles to authenticated;
revoke insert on public.profiles from anon, authenticated;
grant insert (id, username, full_name) on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------
create table if not exists public.matches (
  id            uuid primary key default gen_random_uuid(),
  host_id       uuid not null references public.profiles (id) on delete cascade,
  format        text not null check (format in ('singles', 'doubles')),
  status        text not null default 'waiting'
                check (status in ('waiting', 'in_progress', 'completed', 'disputed', 'cancelled')),
  court_id      uuid references public.courts (id) on delete set null,
  location      text not null default '' check (char_length(location) <= 120),
  notes         text not null default '' check (char_length(notes) <= 300),
  winning_team  smallint check (winning_team in (1, 2)),
  created_at    timestamptz not null default now(),
  started_at    timestamptz,
  completed_at  timestamptz
);
create index if not exists matches_host_idx on public.matches (host_id, created_at desc);

-- The secret inside the QR code lives in its own table that nobody can read through the API.
create table if not exists public.match_codes (
  match_id  uuid primary key references public.matches (id) on delete cascade,
  code      text not null unique
);

create table if not exists public.match_players (
  match_id       uuid not null references public.matches (id) on delete cascade,
  user_id        uuid not null references public.profiles (id) on delete cascade,
  team           smallint not null check (team in (1, 2)),
  status         text not null default 'joined' check (status in ('invited', 'joined')),
  invited_by     uuid references public.profiles (id) on delete set null,
  result         text check (result in ('win', 'lose')),
  reported_at    timestamptz,
  rating_before  integer,
  rating_after   integer,
  joined_at      timestamptz not null default now(),
  primary key (match_id, user_id)
);
create index if not exists match_players_user_idx on public.match_players (user_id, joined_at desc);

alter table public.matches       enable row level security;
alter table public.match_codes   enable row level security;
alter table public.match_players enable row level security;

drop policy if exists "signed-in users read matches"       on public.matches;
drop policy if exists "signed-in users read match players" on public.match_players;
create policy "signed-in users read matches"       on public.matches       for select to authenticated using (true);
create policy "signed-in users read match players" on public.match_players for select to authenticated using (true);
-- match_codes: no policies at all = no API access.
revoke all on public.match_codes from anon, authenticated;
revoke all on public.matches, public.match_players from anon, authenticated;
grant select on public.matches, public.match_players to authenticated;

-- ---------------------------------------------------------------------
-- 3. Notifications for matches
-- ---------------------------------------------------------------------
alter table public.notifications add column if not exists match_id uuid references public.matches (id) on delete cascade;
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('like', 'comment', 'follow', 'club_join', 'match_invite', 'match_result'));

-- ---------------------------------------------------------------------
-- 4. Helpers
-- ---------------------------------------------------------------------
create or replace function public.match_team_size(p_format text)
returns integer language sql immutable set search_path = '' as $$
  select case when p_format = 'doubles' then 2 else 1 end;
$$;

-- Locks the match row and checks the caller has joined it.
create or replace function public.lock_match_for_player(p_match_id uuid)
returns public.matches
language plpgsql security definer set search_path = public as $$
declare
  m public.matches;
begin
  if auth.uid() is null then
    raise exception 'Please log in first.';
  end if;
  select * into m from public.matches where id = p_match_id for update;
  if not found then
    raise exception 'Match not found.';
  end if;
  if not exists (
    select 1 from public.match_players
    where match_id = p_match_id and user_id = auth.uid() and status = 'joined'
  ) then
    raise exception 'You are not in this match.';
  end if;
  return m;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Match actions (called from the app)
-- ---------------------------------------------------------------------

-- Host creates a match; returns its id and the QR code secret.
create or replace function public.create_match(
  p_format text,
  p_court_id uuid default null,
  p_location text default '',
  p_notes text default ''
) returns table (match_id uuid, code text)
language plpgsql security definer set search_path = public as $$
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
  if (select count(*) from public.matches where host_id = auth.uid() and status = 'waiting') >= 3 then
    raise exception 'You already have 3 matches waiting for players. Cancel one first.';
  end if;

  insert into public.matches (host_id, format, court_id, location, notes)
  values (auth.uid(), p_format, p_court_id, left(btrim(coalesce(p_location, '')), 120), left(btrim(coalesce(p_notes, '')), 300))
  returning id into v_id;

  insert into public.match_codes (match_id, code) values (v_id, v_code);
  insert into public.match_players (match_id, user_id, team, status) values (v_id, auth.uid(), 1, 'joined');

  return query select v_id, v_code;
end;
$$;

-- Players already in a match can show its QR code (e.g. the host's partner).
create or replace function public.get_match_code(p_match_id uuid)
returns text
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.match_players
    where match_id = p_match_id and user_id = auth.uid() and status = 'joined'
  ) then
    raise exception 'You are not in this match.';
  end if;
  return (select code from public.match_codes where match_id = p_match_id);
end;
$$;

-- Opponent scans the QR code to join. Fills team 2 first, then any open team-1 slot.
create or replace function public.join_match(p_code text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_match_id uuid;
  m public.matches;
  v_size integer;
  v_team smallint;
begin
  if auth.uid() is null then
    raise exception 'Please log in first.';
  end if;
  select match_id into v_match_id from public.match_codes where code = btrim(p_code);
  if v_match_id is null then
    raise exception 'That QR code is not a valid Pickl match.';
  end if;

  select * into m from public.matches where id = v_match_id for update;

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

-- Invite a player by @username into an open slot (doubles partners / opponents).
create or replace function public.invite_to_match(p_match_id uuid, p_username text, p_team integer)
returns void
language plpgsql security definer set search_path = public as $$
declare
  m public.matches;
  v_user uuid;
  v_name text := btrim(coalesce(p_username, ''));
begin
  m := public.lock_match_for_player(p_match_id);
  if m.status <> 'waiting' then
    raise exception 'Players can only be added before the match starts.';
  end if;
  if p_team not in (1, 2) then
    raise exception 'Pick a team.';
  end if;

  if left(v_name, 1) = '@' then
    v_name := substr(v_name, 2);
  end if;
  select id into v_user from public.profiles where username = v_name;
  if v_user is null then
    raise exception 'No player found with that username.';
  end if;
  if exists (select 1 from public.match_players where match_id = m.id and user_id = v_user) then
    raise exception 'That player is already in this match.';
  end if;
  if (select count(*) from public.match_players where match_id = m.id and team = p_team)
     >= public.match_team_size(m.format) then
    raise exception 'That team is already full.';
  end if;

  insert into public.match_players (match_id, user_id, team, status, invited_by)
  values (m.id, v_user, p_team, 'invited', auth.uid());

  insert into public.notifications (user_id, actor_id, type, match_id)
  values (v_user, auth.uid(), 'match_invite', m.id);
end;
$$;

-- Accept or decline a match invite.
create or replace function public.respond_to_match_invite(p_match_id uuid, p_accept boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare
  m public.matches;
begin
  if auth.uid() is null then
    raise exception 'Please log in first.';
  end if;
  select * into m from public.matches where id = p_match_id for update;
  if not found or not exists (
    select 1 from public.match_players where match_id = p_match_id and user_id = auth.uid() and status = 'invited'
  ) then
    raise exception 'This invite is no longer available.';
  end if;
  if m.status <> 'waiting' then
    raise exception 'This match has already started or ended.';
  end if;

  if p_accept then
    update public.match_players set status = 'joined', joined_at = now()
    where match_id = p_match_id and user_id = auth.uid();
  else
    delete from public.match_players where match_id = p_match_id and user_id = auth.uid();
  end if;
  delete from public.notifications where user_id = auth.uid() and match_id = p_match_id and type = 'match_invite';
end;
$$;

-- Remove a player before the start: the host can remove anyone, players can leave,
-- and whoever sent an invite can take it back. If the host leaves, the match is cancelled.
create or replace function public.remove_from_match(p_match_id uuid, p_user_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  m public.matches;
  v_invited_by uuid;
begin
  if auth.uid() is null then
    raise exception 'Please log in first.';
  end if;
  select * into m from public.matches where id = p_match_id for update;
  if not found then
    raise exception 'Match not found.';
  end if;
  if m.status <> 'waiting' then
    raise exception 'Players can only be removed before the match starts.';
  end if;
  select invited_by into v_invited_by from public.match_players where match_id = p_match_id and user_id = p_user_id;
  if not found then
    return;
  end if;
  if not (auth.uid() = m.host_id or auth.uid() = p_user_id or auth.uid() = v_invited_by) then
    raise exception 'You can''t remove that player.';
  end if;

  if p_user_id = m.host_id then
    update public.matches set status = 'cancelled', completed_at = now() where id = m.id;
  else
    delete from public.match_players where match_id = p_match_id and user_id = p_user_id;
    delete from public.notifications where user_id = p_user_id and match_id = p_match_id and type = 'match_invite';
  end if;
end;
$$;

-- Host starts the match once every slot is filled and everyone has accepted.
create or replace function public.start_match(p_match_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  m public.matches;
  v_size integer;
begin
  m := public.lock_match_for_player(p_match_id);
  if auth.uid() <> m.host_id then
    raise exception 'Only the host can start the match.';
  end if;
  if m.status <> 'waiting' then
    raise exception 'This match has already started or ended.';
  end if;
  v_size := public.match_team_size(m.format);
  if (select count(*) from public.match_players where match_id = m.id and team = 1 and status = 'joined') <> v_size
     or (select count(*) from public.match_players where match_id = m.id and team = 2 and status = 'joined') <> v_size then
    raise exception 'Every player needs to join before the match can start.';
  end if;
  update public.matches set status = 'in_progress', started_at = now() where id = m.id;
end;
$$;

-- Each player taps Done → Win or Lose. When the two teams agree, ratings update.
create or replace function public.report_match_result(p_match_id uuid, p_result text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  m public.matches;
  t1 text[];
  t2 text[];
  v_winner smallint;
  p record;
  v_new integer;
begin
  m := public.lock_match_for_player(p_match_id);
  if m.status not in ('in_progress', 'disputed') then
    raise exception 'This match isn''t being played right now.';
  end if;
  if p_result not in ('win', 'lose') then
    raise exception 'Choose Win or Lose.';
  end if;

  update public.match_players set result = p_result, reported_at = now()
  where match_id = m.id and user_id = auth.uid();

  select array_agg(distinct result) filter (where result is not null) into t1
  from public.match_players where match_id = m.id and team = 1;
  select array_agg(distinct result) filter (where result is not null) into t2
  from public.match_players where match_id = m.id and team = 2;

  -- Teammates disagree with each other.
  if coalesce(array_length(t1, 1), 0) > 1 or coalesce(array_length(t2, 1), 0) > 1 then
    update public.matches set status = 'disputed' where id = m.id;
    return 'disputed';
  end if;

  -- Still waiting for the other team.
  if t1 is null or t2 is null then
    update public.matches set status = 'in_progress' where id = m.id;
    return 'waiting';
  end if;

  if t1[1] = t2[1] then
    update public.matches set status = 'disputed' where id = m.id;
    return 'disputed';
  end if;

  v_winner := case when t1[1] = 'win' then 1 else 2 end;

  for p in
    select mp.user_id, mp.team, pr.rating
    from public.match_players mp
    join public.profiles pr on pr.id = mp.user_id
    where mp.match_id = m.id
    for update of pr
  loop
    v_new := greatest(0, p.rating + case when p.team = v_winner then 25 else -25 end);
    update public.profiles set rating = v_new where id = p.user_id;
    update public.match_players set rating_before = p.rating, rating_after = v_new
    where match_id = m.id and user_id = p.user_id;
    if p.user_id <> auth.uid() then
      insert into public.notifications (user_id, actor_id, type, match_id)
      values (p.user_id, auth.uid(), 'match_result', m.id);
    end if;
  end loop;

  update public.matches set status = 'completed', winning_team = v_winner, completed_at = now() where id = m.id;
  return 'completed';
end;
$$;

-- Any player can call off a match that hasn't been completed. Nobody's rating changes.
create or replace function public.cancel_match(p_match_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  m public.matches;
begin
  m := public.lock_match_for_player(p_match_id);
  if m.status in ('completed', 'cancelled') then
    raise exception 'This match has already ended.';
  end if;
  update public.matches set status = 'cancelled', completed_at = now() where id = m.id;
  delete from public.notifications where match_id = m.id and type = 'match_invite';
end;
$$;

-- ---------------------------------------------------------------------
-- 6. Permissions
-- ---------------------------------------------------------------------
revoke execute on function public.lock_match_for_player(uuid) from public, anon, authenticated;
revoke execute on function public.match_team_size(text) from public, anon;

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.create_match(text, uuid, text, text)',
    'public.get_match_code(uuid)',
    'public.join_match(text)',
    'public.invite_to_match(uuid, text, integer)',
    'public.respond_to_match_invite(uuid, boolean)',
    'public.remove_from_match(uuid, uuid)',
    'public.start_match(uuid)',
    'public.report_match_result(uuid, text)',
    'public.cancel_match(uuid)'
  ] loop
    execute 'revoke execute on function ' || f || ' from public, anon';
    execute 'grant execute on function ' || f || ' to authenticated';
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- 7. Realtime: live match rooms
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['matches', 'match_players'] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end;
$$;
