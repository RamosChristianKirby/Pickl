/**
 * Business / legal details shown in the footer and on the legal pages.
 * Change these in one place if anything about who runs Pickl changes.
 */
export const SITE = {
  name: "Pickl",
  url: "https://pickl-sable.vercel.app",
  operator: "Kirby Ramos",
  contactEmail: "ramos.christiankirby@gmail.com",
  country: "Philippines",
  /** Minimum age to create an account. Users under 18 need a parent or guardian's permission. */
  minAge: 13,
  /** Bump this (and the date) whenever the Terms or Privacy Policy change. */
  policyVersion: "2026-10-04",
  lastUpdated: "October 4, 2026",
} as const;

export const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookies" },
  { href: "/data-deletion", label: "Delete your data" },
  { href: "/licenses", label: "Licenses" },
] as const;
