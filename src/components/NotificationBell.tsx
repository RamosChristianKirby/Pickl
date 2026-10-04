"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Avatar } from "./Avatar";
import { createClient } from "@/lib/supabase/client";
import { NOTIFICATION_SELECT, describeNotification, normalizeNotifications } from "@/lib/notifications";
import { cn, timeAgo } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";

export function NotificationBell({ viewerId }: { viewerId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data }, { count }] = await Promise.all([
      supabase
        .from("notifications")
        .select(NOTIFICATION_SELECT)
        .eq("user_id", viewerId)
        .order("created_at", { ascending: false })
        .limit(15),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", viewerId)
        .is("read_at", null),
    ]);
    setItems(normalizeNotifications(data));
    setUnread(count ?? 0);
  }, [viewerId]);

  useEffect(() => {
    load();
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-${viewerId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${viewerId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [viewerId, load]);

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

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      await createClient().rpc("mark_notifications_read");
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="card fixed inset-x-2 top-16 z-50 max-h-[75vh] overflow-y-auto p-2 shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96">
          <div className="flex items-center justify-between px-2 py-1.5">
            <h3 className="text-lg font-bold text-ink">Notifications</h3>
            <Link href="/notifications" onClick={() => setOpen(false)} className="text-sm font-medium text-brand-700 hover:underline">
              See all
            </Link>
          </div>
          {items === null && <p className="px-2 py-6 text-center text-sm text-slate-500">Loading…</p>}
          {items?.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-slate-500">
              No notifications yet. Likes, comments, new followers and club joins will show up here.
            </p>
          )}
          {items?.map((n) => {
            const d = describeNotification(n);
            return (
              <Link
                key={n.id}
                href={d.href}
                onClick={() => setOpen(false)}
                className={cn("flex items-start gap-3 rounded-xl p-2 transition hover:bg-slate-50", !n.read_at && "bg-brand-50/60")}
              >
                <Avatar src={n.actor?.avatar_url} name={n.actor?.full_name || n.actor?.username || "?"} size="md" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="text-slate-700">
                    <span className="font-semibold text-ink">{n.actor?.full_name || n.actor?.username || "Someone"}</span> {d.text}
                  </p>
                  {d.preview && <p className="truncate text-xs text-slate-500">“{d.preview}”</p>}
                  <p className={cn("mt-0.5 text-xs", n.read_at ? "text-slate-500" : "font-semibold text-brand-700")} suppressHydrationWarning>
                    {timeAgo(n.created_at)}
                  </p>
                </div>
                {!n.read_at && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
