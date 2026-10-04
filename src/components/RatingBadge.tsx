import { Trophy } from "lucide-react";
import { cn, ratingTier, ratingTone } from "@/lib/utils";

/** Pickl Rating pill — starts at 100 and moves ±25 with each ranked match. */
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
  return (
    <span
      title={`Pickl Rating: ${value} (${ratingTier(value)})`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ring-1",
        ratingTone(value),
        className,
      )}
    >
      <Trophy className="h-3 w-3" aria-hidden />
      {value}
      {showLabel && <span className="font-medium opacity-80">· {ratingTier(value)}</span>}
    </span>
  );
}
