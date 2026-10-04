"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { readThemePref, setThemePref, type ThemePref } from "@/lib/theme";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemePref; label: string; Icon: typeof Sun }[] = [
  { value: "system", label: "System", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
];

/** System / Light / Dark switch. The choice is saved on this device. */
export function ThemeToggle({ className, showLabels = true }: { className?: string; showLabels?: boolean }) {
  const [pref, setPref] = useState<ThemePref | null>(null);

  useEffect(() => setPref(readThemePref()), []);

  const choose = (value: ThemePref) => {
    setPref(value);
    setThemePref(value);
  };

  return (
    <div role="radiogroup" aria-label="Theme" className={cn("inline-flex rounded-xl bg-slate-100 p-1", className)}>
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = pref === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={showLabels ? undefined : label}
            title={label}
            onClick={() => choose(value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
              active ? "bg-white text-ink shadow-sm ring-1 ring-slate-200/70" : "text-slate-500 hover:text-ink",
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {showLabels && label}
          </button>
        );
      })}
    </div>
  );
}
