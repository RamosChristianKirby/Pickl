import type { Metadata } from "next";
import Link from "next/link";
import { PostComposer } from "@/components/PostComposer";
import { PostList } from "@/components/PostList";
import { RealtimeFeedBanner } from "@/components/RealtimeFeedBanner";
import { createClient } from "@/lib/supabase/server";
import { POST_SELECT, getFollowingIds, hydratePosts, requireViewer } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Home" };

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const viewer = await requireViewer();
  const supabase = await createClient();
  const following = tab === "following";

  let query = supabase.from("posts").select(POST_SELECT).is("club_id", null).order("created_at", { ascending: false }).limit(40);

  if (following) {
    const ids = await getFollowingIds(viewer.id);
    query = query.in("author_id", [viewer.id, ...ids]);
  }

  const { data } = await query;
  const posts = await hydratePosts(data, viewer.id);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PostComposer viewer={viewer} />
      <RealtimeFeedBanner viewerId={viewer.id} />

      <div className="card flex p-1">
        {[
          { key: "all", label: "Everyone", href: "/feed" },
          { key: "following", label: "Following", href: "/feed?tab=following" },
        ].map((t) => {
          const active = (t.key === "following") === following;
          return (
            <Link
              key={t.key}
              href={t.href}
              className={cn(
                "flex-1 rounded-xl py-2 text-center text-sm font-semibold transition",
                active ? "bg-brand-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <PostList
        posts={posts}
        viewer={viewer}
        emptyTitle={following ? "Your following feed is quiet" : "Be the first to post"}
        emptyDescription={
          following
            ? "Follow players from their profiles or the suggestions on the right, and their posts will show up here."
            : "Share a match recap, a drill that clicked, or a photo from today's session."
        }
      />
    </div>
  );
}
