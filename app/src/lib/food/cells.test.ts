// food/cells.ts: a cell drawn at the box's pixels (never more than the cell's own), one decode per sheet shared by its
// cells, the decoded sheet closed a moment after its last draw, a sheet that fails rejected; an older draw never lands
// over a newer one; a plate's missing picture its tile.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { drawCell, drawPlate, held, nightTint, plateRects } from './cells.ts';

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

  it('an older draw still loading its sheet draws nothing over a newer one', async () => {
    const c = canvas();
    let open!: () => void;
    const slow = new Promise<void>((r) => (open = r));
    vi.stubGlobal('fetch', async (u: string) => (u.includes('slow') && (await slow), new Response(new Blob([u]))));
    const old = drawCell(c, { url: '/slow.webp', x: 0, y: 0, size: 128 }, 48);
    await drawCell(c, { url: '/t-9.webp', x: 128, y: 0, size: 128 }, 48);
    open();
    await old;
    expect(calls.map((x) => x[1])).toEqual([128]);
    await vi.advanceTimersByTimeAsync(2000); // (both sheets let go)
  });

  it('rejects a sheet that can’t be had, and holds nothing for it', async () => {
    await expect(drawCell(canvas(), { url: '/bad.webp', x: 0, y: 0, size: 128 }, 48)).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(2000);
    expect(held().decoded).toBe(0);
  });
});

describe('drawPlate: a recipe’s picture box', () => {
  it('plateRects: 1 whole, 2 halves, 3 a half and two quarters, 4 a 2 × 2, a gap between, the edges whole', () => {
    expect(plateRects(1, 120, 0)).toEqual([[0, 0, 120, 120]]);
    expect(plateRects(2, 120, 4)).toEqual([[0, 0, 58, 120], [62, 0, 58, 120]]);
    expect(plateRects(3, 120, 4)).toEqual([[0, 0, 58, 120], [62, 0, 58, 58], [62, 62, 58, 58]]);
    expect(plateRects(4, 120, 4)).toEqual([[0, 0, 58, 58], [62, 0, 58, 58], [0, 62, 58, 58], [62, 62, 58, 58]]);
  });

  it('draws each picture’s middle into its rectangle (a tile its tint), once: drawn again from what it kept', async () => {
    const made: ReturnType<typeof canvas>[] = [];
    const fills: string[] = [];
    vi.stubGlobal('Path2D', class { constructor(public d: string) {} });
    vi.stubGlobal('document', { createElement: () => {
      const c = canvas() as unknown as { getContext: () => object };
      const g = c.getContext() as Record<string, unknown>;
      c.getContext = () => Object.assign(g, { fillRect: () => fills.push(String(g.fillStyle)), save() {}, restore() {}, translate() {}, scale() {}, stroke() {} });
      made.push(c as never);
      return c;
    } });
    const tile = { tint: '#EDC3A8', glyph: 'M0 0', ink: '#000' };
    const cells = [{ ...tile, img: { url: '/t-1.webp', x: 0, y: 0, size: 128 } }, { ...tile, img: { url: '/t-2.webp', x: 128, y: 0, size: 128 } }, tile];
    const a = canvas(), b = canvas();
    await drawPlate(a, cells, 40);
    expect(a.width).toBe(120);
    expect(decodes).toBe(2); // two sheets
    expect(fills).toEqual(['#EDC3A8']);
    // the first: its 128 cell zoomed ×1.35 and cut to a tall half (58 × 120 at 3×)
    const [first] = calls.filter((c) => c.length === 9);
    const ch = 128 / 1.35, cw = (ch * 58) / 120;
    expect(first.slice(1)).toEqual([(128 - cw) / 2, (128 - ch) / 2, cw, ch, 0, 0, 58, 120]);
    await drawPlate(b, cells, 40);
    expect([made.length, decodes, held().plates]).toEqual([1, 2, 1]); // kept: no new canvas, no decode
    expect(calls.at(-1)).toEqual([made[0], 0, 0]);
  });

  it('a picture whose sheet fails: its tile in its cell, the rest drawn, not kept (asked again next time)', async () => {
    const fills: string[] = [];
    vi.stubGlobal('Path2D', class { constructor(public d: string) {} });
    vi.stubGlobal('document', { createElement: () => {
      const c = canvas() as unknown as { getContext: () => object };
      const g = c.getContext() as Record<string, unknown>;
      c.getContext = () => Object.assign(g, { fillRect: () => fills.push(String(g.fillStyle)), save() {}, restore() {}, translate() {}, scale() {}, stroke() {} });
      return c;
    } });
    const cells = [{ tint: '#C4E3A9', glyph: 'M0 0', ink: '#000', img: { url: '/t-3.webp', x: 0, y: 0, size: 128 } }, { tint: '#EDC3A8', glyph: 'M0 0', ink: '#000', img: { url: '/bad-2.webp', x: 0, y: 0, size: 128 } }];
    const before = held().plates;
    await expect(drawPlate(canvas(), cells, 40)).resolves.toBeUndefined();
    expect(fills).toEqual(['#EDC3A8']);
    expect(calls.filter((c) => c.length === 9)).toHaveLength(1); // (the good picture)
    expect(held().plates).toBe(before);
  });

  it('nightTint: the box’s night mix, brightened for the pictures’ .85 filter', () => {
    expect(nightTint('#F3E2B3')).toBe('#E7DABD');
  });
});
