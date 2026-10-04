-- =====================================================================
--  Dinkly — Supabase schema
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
