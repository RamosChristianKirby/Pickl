"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, Search, X } from "lucide-react";
import { TILE_ATTRIBUTION, TILE_URL, loadLeaflet, pinIcon } from "@/lib/leaflet";

type LatLng = { lat: number; lng: number };

/**
 * Click the map (or search / use your location) to set a court's coordinates.
 * Writes hidden `latitude` and `longitude` inputs for the surrounding form.
 */
export function LocationPicker({ initial }: { initial?: LatLng | null }) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const setPointRef = useRef<(p: LatLng | null, fly?: boolean) => void>(() => {});
  const [point, setPoint] = useState<LatLng | null>(initial ?? null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<"search" | "locate" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !el.current) return;
      const map = L.map(el.current);
      mapRef.current = map;
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);
      map.setView(initial ? [initial.lat, initial.lng] : [20, 0], initial ? 16 : 2);

      setPointRef.current = (p, fly = false) => {
        setPoint(p);
        markerRef.current?.remove();
        markerRef.current = null;
        if (!p) return;
        markerRef.current = L.marker([p.lat, p.lng], { icon: pinIcon(L), draggable: true }).addTo(map);
        markerRef.current.on("dragend", () => {
          const ll = markerRef.current!.getLatLng();
          setPoint({ lat: ll.lat, lng: ll.lng });
        });
        if (fly) map.setView([p.lat, p.lng], 17);
      };
      if (initial) setPointRef.current(initial);
      map.on("click", (e: import("leaflet").LeafletMouseEvent) => setPointRef.current({ lat: e.latlng.lat, lng: e.latlng.lng }));
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = async () => {
    if (!query.trim()) return;
    setBusy("search");
    setError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query.trim())}`,
        { headers: { Accept: "application/json" } },
      );
      const results = (await res.json()) as { lat: string; lon: string }[];
      if (!results.length) setError("Couldn't find that place. Try adding the city, or click the map instead.");
      else setPointRef.current({ lat: Number(results[0].lat), lng: Number(results[0].lon) }, true);
    } catch {
      setError("Search is unavailable right now. Click the map to drop a pin instead.");
    } finally {
      setBusy(null);
    }
  };

  const locate = () => {
    if (!navigator.geolocation) return setError("Your browser can't share its location.");
    setBusy("locate");
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(null);
        setPointRef.current({ lat: pos.coords.latitude, lng: pos.coords.longitude }, true);
      },
      () => {
        setBusy(null);
        setError("Couldn't get your location. Check your browser's location permission.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-2">
      <input type="hidden" name="latitude" value={point ? point.lat.toFixed(6) : ""} />
      <input type="hidden" name="longitude" value={point ? point.lng.toFixed(6) : ""} />

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                search();
              }
            }}
            placeholder="Search for the address"
            className="input pl-9"
          />
        </div>
        <button type="button" onClick={search} disabled={busy !== null} className="btn-secondary">
          {busy === "search" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Find
        </button>
        <button type="button" onClick={locate} disabled={busy !== null} className="btn-secondary">
          {busy === "locate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />} Use my location
        </button>
      </div>

      <div ref={el} className="z-0 h-72 w-full cursor-crosshair overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200" />

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          {point ? `Pin set at ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)} (drag it to adjust)` : "Click the map to drop a pin on the court."}
        </span>
        {point && (
          <button type="button" onClick={() => setPointRef.current(null)} className="flex items-center gap-1 hover:text-rose-600">
            <X className="h-3 w-3" /> Clear pin
          </button>
        )}
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}
