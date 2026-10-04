export const LINK_EXPIRED_MESSAGE =
  "This confirmation link has expired or was already used. Try logging in — if your email still isn't confirmed, you can get a new link.";

export const NOTICES: Record<string, string> = {
  confirmed: "Your email is confirmed! Log in to start playing.",
  deleted: "Your account and data have been deleted. Thanks for playing with Pickl.",
};

/** Only allow same-site relative paths as redirect targets. */
export function safeNextPath(value: unknown, fallback = "/feed") {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}
