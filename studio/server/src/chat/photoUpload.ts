import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/** Photos Ben sends from the chat popup: checked, stripped of their metadata, saved where the agents can read them. */

/** Biggest photo accepted, after the browser shrank it (an iPhone original is far larger). */
export const MAX_PHOTO_BYTES = 4_000_000;
/** A photo's JSON body (base64 is a third bigger than the bytes). */
export const PHOTO_BODY_LIMIT = Math.ceil(MAX_PHOTO_BYTES * 1.4) + 1000;
/** Where unsorted photos land, under `photos-clients/` (folder not pushed to GitHub). */
export const PHOTO_INBOX = '_a-classer';

export type PhotoKind = 'jpg' | 'png';

/** The real format, from the first bytes (the file name and the declared type are not trusted). */
export function detectPhoto(buf: Buffer): PhotoKind | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 8 && buf[0] === 0x89 && buf.toString('latin1', 1, 4) === 'PNG') return 'png';
  return null;
}

/** JPEG: drops EXIF (GPS position, device, date), XMP and comments; keeps the picture. */
export function stripJpeg(buf: Buffer): Buffer {
  const out: Buffer[] = [buf.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff) break;
    const marker = buf[i + 1] as number;
    if (marker === 0xff) {
      i += 1;
      continue;
    }
    if (marker === 0xda) break; // start of the picture data: the rest is kept as is
    if (marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd8) || marker === 0x01) {
      out.push(buf.subarray(i, i + 2));
      i += 2;
      continue;
    }
    const length = buf.readUInt16BE(i + 2);
    const metadata = (marker >= 0xe1 && marker <= 0xef && marker !== 0xee) || marker === 0xfe;
    if (!metadata) out.push(buf.subarray(i, i + 2 + length));
    i += 2 + length;
  }
  out.push(buf.subarray(i));
  return Buffer.concat(out);
}

/** PNG: drops text, EXIF and date chunks; keeps the picture. */
export function stripPng(buf: Buffer): Buffer {
  const drop = new Set(['tEXt', 'iTXt', 'zTXt', 'eXIf', 'tIME']);
  const out: Buffer[] = [buf.subarray(0, 8)];
  let i = 8;
  while (i + 12 <= buf.length) {
    const length = buf.readUInt32BE(i);
    const type = buf.toString('latin1', i + 4, i + 8);
    const end = i + 12 + length;
    if (!drop.has(type)) out.push(buf.subarray(i, Math.min(end, buf.length)));
    i = end;
  }
  return Buffer.concat(out);
}

export type PhotoResult = { ok: true; file: string; rel: string } | { ok: false; message: string };

/** Validates, cleans and writes one photo from its base64 text. Never throws. */
export function savePhoto(photosRoot: string, base64: unknown, now: Date = new Date()): PhotoResult {
  if (typeof base64 !== 'string' || base64.length === 0) return { ok: false, message: 'Photo vide.' };
  const raw = Buffer.from(base64.replace(/^data:[^,]*,/, ''), 'base64');
  if (raw.length === 0) return { ok: false, message: 'Photo illisible.' };
  if (raw.length > MAX_PHOTO_BYTES) return { ok: false, message: 'Photo trop lourde (4 Mo au maximum).' };
  const kind = detectPhoto(raw);
  if (!kind) return { ok: false, message: 'Format non accepté : seulement JPEG ou PNG.' };
  try {
    const clean = kind === 'png' ? stripPng(raw) : stripJpeg(raw);
    const dir = path.join(photosRoot, PHOTO_INBOX);
    fs.mkdirSync(dir, { recursive: true });
    const stamp = now.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
    const name = `${stamp}-${crypto.randomBytes(2).toString('hex')}.${kind}`;
    const file = path.join(dir, name);
    fs.writeFileSync(file, clean, { flag: 'wx' });
    return { ok: true, file, rel: `photos-clients/${PHOTO_INBOX}/${name}` };
  } catch {
    return { ok: false, message: "La photo n'a pas pu être enregistrée." };
  }
}
