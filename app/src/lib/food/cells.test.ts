// food/cells.ts: a cell drawn at the box's pixels (never more than the cell's own), one decode per sheet shared by its
// cells, the decoded sheet closed a moment after its last draw, a sheet that fails rejected.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { drawCell, held } from './cells.ts';

const calls: unknown[][] = [];
let decodes = 0, closed = 0;
const canvas = () => ({ width: 0, height: 0, getContext: () => ({ imageSmoothingQuality: '', clearRect() {}, drawImage: (...a: unknown[]) => calls.push(a) }) }) as unknown as HTMLCanvasElement;

beforeEach(() => {
  vi.useFakeTimers();
  calls.length = decodes = closed = 0;
  vi.stubGlobal('devicePixelRatio', 3);
  vi.stubGlobal('fetch', async (u: string) => (u.includes('bad') ? new Response(null, { status: 404 }) : new Response(new Blob(['x']))));
  vi.stubGlobal('createImageBitmap', async () => (decodes++, { close: () => closed++ }));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('drawCell', () => {
  it('draws at the screen’s pixels up to the cell’s size, one decode a sheet, closed after its last draw', async () => {
    const a = canvas(), b = canvas();
    await Promise.all([drawCell(a, { url: '/t-1.webp', x: 128, y: 0, size: 128 }, 48), drawCell(b, { url: '/t-1.webp', x: 0, y: 256, size: 384 }, 104)]);
    expect([a.width, b.width]).toEqual([128, 312]);
    expect(calls.map((c) => c.slice(1))).toEqual([[128, 0, 128, 128, 0, 0, 128, 128], [0, 256, 384, 384, 0, 0, 312, 312]]);
    expect([decodes, held().decoded]).toEqual([1, 1]);
    await vi.advanceTimersByTimeAsync(2000);
    expect([closed, held().decoded]).toEqual([1, 0]);
  });

  it('rejects a sheet that can’t be had, and holds nothing for it', async () => {
    await expect(drawCell(canvas(), { url: '/bad.webp', x: 0, y: 0, size: 128 }, 48)).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(2000);
    expect(held().decoded).toBe(0);
  });
});
