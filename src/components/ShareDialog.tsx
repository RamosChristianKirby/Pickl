"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Link2, Loader2, Repeat2, X } from "lucide-react";
import { Avatar } from "./Avatar";
import { SharedPostEmbed } from "./SharedPostEmbed";
import { createPost } from "@/lib/actions/social";
import type { ProfileLite, SharedPost } from "@/lib/types";

/** "Share to your feed" dialog, like Facebook: optional caption + the original post, or copy the link. */
export function ShareDialog({
  open,
  onClose,
  viewer,
  original,
  canShareToFeed,
  onShared,
}: {
  open: boolean;
  onClose: () => void;
  viewer: ProfileLite;
  original: SharedPost;
  canShareToFeed: boolean;
  onShared: () => void;
}) {
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setCaption("");
    setError(null);
    setDone(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const name = viewer.full_name || viewer.username;

  const share = () => {
    setError(null);
    startTransition(async () => {
      const res = await createPost({ content: caption, sharedPostId: original.id });
      if (res && "error" in res && res.error) {
        setError(res.error);
        return;
      }
      setDone(true);
      onShared();
      setTimeout(onClose, 900);
    });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${original.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Couldn't copy the link.");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-navy/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 id="share-title" className="text-lg font-bold text-ink">
            Share
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          {canShareToFeed ? (
            <>
              <div className="flex items-center gap-2.5">
                <Avatar src={viewer.avatar_url} name={name} size="md" />
                <div>
                  <p className="font-semibold text-ink">{name}</p>
                  <p className="text-xs text-slate-500">Sharing to your feed</p>
                </div>
              </div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={2000}
                rows={2}
                autoFocus
                placeholder="Say something about this…"
                className="w-full resize-none rounded-xl border-0 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-500"
                aria-label="Add a caption"
              />
            </>
          ) : (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
              Club posts can only be seen by club members, so they can&apos;t be shared to your feed. You can still copy the link for other members.
            </p>
          )}

          <SharedPostEmbed shared={original} />

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            {canShareToFeed && (
              <button type="button" onClick={share} disabled={pending || done} className="btn-primary flex-1">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Repeat2 className="h-4 w-4" />}
                {done ? "Shared!" : "Share now"}
              </button>
            )}
            <button type="button" onClick={copy} className="btn-secondary flex-1">
              <Link2 className="h-4 w-4" /> {copied ? "Link copied" : "Copy link"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
