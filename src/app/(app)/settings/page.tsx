import type { Metadata } from "next";
import { DeleteAccount } from "./DeleteAccount";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileForm } from "./ProfileForm";
import { requireViewer } from "@/lib/data";

export const metadata: Metadata = { title: "Edit profile" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const viewer = await requireViewer();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {welcome && (
        <div className="card overflow-hidden">
          <div className="bg-linear-to-r from-brand-600 to-brand-800 px-5 py-4 text-white">
            <p className="text-lg font-bold">Welcome to Pickl! 🎉</p>
            <p className="text-sm text-white/80">
              Set up your player card so others can find you for games at your level.
            </p>
          </div>
        </div>
      )}
      <div className="card p-5 sm:p-6">
        <h1 className="text-xl font-bold tracking-tight text-ink">Edit profile</h1>
        <p className="mt-1 text-sm text-slate-500">This is how other players see you on Pickl.</p>
        <div className="mt-6">
          <ProfileForm viewer={viewer} />
        </div>
      </div>
      <div className="card p-5 sm:p-6">
        <h2 className="text-lg font-bold text-ink">Appearance</h2>
        <p className="mt-1 text-sm text-slate-500">Choose light or dark mode, or match your device. Saved on this browser.</p>
        <ThemeToggle className="mt-4 w-full max-w-sm" />
      </div>
      <DeleteAccount />
    </div>
  );
}
