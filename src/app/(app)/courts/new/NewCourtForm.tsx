"use client";

import { useActionState } from "react";
import { addCourt } from "@/lib/actions/courts";
import { SubmitButton } from "@/components/SubmitButton";
import { FormMessage } from "@/components/FormMessage";
import { LocationPicker } from "@/components/LocationPicker";

export function NewCourtForm() {
  const [state, action] = useActionState(addCourt, undefined);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="name" className="label">Venue name</label>
        <input id="name" name="name" required minLength={3} maxLength={100} className="input" placeholder="Riverside Park Courts" />
      </div>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>
          <label htmlFor="address" className="label">Address</label>
          <input id="address" name="address" maxLength={200} className="input" placeholder="Street address" />
        </div>
        <div>
          <label htmlFor="city" className="label">City</label>
          <input id="city" name="city" maxLength={80} className="input" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="num_courts" className="label">Number of courts</label>
          <input id="num_courts" name="num_courts" type="number" min={1} max={100} defaultValue={4} required className="input" />
        </div>
        <div>
          <label htmlFor="surface" className="label">Surface</label>
          <select id="surface" name="surface" defaultValue="hard" className="input">
            <option value="hard">Hard court</option>
            <option value="acrylic">Acrylic / cushioned</option>
            <option value="concrete">Concrete</option>
            <option value="wood">Wood (gym)</option>
            <option value="sport-tile">Sport tile</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" name="indoor" className="h-4 w-4 rounded accent-brand-600" /> Indoor
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" name="lights" className="h-4 w-4 rounded accent-brand-600" /> Has lights for night play
        </label>
      </div>
      <div>
        <span className="label">Location on the map</span>
        <LocationPicker />
      </div>
      <div>
        <label htmlFor="notes" className="label">Notes</label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          className="input resize-none"
          placeholder="Open play times, fees, parking, net type…"
        />
      </div>
      <FormMessage state={state} />
      <div className="flex justify-end">
        <SubmitButton pendingText="Adding…">Add court</SubmitButton>
      </div>
    </form>
  );
}
