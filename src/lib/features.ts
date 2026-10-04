/**
 * Feature switches. Flip a value to `true` to bring a section back.
 * Disabled sections are hidden from navigation AND return "404 Not Found" if visited directly.
 */
export const FEATURES = {
  /** The "Players" discovery page (/players) and links to it. */
  players: false,
} as const;
