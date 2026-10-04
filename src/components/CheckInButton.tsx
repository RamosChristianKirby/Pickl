"use client";

import { useState, useTransition } from "react";
import { LogOut, MapPin } from "lucide-react";
import { checkIn, checkOut } from "@/lib/actions/courts";

export function CheckInButton({ courtId, activeCheckInId }: { courtId: string; activeCheckInId: string | null }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (activeCheckInId) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800 ring-1 ring-brand-200">
          <MapPin className="h-4 w-4" /> You&apos;re checked in here
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => void (await checkOut(activeCheckInId)))}
          className="btn-ghost"
        >
          <LogOut className="h-4 w-4" /> Check out
        </button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const res = await checkIn(courtId, note);
          if (res?.error) setError(res.error);
          else setNote("");
        });
      }}
    >
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={140}
        placeholder="Add a note — e.g. “Looking for a 3.5 doubles partner”"
        className="input flex-1"
      />
      <button type="submit" disabled={pending} className="btn-primary whitespace-nowrap">
        <MapPin className="h-4 w-4" /> {pending ? "Checking in…" : "Check in"}
      </button>
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </form>
  );
}
