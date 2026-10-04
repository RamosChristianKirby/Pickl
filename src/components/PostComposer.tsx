"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Avatar } from "./Avatar";
import { createPost } from "@/lib/actions/social";
import { uploadImage } from "@/lib/upload";
import { prepareImageForUpload } from "@/lib/prepare-image";
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
  const [preparing, setPreparing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const name = viewer.full_name || viewer.username;
  const busy = pending || uploading || preparing;
  const canPost = (content.trim().length > 0 || file) && !busy;

  // Photos are posted whole, at their original shape — no cropping. Big ones are just scaled down.
  const pickFile = async (f: File | undefined) => {
    if (fileInput.current) fileInput.current.value = "";
    if (!f) return;
    setError(null);
    setPreparing(true);
    try {
      const ready = await prepareImageForUpload(f);
      if (preview) URL.revokeObjectURL(preview);
      setFile(ready);
      setPreview(URL.createObjectURL(ready));
    } catch (err) {
      setError(err instanceof Error ? err.message : "That image couldn't be used.");
    } finally {
      setPreparing(false);
    }
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
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
          <img src={preview} alt="Selected upload preview" className="max-h-[480px] w-full bg-slate-100 object-contain" />
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

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <button type="button" disabled={busy} onClick={() => fileInput.current?.click()} className="btn-ghost px-3 py-2">
          {preparing ? <Loader2 className="h-5 w-5 animate-spin text-brand-600" /> : <ImagePlus className="h-5 w-5 text-brand-600" />}
          {preparing ? <span>Adding photo…</span> : <span>Photo</span>}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        <button type="submit" disabled={!canPost} className="btn-primary px-6">
          {(pending || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
          {uploading ? "Uploading…" : pending ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}
