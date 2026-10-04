/**
 * Image URLs saved to the database must point at the uploader's own folder in this
 * project's public "media" bucket. This stops people from saving arbitrary links
 * (tracking pixels, offensive hot-links, etc.) by calling the API directly.
 */
export function isOwnMediaUrl(url: string | null | undefined, userId: string) {
  if (!url) return true;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return false;
  const prefix = `${base.replace(/\/+$/, "")}/storage/v1/object/public/media/${userId}/`;
  return url.startsWith(prefix) && !url.slice(prefix.length).includes("/") && !url.includes("..");
}
