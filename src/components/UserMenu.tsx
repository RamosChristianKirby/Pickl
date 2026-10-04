"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { Avatar } from "./Avatar";
import { ThemeToggle } from "./ThemeToggle";
import type { Profile } from "@/lib/types";
import { profileHref } from "@/lib/utils";

export function UserMenu({ viewer }: { viewer: Profile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const name = viewer.full_name || viewer.username;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full p-0.5 pr-2 transition hover:bg-slate-100"
      >
        <Avatar src={viewer.avatar_url} name={name} size="sm" />
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>

      {open && (
        <div role="menu" className="card absolute right-0 top-12 z-50 w-64 p-2 shadow-xl">
          <Link
            href={profileHref(viewer.username)}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50"
          >
            <Avatar src={viewer.avatar_url} name={name} size="md" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{name}</p>
              <p className="truncate text-xs text-slate-500">@{viewer.username}</p>
            </div>
          </Link>
          <div className="my-2 h-px bg-slate-100" />
          <Link
            href={profileHref(viewer.username)}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <UserRound className="h-4 w-4" /> View profile
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Settings className="h-4 w-4" /> Edit profile
          </Link>
          <div className="px-2 py-2">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Theme</p>
            <ThemeToggle className="w-full" />
          </div>
          <div className="my-1 h-px bg-slate-100" />
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
