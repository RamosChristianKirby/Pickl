import { Trophy } from "lucide-react";
import { cn, ratingTone, skillLevel } from "@/lib/utils";

/** Skill-level pill (2.0, 3.5 …) from the player's Pickl Rating points (start 100, ±25 per ranked match). */
export function RatingBadge({
  rating,
  showLabel = false,
  className,
}: {
  rating: number | null | undefined;
  showLabel?: boolean;
  className?: string;
}) {
  const value = rating ?? 100;
  const lvl = skillLevel(value);
  return (
    <span
      title={`Level ${lvl.level} · ${lvl.name} · ${value} pts`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ring-1",
        ratingTone(value),
        className,
      )}
    >
      <Trophy className="h-3 w-3" aria-hidden />
      {lvl.level}
      {showLabel && (
        <span className="font-medium opacity-80">
          · {lvl.name} · {value} pts
        </span>
      )}
    </span>
  );
}
