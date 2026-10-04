import type { Metadata } from "next";
import Link from "next/link";
import { PostComposer } from "@/components/PostComposer";
import { PostList } from "@/components/PostList";
import { RealtimeFeedBanner } from "@/components/RealtimeFeedBanner";
import { createClient } from "@/lib/supabase/server";
import { POST_SELECT, getFollowingIds, hydratePosts, requireViewer } from "@/lib/data";
import { getForYouFeed } from "@/lib/feed";
import type { Post } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Home" };

const TABS = [
  { key: "for-you", label: "For you", href: "/feed" },
  { key: "following", label: "Following", href: "/feed?tab=following" },
  { key: "latest", label: "Latest", href: "/feed?tab=latest" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const EMPTY: Record<TabKey, { title: string; description: string }> = {
  "for-you": {
    title: "Be the first to post",
    description: "Share a match recap, a drill that clicked, or a photo from today's session.",
  },
  following: {
    title: "Your following feed is quiet",
    description: "Follow players from their profiles or the suggestions on the right, and their posts will show up here.",
  },
  latest: {
    title: "Be the first to post",
    description: "Share a match recap, a drill that clicked, or a photo from today's session.",
  },
};

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: rawTab } = await searchParams;
  const tab: TabKey = rawTab === "following" || rawTab === "latest" ? rawTab : "for-you";
  const viewer = await requireViewer();

  let posts: Post[];
  if (tab === "for-you") {
    posts = await getForYouFeed(viewer);
  } else {
    const supabase = await createClient();
    let query = supabase.from("posts").select(POST_SELECT).is("club_id", null).order("created_at", { ascending: false }).limit(40);
    if (tab === "following") {
      const ids = await getFollowingIds(viewer.id);
      query = query.in("author_id", [viewer.id, ...ids]);
    }
    const { data } = await query;
    posts = await hydratePosts(data, viewer.id);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PostComposer viewer={viewer} />
      <RealtimeFeedBanner viewerId={viewer.id} />

      <div className="card flex p-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            aria-current={t.key === tab ? "page" : undefined}
            className={cn(
              "flex-1 rounded-xl py-2 text-center text-sm font-semibold transition",
              t.key === tab ? "bg-brand-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <PostList posts={posts} viewer={viewer} emptyTitle={EMPTY[tab].title} emptyDescription={EMPTY[tab].description} />
    </div>
  );
}
