import Link from "next/link";
import { Search } from "lucide-react";
import { Logo } from "./Logo";
import { NavTabs } from "./NavTabs";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import type { Profile } from "@/lib/types";

export function Navbar({ viewer }: { viewer: Profile }) {
  return (
    <header className="sticky top-0 z-40 h-16 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid h-full max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex min-w-0 items-center gap-3">
          <Logo href="/feed" compact />
          <form action="/search" className="relative hidden w-full max-w-60 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              name="q"
              placeholder="Search Pickl"
              aria-label="Search players, clubs and courts"
              className="h-10 w-full rounded-full bg-slate-100 pl-9 pr-3 text-sm outline-none ring-brand-500 transition placeholder:text-slate-500 focus:bg-white focus:ring-2"
            />
          </form>
        </div>

        <NavTabs />

        <div className="flex items-center justify-end gap-2">
          <Link href="/search" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 sm:hidden" aria-label="Search">
            <Search className="h-5 w-5" />
          </Link>
          <NotificationBell viewerId={viewer.id} />
          <UserMenu viewer={viewer} />
        </div>
      </div>
    </header>
  );
}
