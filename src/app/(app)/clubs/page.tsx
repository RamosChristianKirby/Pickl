import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Plus, Search, Users } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ClubThumb } from "@/components/LeftSidebar";
import { JoinClubButton } from "@/components/JoinClubButton";
import { createClient } from "@/lib/supabase/server";
import { getMyClubs, requireViewer } from "@/lib/data";
import { sanitizeSearch } from "@/lib/utils";
import type { Club } from "@/lib/types";

export const metadata: Metadata = { title: "Clubs" };

type ClubRow = Club & { club_members: { count: number }[] };

export default async function ClubsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: rawQ } = await searchParams;
  const viewer = await requireViewer();
  const supabase = await createClient();
  const q = sanitizeSearch(rawQ);

  let query = supabase.from("clubs").select("*, club_members ( count )").order("created_at", { ascending: false }).limit(60);
  if (q) query = query.or(`name.ilike.%${q}%,location.ilike.%${q}%,description.ilike.%${q}%`);

  const [{ data }, mine] = await Promise.all([query, getMyClubs(viewer.id)]);
  const clubs = (data ?? []) as ClubRow[];
  const myIds = new Set(mine.map((c) => c.id));

  return (
    <div className="space-y-4">
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Clubs</h1>
          <p className="mt-1 text-sm text-slate-500">Join your local crew or start a new one.</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <form className="relative min-w-0 flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={rawQ ?? ""} placeholder="Search clubs" className="input w-full pl-9 sm:w-56" />
          </form>
          <Link href="/clubs/new" className="btn-primary whitespace-nowrap">
            <Plus className="h-4 w-4" /> New<span className="hidden min-[360px]:inline"> club</span>
          </Link>
        </div>
      </div>

      {clubs.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "No clubs match your search" : "No clubs yet"}
          description="Start the first club for your area — it only takes a minute."
          action={
            <Link href="/clubs/new" className="btn-primary">
              <Plus className="h-4 w-4" /> Create a club
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {clubs.map((club) => {
            const members = club.club_members?.[0]?.count ?? 0;
            return (
              <div key={club.id} className="card flex flex-col overflow-hidden">
                <Link href={`/clubs/${club.slug}`} className="relative block h-28 bg-linear-to-br from-brand-500 to-brand-800">
                  {club.cover_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={club.cover_url} alt="" className="h-full w-full object-cover" />
                  )}
                </Link>
                <div className="flex flex-1 flex-col p-4">
                  <div className="relative z-10 -mt-10 mb-2">
                    <ClubThumb name={club.name} src={null} size="lg" />
                  </div>
                  <Link href={`/clubs/${club.slug}`} className="font-semibold text-ink hover:underline">
                    {club.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {members} {members === 1 ? "member" : "members"}
                    </span>
                    {club.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {club.location}
                      </span>
                    )}
                  </div>
                  {club.description && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{club.description}</p>}
                  <div className="mt-auto pt-4">
                    <JoinClubButton clubId={club.id} isMember={myIds.has(club.id)} isOwner={club.owner_id === viewer.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
