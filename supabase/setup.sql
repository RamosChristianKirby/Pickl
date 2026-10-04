-- =====================================================================
--  Pickl — COMPLETE database setup (schema + all migrations).
--  Paste this whole file into Supabase → SQL Editor and click Run.
--  Safe to run again at any time.
-- =====================================================================

-- =====================================================================
--  Pickl — Supabase schema
--  Run this whole file once in: Supabase Dashboard → SQL Editor → New query
--  Safe to re-run: it drops and recreates policies/triggers it owns.
-- =====================================================================

-- ---------------------------------------------------------------------
-- PROFILES (1:1 with auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null unique check (username ~ '^[!-~]{1,50}$'),
  full_name    text not null default '',
  avatar_url   text,
  cover_url    text,
  bio          text not null default '' check (char_length(bio) <= 300),
  skill_level  numeric(2,1) check (skill_level between 1.0 and 6.0),
  play_style   text check (play_style in ('singles', 'doubles', 'mixed', 'all')),
  location     text not null default '',
  paddle       text not null default '',
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- CLUBS
-- ---------------------------------------------------------------------
create table if not exists public.clubs (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  name         text not null check (char_length(name) between 3 and 80),
  description  text not null default '' check (char_length(description) <= 1000),
  location     text not null default '',
  cover_url    text,
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now()
);

create table if not exists public.club_members (
  club_id    uuid not null references public.clubs (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at  timestamptz not null default now(),
  primary key (club_id, user_id)
);

-- ---------------------------------------------------------------------
-- POSTS / LIKES / COMMENTS
-- ---------------------------------------------------------------------
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles (id) on delete cascade,
  club_id     uuid references public.clubs (id) on delete cascade,
  content     text not null default '' check (char_length(content) <= 2000),
  image_url   text,
  created_at  timestamptz not null default now(),
  constraint post_not_empty check (char_length(content) > 0 or image_url is not null)
);
create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_author_idx on public.posts (author_id);
create index if not exists posts_club_idx on public.posts (club_id);

create table if not exists public.likes (
  post_id     uuid not null references public.posts (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  content     text not null check (char_length(content) between 1 and 1000),
  created_at  timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, created_at);

-- ---------------------------------------------------------------------
-- FOLLOWS
-- ---------------------------------------------------------------------
create table if not exists public.follows (
  follower_id   uuid not null references public.profiles (id) on delete cascade,
  following_id  uuid not null references public.profiles (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);
create index if not exists follows_following_idx on public.follows (following_id);

-- ---------------------------------------------------------------------
-- COURTS / CHECK-INS
-- ---------------------------------------------------------------------
create table if not exists public.courts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 3 and 100),
  address     text not null default '',
  city        text not null default '',
  num_courts  int  not null default 1 check (num_courts between 1 and 100),
  indoor      boolean not null default false,
  lights      boolean not null default false,
  surface     text not null default 'hard',
  notes       text not null default '',
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.check_ins (
  id          uuid primary key default gen_random_uuid(),
  court_id    uuid not null references public.courts (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  note        text not null default '' check (char_length(note) <= 140),
  created_at  timestamptz not null default now()
);
create index if not exists check_ins_court_idx on public.check_ins (court_id, created_at desc);

-- ---------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------

-- Create a profile row automatically whenever someone signs up.
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Club creator automatically becomes its owner-member.
create or replace function public.handle_new_club()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.club_members (club_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_club_created on public.clubs;
create trigger on_club_created
  after insert on public.clubs
  for each row execute function public.handle_new_club();

-- Helper used by RLS: is the current user a member of a club?
create or replace function public.is_club_member(p_club_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.club_members
    where club_id = p_club_id and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.clubs        enable row level security;
alter table public.club_members enable row level security;
alter table public.posts        enable row level security;
alter table public.likes        enable row level security;
alter table public.comments     enable row level security;
alter table public.follows      enable row level security;
alter table public.courts       enable row level security;
alter table public.check_ins    enable row level security;

-- profiles
drop policy if exists "profiles are public"          on public.profiles;
drop policy if exists "users insert own profile"     on public.profiles;
drop policy if exists "users update own profile"     on public.profiles;
create policy "profiles are public"      on public.profiles for select using (true);
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- clubs
drop policy if exists "clubs are public"        on public.clubs;
drop policy if exists "users create clubs"      on public.clubs;
drop policy if exists "owners update clubs"     on public.clubs;
drop policy if exists "owners delete clubs"     on public.clubs;
create policy "clubs are public"    on public.clubs for select using (true);
create policy "users create clubs"  on public.clubs for insert with check (auth.uid() = owner_id);
create policy "owners update clubs" on public.clubs for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners delete clubs" on public.clubs for delete using (auth.uid() = owner_id);

-- club_members
drop policy if exists "memberships are public" on public.club_members;
drop policy if exists "users join clubs"       on public.club_members;
drop policy if exists "users leave clubs"      on public.club_members;
create policy "memberships are public" on public.club_members for select using (true);
create policy "users join clubs"       on public.club_members for insert with check (auth.uid() = user_id and role = 'member');
create policy "users leave clubs"      on public.club_members for delete using (auth.uid() = user_id and role <> 'owner');

-- posts
drop policy if exists "posts are public"     on public.posts;
drop policy if exists "users create posts"   on public.posts;
drop policy if exists "authors delete posts" on public.posts;
create policy "posts are public"   on public.posts for select using (true);
create policy "users create posts" on public.posts for insert
  with check (auth.uid() = author_id and (club_id is null or public.is_club_member(club_id)));
create policy "authors delete posts" on public.posts for delete using (auth.uid() = author_id);

-- likes
drop policy if exists "likes are public"  on public.likes;
drop policy if exists "users like"        on public.likes;
drop policy if exists "users unlike"      on public.likes;
create policy "likes are public" on public.likes for select using (true);
create policy "users like"       on public.likes for insert with check (auth.uid() = user_id);
create policy "users unlike"     on public.likes for delete using (auth.uid() = user_id);

-- comments
drop policy if exists "comments are public"     on public.comments;
drop policy if exists "users comment"           on public.comments;
drop policy if exists "authors delete comments" on public.comments;
create policy "comments are public"     on public.comments for select using (true);
create policy "users comment"           on public.comments for insert with check (auth.uid() = author_id);
create policy "authors delete comments" on public.comments for delete using (auth.uid() = author_id);

-- follows
drop policy if exists "follows are public" on public.follows;
drop policy if exists "users follow"       on public.follows;
drop policy if exists "users unfollow"     on public.follows;
create policy "follows are public" on public.follows for select using (true);
create policy "users follow"       on public.follows for insert with check (auth.uid() = follower_id);
create policy "users unfollow"     on public.follows for delete using (auth.uid() = follower_id);

-- courts
drop policy if exists "courts are public"   on public.courts;
drop policy if exists "users add courts"    on public.courts;
drop policy if exists "creators edit courts" on public.courts;
create policy "courts are public"    on public.courts for select using (true);
create policy "users add courts"     on public.courts for insert with check (auth.uid() = created_by);
create policy "creators edit courts" on public.courts for update using (auth.uid() = created_by) with check (auth.uid() = created_by);

-- check_ins
drop policy if exists "check-ins are public" on public.check_ins;
drop policy if exists "users check in"       on public.check_ins;
drop policy if exists "users check out"      on public.check_ins;
create policy "check-ins are public" on public.check_ins for select using (true);
create policy "users check in"       on public.check_ins for insert with check (auth.uid() = user_id);
create policy "users check out"      on public.check_ins for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- STORAGE: public "media" bucket for avatars, covers and post photos.
-- Files must live under a folder named after the uploader's user id.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "media is public"          on storage.objects;
drop policy if exists "users upload own media"   on storage.objects;
drop policy if exists "users update own media"   on storage.objects;
drop policy if exists "users delete own media"   on storage.objects;
create policy "media is public" on storage.objects for select
  using (bucket_id = 'media');
create policy "users upload own media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users update own media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

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

-- =====================================================================
--  003 — Notifications, court map coordinates and realtime.
--  Run once in Supabase → SQL Editor (after schema.sql). Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- COURT COORDINATES (for the map)
-- ---------------------------------------------------------------------
alter table public.courts add column if not exists latitude  double precision;
alter table public.courts add column if not exists longitude double precision;
alter table public.courts drop constraint if exists courts_lat_range;
alter table public.courts drop constraint if exists courts_lng_range;
alter table public.courts add constraint courts_lat_range check (latitude  is null or latitude  between -90  and 90);
alter table public.courts add constraint courts_lng_range check (longitude is null or longitude between -180 and 180);

-- ---------------------------------------------------------------------
-- (Games / open play were removed — clean up if an earlier version created them.)
-- ---------------------------------------------------------------------
drop table if exists public.game_players cascade;
drop table if exists public.games cascade;
drop function if exists public.handle_new_game();
drop function if exists public.enforce_game_capacity();
drop function if exists public.on_game_join();
drop function if exists public.notify(uuid, uuid, text, uuid, uuid, uuid);
do $$
begin
  if to_regclass('public.notifications') is not null then
    delete from public.notifications where type = 'game_join';
    alter table public.notifications drop column if exists game_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- (Direct messages were removed — clean up if an earlier version created them.)
-- ---------------------------------------------------------------------
drop function if exists public.mark_messages_read(uuid);
drop table if exists public.messages cascade;

-- ---------------------------------------------------------------------
-- NOTIFICATIONS (created automatically by triggers)
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  actor_id    uuid not null references public.profiles (id) on delete cascade,
  type        text not null,
  post_id     uuid references public.posts (id) on delete cascade,
  club_id     uuid references public.clubs (id) on delete cascade,
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check check (type in ('like', 'comment', 'follow', 'club_join'));

create or replace function public.notify(
  p_user uuid, p_actor uuid, p_type text,
  p_post uuid default null, p_club uuid default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user is null or p_user = p_actor then
    return;
  end if;
  insert into public.notifications (user_id, actor_id, type, post_id, club_id)
  values (p_user, p_actor, p_type, p_post, p_club);
end;
$$;

create or replace function public.mark_notifications_read()
returns void language sql security definer set search_path = public as $$
  update public.notifications set read_at = now() where user_id = auth.uid() and read_at is null;
$$;

-- Likes
create or replace function public.on_like_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify((select author_id from public.posts where id = new.post_id), new.user_id, 'like', new.post_id);
  return new;
end;
$$;
create or replace function public.on_like_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.notifications
  where type = 'like' and actor_id = old.user_id and post_id = old.post_id and read_at is null;
  return old;
end;
$$;
drop trigger if exists notify_like on public.likes;
create trigger notify_like after insert on public.likes for each row execute function public.on_like_insert();
drop trigger if exists unnotify_like on public.likes;
create trigger unnotify_like after delete on public.likes for each row execute function public.on_like_delete();

-- Comments
create or replace function public.on_comment_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify((select author_id from public.posts where id = new.post_id), new.author_id, 'comment', new.post_id);
  return new;
end;
$$;
drop trigger if exists notify_comment on public.comments;
create trigger notify_comment after insert on public.comments for each row execute function public.on_comment_insert();

-- Follows
create or replace function public.on_follow_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify(new.following_id, new.follower_id, 'follow');
  return new;
end;
$$;
create or replace function public.on_follow_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.notifications
  where type = 'follow' and actor_id = old.follower_id and user_id = old.following_id and read_at is null;
  return old;
end;
$$;
drop trigger if exists notify_follow on public.follows;
create trigger notify_follow after insert on public.follows for each row execute function public.on_follow_insert();
drop trigger if exists unnotify_follow on public.follows;
create trigger unnotify_follow after delete on public.follows for each row execute function public.on_follow_delete();

-- Club joins (notify the owner)
create or replace function public.on_club_join()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'member' then
    perform public.notify((select owner_id from public.clubs where id = new.club_id), new.user_id, 'club_join', null, new.club_id);
  end if;
  return new;
end;
$$;
drop trigger if exists notify_club_join on public.club_members;
create trigger notify_club_join after insert on public.club_members for each row execute function public.on_club_join();

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.notifications enable row level security;

drop policy if exists "users read own notifications"   on public.notifications;
drop policy if exists "users delete own notifications" on public.notifications;
create policy "users read own notifications"   on public.notifications for select using (auth.uid() = user_id);
create policy "users delete own notifications" on public.notifications for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- REALTIME: stream new posts and notifications to the browser
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['posts', 'notifications'] loop
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

-- =====================================================================
--  004 — Security hardening. Safe to re-run.
--
--  • Only signed-in users can read app data (stops anonymous scraping
--    of profiles, posts, check-ins, etc. through the public API key).
--  • Internal functions can't be called directly through the API.
--  • The media bucket only accepts images up to 5 MB.
--  • Saved image links must point at this project's media bucket.
--  • Length limits on every free-text column.
--
--  Note: user emails live in Supabase's private "auth" schema, which is
--  never exposed through the API. The app's tables don't store emails.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Reads require a signed-in user
-- ---------------------------------------------------------------------
drop policy if exists "profiles are public"           on public.profiles;
drop policy if exists "signed-in users read profiles" on public.profiles;
create policy "signed-in users read profiles" on public.profiles for select to authenticated using (true);

drop policy if exists "clubs are public"           on public.clubs;
drop policy if exists "signed-in users read clubs" on public.clubs;
create policy "signed-in users read clubs" on public.clubs for select to authenticated using (true);

drop policy if exists "memberships are public"           on public.club_members;
drop policy if exists "signed-in users read memberships" on public.club_members;
create policy "signed-in users read memberships" on public.club_members for select to authenticated using (true);

drop policy if exists "posts are public"           on public.posts;
drop policy if exists "signed-in users read posts" on public.posts;
create policy "signed-in users read posts" on public.posts for select to authenticated using (true);

drop policy if exists "likes are public"           on public.likes;
drop policy if exists "signed-in users read likes" on public.likes;
create policy "signed-in users read likes" on public.likes for select to authenticated using (true);

drop policy if exists "comments are public"           on public.comments;
drop policy if exists "signed-in users read comments" on public.comments;
create policy "signed-in users read comments" on public.comments for select to authenticated using (true);

drop policy if exists "follows are public"           on public.follows;
drop policy if exists "signed-in users read follows" on public.follows;
create policy "signed-in users read follows" on public.follows for select to authenticated using (true);

drop policy if exists "courts are public"           on public.courts;
drop policy if exists "signed-in users read courts" on public.courts;
create policy "signed-in users read courts" on public.courts for select to authenticated using (true);

drop policy if exists "check-ins are public"           on public.check_ins;
drop policy if exists "signed-in users read check-ins" on public.check_ins;
create policy "signed-in users read check-ins" on public.check_ins for select to authenticated using (true);

-- Write policies: restrict to signed-in users explicitly (they already check auth.uid()).
alter policy "users insert own profile" on public.profiles     to authenticated;
alter policy "users update own profile" on public.profiles     to authenticated;
alter policy "users create clubs"       on public.clubs        to authenticated;
alter policy "owners update clubs"      on public.clubs        to authenticated;
alter policy "owners delete clubs"      on public.clubs        to authenticated;
alter policy "users join clubs"         on public.club_members to authenticated;
alter policy "users leave clubs"        on public.club_members to authenticated;
alter policy "users create posts"       on public.posts        to authenticated;
alter policy "authors delete posts"     on public.posts        to authenticated;
alter policy "users like"               on public.likes        to authenticated;
alter policy "users unlike"             on public.likes        to authenticated;
alter policy "users comment"            on public.comments     to authenticated;
alter policy "authors delete comments"  on public.comments     to authenticated;
alter policy "users follow"             on public.follows      to authenticated;
alter policy "users unfollow"           on public.follows      to authenticated;
alter policy "users add courts"         on public.courts       to authenticated;
alter policy "creators edit courts"     on public.courts       to authenticated;
alter policy "users check in"           on public.check_ins    to authenticated;
alter policy "users check out"          on public.check_ins    to authenticated;
alter policy "users read own notifications"   on public.notifications to authenticated;
alter policy "users delete own notifications" on public.notifications to authenticated;

-- Sign-up needs to know if a username is free, without being able to read profiles.
create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select not exists (select 1 from public.profiles where username = btrim(p_username));
$$;

-- ---------------------------------------------------------------------
-- 2. Lock down functions (Supabase lets anyone call public functions by default)
-- ---------------------------------------------------------------------
-- notify() must only ever run from triggers — otherwise people could forge notifications.
revoke execute on function public.notify(uuid, uuid, text, uuid, uuid) from public, anon, authenticated;

revoke execute on function public.mark_notifications_read() from public, anon;
grant  execute on function public.mark_notifications_read() to authenticated;

-- is_club_member only reads club_members, which signed-in users can already see,
-- so it doesn't need elevated (SECURITY DEFINER) rights.
alter function public.is_club_member(uuid) security invoker;
revoke execute on function public.is_club_member(uuid) from public, anon;
grant  execute on function public.is_club_member(uuid) to authenticated;

revoke execute on function public.username_available(text) from public;
grant  execute on function public.username_available(text) to anon, authenticated;

-- Trigger functions are never called directly.
revoke execute on function public.handle_new_user()   from public, anon, authenticated;
revoke execute on function public.handle_new_club()   from public, anon, authenticated;
revoke execute on function public.on_like_insert()    from public, anon, authenticated;
revoke execute on function public.on_like_delete()    from public, anon, authenticated;
revoke execute on function public.on_comment_insert() from public, anon, authenticated;
revoke execute on function public.on_follow_insert()  from public, anon, authenticated;
revoke execute on function public.on_follow_delete()  from public, anon, authenticated;
revoke execute on function public.on_club_join()      from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Storage: images only, 5 MB max
-- ---------------------------------------------------------------------
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'media';

-- Files are served by their public URL, which doesn't need a read policy. Removing the
-- broad read policy stops anyone from *listing* every file (and user id) in the bucket.
drop policy if exists "media is public"        on storage.objects;
drop policy if exists "users read own media"   on storage.objects;
create policy "users read own media" on storage.objects for select to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- 4. Image links must point at this project's media bucket
-- ---------------------------------------------------------------------
create or replace function public.is_media_url(u text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select u is null
      or u ~ '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/media/[0-9a-f-]{36}/[A-Za-z0-9._-]+$';
$$;

-- Clean any existing bad values before adding the rules.
update public.profiles set avatar_url = null where not public.is_media_url(avatar_url);
update public.profiles set cover_url  = null where not public.is_media_url(cover_url);
update public.clubs    set cover_url  = null where not public.is_media_url(cover_url);
delete from public.posts where not public.is_media_url(image_url) and content = '';
update public.posts    set image_url  = null where not public.is_media_url(image_url);

alter table public.profiles drop constraint if exists profiles_avatar_url_media;
alter table public.profiles add  constraint profiles_avatar_url_media check (public.is_media_url(avatar_url));
alter table public.profiles drop constraint if exists profiles_cover_url_media;
alter table public.profiles add  constraint profiles_cover_url_media  check (public.is_media_url(cover_url));
alter table public.clubs    drop constraint if exists clubs_cover_url_media;
alter table public.clubs    add  constraint clubs_cover_url_media     check (public.is_media_url(cover_url));
alter table public.posts    drop constraint if exists posts_image_url_media;
alter table public.posts    add  constraint posts_image_url_media     check (public.is_media_url(image_url));

-- ---------------------------------------------------------------------
-- 5. Length limits on free-text columns (blocks giant payloads via the API)
-- ---------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_full_name_len;
alter table public.profiles add  constraint profiles_full_name_len check (char_length(full_name) <= 80) not valid;
alter table public.profiles drop constraint if exists profiles_location_len;
alter table public.profiles add  constraint profiles_location_len  check (char_length(location) <= 80) not valid;
alter table public.profiles drop constraint if exists profiles_paddle_len;
alter table public.profiles add  constraint profiles_paddle_len    check (char_length(paddle) <= 80) not valid;
alter table public.clubs    drop constraint if exists clubs_location_len;
alter table public.clubs    add  constraint clubs_location_len     check (char_length(location) <= 120) not valid;
alter table public.courts   drop constraint if exists courts_text_len;
alter table public.courts   add  constraint courts_text_len check (
  char_length(address) <= 200 and char_length(city) <= 80 and char_length(notes) <= 500 and char_length(surface) <= 30
) not valid;

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
