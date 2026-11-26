export type ImageKind = { mime: "image/jpeg" | "image/png" | "image/webp"; ext: "jpg" | "png" | "webp" };
/** Identify an image by its first bytes, never by the file name or the browser's claim. */
export function detectImage(bytes: Uint8Array): ImageKind | null {
  if (bytes.length < 12) return null;
  const is = (offset: number, ...values: number[]) =>
    values.every((v, i) => bytes[offset + i] === v);
  if (is(0, 0xff, 0xd8, 0xff)) return { mime: "image/jpeg", ext: "jpg" };
  if (is(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))
    return { mime: "image/png", ext: "png" };
  // "RIFF" .... "WEBP"
  if (is(0, 0x52, 0x49, 0x46, 0x46) && is(8, 0x57, 0x45, 0x42, 0x50))
    return { mime: "image/webp", ext: "webp" };
  return null;
}
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
