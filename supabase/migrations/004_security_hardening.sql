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
