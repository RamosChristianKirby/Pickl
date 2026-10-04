import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("h-9 w-9", className)}>
      <rect width="64" height="64" rx="16" fill="#0d7a42" />
      <circle cx="32" cy="32" r="18" fill="#d7f24a" />
      <g fill="#0d7a42" opacity=".55">
        <circle cx="26" cy="24" r="2.6" />
        <circle cx="36" cy="22" r="2.6" />
        <circle cx="41" cy="31" r="2.6" />
        <circle cx="23" cy="34" r="2.6" />
        <circle cx="31" cy="32" r="2.6" />
        <circle cx="36" cy="41" r="2.6" />
        <circle cx="27" cy="43" r="2.6" />
      </g>
    </svg>
  );
}

export function Logo({ href = "/", compact = false, light = false }: { href?: string; compact?: boolean; light?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="Pickl home">
      <LogoMark />
      {!compact && (
        <span className={cn("text-xl font-extrabold tracking-tight", light ? "text-white" : "text-ink")}>
          pickl
        </span>
      )}
    </Link>
  );
}
