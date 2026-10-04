"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";
import { isOwnMediaUrl } from "@/lib/media";
import { USERNAME_RULE, isValidUsername } from "@/lib/utils";

const STYLES = ["singles", "doubles", "mixed", "all"];

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const username = String(formData.get("username") ?? "").trim();
  if (!username) return { error: "Username can't be empty." };
  if (!isValidUsername(username)) return { error: USERNAME_RULE };

  const { data: clash } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();
  if (clash) return { error: "That username is already taken." };

  const style = String(formData.get("play_style") ?? "");
  const avatarUrl = String(formData.get("avatar_url") ?? "") || null;
  const coverUrl = String(formData.get("cover_url") ?? "") || null;
  // Only allow photos that were uploaded to this user's own storage folder
  // (or that are unchanged from what's already saved).
  const { data: current } = await supabase.from("profiles").select("avatar_url, cover_url").eq("id", user.id).single();
  const ok = (url: string | null, existing: string | null | undefined) => url === (existing ?? null) || isOwnMediaUrl(url, user.id);
  const cur = current as { avatar_url: string | null; cover_url: string | null } | null;
  if (!ok(avatarUrl, cur?.avatar_url) || !ok(coverUrl, cur?.cover_url)) return { error: "Invalid image." };

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      full_name: String(formData.get("full_name") ?? "").trim().slice(0, 80),
      bio: String(formData.get("bio") ?? "").trim().slice(0, 300),
      location: String(formData.get("location") ?? "").trim().slice(0, 80),
      paddle: String(formData.get("paddle") ?? "").trim().slice(0, 80),
      play_style: STYLES.includes(style) ? style : null,
      avatar_url: avatarUrl,
      cover_url: coverUrl,
    })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: "Profile saved." };
}

/** Save a newly uploaded avatar or cover photo (must be a file in this project's public media bucket). */
export async function updateProfilePhoto(kind: "avatar" | "cover", url: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  if (!isOwnMediaUrl(url, user.id)) return { error: "Invalid image." };

  const column = kind === "avatar" ? "avatar_url" : "cover_url";
  const { error } = await supabase.from("profiles").update({ [column]: url }).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
