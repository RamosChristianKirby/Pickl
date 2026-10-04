"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { ActionState } from "@/lib/types";
import { isOwnMediaUrl } from "@/lib/media";

export async function createClub(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const coverUrl = String(formData.get("cover_url") ?? "").trim() || null;

  if (name.length < 3) return { error: "Club name must be at least 3 characters." };
  if (!isOwnMediaUrl(coverUrl, user.id)) return { error: "Invalid cover image." };

  const visibility = formData.get("visibility") === "private" ? "private" : "public";
  const password = String(formData.get("password") ?? "");
  if (visibility === "private" && (password.length < 4 || password.length > 50))
    return { error: "Private clubs need a password of 4 to 50 characters." };

  const base = slugify(name) || "club";
  const wanted = base.length >= 3 ? base : `${base}-club`;

  // create_club stores the password as a hash and picks a free slug.
  const { data: slug, error } = await supabase.rpc("create_club", {
    p_name: name.slice(0, 80),
    p_slug: wanted,
    p_description: description.slice(0, 1000),
    p_location: location.slice(0, 120),
    p_cover_url: coverUrl,
    p_visibility: visibility,
    p_password: visibility === "private" ? password : null,
  });
  if (error || !slug) return { error: error?.message ?? "Could not create the club." };

  revalidatePath("/", "layout");
  redirect(`/clubs/${slug as string}`);
}

export async function setMembership(clubId: string, join: boolean, password?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const { error } = join
    ? await supabase.rpc("join_club", { p_club_id: clubId, p_password: password ?? null })
    : await supabase.from("club_members").delete().match({ club_id: clubId, user_id: user.id });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
