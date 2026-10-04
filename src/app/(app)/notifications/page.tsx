import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { MarkNotificationsRead } from "@/components/MarkNotificationsRead";
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/data";
import { NOTIFICATION_SELECT, describeNotification, normalizeNotifications } from "@/lib/notifications";
import { cn, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select(NOTIFICATION_SELECT)
    .eq("user_id", viewer.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const items = normalizeNotifications(data);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <MarkNotificationsRead />
      <div className="card p-5">
        <h1 className="text-xl font-bold tracking-tight text-ink">Notifications</h1>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" description="Likes, comments, new followers and club joins will show up here." />
      ) : (
        <ul className="card divide-y divide-slate-100 overflow-hidden">
          {items.map((n) => {
            const d = describeNotification(n);
            const actorName = n.actor?.full_name || n.actor?.username || "Someone";
            return (
              <li key={n.id}>
                <Link href={d.href} className={cn("flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50", !n.read_at && "bg-brand-50/50")}>
                  <Avatar src={n.actor?.avatar_url} name={actorName} size="md" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="text-slate-700">
                      <span className="font-semibold text-ink">{actorName}</span> {d.text}
                    </p>
                    {d.preview && <p className="truncate text-xs text-slate-500">“{d.preview}”</p>}
                    <p className="mt-0.5 text-xs text-slate-400">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read_at && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
