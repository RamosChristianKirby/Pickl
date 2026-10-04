"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ArrowUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** Listens for new posts and offers a one-click refresh, like a social feed should. */
export function RealtimeFeedBanner({ viewerId, clubId }: { viewerId: string; clubId?: string }) {
  const [count, setCount] = useState(0);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`feed-${clubId ?? "home"}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: clubId ? `club_id=eq.${clubId}` : undefined,
        },
        (payload) => {
          const row = payload.new as { author_id?: string; club_id?: string | null };
          if (row.author_id === viewerId) return; // your own posts already show up
          if (!clubId && row.club_id) return; // home feed only shows non-club posts
          setCount((c) => c + 1);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [viewerId, clubId]);

  if (count === 0) return null;

  return (
    <div className="sticky top-20 z-30 flex justify-center">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() => {
            router.refresh();
            setCount(0);
            window.scrollTo({ top: 0, behavior: "smooth" });
          })
        }
        className="btn-primary rounded-full px-5 shadow-lg"
      >
        <ArrowUp className="h-4 w-4" />
        {count === 1 ? "1 new post" : `${count} new posts`}
      </button>
    </div>
  );
}
