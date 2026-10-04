"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";

const KEY = "pickl-cookie-notice";

/**
 * Pickl only sets essential sign-in cookies, so there's nothing to opt out of —
 * this notice just tells people that plainly (no tracking, no dark patterns).
 */
export function CookieNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* storage blocked: don't nag */
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return (
    <div role="region" aria-label="Cookie notice" className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-xl rounded-2xl bg-ink p-4 text-sm text-slate-100 shadow-2xl ring-1 ring-white/10 sm:bottom-6">
      <div className="flex items-start gap-3">
        <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-ball" aria-hidden />
        <p className="flex-1">
          Pickl only uses <strong>essential cookies</strong> to keep you signed in. No ads, analytics or tracking.{" "}
          <Link href="/cookies" className="font-semibold text-ball underline underline-offset-2">
            Cookie policy
          </Link>
        </p>
        <button type="button" onClick={dismiss} className="rounded-lg bg-ball px-3 py-1.5 font-bold text-ink hover:brightness-95">
          Got it
        </button>
      </div>
    </div>
  );
}
