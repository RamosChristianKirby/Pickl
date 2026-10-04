"use client";

import { useActionState, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { createClub } from "@/lib/actions/clubs";
import { uploadImage } from "@/lib/upload";
import { SubmitButton } from "@/components/SubmitButton";
import { FormMessage } from "@/components/FormMessage";
import { COVER_ASPECT, ImageCropModal } from "@/components/ImageCropModal";

export function NewClubForm({ userId }: { userId: string }) {
  const [state, action] = useActionState(createClub, undefined);
  const [coverUrl, setCoverUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [picked, setPicked] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const onPick = (input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setUploadError("Please choose an image file.");
    setUploadError(null);
    setPicked(file);
  };

  const onFile = async (file: File) => {
    setPicked(null);
    setUploadError(null);
    setUploading(true);
    try {
      setCoverUrl(await uploadImage(file, userId));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="cover_url" value={coverUrl} />

      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-brand-500 to-brand-800 text-white"
      >
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <span className="relative flex items-center gap-2 rounded-lg bg-black/45 px-3 py-1.5 text-sm font-semibold backdrop-blur">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {coverUrl ? "Change cover photo" : "Add a cover photo"}
        </span>
      </button>
      <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => onPick(e.target)} />
      {uploadError && <p className="text-sm text-rose-600">{uploadError}</p>}
      {picked && (
        <ImageCropModal
          file={picked}
          aspect={COVER_ASPECT}
          outputWidth={1800}
          onCancel={() => setPicked(null)}
          onConfirm={onFile}
        />
      )}

      <div>
        <label htmlFor="name" className="label">Club name</label>
        <input id="name" name="name" required minLength={3} maxLength={80} className="input" placeholder="Northside Dink Society" />
      </div>
      <div>
        <label htmlFor="location" className="label">Location</label>
        <input id="location" name="location" maxLength={120} className="input" placeholder="City or neighborhood" />
      </div>
      <div>
        <label htmlFor="description" className="label">About</label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={1000}
          className="input resize-none"
          placeholder="Who is this club for? When and where do you play?"
        />
      </div>

      <FormMessage state={state} />
      <div className="flex justify-end">
        <SubmitButton pendingText="Creating…" disabled={uploading}>
          Create club
        </SubmitButton>
      </div>
    </form>
  );
}
