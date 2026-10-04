import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Search, UserRound } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { SkillBadge } from "@/components/SkillBadge";
import { FollowButton } from "@/components/FollowButton";
import { EmptyState } from "@/components/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { getFollowingIds, requireViewer } from "@/lib/data";
import { FEATURES } from "@/lib/features";
import { notFound } from "next/navigation";
import { PLAY_STYLE_LABEL, SKILL_LEVELS, sanitizeSearch, profileHref } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Players" };

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; min?: string; max?: string; style?: string }>;
}) {
  if (!FEATURES.players) notFound();
  const sp = await searchParams;
  const viewer = await requireViewer();
  const supabase = await createClient();
  const q = sanitizeSearch(sp.q);

  let query = supabase.from("profiles").select("*").neq("id", viewer.id).order("created_at", { ascending: false }).limit(60);
  if (q) query = query.or(`full_name.ilike.%${q}%,username.ilike.%${q}%,location.ilike.%${q}%`);
  if (sp.min) query = query.gte("skill_level", Number(sp.min));
  if (sp.max) query = query.lte("skill_level", Number(sp.max));
  if (sp.style && sp.style in PLAY_STYLE_LABEL) query = query.eq("play_style", sp.style);

  const [{ data }, followingIds] = await Promise.all([query, getFollowingIds(viewer.id)]);
  const players = (data ?? []) as Profile[];
  const following = new Set(followingIds);

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h1 className="text-xl font-bold tracking-tight text-ink">Find players</h1>
        <p className="mt-1 text-sm text-slate-500">Discover partners and opponents at your level.</p>
        <form className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={sp.q ?? ""} placeholder="Name, username or location" className="input pl-9" />
          </div>
          <select name="min" defaultValue={sp.min ?? ""} className="input sm:w-32" aria-label="Minimum skill">
            <option value="">Min level</option>
            {SKILL_LEVELS.map((l) => (
              <option key={l} value={l.toFixed(1)}>
                {l.toFixed(1)}+
              </option>
            ))}
          </select>
          <select name="max" defaultValue={sp.max ?? ""} className="input sm:w-32" aria-label="Maximum skill">
            <option value="">Max level</option>
            {SKILL_LEVELS.map((l) => (
              <option key={l} value={l.toFixed(1)}>
                ≤ {l.toFixed(1)}
              </option>
            ))}
          </select>
          <select name="style" defaultValue={sp.style ?? ""} className="input sm:w-40" aria-label="Format">
            <option value="">Any format</option>
            {Object.entries(PLAY_STYLE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <button className="btn-primary">Search</button>
        </form>
      </div>

      {players.length === 0 ? (
        <EmptyState icon={UserRound} title="No players found" description="Try widening your skill range or clearing the search." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {players.map((p) => {
            const name = p.full_name || p.username;
            return (
              <div key={p.id} className="card flex flex-col p-4">
                <div className="flex items-start gap-3">
                  <Link href={profileHref(p.username)}>
                    <Avatar src={p.avatar_url} name={name} size="lg" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={profileHref(p.username)} className="block truncate font-semibold text-ink hover:underline">
                      {name}
                    </Link>
                    <p className="truncate text-xs text-slate-500">@{p.username}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <SkillBadge level={p.skill_level} showLabel />
                      {p.play_style && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {PLAY_STYLE_LABEL[p.play_style]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {p.bio && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{p.bio}</p>}
                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                  <span className="flex min-w-0 items-center gap-1 truncate text-xs text-slate-500">
                    {p.location && (
                      <>
                        <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{p.location}</span>
                      </>
                    )}
                  </span>
                  <FollowButton targetId={p.id} initiallyFollowing={following.has(p.id)} size="sm" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
