"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";
import { updateProfilePhoto } from "@/lib/actions/profile";
import { uploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";
import { COVER_ASPECT, ImageCropModal } from "./ImageCropModal";

/** Lets the profile owner change their cover or profile photo right from their profile page. */
export function ProfilePhotoButton({
  kind,
  userId,
  hasPhoto,
  className,
}: {
  kind: "avatar" | "cover";
  userId: string;
  hasPhoto: boolean;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<File | null>(null);
  const [, startTransition] = useTransition();

  const onPick = (file?: File) => {
    if (input.current) input.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file.");
    setError(null);
    setPicked(file);
  };

  const onFile = async (file: File) => {
    setPicked(null);
    setError(null);
    setBusy(true);
    try {
      const url = await uploadImage(file, userId);
      startTransition(async () => {
        const res = await updateProfilePhoto(kind, url);
        if (res?.error) setError(res.error);
        setBusy(false);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setBusy(false);
    }
  };

  const label = kind === "cover" ? (hasPhoto ? "Edit cover photo" : "Add cover photo") : "Change profile photo";

  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label={label}
        title={label}
        className={cn(
          kind === "cover"
            ? "flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 text-sm font-semibold text-ink shadow-sm backdrop-blur transition hover:bg-white"
            : "flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-ink shadow ring-2 ring-white transition hover:bg-slate-200",
          className,
        )}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        {kind === "cover" && <span className="hidden sm:inline">{busy ? "Uploading…" : label}</span>}
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => onPick(e.target.files?.[0])} />
      {picked && (
        <ImageCropModal
          file={picked}
          aspect={kind === "cover" ? COVER_ASPECT : 1}
          round={kind === "avatar"}
          outputWidth={kind === "cover" ? 1800 : 600}
          onCancel={() => setPicked(null)}
          onConfirm={onFile}
        />
      )}
      {error && (
        <p className="absolute left-4 top-4 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white shadow">{error}</p>
      )}
    </>
  );
}
