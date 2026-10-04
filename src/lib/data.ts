import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Post, Profile, ProfileLite, SharedPost } from "@/lib/types";
import { safeDecode } from "@/lib/utils";

export const PROFILE_LITE = "id, username, full_name, avatar_url, rating";

export const POST_SELECT = `
  id, content, image_url, created_at, club_id, shared_post_id,
  author:profiles!posts_author_id_fkey ( ${PROFILE_LITE} ),
  club:clubs ( id, slug, name ),
  likes ( count ),
  comments ( count )
`;

/** Current signed-in user's profile, cached for the duration of one request. */
export const getViewer = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (profile) return profile as Profile;

  // Safety net: if the signup trigger didn't create a profile, create one now.
  const fallback = {
    id: user.id,
    username: `player_${user.id.replace(/-/g, "").slice(0, 8)}`,
    full_name: (user.user_metadata?.full_name as string | undefined) ?? "",
  };
  const { data: created } = await supabase.from("profiles").insert(fallback).select("*").single();
  return (created as Profile) ?? null;
});

export async function requireViewer(): Promise<Profile> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}

type RawPost = {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  club_id: string | null;
  author: ProfileLite | ProfileLite[];
  club: Post["club"] | Post["club"][] | null;
  likes: { count: number }[];
  comments: { count: number }[];
  shared_post_id: string | null;
};

const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

/** Turn raw rows into Post objects and mark which ones the viewer liked. */
export async function hydratePosts(rows: unknown[] | null, viewerId: string): Promise<Post[]> {
  const raw = (rows ?? []) as RawPost[];
  if (raw.length === 0) return [];

  const supabase = await createClient();
  const ids = raw.map((p) => p.id);
  const sharedIds = [...new Set(raw.map((p) => p.shared_post_id).filter((v): v is string => Boolean(v)))];

  // Originals of shared posts (RLS hides deleted / club-only ones) and how often each post was shared.
  const [{ data: originals }, { data: shareRows }] = await Promise.all([
    sharedIds.length
      ? supabase.from("posts").select(`id, content, image_url, created_at, author:profiles!posts_author_id_fkey ( ${PROFILE_LITE} )`).in("id", sharedIds)
      : Promise.resolve({ data: [] as unknown[] }),
    supabase.from("posts").select("shared_post_id").in("shared_post_id", ids),
  ]);
  const sharedMap = new Map<string, SharedPost>();
  for (const o of (originals ?? []) as unknown as Array<SharedPost & { author: ProfileLite | ProfileLite[] }>) {
    const author = Array.isArray(o.author) ? o.author[0] : o.author;
    if (author) sharedMap.set(o.id, { ...o, author });
  }
  const shareCounts = new Map<string, number>();
  for (const r of (shareRows ?? []) as { shared_post_id: string }[]) shareCounts.set(r.shared_post_id, (shareCounts.get(r.shared_post_id) ?? 0) + 1);

  const { data: myLikes } = await supabase
    .from("likes")
    .select("post_id")
    .eq("user_id", viewerId)
    .in(
      "post_id",
      raw.map((p) => p.id),
    );
  const liked = new Set(((myLikes ?? []) as { post_id: string }[]).map((l) => l.post_id));

  return raw
    .map((p) => ({
      id: p.id,
      content: p.content,
      image_url: p.image_url,
      created_at: p.created_at,
      club_id: p.club_id,
      author: one(p.author) as ProfileLite,
      club: one(p.club),
      like_count: p.likes?.[0]?.count ?? 0,
      comment_count: p.comments?.[0]?.count ?? 0,
      share_count: shareCounts.get(p.id) ?? 0,
      liked_by_me: liked.has(p.id),
      shared_post_id: p.shared_post_id ?? null,
      shared: p.shared_post_id ? (sharedMap.get(p.shared_post_id) ?? null) : null,
    }))
    .filter((p) => p.author);
}

export async function getFollowingIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
  return ((data ?? []) as { following_id: string }[]).map((r) => r.following_id);
}

export async function getMyClubs(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("club_members")
    .select("role, club:clubs ( id, slug, name, cover_url )")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  type ClubLite = { id: string; slug: string; name: string; cover_url: string | null };
  type Row = { role: string; club: ClubLite | ClubLite[] | null };
  return ((data ?? []) as unknown as Row[])
    .map((row) => {
      const club = one(row.club);
      return club ? { ...club, role: row.role } : null;
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);
}

/** Look up a profile from a /u/[username]-style route param (may arrive encoded or decoded). */
export async function findProfileByUsername(param: string): Promise<Profile | null> {
  const supabase = await createClient();
  const decoded = safeDecode(param);
  let { data } = await supabase.from("profiles").select("*").eq("username", decoded).maybeSingle();
  if (!data && decoded !== param) {
    ({ data } = await supabase.from("profiles").select("*").eq("username", param).maybeSingle());
  }
  return (data as Profile | null) ?? null;
}
