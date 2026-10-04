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

  const base = slugify(name) || "club";
  let slug = base.length >= 3 ? base : `${base}-club`;
  const { data: existing } = await supabase.from("clubs").select("id").eq("slug", slug).maybeSingle();
  if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const { error } = await supabase.from("clubs").insert({
    name: name.slice(0, 80),
    description: description.slice(0, 1000),
    location: location.slice(0, 120),
    cover_url: coverUrl,
    slug,
    owner_id: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(`/clubs/${slug}`);
}

export async function setMembership(clubId: string, join: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const { error } = join
    ? await supabase
        .from("club_members")
        .upsert({ club_id: clubId, user_id: user.id, role: "member" }, { ignoreDuplicates: true })
    : await supabase.from("club_members").delete().match({ club_id: clubId, user_id: user.id });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
