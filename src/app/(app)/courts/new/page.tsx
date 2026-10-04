import type { Metadata } from "next";
import { NewCourtForm } from "./NewCourtForm";

export const metadata: Metadata = { title: "Add a court" };

export default function NewCourtPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="card p-5 sm:p-6">
        <h1 className="text-xl font-bold tracking-tight text-ink">Add a court</h1>
        <p className="mt-1 text-sm text-slate-500">Help the community find great places to play.</p>
        <div className="mt-6">
          <NewCourtForm />
        </div>
      </div>
    </div>
  );
}
