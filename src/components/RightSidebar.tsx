import Link from "next/link";
import { MapPin } from "lucide-react";
import { Avatar } from "./Avatar";
import { RatingBadge } from "./RatingBadge";
import { FollowButton } from "./FollowButton";
import { SiteFooter } from "./SiteFooter";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_LITE, getFollowingIds } from "@/lib/data";
import { activeSince, profileHref } from "@/lib/utils";
import { FEATURES } from "@/lib/features";
import type { Profile, ProfileLite } from "@/lib/types";

export async function RightSidebar({ viewer }: { viewer: Profile }) {
  const supabase = await createClient();
  const following = await getFollowingIds(viewer.id);
  const exclude = [viewer.id, ...following];

  // Suggest players with a Pickl Rating close to the viewer's.
  let suggestQuery = supabase
    .from("profiles")
    .select(PROFILE_LITE)
    .not("id", "in", `(${exclude.join(",")})`)
    .order("created_at", { ascending: false })
    .limit(5);
  if (viewer.rating != null) {
    suggestQuery = suggestQuery.gte("rating", viewer.rating - 50).lte("rating", viewer.rating + 50);
  }
  let { data: suggestions } = await suggestQuery;
  if (!suggestions || suggestions.length === 0) {
    ({ data: suggestions } = await supabase
      .from("profiles")
      .select(PROFILE_LITE)
      .not("id", "in", `(${exclude.join(",")})`)
      .order("created_at", { ascending: false })
      .limit(5));
  }

  const { data: checkIns } = await supabase
    .from("check_ins")
    .select("court:courts ( id, name, city )")
    .gte("created_at", activeSince())
    .limit(200);

  const courtCounts = new Map<string, { id: string; name: string; city: string; count: number }>();
  for (const row of (checkIns ?? []) as unknown as { court: unknown }[]) {
    const court = (Array.isArray(row.court) ? row.court[0] : row.court) as
      | { id: string; name: string; city: string }
      | null;
    if (!court) continue;
    const entry = courtCounts.get(court.id) ?? { ...court, count: 0 };
    entry.count += 1;
    courtCounts.set(court.id, entry);
  }
  const hotCourts = [...courtCounts.values()].sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="space-y-5">
      <section className="card p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-ink">On court now</h3>
          <span className="flex items-center gap-1.5 text-xs font-medium text-brand-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
            </span>
            Live
          </span>
        </div>
        <div className="mt-3 space-y-1">
          {hotCourts.length === 0 && (
            <p className="text-sm text-slate-500">
              Nobody&apos;s checked in yet.{" "}
              <Link href="/courts" className="font-medium text-brand-700 hover:underline">
                Be the first
              </Link>
            </p>
          )}
          {hotCourts.map((c) => (
            <Link
              key={c.id}
              href={`/courts/${c.id}`}
              className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <MapPin className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{c.name}</p>
                <p className="truncate text-xs text-slate-500">{c.city}</p>
              </div>
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">{c.count}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <h3 className="font-semibold text-ink">Players to follow</h3>
        <div className="mt-3 space-y-3">
          {(suggestions ?? []).length === 0 && <p className="text-sm text-slate-500">You&apos;re following everyone. Legend.</p>}
          {((suggestions ?? []) as ProfileLite[]).map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <Link href={profileHref(p.username)}>
                <Avatar src={p.avatar_url} name={p.full_name || p.username} size="sm" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={profileHref(p.username)} className="block truncate text-sm font-medium text-ink hover:underline">
                  {p.full_name || p.username}
                </Link>
                <RatingBadge rating={p.rating} />
              </div>
              <FollowButton targetId={p.id} initiallyFollowing={false} size="sm" />
            </div>
          ))}
        </div>
        {FEATURES.players && (
        <Link href="/players" className="mt-4 block text-sm font-medium text-brand-700 hover:underline">
          Discover more players
        </Link>
        )}
      </section>

      <div className="px-2">
        <SiteFooter compact />
      </div>
    </div>
  );
}
