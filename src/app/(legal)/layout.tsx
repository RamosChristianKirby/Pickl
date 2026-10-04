import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SiteFooter } from "@/components/SiteFooter";
import { LEGAL_LINKS } from "@/lib/site";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <Link href="/feed" className="text-sm font-semibold text-brand-700 hover:underline">
            Open Pickl →
          </Link>
        </div>
        <nav aria-label="Legal pages" className="mx-auto flex max-w-3xl gap-4 overflow-x-auto px-4 pb-3 text-sm sm:px-6">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap text-slate-600 hover:text-ink hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main id="main" className="legal mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {children}
      </main>
      <footer className="border-t border-slate-200">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <SiteFooter />
        </div>
      </footer>
    </div>
  );
}
