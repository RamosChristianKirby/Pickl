"use client";

import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024;

/** Upload an image to the public `media` bucket under the user's folder and return its public URL. */
export async function uploadImage(file: File, userId: string): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > MAX_BYTES) throw new Error("Images must be under 5 MB.");

  const supabase = createClient();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  if (error) throw new Error(error.message);

  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}
