"use client";

import { useRef, useState, useTransition } from "react";
import { Crop, ImagePlus, Loader2, X } from "lucide-react";
import { Avatar } from "./Avatar";
import { ImageCropModal, POST_PHOTO_PRESETS } from "./ImageCropModal";
import { createPost } from "@/lib/actions/social";
import { uploadImage } from "@/lib/upload";
import type { Profile } from "@/lib/types";

export function PostComposer({
  viewer,
  clubId,
  placeholder,
}: {
  viewer: Profile;
  clubId?: string;
  placeholder?: string;
}) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [original, setOriginal] = useState<File | null>(null);
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const name = viewer.full_name || viewer.username;
  const busy = pending || uploading;
  const canPost = (content.trim().length > 0 || file) && !busy;

  // Picking a photo opens the editor first; the edited version is what gets posted.
  const pickFile = (f: File | undefined) => {
    if (fileInput.current) fileInput.current.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("Please choose an image file.");
    setError(null);
    setOriginal(f);
    setEditing(true);
  };

  const applyEdit = (cropped: File) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(cropped);
    setPreview(URL.createObjectURL(cropped));
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditing(false);
    if (!file) setOriginal(null);
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setOriginal(null);
    setPreview(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPost) return;
    setError(null);

    let imageUrl: string | null = null;
    if (file) {
      try {
        setUploading(true);
        imageUrl = await uploadImage(file, viewer.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
        return;
      } finally {
        setUploading(false);
      }
    }

    startTransition(async () => {
      const res = await createPost({ content, imageUrl, clubId: clubId ?? null });
      if (res && "error" in res && res.error) {
        setError(res.error);
        return;
      }
      setContent("");
      clearFile();
    });
  };

  return (
    <form onSubmit={submit} className="card p-4">
      <div className="flex gap-3">
        <Avatar src={viewer.avatar_url} name={name} size="md" />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={content.split("\n").length > 2 ? 4 : 2}
          maxLength={2000}
          placeholder={placeholder ?? `What's happening on the court, ${name.split(" ")[0]}?`}
          className="min-h-[52px] flex-1 resize-none rounded-2xl bg-slate-100 px-4 py-3 text-base outline-none sm:text-[15px] ring-brand-500 transition placeholder:text-slate-500 focus:bg-white focus:ring-2"
        />
      </div>

      {preview && (
        <div className="relative mt-3 overflow-hidden rounded-xl ring-1 ring-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Selected upload preview" className="max-h-96 w-full object-cover" />
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/80"
          >
            <Crop className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            type="button"
            onClick={clearFile}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
            aria-label="Remove photo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      {editing && original && (
        <ImageCropModal
          file={original}
          presets={POST_PHOTO_PRESETS}
          outputWidth={1600}
          onCancel={cancelEdit}
          onConfirm={applyEdit}
        />
      )}

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <button type="button" onClick={() => fileInput.current?.click()} className="btn-ghost px-3 py-2">
          <ImagePlus className="h-5 w-5 text-brand-600" />
          <span>Photo</span>
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        <button type="submit" disabled={!canPost} className="btn-primary px-6">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {uploading ? "Uploading…" : pending ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}
