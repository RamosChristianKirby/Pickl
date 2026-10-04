"use client";

import type * as Leaflet from "leaflet";

/** Load Leaflet only in the browser (it touches `window` on import). */
export async function loadLeaflet(): Promise<typeof Leaflet> {
  const mod = await import("leaflet");
  return ((mod as unknown as { default?: typeof Leaflet }).default ?? mod) as typeof Leaflet;
}

export const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** A court pin drawn with CSS, so no marker image files are needed. */
export function pinIcon(L: typeof Leaflet, live = 0) {
  const badge = live > 0 ? `<span class="dk-pin-badge">${live}</span>` : "";
  return L.divIcon({
    className: "",
    html: `<div class="dk-pin${live > 0 ? " dk-pin-live" : ""}"><i></i>${badge}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  });
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}
