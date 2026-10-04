"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

function coord(value: FormDataEntryValue | null, limit: number) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
}

export async function addCourt(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const name = String(formData.get("name") ?? "").trim();
  const numCourts = Number(formData.get("num_courts") ?? 1);
  if (name.length < 3) return { error: "Court name must be at least 3 characters." };
  if (!Number.isInteger(numCourts) || numCourts < 1 || numCourts > 100)
    return { error: "Number of courts must be between 1 and 100." };

  const { data, error } = await supabase
    .from("courts")
    .insert({
      name: name.slice(0, 100),
      address: String(formData.get("address") ?? "").trim().slice(0, 200),
      city: String(formData.get("city") ?? "").trim().slice(0, 80),
      num_courts: numCourts,
      indoor: formData.get("indoor") === "on",
      lights: formData.get("lights") === "on",
      surface: String(formData.get("surface") ?? "hard"),
      notes: String(formData.get("notes") ?? "").trim().slice(0, 500),
      latitude: coord(formData.get("latitude"), 90),
      longitude: coord(formData.get("longitude"), 180),
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "Could not add court." };

  revalidatePath("/courts");
  redirect(`/courts/${(data as { id: string }).id}`);
}

export async function checkIn(courtId: string, note: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const { error } = await supabase
    .from("check_ins")
    .insert({ court_id: courtId, user_id: user.id, note: note.trim().slice(0, 140) });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function checkOut(checkInId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("check_ins").delete().eq("id", checkInId);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateCourtLocation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const courtId = String(formData.get("court_id") ?? "");
  const latitude = coord(formData.get("latitude"), 90);
  const longitude = coord(formData.get("longitude"), 180);
  if ((latitude == null) !== (longitude == null)) return { error: "Drop a pin on the map first." };

  const { error } = await supabase.from("courts").update({ latitude, longitude }).eq("id", courtId);
  if (error) return { error: error.message };
  revalidatePath(`/courts/${courtId}`);
  revalidatePath("/courts");
  return { success: "Location saved." };
}
