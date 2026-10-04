import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Post, Profile, ProfileLite } from "@/lib/types";
import { safeDecode } from "@/lib/utils";

export const PROFILE_LITE = "id, username, full_name, avatar_url, skill_level";

export const POST_SELECT = `
  id, content, image_url, created_at, club_id,
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
};

const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

/** Turn raw rows into Post objects and mark which ones the viewer liked. */
export async function hydratePosts(rows: unknown[] | null, viewerId: string): Promise<Post[]> {
  const raw = (rows ?? []) as RawPost[];
  if (raw.length === 0) return [];

  const supabase = await createClient();
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
      liked_by_me: liked.has(p.id),
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
