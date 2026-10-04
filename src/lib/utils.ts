export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function timeAgo(date: string | Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 45) return "just now";
  const units: Array<[number, string]> = [
    [60, "m"],
    [60, "h"],
    [24, "d"],
    [7, "w"],
  ];
  let value = seconds / 60;
  let label = "m";
  for (let i = 1; i < units.length && value >= units[i][0]; i++) {
    value = value / units[i][0];
    label = units[i][1];
  }
  if (label === "w" && value > 4) {
    return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
  return `${Math.floor(value)}${label}`;
}

/** Letters (any case), numbers and keyboard symbols. No spaces, emoji or accented letters. */
export const USERNAME_PATTERN = "[!-~]+";
export const USERNAME_RULE = "Usernames can use letters, numbers and symbols only (no spaces or emoji).";
export function isValidUsername(username: string) {
  return /^[!-~]+$/.test(username) && username.length <= 50;
}

/** Link to a player's profile. Usernames can contain any characters, so encode them. */
export function profileHref(username: string) {
  return `/u/${encodeUsername(username)}`;
}

function encodeUsername(username: string) {
  return encodeURIComponent(username).replace(/\./g, "%2E");
}

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

/** Pickl Rating: everyone starts at 100; ranked matches move it ±25. */
export const STARTING_RATING = 100;

export function ratingTier(rating: number | null | undefined) {
  const r = rating ?? STARTING_RATING;
  if (r < 125) return "Rookie";
  if (r < 200) return "Contender";
  if (r < 300) return "Competitor";
  if (r < 450) return "Advanced";
  return "Elite";
}

export function ratingTone(rating: number | null | undefined) {
  const r = rating ?? STARTING_RATING;
  if (r < 125) return "bg-slate-100 text-slate-700 ring-slate-200";
  if (r < 200) return "bg-sky-50 text-sky-700 ring-sky-200";
  if (r < 300) return "bg-brand-50 text-brand-700 ring-brand-200";
  if (r < 450) return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-rose-50 text-rose-700 ring-rose-200";
}

export const PLAY_STYLE_LABEL: Record<string, string> = {
  singles: "Singles",
  doubles: "Doubles",
  mixed: "Mixed doubles",
  all: "Plays everything",
};

/** Strip characters that would break a PostgREST `or()` filter. */
export function sanitizeSearch(q: string | undefined | null) {
  return (q ?? "").replace(/[,()*%\\]/g, " ").trim().slice(0, 60);
}

/** A check-in counts as "on court now" for this long. */
export const ACTIVE_CHECKIN_HOURS = 3;
export function activeSince() {
  return new Date(Date.now() - ACTIVE_CHECKIN_HOURS * 60 * 60 * 1000).toISOString();
}

export function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
