import { notFound } from "next/navigation";
import { PostCard } from "@/components/PostCard";
import { createClient } from "@/lib/supabase/server";
import { POST_SELECT, hydratePosts, requireViewer } from "@/lib/data";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireViewer();
  const supabase = await createClient();

  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await supabase.from("posts").select(POST_SELECT).eq("id", id).maybeSingle();
  if (!data) notFound();

  const [post] = await hydratePosts([data], viewer.id);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PostCard post={post} viewer={viewer} defaultShowComments />
    </div>
  );
}
