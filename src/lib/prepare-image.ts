"use client";

const MAX_SIDE = 2048; // long edge, like Facebook's "high quality" uploads
const KEEP_IF_UNDER = 1.5 * 1024 * 1024; // small, already-web-friendly files are uploaded untouched
const WEB_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  // createImageBitmap applies the photo's EXIF rotation, so phone pictures come out the right way up.
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      /* fall through to <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Get a post photo ready for upload without cropping it: the whole picture is kept at its
 * original shape. Big photos are scaled down (long edge ≤ 2048px) so they upload fast and stay
 * under the 5 MB limit; small JPG/PNG/WebP files and GIFs (to keep animation) are left as they are.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.type === "image/gif") return file;

  let decoded;
  try {
    decoded = await decode(file);
  } catch {
    throw new Error("That image couldn't be opened. Try a JPG or PNG.");
  }

  const { source, width, height, close } = decoded;
  try {
    const longest = Math.max(width, height);
    if (WEB_TYPES.includes(file.type) && longest <= MAX_SIDE && file.size <= KEEP_IF_UNDER) return file;

    const scale = Math.min(1, MAX_SIDE / longest);
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, w, h);

    // PNG/WebP may have transparency, so keep that as WebP; everything else becomes JPEG.
    const type = file.type === "image/png" || file.type === "image/webp" ? "image/webp" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.88));
    if (!blob) return file;

    // Some browsers (older Safari) can't make WebP and hand back a PNG instead — name it by what we got.
    const outType = blob.type || type;
    const ext = outType === "image/webp" ? "webp" : outType === "image/png" ? "png" : "jpg";
    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.${ext}`, { type: outType });
  } finally {
    close();
  }
}
