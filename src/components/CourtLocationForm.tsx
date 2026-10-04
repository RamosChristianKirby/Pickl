"use client";

import { useActionState } from "react";
import { updateCourtLocation } from "@/lib/actions/courts";
import { LocationPicker } from "./LocationPicker";
import { SubmitButton } from "./SubmitButton";
import { FormMessage } from "./FormMessage";

export function CourtLocationForm({
  courtId,
  initial,
}: {
  courtId: string;
  initial: { lat: number; lng: number } | null;
}) {
  const [state, action] = useActionState(updateCourtLocation, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="court_id" value={courtId} />
      <LocationPicker initial={initial} />
      <FormMessage state={state} />
      <div className="flex justify-end">
        <SubmitButton pendingText="Saving…">Save location</SubmitButton>
      </div>
    </form>
  );
}
