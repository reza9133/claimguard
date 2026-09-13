/**
 * Reads a browser File into a Uint8Array so it can be passed directly as the
 * contract's `photo: bytes` argument. ClaimGuard never persists this data in
 * contract storage — it's used transiently, inside the same transaction, for
 * AI evaluation — so there is no separate "upload" step; the bytes travel as
 * part of the file_claim / appeal_claim call itself.
 */
export async function fileToBytes(file: File): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}

const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // 4 MB — keep transactions light

export function validatePhotoFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Please choose an image file.";
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return "Image is too large — please use one under 4 MB.";
  }
  return null;
}
