// Pictures for the tests (src/img.ts reads only their headers): a JPEG's or a WebP's segments around `pad` bytes of
// stand-in data, so a test sets the size and the metadata it needs.

const seg = (m: number, body: number[]): number[] => [0xff, m, ((body.length + 2) >> 8) & 0xff, (body.length + 2) & 0xff, ...body];
const str = (s: string): number[] => [...s].map((c) => c.charCodeAt(0));
const le16 = (n: number): number[] => [n & 0xff, (n >> 8) & 0xff];
const le24 = (n: number): number[] => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff];
const le32 = (n: number): number[] => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff];
const filler = (n: number, seed: number): number[] => Array.from({ length: n }, (_, i) => (i * 31 + seed) % 251);

/** A JPEG of `w`×`h` (SOF `sof`), with an APP1 (Exif) or APP13 segment when asked. */
export function jpeg(o: { w?: number; h?: number; sof?: number; app1?: boolean; app13?: boolean; pad?: number; seed?: number } = {}): Uint8Array {
  const { w = 384, h = 384, sof = 0xc0, pad = 2000, seed = 1 } = o;
  return Uint8Array.from([
    0xff, 0xd8,
    ...seg(0xe0, [...str('JFIF'), 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]),
    ...(o.app1 ? seg(0xe1, [...str('Exif'), 0, 0, ...filler(40, 7)]) : []),
    ...(o.app13 ? seg(0xed, [...str('Photoshop 3.0'), 0, ...filler(20, 3)]) : []),
    ...seg(0xdb, filler(65, 2)),
    ...seg(sof, [8, (h >> 8) & 0xff, h & 0xff, (w >> 8) & 0xff, w & 0xff, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]),
    ...seg(0xda, [3, 1, 0, 2, 0x11, 3, 0x11, 0, 0x3f, 0]),
    ...filler(pad, seed).map((x) => (x === 0xff ? 0xfe : x)),
    0xff, 0xd9
  ]);
}

/** A WebP of `w`×`h`: a lossy (`VP8 `) or lossless (`VP8L`) bitstream, in a VP8X container with flags and chunks when asked. */
export function webp(o: { w?: number; h?: number; kind?: 'VP8 ' | 'VP8L'; vp8x?: number; chunk?: string; pad?: number } = {}): Uint8Array {
  const { w = 384, h = 384, kind = 'VP8 ', pad = 1000 } = o;
  const chunk = (tag: string, data: number[]): number[] => [...str(tag), ...le32(data.length), ...data, ...(data.length & 1 ? [0] : [])];
  const bits = kind === 'VP8 '
    ? chunk('VP8 ', [0x10, 0x02, 0x00, 0x9d, 0x01, 0x2a, ...le16(w), ...le16(h), ...filler(pad, 5)])
    : chunk('VP8L', [0x2f, ...le32(((w - 1) & 0x3fff) | (((h - 1) & 0x3fff) << 14)), ...filler(pad, 9)]);
  const body = [
    ...(o.vp8x !== undefined ? chunk('VP8X', [o.vp8x, 0, 0, 0, ...le24(w - 1), ...le24(h - 1)]) : []),
    ...bits,
    ...(o.chunk ? chunk(o.chunk, filler(30, 4)) : [])
  ];
  return Uint8Array.from([...str('RIFF'), ...le32(body.length + 4), ...str('WEBP'), ...body]);
}

/** The id the record names a picture by (img.ts imgId), as the phone computes it. */
export async function idOf(b: Uint8Array): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', b as Uint8Array<ArrayBuffer>));
  return Array.from(d.subarray(0, 16), (x) => x.toString(16).padStart(2, '0')).join('');
}
