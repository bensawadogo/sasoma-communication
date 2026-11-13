/** Photos sent from the chat popup: shrunk and re-encoded in the browser before they leave the device. */
import { fitSize } from './photoSize.js';

const PHOTO_QUALITY = 0.85;
/** A source picture is refused above this size before any decoding (a phone original is usually under 12 MB). */
const SOURCE_MAX_BYTES = 30_000_000;

/**
 * The photo as base64 JPEG (no "data:" prefix). Re-drawing it on a canvas also drops everything the file
 * carried besides the picture: GPS position, device, date. The server strips again, as a second line.
 */
export async function shrinkPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error("Ce fichier n'est pas une image.");
  if (file.size > SOURCE_MAX_BYTES) throw new Error('Photo trop lourde.');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error("Cette photo ne peut pas être lue ici (format non pris en charge). Envoie un JPEG ou un PNG.");
  }
  try {
    const { width, height } = fitSize(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Photo illisible.');
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', PHOTO_QUALITY));
    if (!blob) throw new Error('Photo illisible.');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    return btoa(binary);
  } finally {
    bitmap.close();
  }
}
