"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/lib/features";

export const NAV_ITEMS = [
  { href: "/feed", label: "Home", icon: Home },
  ...(FEATURES.players ? [{ href: "/players", label: "Players", icon: UserRound }] : []),
  { href: "/clubs", label: "Clubs", icon: Users },
  { href: "/courts", label: "Courts", icon: MapPin },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Center icon tabs in the top bar (desktop/tablet). */
export function NavTabs() {
  const pathname = usePathname();
  return (
    <nav className="hidden h-full items-stretch md:flex" aria-label="Main">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            title={label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex w-24 items-center justify-center text-slate-500 transition hover:text-brand-700 lg:w-28",
              active && "text-brand-700",
            )}
          >
            <span className={cn("flex h-11 w-full items-center justify-center rounded-xl", !active && "hover:bg-slate-100")}>
              <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 2} />
            </span>
            {active && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-brand-600" />}
          </Link>
        );
      })}
    </nav>
  );
}

/** Bottom tab bar on phones. */
export function MobileNav({ profilePath }: { profilePath: string }) {
  const pathname = usePathname();
  const items = [...NAV_ITEMS, { href: profilePath, label: "Profile", icon: UserRound }];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Main"
    >
      <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href) || (label === "Profile" && pathname === decodeURI(href));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium",
                active ? "text-brand-700" : "text-slate-500",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Vertical nav list for the left sidebar. */
export function SideNav() {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5" aria-label="Sections">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active ? "bg-white text-brand-800 shadow-sm ring-1 ring-slate-200/70" : "text-slate-700 hover:bg-slate-200/60",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                active ? "bg-brand-600 text-white" : "bg-slate-200/70 text-slate-600",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
