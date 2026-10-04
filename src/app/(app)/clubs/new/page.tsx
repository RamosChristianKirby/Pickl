import type { Metadata } from "next";
import { NewClubForm } from "./NewClubForm";
import { requireViewer } from "@/lib/data";

export const metadata: Metadata = { title: "Create a club" };

export default async function NewClubPage() {
  const viewer = await requireViewer();
  return (
    <div className="mx-auto max-w-2xl">
      <div className="card p-5 sm:p-6">
        <h1 className="text-xl font-bold tracking-tight text-ink">Create a club</h1>
        <p className="mt-1 text-sm text-slate-500">
          Clubs have their own feed and member list. You&apos;ll be the owner.
        </p>
        <div className="mt-6">
          <NewClubForm userId={viewer.id} />
        </div>
      </div>
    </div>
  );
}
