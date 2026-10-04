import { createClient } from "@/lib/supabase/server";
import { POST_SELECT, getFollowingIds, getMyClubs, hydratePosts } from "@/lib/data";
import type { Post, Profile } from "@/lib/types";

/**
 * "For you" feed ranking — a small, Facebook-style algorithm.
 *
 * 1. Gather candidates: the newest posts from everyone, plus posts from people you
 *    follow and from clubs you're in (so they're never crowded out).
 * 2. Score each post:  quality × affinity × freshness
 *    - quality:   likes and comments (comments count double), on a log scale
 *    - affinity:  you follow the author, you've liked/commented on their posts before,
 *                 it's from one of your clubs, the author has a similar Pickl Rating
 *    - freshness: older posts fade out gradually (time decay)
 * 3. Mix it up: repeated posts from the same author are pushed down, so one person
 *    can't take over the feed.
 *
 * A brand-new account has no follows or history yet, so its feed is simply the most
 * engaging recent posts from everyone — the same way Facebook fills a new user's feed.
 */

const CANDIDATES_EVERYONE = 200;
const CANDIDATES_NETWORK = 100;
const CANDIDATES_CLUBS = 60;
const HISTORY_DAYS = 60;
const GRAVITY = 1.4; // how fast posts fade with age (higher = faster)

type Row = {
  id: string;
  created_at: string;
  image_url: string | null;
  club_id: string | null;
  author: { id: string; rating: number | null } | { id: string; rating: number | null }[] | null;
  likes: { count: number }[];
  comments: { count: number }[];
};

type Signals = {
  viewer: Profile;
  following: Set<string>;
  myClubs: Set<string>;
  /** author id → how many times the viewer liked/commented on their posts recently */
  interactions: Map<string, number>;
  now: number;
};

const authorOf = (r: Row) => (Array.isArray(r.author) ? r.author[0] : r.author) ?? null;

/** Small deterministic 0–1 hash, so the feed varies a bit per person and per hour but doesn't jump on every refresh. */
function jitter(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

export function scorePost(row: Row, s: Signals): number {
  const author = authorOf(row);
  if (!author) return 0;

  const likes = row.likes?.[0]?.count ?? 0;
  const comments = row.comments?.[0]?.count ?? 0;
  const quality = 1 + Math.log2(1 + likes + 2 * comments) + (row.image_url ? 0.3 : 0);

  let affinity = 1;
  if (author.id === s.viewer.id) affinity *= 1.5;
  if (s.following.has(author.id)) affinity *= 3;
  if (row.club_id && s.myClubs.has(row.club_id)) affinity *= 2;
  const n = s.interactions.get(author.id) ?? 0;
  if (n > 0) affinity *= 1 + Math.min(n, 10) * 0.15; // up to 2.5×
  if (s.viewer.rating != null && author.rating != null) {
    if (Math.abs(s.viewer.rating - author.rating) <= 50) affinity *= 1.2; // similar Pickl Rating
  }

  const ageHours = Math.max(0, (s.now - new Date(row.created_at).getTime()) / 3_600_000);
  const freshness = 1 / Math.pow(ageHours + 2, GRAVITY);

  const hourBucket = Math.floor(s.now / 3_600_000);
  const variety = 0.9 + 0.2 * jitter(`${s.viewer.id}:${row.id}:${hourBucket}`);

  return quality * affinity * freshness * variety;
}

/** Sort by score, but each extra post from the same author counts for less. */
function diversify(rows: { row: Row; score: number }[], limit: number): Row[] {
  const pool = [...rows].sort((a, b) => b.score - a.score);
  const seen = new Map<string, number>();
  const out: Row[] = [];
  while (out.length < limit && pool.length > 0) {
    let best = 0;
    let bestScore = -1;
    for (let i = 0; i < pool.length; i++) {
      const id = authorOf(pool[i].row)?.id ?? "";
      const adjusted = pool[i].score * Math.pow(0.5, seen.get(id) ?? 0);
      if (adjusted > bestScore) {
        bestScore = adjusted;
        best = i;
      }
      // pool is sorted, so nothing further down can beat an un-penalised score
      if (!seen.has(id)) break;
    }
    const [pick] = pool.splice(best, 1);
    const id = authorOf(pick.row)?.id ?? "";
    seen.set(id, (seen.get(id) ?? 0) + 1);
    out.push(pick.row);
  }
  return out;
}

async function getInteractions(viewerId: string): Promise<Map<string, number>> {
  const supabase = await createClient();
  const since = new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString();
  type R = { post: { author_id: string } | { author_id: string }[] | null };

  const [{ data: liked }, { data: commented }] = await Promise.all([
    supabase.from("likes").select("post:posts ( author_id )").eq("user_id", viewerId).gte("created_at", since).limit(300),
    supabase.from("comments").select("post:posts ( author_id )").eq("author_id", viewerId).gte("created_at", since).limit(300),
  ]);

  const counts = new Map<string, number>();
  for (const r of [...((liked ?? []) as unknown as R[]), ...((commented ?? []) as unknown as R[])]) {
    const p = Array.isArray(r.post) ? r.post[0] : r.post;
    if (!p || p.author_id === viewerId) continue;
    counts.set(p.author_id, (counts.get(p.author_id) ?? 0) + 1);
  }
  return counts;
}

export async function getForYouFeed(viewer: Profile, limit = 40): Promise<Post[]> {
  const supabase = await createClient();

  const [followingIds, clubs, interactions] = await Promise.all([
    getFollowingIds(viewer.id),
    getMyClubs(viewer.id),
    getInteractions(viewer.id),
  ]);
  const clubIds = clubs.map((c) => c.id);
  const network = [viewer.id, ...followingIds].slice(0, 150);

  const [everyone, fromNetwork, fromClubs] = await Promise.all([
    supabase.from("posts").select(POST_SELECT).is("club_id", null).order("created_at", { ascending: false }).limit(CANDIDATES_EVERYONE),
    supabase
      .from("posts")
      .select(POST_SELECT)
      .is("club_id", null)
      .in("author_id", network)
      .order("created_at", { ascending: false })
      .limit(CANDIDATES_NETWORK),
    clubIds.length
      ? supabase.from("posts").select(POST_SELECT).in("club_id", clubIds).order("created_at", { ascending: false }).limit(CANDIDATES_CLUBS)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  const byId = new Map<string, Row>();
  for (const r of [...(everyone.data ?? []), ...(fromNetwork.data ?? []), ...(fromClubs.data ?? [])] as unknown as Row[]) {
    byId.set(r.id, r);
  }

  const signals: Signals = {
    viewer,
    following: new Set(followingIds),
    myClubs: new Set(clubIds),
    interactions,
    now: Date.now(),
  };

  const ranked = diversify(
    [...byId.values()].map((row) => ({ row, score: scorePost(row, signals) })),
    limit,
  );
  return hydratePosts(ranked, viewer.id);
}
