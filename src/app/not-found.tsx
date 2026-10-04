import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <div>
        <p className="text-sm font-semibold text-brand-700">404 — Out of bounds</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">That shot landed long.</h1>
        <p className="mt-2 text-slate-500">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
      </div>
      <Link href="/feed" className="btn-primary">
        Back to the feed
      </Link>
    </main>
  );
}
