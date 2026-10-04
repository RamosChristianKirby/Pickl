import Link from "next/link";
import { LEGAL_LINKS, SITE } from "@/lib/site";

/** Legal links + who runs Pickl. Used on the landing page, auth pages and legal pages. */
export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "space-y-2 text-xs text-slate-500" : "space-y-3 text-sm text-slate-500"}>
      <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-1">
        {LEGAL_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-ink hover:underline">
            {l.label}
          </Link>
        ))}
      </nav>
      <p>
        © {new Date().getFullYear()} {SITE.name} · Operated by {SITE.operator}, {SITE.country} ·{" "}
        <a href={`mailto:${SITE.contactEmail}`} className="hover:text-ink hover:underline">
          {SITE.contactEmail}
        </a>
      </p>
    </div>
  );
}
