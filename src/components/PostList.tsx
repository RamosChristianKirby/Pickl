import { MessageSquareDashed } from "lucide-react";
import { PostCard } from "./PostCard";
import { EmptyState } from "./EmptyState";
import type { Post, ProfileLite } from "@/lib/types";

export function PostList({
  posts,
  viewer,
  hideClub,
  emptyTitle = "No posts yet",
  emptyDescription,
}: {
  posts: Post[];
  viewer: ProfileLite;
  hideClub?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (posts.length === 0) {
    return <EmptyState icon={MessageSquareDashed} title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} viewer={viewer} hideClub={hideClub} />
      ))}
    </div>
  );
}
