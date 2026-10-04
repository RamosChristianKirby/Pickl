"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Loader2, SendHorizontal, Trash2 } from "lucide-react";
import { Avatar } from "./Avatar";
import { addComment, deleteComment, getComments } from "@/lib/actions/social";
import { timeAgo, profileHref } from "@/lib/utils";
import type { Comment, ProfileLite } from "@/lib/types";

export function Comments({
  postId,
  viewer,
  onCountChange,
}: {
  postId: string;
  viewer: ProfileLite;
  onCountChange: (delta: number) => void;
}) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    getComments(postId).then((c) => !cancelled && setComments(c));
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await addComment(postId, text);
      if ("error" in res && res.error) return setError(res.error);
      if ("comment" in res && res.comment) {
        const comment = res.comment;
        setComments((prev) => [...(prev ?? []), comment]);
        onCountChange(1);
        setText("");
      }
    });
  };

  const remove = (id: string) => {
    setComments((prev) => (prev ?? []).filter((c) => c.id !== id));
    onCountChange(-1);
    startTransition(async () => {
      await deleteComment(id);
    });
  };

  return (
    <div className="border-t border-slate-100 px-4 pb-4 pt-3">
      {comments === null ? (
        <div className="flex justify-center py-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => {
            const name = c.author.full_name || c.author.username;
            return (
              <li key={c.id} className="group flex gap-2">
                <Link href={profileHref(c.author.username)}>
                  <Avatar src={c.author.avatar_url} name={name} size="xs" />
                </Link>
                <div className="min-w-0">
                  <div className="rounded-2xl bg-slate-100 px-3 py-2">
                    <Link href={profileHref(c.author.username)} className="text-[13px] font-semibold text-ink hover:underline">
                      {name}
                    </Link>
                    <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{c.content}</p>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 px-3 text-xs text-slate-500">
                    <span suppressHydrationWarning>{timeAgo(c.created_at)}</span>
                    {c.author.id === viewer.id && (
                      <button
                        type="button"
                        onClick={() => remove(c.id)}
                        className="flex items-center gap-1 transition hover:text-rose-600 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 focus:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={submit} className="mt-3 flex items-center gap-2">
        <Avatar src={viewer.avatar_url} name={viewer.full_name || viewer.username} size="xs" />
        <div className="relative flex-1">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            placeholder="Write a comment…"
            className="h-10 w-full rounded-full bg-slate-100 pl-4 pr-10 text-base outline-none sm:h-9 sm:text-sm ring-brand-500 focus:bg-white focus:ring-2"
          />
          <button
            type="submit"
            disabled={pending || !text.trim()}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-brand-600 transition hover:bg-brand-50 disabled:text-slate-300"
            aria-label="Send comment"
          >
            <SendHorizontal className="h-4 w-4" />
          </button>
        </div>
      </form>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </div>
  );
}
