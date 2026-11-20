// マイ食品's photo, made on the phone (docs/food-data.md "Pictures"; relay/src/img.ts takes only this): the picked image
// decoded by an <img> (WebKit applies its EXIF orientation), its square (centred, or slid along its long side: cropOf)
// drawn into one PHOTO_PX canvas, encoded WebP where the browser can (WebKit's canvas falls back to PNG: then JPEG at
// 0.8, at 0.65 past PHOTO_SOFT), at most PHOTO_MAX. A canvas's output carries no location, but WebKit's JPEG has an Exif
// segment of its own (APP1: its resolution, 76 bytes): every APP1 and APP13 is cut (stripJpeg), as the relay refuses
// them. Its id: the first 128 bits of its SHA-256, so the op and the picture work offline.

const PHOTO_PX = 384;
export const PHOTO_MAX = 65_536;
const PHOTO_SOFT = 48 * 1024;

/** The source's square: its short side, at `t` (0…1) along the long side (0.5: centred). */
export function cropOf(w: number, h: number, t = 0.5): { sx: number; sy: number; s: number } {
  const s = Math.min(w, h), k = Math.min(1, Math.max(0, t));
  return { sx: w > h ? Math.round((w - s) * k) : 0, sy: h > w ? Math.round((h - s) * k) : 0, s };
}

/** The bytes to keep, by the rules above, from an encoder (`type`, quality → its blob, null if none); null: none fit. */
export async function encodeWith(enc: (type: string, q: number) => Promise<Blob | null>): Promise<Blob | null> {
  const webp = await enc('image/webp', 0.8);
  if (webp?.type === 'image/webp' && webp.size <= PHOTO_MAX) return webp;
  let jpeg = await enc('image/jpeg', 0.8);
  if (jpeg && jpeg.size > PHOTO_SOFT) jpeg = await enc('image/jpeg', 0.65);
  return jpeg?.type === 'image/jpeg' && jpeg.size <= PHOTO_MAX ? jpeg : null;
}

/** A JPEG without its APP1 (Exif, XMP) and APP13 (IPTC) segments, the rest as it was; anything else as it is. */
export function stripJpeg(b: Uint8Array): Uint8Array {
  if (b[0] !== 0xff || b[1] !== 0xd8) return b;
  const keep: Uint8Array[] = [b.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= b.length && b[i] === 0xff) {
    const m = b[i + 1];
    if (m === 0xda) break;
    const end = i + 2 + ((b[i + 2] << 8) | b[i + 3]);
    if (m !== 0xe1 && m !== 0xed) keep.push(b.subarray(i, end));
    i = end;
  }
  keep.push(b.subarray(i));
  const out = new Uint8Array(keep.reduce((n, x) => n + x.length, 0));
  keep.reduce((at, x) => (out.set(x, at), at + x.length), 0);
  return out;
}

/** The picture's id (CustomOp `img`). */
export async function photoId(b: Blob): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', await b.arrayBuffer()));
  return Array.from(d.subarray(0, 16), (x) => x.toString(16).padStart(2, '0')).join('');
}

/** A picked file decoded (its oriented size), or null; `url` its object URL (the crop's preview: revoke it after). */
export async function decodePhoto(file: Blob): Promise<{ im: HTMLImageElement; w: number; h: number; url: string } | null> {
  const url = URL.createObjectURL(file), im = new Image();
  im.decoding = 'async';
  im.src = url;
  try {
    await im.decode();
  } catch {
    URL.revokeObjectURL(url);
    return null;
  }
  return im.naturalWidth && im.naturalHeight ? { im, w: im.naturalWidth, h: im.naturalHeight, url } : (URL.revokeObjectURL(url), null);
}

/** The square at `t` drawn at PHOTO_PX and encoded: its bytes and id, or null (nothing fit). */
export async function makePhoto(im: CanvasImageSource, w: number, h: number, t: number): Promise<{ blob: Blob; id: string } | null> {
  const cv = document.createElement('canvas');
  cv.width = cv.height = PHOTO_PX;
  const g = cv.getContext('2d');
  if (!g) return null;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  const { sx, sy, s } = cropOf(w, h, t);
  g.drawImage(im, sx, sy, s, s, 0, 0, PHOTO_PX, PHOTO_PX);
  const blob = await encodeWith(async (type, q) => {
    const b = await new Promise<Blob | null>((ok) => cv.toBlob(ok, type, q));
    return b?.type === 'image/jpeg' ? new Blob([stripJpeg(new Uint8Array(await b.arrayBuffer())) as Uint8Array<ArrayBuffer>], { type: 'image/jpeg' }) : b;
  });
  cv.width = cv.height = 0;
  return blob ? { blob, id: await photoId(blob) } : null;
}
