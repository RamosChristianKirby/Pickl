import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Search, Users } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { SkillBadge } from "@/components/SkillBadge";
import { ClubThumb } from "@/components/LeftSidebar";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_LITE, requireViewer } from "@/lib/data";
import { sanitizeSearch, profileHref } from "@/lib/utils";
import type { ProfileLite } from "@/lib/types";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: rawQ } = await searchParams;
  await requireViewer();
  const q = sanitizeSearch(rawQ);
  const supabase = await createClient();

  const [players, clubs, courts] = q
    ? await Promise.all([
        supabase.from("profiles").select(PROFILE_LITE).or(`full_name.ilike.%${q}%,username.ilike.%${q}%`).limit(8),
        supabase.from("clubs").select("id, slug, name, location, cover_url").or(`name.ilike.%${q}%,location.ilike.%${q}%`).limit(8),
        supabase.from("courts").select("id, name, city").or(`name.ilike.%${q}%,city.ilike.%${q}%`).limit(8),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const playerRows = (players.data ?? []) as ProfileLite[];
  const clubRows = (clubs.data ?? []) as { id: string; slug: string; name: string; location: string; cover_url: string | null }[];
  const courtRows = (courts.data ?? []) as { id: string; name: string; city: string }[];
  const total = playerRows.length + clubRows.length + courtRows.length;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <form className="card relative p-2">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          name="q"
          defaultValue={rawQ ?? ""}
          autoFocus
          placeholder="Search players, clubs and courts"
          className="h-12 w-full rounded-xl bg-transparent pl-11 pr-3 text-base outline-none"
        />
      </form>

      {q && total === 0 && <p className="card p-6 text-center text-sm text-slate-500">No results for “{q}”.</p>}

      {playerRows.length > 0 && (
        <section className="card p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">Players</h2>
          {playerRows.map((p) => (
            <Link key={p.id} href={profileHref(p.username)} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50">
              <Avatar src={p.avatar_url} name={p.full_name || p.username} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{p.full_name || p.username}</p>
                <p className="truncate text-xs text-slate-500">@{p.username}</p>
              </div>
              <SkillBadge level={p.skill_level} />
            </Link>
          ))}
        </section>
      )}

      {clubRows.length > 0 && (
        <section className="card p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">Clubs</h2>
          {clubRows.map((c) => (
            <Link key={c.id} href={`/clubs/${c.slug}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50">
              <ClubThumb name={c.name} src={c.cover_url} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{c.name}</p>
                {c.location && <p className="truncate text-xs text-slate-500">{c.location}</p>}
              </div>
              <Users className="h-4 w-4 text-slate-400" />
            </Link>
          ))}
        </section>
      )}

      {courtRows.length > 0 && (
        <section className="card p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">Courts</h2>
          {courtRows.map((c) => (
            <Link key={c.id} href={`/courts/${c.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <MapPin className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{c.name}</p>
                <p className="truncate text-xs text-slate-500">{c.city}</p>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
