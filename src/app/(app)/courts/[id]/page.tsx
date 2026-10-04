import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Info, Lightbulb, MapPin, Navigation, Sun, Warehouse } from "lucide-react";
import { CourtsMap } from "@/components/CourtsMap";
import { CourtLocationForm } from "@/components/CourtLocationForm";
import { Avatar } from "@/components/Avatar";
import { SkillBadge } from "@/components/SkillBadge";
import { CheckInButton } from "@/components/CheckInButton";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_LITE, requireViewer } from "@/lib/data";
import { ACTIVE_CHECKIN_HOURS, activeSince, timeAgo, profileHref } from "@/lib/utils";
import type { Court, ProfileLite } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };

const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: "Court" };
  const supabase = await createClient();
  const { data } = await supabase.from("courts").select("name").eq("id", id).maybeSingle();
  return { title: (data as { name: string } | null)?.name ?? "Court" };
}

type CheckInRow = { id: string; note: string; created_at: string; user_id: string; player: ProfileLite };

export default async function CourtPage({ params }: Props) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const viewer = await requireViewer();
  const supabase = await createClient();

  const { data: courtRow } = await supabase.from("courts").select("*").eq("id", id).maybeSingle();
  if (!courtRow) notFound();
  const court = courtRow as Court;

  const { data: rows } = await supabase
    .from("check_ins")
    .select(`id, note, created_at, user_id, player:profiles!check_ins_user_id_fkey ( ${PROFILE_LITE} )`)
    .eq("court_id", court.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const checkIns = ((rows ?? []) as unknown as Array<Omit<CheckInRow, "player"> & { player: ProfileLite | ProfileLite[] }>)
    .map((r) => ({ ...r, player: Array.isArray(r.player) ? r.player[0] : r.player }))
    .filter((r): r is CheckInRow => Boolean(r.player));

  const hasPin = court.latitude != null && court.longitude != null;
  const canEditLocation = court.created_by === viewer.id;

  const cutoff = Date.parse(activeSince());
  const isActive = (c: CheckInRow) => new Date(c.created_at).getTime() >= cutoff;
  const activeNow = checkIns.filter(isActive);
  const recent = checkIns.filter((c) => !isActive(c)).slice(0, 15);
  const myActive = activeNow.find((c) => c.user_id === viewer.id);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [court.name, court.address, court.city].filter(Boolean).join(", "),
  )}`;

  return (
    <div className="space-y-4">
      <section className="card overflow-hidden">
        <div className="relative h-32 bg-linear-to-br from-brand-600 to-brand-900 sm:h-40">
          <svg className="absolute inset-0 h-full w-full opacity-20" viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" aria-hidden>
            <rect x="60" y="20" width="680" height="160" fill="none" stroke="white" strokeWidth="3" />
            <line x1="400" y1="20" x2="400" y2="180" stroke="white" strokeWidth="5" />
            <line x1="310" y1="20" x2="310" y2="180" stroke="white" strokeWidth="3" />
            <line x1="490" y1="20" x2="490" y2="180" stroke="white" strokeWidth="3" />
            <line x1="60" y1="100" x2="310" y2="100" stroke="white" strokeWidth="3" />
            <line x1="490" y1="100" x2="740" y2="100" stroke="white" strokeWidth="3" />
          </svg>
          <span className="absolute bottom-4 left-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-ball text-ink shadow-lg">
            {court.indoor ? <Warehouse className="h-7 w-7" /> : <Sun className="h-7 w-7" />}
          </span>
        </div>
        <div className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">{court.name}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                {[court.address, court.city].filter(Boolean).join(", ") || "Address not set"}
              </p>
            </div>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              <Navigation className="h-4 w-4" /> Directions
            </a>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Courts" value={String(court.num_courts)} />
            <Stat label="Setting" value={court.indoor ? "Indoor" : "Outdoor"} />
            <Stat label="Surface" value={court.surface.replace("-", " ")} />
            <Stat label="Lights" value={court.lights ? "Yes" : "No"} icon={court.lights ? <Lightbulb className="h-4 w-4 text-amber-500" /> : null} />
          </div>
          {court.notes && (
            <p className="mt-4 flex gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> {court.notes}
            </p>
          )}
        </div>
      </section>

      {(hasPin || canEditLocation) && (
        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-semibold text-ink">
            <MapPin className="h-4 w-4 text-brand-600" /> Map
          </h2>
          {hasPin && (
            <CourtsMap
              className="mt-3 h-64"
              zoom={16}
              courts={[
                {
                  id: court.id,
                  name: court.name,
                  city: court.city,
                  latitude: court.latitude as number,
                  longitude: court.longitude as number,
                  live: 0,
                },
              ]}
            />
          )}
          {canEditLocation && (
            <details className="mt-3" open={!hasPin}>
              <summary className="cursor-pointer text-sm font-medium text-brand-700">
                {hasPin ? "Edit map location" : "Add this court to the map"}
              </summary>
              <div className="mt-3">
                <CourtLocationForm
                  courtId={court.id}
                  initial={hasPin ? { lat: court.latitude as number, lng: court.longitude as number } : null}
                />
              </div>
            </details>
          )}
        </section>
      )}

      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-ink">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" />
            </span>
            On court now <span className="text-slate-400">· {activeNow.length}</span>
          </h2>
          <span className="text-xs text-slate-400">Check-ins from the last {ACTIVE_CHECKIN_HOURS} hours</span>
        </div>

        <div className="mt-4">
          <CheckInButton courtId={court.id} activeCheckInId={myActive?.id ?? null} />
        </div>

        <ul className="mt-4 divide-y divide-slate-100">
          {activeNow.length === 0 && <li className="py-3 text-sm text-slate-500">No one has checked in yet. Be the first!</li>}
          {activeNow.map((c) => (
            <CheckInItem key={c.id} c={c} />
          ))}
        </ul>
      </section>


      {recent.length > 0 && (
        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-semibold text-ink">
            <Clock className="h-4 w-4 text-slate-400" /> Recent visitors
          </h2>
          <ul className="mt-2 divide-y divide-slate-100">
            {recent.map((c) => (
              <CheckInItem key={c.id} c={c} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 font-semibold capitalize text-ink">
        {icon}
        {value}
      </p>
    </div>
  );
}

function CheckInItem({ c }: { c: CheckInRow }) {
  const name = c.player.full_name || c.player.username;
  return (
    <li className="flex items-center gap-3 py-3">
      <Link href={profileHref(c.player.username)}>
        <Avatar src={c.player.avatar_url} name={name} size="sm" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link href={profileHref(c.player.username)} className="truncate text-sm font-medium text-ink hover:underline">
            {name}
          </Link>
          <SkillBadge level={c.player.skill_level} />
        </div>
        {c.note && <p className="truncate text-sm text-slate-600">“{c.note}”</p>}
      </div>
      <span className="shrink-0 text-xs text-slate-400">{timeAgo(c.created_at)}</span>
    </li>
  );
}
