import { cn, initials } from "@/lib/utils";

const SIZES = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
  "2xl": "h-32 w-32 text-3xl",
  profile: "h-24 w-24 text-2xl sm:h-32 sm:w-32 sm:text-3xl",
} as const;

const TONES = [
  "bg-brand-100 text-brand-800",
  "bg-amber-100 text-amber-800",
  "bg-sky-100 text-sky-800",
  "bg-rose-100 text-rose-800",
  "bg-violet-100 text-violet-800",
  "bg-teal-100 text-teal-800",
];

function toneFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

export function Avatar({
  src,
  name,
  size = "md",
  className,
}: {
  src?: string | null;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const ring = className?.includes("ring-") ? "ring-white" : "ring-2 ring-white";
  const base = cn("shrink-0 rounded-full object-cover", ring, SIZES[size], className);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={base} />;
  }
  return (
    <span aria-label={name} className={cn(base, "inline-flex items-center justify-center font-bold", toneFor(name))}>
      {initials(name)}
    </span>
  );
}
