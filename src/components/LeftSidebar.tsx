import Link from "next/link";
import { Plus } from "lucide-react";
import { Avatar } from "./Avatar";
import { SideNav } from "./NavTabs";
import { SkillBadge } from "./SkillBadge";
import { getMyClubs } from "@/lib/data";
import type { Profile } from "@/lib/types";
import { profileHref } from "@/lib/utils";

export async function LeftSidebar({ viewer }: { viewer: Profile }) {
  const clubs = await getMyClubs(viewer.id);
  const name = viewer.full_name || viewer.username;

  return (
    <div className="space-y-6">
      <Link
        href={profileHref(viewer.username)}
        className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-slate-200/60"
      >
        <Avatar src={viewer.avatar_url} name={name} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{name}</p>
          <SkillBadge level={viewer.skill_level} showLabel />
        </div>
      </Link>

      <SideNav />

      <div>
        <div className="flex items-center justify-between px-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Your clubs</h3>
          <Link href="/clubs/new" className="rounded-md p-1 text-slate-500 hover:bg-slate-200/60" aria-label="Create club">
            <Plus className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-2 space-y-0.5">
          {clubs.length === 0 && (
            <p className="px-3 text-sm text-slate-500">
              You haven&apos;t joined any clubs.{" "}
              <Link href="/clubs" className="font-medium text-brand-700 hover:underline">
                Browse clubs
              </Link>
            </p>
          )}
          {clubs.slice(0, 8).map((club) => (
            <Link
              key={club.id}
              href={`/clubs/${club.slug}`}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-200/60"
            >
              <ClubThumb name={club.name} src={club.cover_url} />
              <span className="truncate">{club.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ClubThumb({ name, src, size = "sm" }: { name: string; src: string | null; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-14 w-14 rounded-2xl text-lg ring-4 ring-white" : "h-8 w-8 rounded-lg text-xs";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={`${cls} shrink-0 object-cover`} />;
  }
  return (
    <span
      className={`${cls} flex shrink-0 items-center justify-center bg-linear-to-br from-brand-500 to-brand-800 font-bold text-white`}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
