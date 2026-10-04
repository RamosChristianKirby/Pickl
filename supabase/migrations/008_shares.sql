-- =====================================================================
--  008 — Facebook-style sharing. Safe to re-run.
--
--  A share is a normal post (with an optional caption) that points at the
--  original post through shared_post_id. Only feed posts (not club posts)
--  can be shared, and the original author gets a "shared your post"
--  notification. If the original is deleted, the share stays and shows
--  "This content isn't available".
-- =====================================================================

alter table public.posts add column if not exists shared_post_id uuid references public.posts (id) on delete set null;
create index if not exists posts_shared_post_idx on public.posts (shared_post_id) where shared_post_id is not null;

-- A share may have no caption of its own.
alter table public.posts drop constraint if exists post_not_empty;
alter table public.posts add constraint post_not_empty
  check (char_length(content) > 0 or image_url is not null or shared_post_id is not null) not valid;

-- Players can only share feed posts they can see (never club posts), and a share can't be of itself.
drop policy if exists "users create posts" on public.posts;
create policy "users create posts" on public.posts for insert to authenticated
  with check (
    auth.uid() = author_id
    and (posts.club_id is null or public.is_club_member(posts.club_id))
    and (
      posts.shared_post_id is null
      or (posts.club_id is null and exists (select 1 from public.posts p where p.id = posts.shared_post_id and p.club_id is null))
    )
  );

-- Notify the original author.
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('like', 'comment', 'follow', 'club_join', 'match_invite', 'match_result', 'share'));

create or replace function public.on_post_share()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
begin
  if new.shared_post_id is not null then
    select author_id into v_owner from public.posts where id = new.shared_post_id;
    perform public.notify(v_owner, new.author_id, 'share', new.id, null);
  end if;
  return new;
end;
$$;

drop trigger if exists notify_share on public.posts;
create trigger notify_share after insert on public.posts for each row execute function public.on_post_share();
revoke execute on function public.on_post_share() from public, anon, authenticated;
