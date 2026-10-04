"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { TILE_ATTRIBUTION, TILE_URL, escapeHtml, loadLeaflet, pinIcon } from "@/lib/leaflet";
import { cn } from "@/lib/utils";

export type MapCourt = { id: string; name: string; city: string; latitude: number; longitude: number; live: number };

export function CourtsMap({ courts, className, zoom = 13 }: { courts: MapCourt[]; className?: string; zoom?: number }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    loadLeaflet().then((L) => {
      if (cancelled || !el.current) return;
      map = L.map(el.current, { scrollWheelZoom: false });
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);

      const points: [number, number][] = [];
      for (const c of courts) {
        const pos: [number, number] = [c.latitude, c.longitude];
        points.push(pos);
        L.marker(pos, { icon: pinIcon(L, c.live) })
          .addTo(map)
          .bindPopup(
            `<a href="/courts/${c.id}" class="dk-popup"><strong>${escapeHtml(c.name)}</strong>` +
              (c.city ? `<br/><span>${escapeHtml(c.city)}</span>` : "") +
              (c.live > 0 ? `<br/><em>${c.live} playing now</em>` : "") +
              `</a>`,
          );
      }

      if (points.length === 1) map.setView(points[0], zoom);
      else if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 15 });
      else map.setView([20, 0], 2);
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [courts, zoom]);

  return <div ref={el} className={cn("z-0 h-80 w-full overflow-hidden rounded-2xl bg-slate-100", className)} />;
}
