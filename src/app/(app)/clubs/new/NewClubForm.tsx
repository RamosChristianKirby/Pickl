"use client";

import { useActionState, useRef, useState } from "react";
import { Camera, Globe, Loader2, Lock } from "lucide-react";
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
  const [visibility, setVisibility] = useState<"public" | "private">("public");
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

      <fieldset>
        <legend className="label">Who can join?</legend>
        <input type="hidden" name="visibility" value={visibility} />
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            { value: "public", icon: Globe, title: "Public", body: "Anyone can join. Posts are visible to members." },
            { value: "private", icon: Lock, title: "Private", body: "Members join with a password you share." },
          ] as const).map(({ value, icon: Icon, title, body }) => (
            <button
              key={value}
              type="button"
              onClick={() => setVisibility(value)}
              aria-pressed={visibility === value}
              className={`flex items-start gap-3 rounded-xl p-3 text-left ring-1 transition ${
                visibility === value ? "bg-brand-50 ring-2 ring-brand-500" : "bg-white ring-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="mt-0.5 h-5 w-5 text-brand-600" />
              <span>
                <span className="block font-semibold text-ink">{title}</span>
                <span className="block text-sm text-slate-500">{body}</span>
              </span>
            </button>
          ))}
        </div>
      </fieldset>
      {visibility === "private" && (
        <div>
          <label htmlFor="password" className="label">Club password</label>
          <input id="password" name="password" type="text" required minLength={4} maxLength={50} autoComplete="off" className="input" placeholder="Share this with people you want to let in" />
          <p className="mt-1.5 text-xs text-slate-500">Stored securely — even we can't read it. Players enter it once to join.</p>
        </div>
      )}

      <FormMessage state={state} />
      <div className="flex justify-end">
        <SubmitButton pendingText="Creating…" disabled={uploading}>
          Create club
        </SubmitButton>
      </div>
    </form>
  );
}
