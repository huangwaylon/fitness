// マイ食品's photo, made on the phone (photo.ts): the crop's square and the encoder's choice.
import { describe, expect, it } from 'vitest';
import { cropOf, encodeWith, PHOTO_MAX, photoId, stripJpeg } from './photo.ts';

const blob = (type: string, n: number) => new Blob([new Uint8Array(n)], { type });

describe('a custom food\'s photo', () => {
  it('crops the short side\'s square, centred or slid along the long side', () => {
    expect(cropOf(4000, 3000)).toEqual({ sx: 500, sy: 0, s: 3000 });
    expect(cropOf(4000, 3000, 0)).toEqual({ sx: 0, sy: 0, s: 3000 });
    expect(cropOf(4000, 3000, 1)).toEqual({ sx: 1000, sy: 0, s: 3000 });
    expect(cropOf(3000, 4000, 0.25)).toEqual({ sx: 0, sy: 250, s: 3000 });
    expect(cropOf(500, 500, 0.9)).toEqual({ sx: 0, sy: 0, s: 500 });
    expect(cropOf(4000, 3000, 7)).toEqual({ sx: 1000, sy: 0, s: 3000 });
  });

  it('WebP where the browser encodes it; else JPEG 0.8, then 0.65 past 48 KB; nothing past 64 KB', async () => {
    const asked: string[] = [];
    const enc = (sizes: Record<string, Blob | null>) => async (type: string, q: number) => (asked.push(`${type} ${q}`), sizes[`${type} ${q}`] ?? null);
    expect((await encodeWith(enc({ 'image/webp 0.8': blob('image/webp', 30_000) })))?.type).toBe('image/webp');
    // (WebKit: webp asked, a PNG answered)
    asked.length = 0;
    expect((await encodeWith(enc({ 'image/webp 0.8': blob('image/png', 200_000), 'image/jpeg 0.8': blob('image/jpeg', 30_000) })))?.size).toBe(30_000);
    expect(asked).toEqual(['image/webp 0.8', 'image/jpeg 0.8']);
    asked.length = 0;
    expect((await encodeWith(enc({ 'image/jpeg 0.8': blob('image/jpeg', 52_000), 'image/jpeg 0.65': blob('image/jpeg', 40_000) })))?.size).toBe(40_000);
    expect(asked).toEqual(['image/webp 0.8', 'image/jpeg 0.8', 'image/jpeg 0.65']);
    expect(await encodeWith(enc({ 'image/jpeg 0.8': blob('image/jpeg', 70_000), 'image/jpeg 0.65': blob('image/jpeg', PHOTO_MAX + 1) }))).toBeNull();
    expect(await encodeWith(enc({}))).toBeNull();
  });

  it('cuts a JPEG\'s APP1 (Exif, XMP) and APP13 (IPTC) segments, the rest kept (WebKit\'s canvas JPEG has an Exif one)', () => {
    const seg = (m: number, n: number) => [0xff, m, 0, n + 2, ...Array(n).fill(m & 0x7f)];
    const head = [0xff, 0xd8, ...seg(0xe0, 4), ...seg(0xe1, 6), ...seg(0xdb, 3), ...seg(0xed, 2), ...seg(0xc0, 5)];
    const scan = [0xff, 0xda, 0, 4, 1, 2, 0xff, 0xe1, 9, 9, 0xff, 0xd9]; // (bytes after the scan: data, never segments)
    expect(Array.from(stripJpeg(Uint8Array.from([...head, ...scan])))).toEqual([0xff, 0xd8, ...seg(0xe0, 4), ...seg(0xdb, 3), ...seg(0xc0, 5), ...scan]);
    const webp = Uint8Array.from([0x52, 0x49, 0x46, 0x46]);
    expect(stripJpeg(webp)).toBe(webp);
  });

  it('its id: the first 128 bits of its SHA-256, as hex', async () => {
    expect(await photoId(new Blob([new TextEncoder().encode('abc')]))).toBe('ba7816bf8f01cfea414140de5dae2223');
  });
});
