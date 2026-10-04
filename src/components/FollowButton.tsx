"use client";

import { useState, useTransition } from "react";
import { Check, UserPlus } from "lucide-react";
import { toggleFollow } from "@/lib/actions/social";
import { cn } from "@/lib/utils";

export function FollowButton({
  targetId,
  initiallyFollowing,
  size = "md",
}: {
  targetId: string;
  initiallyFollowing: boolean;
  size?: "sm" | "md";
}) {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      const res = await toggleFollow(targetId, next);
      if (res?.error) setFollowing(!next);
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={cn(
        following ? "btn-secondary" : "btn-primary",
        size === "sm" && "rounded-lg px-3 py-1.5 text-xs",
      )}
    >
      {following ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
      {following ? "Following" : "Follow"}
    </button>
  );
}
