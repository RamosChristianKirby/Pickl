"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

/** Permanently delete the signed-in player's account, photos and data. */
export async function deleteAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (String(formData.get("confirm") ?? "").trim() !== "DELETE") return { error: 'Type DELETE to confirm.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  // 1. Remove every photo in the player's storage folder (the database can't delete storage files itself).
  for (let round = 0; round < 20; round++) {
    const { data: files } = await supabase.storage.from("media").list(user.id, { limit: 100 });
    if (!files || files.length === 0) break;
    const { error } = await supabase.storage.from("media").remove(files.map((f) => `${user.id}/${f.name}`));
    if (error) return { error: `Couldn't delete your photos: ${error.message}` };
  }

  // 2. Delete the account; everything that belongs to it is removed with it.
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { error: error.message };

  await supabase.auth.signOut();
  redirect("/login?notice=deleted");
}
