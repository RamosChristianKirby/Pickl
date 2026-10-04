"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Image as ImageIcon, Loader2, RotateCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type CropPreset = { label: string; aspect: number | "original" };

type Props = {
  file: File;
  title?: string;
  /** Fixed aspect ratio (width / height). Ignored when `presets` is given. */
  aspect?: number;
  /** Let the user pick between several aspect ratios (e.g. for post photos). */
  presets?: CropPreset[];
  /** Circular crop window (for profile photos). */
  round?: boolean;
  /** Width of the exported image in pixels. */
  outputWidth?: number;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (cropped: File) => void | Promise<void>;
};

const MAX_ZOOM = 4;
const STAGE_PADDING = 28; // space between the crop window and the stage edge

/**
 * Popup photo editor (Discord-style): the whole photo is shown with everything outside the
 * crop window dimmed. Drag to reposition, zoom with the slider / wheel / pinch, rotate 90°.
 * Exports the cropped area as a JPEG `File`.
 */
export function ImageCropModal({
  file,
  title = "Edit Image",
  aspect = 1,
  presets,
  round = false,
  outputWidth = 1200,
  confirmLabel = "Apply",
  onCancel,
  onConfirm,
}: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [src, setSrc] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [presetIndex, setPresetIndex] = useState(0);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [stageWidth, setStageWidth] = useState(0);
  const [stageHeight, setStageHeight] = useState(340);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);

  // Load the picked file. The `cancelled` flag matters: in development React runs effects
  // twice, and revoking the first object URL must not be reported as a broken image.
  useEffect(() => {
    let cancelled = false;
    const url = URL.createObjectURL(file);
    setLoadError(false);
    setImg(null);
    setSrc(url);
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (!cancelled) setImg(image);
    };
    image.onerror = () => {
      if (!cancelled) setLoadError(true);
    };
    image.src = url;
    return () => {
      cancelled = true;
      image.onload = null;
      image.onerror = null;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Measure the stage.
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      setStageWidth(el.clientWidth);
      setStageHeight(Math.max(240, Math.min(360, window.innerHeight - 300)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  // Escape closes; lock page scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !saving && onCancel();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onCancel, saving]);

  const rotated = rotation % 180 !== 0;
  const imgW = img ? (rotated ? img.naturalHeight : img.naturalWidth) : 1;
  const imgH = img ? (rotated ? img.naturalWidth : img.naturalHeight) : 1;

  const activePreset = presets?.[presetIndex];
  const ratio = activePreset ? (activePreset.aspect === "original" ? imgW / imgH : activePreset.aspect) : aspect;

  // Crop window: as large as fits inside the stage with some padding.
  const pad = round ? STAGE_PADDING * 2 : STAGE_PADDING;
  const availW = Math.max(0, stageWidth - pad * 2);
  const availH = Math.max(0, stageHeight - pad * 2);
  let cropW = availW;
  let cropH = cropW / ratio;
  if (cropH > availH) {
    cropH = availH;
    cropW = cropH * ratio;
  }

  const baseScale = Math.max(cropW / imgW, cropH / imgH);
  const scale = baseScale * zoom;

  const clamp = useCallback(
    (o: { x: number; y: number }, z = zoom) => {
      const s = baseScale * z;
      const maxX = Math.max(0, (imgW * s - cropW) / 2);
      const maxY = Math.max(0, (imgH * s - cropH) / 2);
      const x = Math.min(maxX, Math.max(-maxX, o.x));
      const y = Math.min(maxY, Math.max(-maxY, o.y));
      return x === o.x && y === o.y ? o : { x, y };
    },
    [baseScale, imgW, imgH, cropW, cropH, zoom],
  );

  useEffect(() => {
    setOffset((o) => clamp(o));
  }, [clamp]);

  const setZoomClamped = (z: number) => {
    const next = Math.min(MAX_ZOOM, Math.max(1, z));
    setZoom(next);
    setOffset((o) => clamp(o, next));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setDragging(true);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, next);

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      setZoomClamped(pinchStart.current.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / pinchStart.current.dist));
      return;
    }
    setOffset((o) => clamp({ x: o.x + (next.x - prev.x), y: o.y + (next.y - prev.y) }));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) setDragging(false);
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    setZoomClamped(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08));
  };

  const rotate = () => {
    setRotation((r) => (r + 90) % 360);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const reset = () => {
    setRotation(0);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const apply = async () => {
    if (!img || !cropW) return;
    setSaving(true);
    setSaveError(null);
    try {
      const outW = Math.round(outputWidth);
      const outH = Math.round(outW / ratio);
      const k = outW / cropW; // screen pixels → output pixels
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Your browser couldn't process this image.");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outW, outH);
      ctx.imageSmoothingQuality = "high";
      ctx.translate(outW / 2 + offset.x * k, outH / 2 + offset.y * k);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale * k, scale * k);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (!blob) throw new Error("Couldn't process this image.");
      const base = file.name.replace(/\.[^.]+$/, "") || "photo";
      await onConfirm(new File([blob], `${base}.jpg`, { type: "image/jpeg" }));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const ready = img && cropW > 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onCancel()}
    >
      <div className="w-full max-w-[480px] overflow-hidden rounded-t-2xl bg-[#2b2d31] text-white shadow-2xl sm:rounded-2xl">
        <header className="flex items-center justify-between px-5 pb-3 pt-5">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-md p-1 text-[#94a3b8] transition hover:text-white"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </header>

        <div className="px-5">
          {/* Stage: whole photo visible, everything outside the crop window dimmed */}
          <div
            ref={stageRef}
            className={cn(
              "relative w-full touch-none select-none overflow-hidden rounded-lg bg-[#1e1f22]",
              ready && (dragging ? "cursor-grabbing" : "cursor-grab"),
            )}
            style={{ height: stageHeight }}
            onPointerDown={ready ? onPointerDown : undefined}
            onPointerMove={ready ? onPointerMove : undefined}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={ready ? onWheel : undefined}
          >
            {loadError ? (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[#cbd5e1]">
                This image couldn&apos;t be opened. Please try another JPG, PNG or WebP file.
              </div>
            ) : !ready ? (
              <div className="flex h-full items-center justify-center text-[#94a3b8]">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
                  style={{
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${scale})`,
                  }}
                />
                {/* Crop window: the huge shadow dims everything outside it */}
                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-[3px] border-white"
                  style={{
                    width: cropW,
                    height: cropH,
                    borderRadius: round ? "9999px" : "6px",
                    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
                  }}
                >
                  {/* Rule-of-thirds guides while dragging (square/rect crops only) */}
                  {!round && (
                    <div className={cn("absolute inset-0 transition-opacity", dragging ? "opacity-100" : "opacity-0")}>
                      <div className="absolute inset-y-0 left-1/3 w-px bg-white/40" />
                      <div className="absolute inset-y-0 left-2/3 w-px bg-white/40" />
                      <div className="absolute inset-x-0 top-1/3 h-px bg-white/40" />
                      <div className="absolute inset-x-0 top-2/3 h-px bg-white/40" />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {presets && presets.length > 1 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {presets.map((p, i) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setPresetIndex(i);
                    setZoom(1);
                    setOffset({ x: 0, y: 0 });
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold transition",
                    i === presetIndex ? "bg-[#fff] text-[#2b2d31]" : "bg-[#4e5058] text-[#e2e8f0] hover:bg-[#6d6f78]",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Zoom slider (small image → big image) and rotate */}
          <div className="relative mt-5 flex items-center justify-center">
            <div className="flex w-full max-w-[220px] items-center gap-3">
              <ImageIcon className="h-4 w-4 shrink-0 text-[#cbd5e1]" />
              <input
                type="range"
                min={1}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoomClamped(Number(e.target.value))}
                disabled={!ready}
                aria-label="Zoom"
                className="dk-range flex-1"
                style={{ ["--dk-fill" as string]: `${((zoom - 1) / (MAX_ZOOM - 1)) * 100}%` }}
              />
              <ImageIcon className="h-6 w-6 shrink-0 text-[#cbd5e1]" />
            </div>
            <button
              type="button"
              onClick={rotate}
              disabled={!ready}
              className="absolute right-0 rounded-md p-1.5 text-[#cbd5e1] transition hover:bg-white/10 hover:text-white"
              aria-label="Rotate"
              title="Rotate"
            >
              <RotateCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {saveError && <p className="px-5 pt-3 text-sm text-rose-400">{saveError}</p>}

        <footer className="mt-5 flex items-center justify-between bg-[#232428] px-5 py-4">
          <button
            type="button"
            onClick={reset}
            disabled={!ready || saving}
            className="text-sm font-medium text-brand-300 transition hover:underline disabled:opacity-50"
          >
            Reset
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="rounded-md bg-[#4e5058] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6d6f78]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={!ready || saving}
              className="flex min-w-24 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving…" : confirmLabel}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

export const POST_PHOTO_PRESETS: CropPreset[] = [
  { label: "Original", aspect: "original" },
  { label: "Square", aspect: 1 },
  { label: "Portrait 4:5", aspect: 4 / 5 },
  { label: "Wide 16:9", aspect: 16 / 9 },
];

/** Cover photos are shown roughly 3:1 on profiles and clubs. */
export const COVER_ASPECT = 3;
