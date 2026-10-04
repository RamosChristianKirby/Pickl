import { cn, skillLabel, skillTone } from "@/lib/utils";

export function SkillBadge({
  level,
  showLabel = false,
  className,
}: {
  level: number | null | undefined;
  showLabel?: boolean;
  className?: string;
}) {
  const value = level == null ? null : Number(level);
  return (
    <span
      title={`Skill rating: ${value == null ? "unrated" : value.toFixed(1)} (${skillLabel(value)})`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
        skillTone(value),
        className,
      )}
    >
      {value == null ? "NR" : value.toFixed(1)}
      {showLabel && <span className="font-medium opacity-80">· {skillLabel(value)}</span>}
    </span>
  );
}
