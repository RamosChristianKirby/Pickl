"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function MarkNotificationsRead() {
  useEffect(() => {
    // Builders are lazy: .then() actually sends the request.
    createClient()
      .rpc("mark_notifications_read")
      .then(() => {});
  }, []);
  return null;
}
