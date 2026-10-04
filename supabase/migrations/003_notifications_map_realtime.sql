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
