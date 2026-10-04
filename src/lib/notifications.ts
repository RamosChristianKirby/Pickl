import { profileHref } from "@/lib/utils";
import type { AppNotification, ProfileLite } from "@/lib/types";

export const NOTIFICATION_SELECT = `
  id, type, created_at, read_at,
  actor:profiles!notifications_actor_id_fkey ( id, username, full_name, avatar_url, rating ),
  post:posts ( id, content ),
  club:clubs ( slug, name )
`;

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

type Raw = Omit<AppNotification, "actor" | "post" | "club"> & {
  actor: ProfileLite | ProfileLite[] | null;
  post: AppNotification["post"] | AppNotification["post"][];
  club: AppNotification["club"] | AppNotification["club"][];
};

export function normalizeNotifications(rows: unknown): AppNotification[] {
  return ((rows ?? []) as Raw[]).map((n) => ({
    ...n,
    actor: one(n.actor),
    post: one(n.post),
    club: one(n.club),
  }));
}

export function describeNotification(n: AppNotification): { text: string; href: string; preview?: string } {
  switch (n.type) {
    case "like":
      return { text: "liked your post.", href: n.post ? `/post/${n.post.id}` : "/feed", preview: n.post?.content || undefined };
    case "comment":
      return { text: "commented on your post.", href: n.post ? `/post/${n.post.id}` : "/feed", preview: n.post?.content || undefined };
    case "follow":
      return { text: "started following you.", href: n.actor ? profileHref(n.actor.username) : "/feed" };
    case "club_join":
      return { text: `joined your club ${n.club?.name ?? ""}.`, href: n.club ? `/clubs/${n.club.slug}` : "/clubs" };
    case "match_invite":
      return { text: "invited you to a ranked match. Open the Pickl app to accept.", href: n.actor ? profileHref(n.actor.username) : "/feed" };
    case "match_result":
      return { text: "confirmed your ranked match result. Your Pickl Rating was updated.", href: "/feed" };
    default:
      return { text: "did something.", href: "/feed" };
  }
}
