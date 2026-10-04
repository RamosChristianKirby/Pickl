import type { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid, Lightbulb, Map as MapIcon, MapPin, Plus, Search, Warehouse, Sun } from "lucide-react";
import { CourtsMap, type MapCourt } from "@/components/CourtsMap";
import { EmptyState } from "@/components/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/data";
import { activeSince, cn, sanitizeSearch } from "@/lib/utils";
import type { Court } from "@/lib/types";

export const metadata: Metadata = { title: "Courts" };

export default async function CourtsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; view?: string }>;
}) {
  const sp = await searchParams;
  await requireViewer();
  const supabase = await createClient();
  const q = sanitizeSearch(sp.q);

  let query = supabase.from("courts").select("*").order("name").limit(100);
  if (q) query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%,address.ilike.%${q}%`);
  if (sp.type === "indoor") query = query.eq("indoor", true);
  if (sp.type === "outdoor") query = query.eq("indoor", false);

  const [{ data }, { data: active }] = await Promise.all([
    query,
    supabase.from("check_ins").select("court_id").gte("created_at", activeSince()).limit(1000),
  ]);
  const courts = (data ?? []) as Court[];
  const liveCounts = new Map<string, number>();
  for (const c of (active ?? []) as { court_id: string }[]) liveCounts.set(c.court_id, (liveCounts.get(c.court_id) ?? 0) + 1);

  courts.sort((a, b) => (liveCounts.get(b.id) ?? 0) - (liveCounts.get(a.id) ?? 0));

  const mapView = sp.view === "map";
  const mapCourts: MapCourt[] = courts
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => ({
      id: c.id,
      name: c.name,
      city: c.city,
      latitude: c.latitude as number,
      longitude: c.longitude as number,
      live: liveCounts.get(c.id) ?? 0,
    }));
  const hrefWith = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (sp.type) params.set("type", sp.type);
    if (sp.view) params.set("view", sp.view);
    for (const [k, v] of Object.entries(changes)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    const qs = params.toString();
    return `/courts${qs ? `?${qs}` : ""}`;
  };

  const tabs = [
    { key: "", label: "All" },
    { key: "outdoor", label: "Outdoor" },
    { key: "indoor", label: "Indoor" },
  ];

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink">Courts</h1>
            <p className="mt-1 text-sm text-slate-500">Find a place to play and see who&apos;s there right now.</p>
          </div>
          <Link href="/courts/new" className="btn-primary whitespace-nowrap">
            <Plus className="h-4 w-4" /> Add a court
          </Link>
        </div>
        <form className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={sp.q ?? ""} placeholder="Search by name, city or address" className="input pl-9" />
          </div>
          {sp.type && <input type="hidden" name="type" value={sp.type} />}
          {sp.view && <input type="hidden" name="view" value={sp.view} />}
          <button className="btn-secondary">Search</button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {tabs.map((t) => {
            const active = (sp.type ?? "") === t.key;
            return (
              <Link
                key={t.key}
                href={hrefWith({ type: t.key || null })}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                  active ? "bg-ink text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {t.label}
              </Link>
            );
          })}
          <div className="ml-auto flex rounded-full bg-slate-100 p-1">
            <Link
              href={hrefWith({ view: null })}
              aria-label="List view"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
                !mapView ? "bg-white text-ink shadow-sm" : "text-slate-500",
              )}
            >
              <LayoutGrid className="h-4 w-4" /> <span className="hidden min-[400px]:inline">List</span>
            </Link>
            <Link
              href={hrefWith({ view: "map" })}
              aria-label="Map view"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
                mapView ? "bg-white text-ink shadow-sm" : "text-slate-500",
              )}
            >
              <MapIcon className="h-4 w-4" /> <span className="hidden min-[400px]:inline">Map</span>
            </Link>
          </div>
        </div>
      </div>

      {mapView && (
        <div className="card p-2">
          <CourtsMap courts={mapCourts} className="h-[60vh] min-h-96" />
          <p className="px-2 pb-1 pt-2 text-xs text-slate-500">
            Showing {mapCourts.length} of {courts.length} courts. Courts without a map pin aren&apos;t shown. Green pins with a
            number have players checked in now.
          </p>
        </div>
      )}

      {mapView ? null : courts.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No courts found"
          description="Know a great spot? Add it so other players can find it."
          action={
            <Link href="/courts/new" className="btn-primary">
              <Plus className="h-4 w-4" /> Add a court
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courts.map((court) => {
            const live = liveCounts.get(court.id) ?? 0;
            return (
              <Link key={court.id} href={`/courts/${court.id}`} className="card group flex gap-4 p-4 transition hover:shadow-md">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  {court.indoor ? <Warehouse className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-ink group-hover:underline">{court.name}</p>
                    {live > 0 && (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> {live} here
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{[court.address, court.city].filter(Boolean).join(", ") || "Address not set"}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                      {court.num_courts} {court.num_courts === 1 ? "court" : "courts"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{court.indoor ? "Indoor" : "Outdoor"}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 capitalize text-slate-600">{court.surface}</span>
                    {court.lights && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                        <Lightbulb className="h-3 w-3" /> Lights
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
