"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_LITE } from "@/lib/data";
import { isOwnMediaUrl } from "@/lib/media";
import type { Comment } from "@/lib/types";

async function getUserOrThrow() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be logged in.");
  return { supabase, user };
}

export async function createPost(input: { content: string; imageUrl?: string | null; clubId?: string | null }) {
  const { supabase, user } = await getUserOrThrow();
  const content = input.content.trim().slice(0, 2000);
  if (!content && !input.imageUrl) return { error: "Write something or add a photo." };
  if (!isOwnMediaUrl(input.imageUrl, user.id)) return { error: "Invalid image." };

  const { error } = await supabase.from("posts").insert({
    author_id: user.id,
    content,
    image_url: input.imageUrl ?? null,
    club_id: input.clubId ?? null,
  });
  if (error) {
    return { error: input.clubId ? "Join this club to post here." : error.message };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deletePost(postId: string) {
  const { supabase } = await getUserOrThrow();
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleLike(postId: string, like: boolean) {
  const { supabase, user } = await getUserOrThrow();
  if (like) {
    await supabase.from("likes").upsert({ post_id: postId, user_id: user.id }, { ignoreDuplicates: true });
  } else {
    await supabase.from("likes").delete().match({ post_id: postId, user_id: user.id });
  }
  return { ok: true };
}

export async function getComments(postId: string): Promise<Comment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select(`id, content, created_at, author:profiles!comments_author_id_fkey ( ${PROFILE_LITE} )`)
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(100);
  return ((data ?? []) as unknown as Array<Comment & { author: Comment["author"] | Comment["author"][] }>).map(
    (c) => ({ ...c, author: Array.isArray(c.author) ? c.author[0] : c.author }),
  );
}

export async function addComment(postId: string, content: string) {
  const { supabase, user } = await getUserOrThrow();
  const text = content.trim().slice(0, 1000);
  if (!text) return { error: "Comment can't be empty." };

  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: user.id, content: text })
    .select(`id, content, created_at, author:profiles!comments_author_id_fkey ( ${PROFILE_LITE} )`)
    .single();
  if (error || !data) return { error: error?.message ?? "Could not add comment." };

  const raw = data as unknown as Comment & { author: Comment["author"] | Comment["author"][] };
  return { comment: { ...raw, author: Array.isArray(raw.author) ? raw.author[0] : raw.author } as Comment };
}

export async function deleteComment(commentId: string) {
  const { supabase } = await getUserOrThrow();
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function toggleFollow(targetId: string, follow: boolean) {
  const { supabase, user } = await getUserOrThrow();
  if (targetId === user.id) return { error: "You can't follow yourself." };

  const { error } = follow
    ? await supabase
        .from("follows")
        .upsert({ follower_id: user.id, following_id: targetId }, { ignoreDuplicates: true })
    : await supabase.from("follows").delete().match({ follower_id: user.id, following_id: targetId });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
