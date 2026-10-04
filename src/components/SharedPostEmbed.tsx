import Link from "next/link";
import { Globe } from "lucide-react";
import { Avatar } from "./Avatar";
import { profileHref, timeAgo } from "@/lib/utils";
import type { SharedPost } from "@/lib/types";

/** The original post shown inside a share, like Facebook's shared-post box. */
export function SharedPostEmbed({ shared }: { shared: SharedPost | null }) {
  if (!shared) {
    return (
      <div className="rounded-xl bg-slate-50 px-4 py-5 text-sm ring-1 ring-slate-200">
        <p className="font-semibold text-ink">This content isn&apos;t available right now</p>
        <p className="mt-0.5 text-slate-500">The post may have been deleted, or only some people can see it.</p>
      </div>
    );
  }
  const name = shared.author.full_name || shared.author.username;
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
      <div className="flex items-center gap-2.5 px-3.5 pt-3">
        <Link href={profileHref(shared.author.username)}>
          <Avatar src={shared.author.avatar_url} name={name} size="sm" />
        </Link>
        <div className="min-w-0">
          <Link href={profileHref(shared.author.username)} className="block truncate text-sm font-semibold text-ink hover:underline">
            {name}
          </Link>
          <Link href={`/post/${shared.id}`} className="flex items-center gap-1 text-xs text-slate-500 hover:underline">
            {timeAgo(shared.created_at)} · <Globe className="h-3 w-3" aria-label="Public" />
          </Link>
        </div>
      </div>
      {shared.content && (
        <Link href={`/post/${shared.id}`} className="block">
          <p className="whitespace-pre-wrap break-words px-3.5 pb-3 pt-2 text-[15px] leading-relaxed text-slate-800">{shared.content}</p>
        </Link>
      )}
      {shared.image_url && (
        <Link href={`/post/${shared.id}`} className={shared.content ? "block bg-slate-100" : "mt-2 block bg-slate-100"}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shared.image_url} alt={`Photo shared by ${name}`} className="block max-h-[520px] w-full object-contain" loading="lazy" />
        </Link>
      )}
      {!shared.content && !shared.image_url && <div className="h-3" />}
    </div>
  );
}
