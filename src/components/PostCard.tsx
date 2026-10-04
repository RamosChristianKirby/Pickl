"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Heart, MessageCircle, MoreHorizontal, Share2, Trash2, Users } from "lucide-react";
import { Avatar } from "./Avatar";
import { RatingBadge } from "./RatingBadge";
import { Comments } from "./Comments";
import { deletePost, toggleLike } from "@/lib/actions/social";
import { cn, timeAgo, profileHref } from "@/lib/utils";
import type { Post, ProfileLite } from "@/lib/types";

export function PostCard({
  post,
  viewer,
  hideClub = false,
  defaultShowComments = false,
}: {
  post: Post;
  viewer: ProfileLite;
  hideClub?: boolean;
  defaultShowComments?: boolean;
}) {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [showComments, setShowComments] = useState(defaultShowComments);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  if (deleted) return null;

  const name = post.author.full_name || post.author.username;
  const isMine = post.author.id === viewer.id;

  const onLike = () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      await toggleLike(post.id, next);
    });
  };

  const onDelete = () => {
    setMenuOpen(false);
    setDeleted(true);
    startTransition(async () => {
      const res = await deletePost(post.id);
      if (res && "error" in res && res.error) setDeleted(false);
    });
  };

  const onShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard not available */
    }
  };

  return (
    <article className="card overflow-hidden">
      <header className="flex items-start gap-3 px-4 pt-4">
        <Link href={profileHref(post.author.username)}>
          <Avatar src={post.author.avatar_url} name={name} size="md" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <Link href={profileHref(post.author.username)} className="font-semibold text-ink hover:underline">
              {name}
            </Link>
            <RatingBadge rating={post.author.rating} />
            {post.club && !hideClub && (
              <span className="flex items-center gap-1 text-sm text-slate-500">
                <span>in</span>
                <Link href={`/clubs/${post.club.slug}`} className="flex items-center gap-1 font-semibold text-slate-700 hover:underline">
                  <Users className="h-3.5 w-3.5" />
                  {post.club.name}
                </Link>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            @{post.author.username} ·{" "}
            <Link href={`/post/${post.id}`} className="hover:underline">
              <time dateTime={post.created_at} suppressHydrationWarning>{timeAgo(post.created_at)}</time>
            </Link>
          </p>
        </div>

        {isMine && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Post options"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div className="card absolute right-0 z-10 mt-1 w-40 p-1 shadow-lg">
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" /> Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {post.content && (
        <p className="whitespace-pre-wrap break-words px-4 pt-3 text-[15px] leading-relaxed text-slate-800">{post.content}</p>
      )}

      {post.image_url && (
        // Like Facebook: the whole photo is shown at its own shape, full width of the post.
        // Very tall photos are capped and centred on a soft background instead of being cropped.
        <a href={post.image_url} target="_blank" rel="noopener noreferrer" className="mt-3 block bg-slate-100" aria-label="Open photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image_url} alt="" className="block h-auto max-h-[min(85vh,750px)] w-full object-contain" loading="lazy" />
        </a>
      )}

      <div className="flex items-center justify-between px-4 pt-3 text-sm text-slate-500">
        <span className="flex items-center gap-1.5">
          {likeCount > 0 && (
            <>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500">
                <Heart className="h-3 w-3 fill-white text-white" />
              </span>
              {likeCount}
            </>
          )}
        </span>
        {commentCount > 0 && (
          <button type="button" onClick={() => setShowComments(true)} className="hover:underline">
            {commentCount} {commentCount === 1 ? "comment" : "comments"}
          </button>
        )}
      </div>

      <div className="mx-4 mt-2 grid grid-cols-3 border-t border-slate-100 py-1">
        <button
          type="button"
          onClick={onLike}
          aria-pressed={liked}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition hover:bg-slate-50",
            liked ? "text-rose-600" : "text-slate-600",
          )}
        >
          <Heart className={cn("h-5 w-5 transition", liked && "scale-110 fill-rose-500 text-rose-500")} /> Like
        </button>
        <button
          type="button"
          onClick={() => setShowComments((s) => !s)}
          className="flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <MessageCircle className="h-5 w-5" /> Comment
        </button>
        <button
          type="button"
          onClick={onShare}
          className="flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <Share2 className="h-5 w-5" /> {copied ? "Link copied" : "Share"}
        </button>
      </div>

      {showComments && (
        <Comments postId={post.id} viewer={viewer} onCountChange={(d) => setCommentCount((c) => Math.max(0, c + d))} />
      )}
    </article>
  );
}
