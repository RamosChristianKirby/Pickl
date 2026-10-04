"use client";

import { useActionState, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { COVER_ASPECT, ImageCropModal } from "@/components/ImageCropModal";
import { SubmitButton } from "@/components/SubmitButton";
import { FormMessage } from "@/components/FormMessage";
import { updateProfile } from "@/lib/actions/profile";
import { uploadImage } from "@/lib/upload";
import { USERNAME_PATTERN, USERNAME_RULE, ratingTier } from "@/lib/utils";
import { RatingBadge } from "@/components/RatingBadge";
import type { Profile } from "@/lib/types";

export function ProfileForm({ viewer }: { viewer: Profile }) {
  const [state, action] = useActionState(updateProfile, undefined);
  const [avatarUrl, setAvatarUrl] = useState(viewer.avatar_url ?? "");
  const [coverUrl, setCoverUrl] = useState(viewer.cover_url ?? "");
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [picked, setPicked] = useState<{ kind: "avatar" | "cover"; file: File } | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const pick = (kind: "avatar" | "cover", input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setUploadError("Please choose an image file.");
    setUploadError(null);
    setPicked({ kind, file });
  };

  const handleUpload = async (kind: "avatar" | "cover", file: File) => {
    setPicked(null);
    setUploadError(null);
    setUploading(kind);
    try {
      const url = await uploadImage(file, viewer.id);
      if (kind === "avatar") setAvatarUrl(url);
      else setCoverUrl(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(null);
    }
  };

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="avatar_url" value={avatarUrl} />
      <input type="hidden" name="cover_url" value={coverUrl} />

      {/* Cover + avatar */}
      <div>
        <div className="relative h-36 overflow-hidden rounded-2xl bg-linear-to-br from-brand-600 to-brand-900">
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
          )}
          <button
            type="button"
            onClick={() => coverInput.current?.click()}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-black/70"
          >
            {uploading === "cover" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            {coverUrl ? "Change cover" : "Add cover photo"}
          </button>
          <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e) => pick("cover", e.target)} />
          {coverUrl && (
            <button
              type="button"
              onClick={() => setCoverUrl("")}
              className="absolute bottom-3 left-3 rounded-lg bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-black/70"
            >
              Remove
            </button>
          )}
        </div>
        <div className="-mt-10 flex items-end gap-3 px-4">
          <div className="relative">
            <Avatar src={avatarUrl || null} name={viewer.full_name || viewer.username} size="xl" className="ring-4" />
            <button
              type="button"
              onClick={() => avatarInput.current?.click()}
              className="absolute bottom-0 right-0 rounded-full bg-white p-2 text-slate-700 shadow ring-1 ring-slate-200 hover:bg-slate-50"
              aria-label="Change profile photo"
            >
              {uploading === "avatar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input ref={avatarInput} type="file" accept="image/*" hidden onChange={(e) => pick("avatar", e.target)} />
          </div>
        </div>
        {avatarUrl && (
          <button type="button" onClick={() => setAvatarUrl("")} className="mt-2 px-4 text-xs font-medium text-slate-500 hover:text-rose-600">
            Remove profile photo
          </button>
        )}
        {uploadError && <p className="mt-2 text-sm text-rose-600">{uploadError}</p>}
        {picked && (
          <ImageCropModal
            file={picked.file}
            aspect={picked.kind === "cover" ? COVER_ASPECT : 1}
            round={picked.kind === "avatar"}
            outputWidth={picked.kind === "cover" ? 1800 : 600}
            onCancel={() => setPicked(null)}
            onConfirm={(cropped) => handleUpload(picked.kind, cropped)}
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="full_name" className="label">Full name</label>
          <input id="full_name" name="full_name" defaultValue={viewer.full_name} maxLength={80} className="input" />
        </div>
        <div>
          <label htmlFor="username" className="label">Username</label>
          <input
            id="username"
            name="username"
            defaultValue={viewer.username}
            required
            maxLength={50}
            pattern={USERNAME_PATTERN}
            title={USERNAME_RULE}
            className="input"
          />
        </div>
      </div>

      <div>
        <label htmlFor="bio" className="label">Bio</label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={viewer.bio}
          maxLength={300}
          rows={3}
          className="input resize-none"
          placeholder="Ex-tennis player, now addicted to dinking. Weekend open play regular."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="label">Skill level (Pickl Rating)</span>
          <div className="flex h-[42px] items-center gap-2 rounded-xl bg-slate-50 px-3 text-sm text-slate-600 ring-1 ring-slate-200">
            <RatingBadge rating={viewer.rating} />
            <span className="truncate">{ratingTier(viewer.rating)} · earned in ranked matches</span>
          </div>
        </div>
        <div>
          <label htmlFor="play_style" className="label">Preferred format</label>
          <select id="play_style" name="play_style" defaultValue={viewer.play_style ?? ""} className="input">
            <option value="">No preference</option>
            <option value="singles">Singles</option>
            <option value="doubles">Doubles</option>
            <option value="mixed">Mixed doubles</option>
            <option value="all">Plays everything</option>
          </select>
        </div>
        <div>
          <label htmlFor="location" className="label">Location</label>
          <input id="location" name="location" defaultValue={viewer.location} maxLength={80} className="input" placeholder="City, area" />
        </div>
        <div>
          <label htmlFor="paddle" className="label">Paddle</label>
          <input id="paddle" name="paddle" defaultValue={viewer.paddle} maxLength={80} className="input" placeholder="Brand & model" />
        </div>
      </div>

      <FormMessage state={state} />

      <div className="flex justify-end">
        <SubmitButton pendingText="Saving…" disabled={uploading !== null}>
          Save profile
        </SubmitButton>
      </div>
    </form>
  );
}
