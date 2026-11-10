// ごはん's pictures drawn off their sheets (images.ts: a cell of a 512² thumbnail sheet or a 1152² detail sheet) into
// each box's own canvas, at the screen's pixels. A sheet is fetched once (its bytes kept, the last few dozen), decoded
// with createImageBitmap (off the main thread where the browser can), each of its cells drawn, and the decoded sheet
// let go of a moment after its last draw. An <img> of the sheet held the whole sheet decoded while its row showed: a
// search's 24 rows held 10-15 sheets (~1 MB each), the amount's one picture a 1152² sheet (5.3 MB); now a row's box
// holds its 128² canvas (64 KB), the amount's 104 px one 312² (0.4 MB) (docs/ops/perf.md).
import type { FoodImg } from './images.ts';

/** A decoded sheet is kept this long after its last draw (the next keystroke's rows, the amount's after its row's). */
const KEEP_MS = 1500;
/** Sheets' bytes kept (WebP, 25-100 KB each), the least recently used out. */
const BYTES_MAX = 40;

const bytes = new Map<string, Promise<Blob>>();
/** The latest draw asked of each canvas: one still waiting for its sheet when a newer one is asked draws nothing (a
 *  reused row's picture changed, a plate's tiles then its pictures). */
const wanted = new WeakMap<HTMLCanvasElement, object>();
/** This draw is the canvas's latest from now on; whether it still is (checked after each wait). */
function ask(canvas: HTMLCanvasElement): () => boolean {
  const me = {};
  wanted.set(canvas, me);
  return () => wanted.get(canvas) === me;
}
const decoded = new Map<string, { p: Promise<CanvasImageSource & { close?: () => void }>; users: number; timer: ReturnType<typeof setTimeout> | 0 }>();

function blobOf(url: string): Promise<Blob> {
  let p = bytes.get(url);
  if (p) bytes.delete(url); // (to the end: the most recent)
  else {
    p = fetch(url).then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`${url}: ${r.status}`))));
    p.catch(() => bytes.get(url) === p && bytes.delete(url));
  }
  bytes.set(url, p);
  while (bytes.size > BYTES_MAX) bytes.delete(bytes.keys().next().value!);
  return p;
}

/** A sheet's pixels (no createImageBitmap: an image element's, decoded). */
async function decode(blob: Blob): Promise<CanvasImageSource & { close?: () => void }> {
  if (typeof createImageBitmap === 'function') return createImageBitmap(blob);
  const im = new Image(), u = URL.createObjectURL(blob);
  im.src = u;
  try {
    await im.decode();
  } finally {
    URL.revokeObjectURL(u);
  }
  return im;
}

function take(url: string) {
  let d = decoded.get(url);
  if (!d) {
    d = { p: blobOf(url).then(decode), users: 0, timer: 0 };
    decoded.set(url, d);
    const mine = d;
    d.p.catch(() => decoded.get(url) === mine && decoded.delete(url));
  }
  if (d.timer) clearTimeout(d.timer);
  d.timer = 0;
  d.users++;
  return d;
}
function release(url: string, d: NonNullable<ReturnType<typeof decoded.get>>) {
  if (--d.users > 0 || decoded.get(url) !== d) return;
  d.timer = setTimeout(() => {
    if (d.users > 0 || decoded.get(url) !== d) return;
    decoded.delete(url);
    void d.p.then((s) => s.close?.(), () => {});
  }, KEEP_MS);
}

/** Draw `cell` into `canvas`, for a box of `px` CSS px: at the screen's pixels, never more than the cell's own (a 128 px
 *  cell in a 48 px box at 3x is scaled up by the page, as the <img> was). Rejects when the sheet can't be had
 *  (FoodThumb: the tile again). */
export async function drawCell(canvas: HTMLCanvasElement, cell: FoodImg, px: number): Promise<void> {
  const latest = ask(canvas);
  const d = take(cell.url);
  try {
    const src = await d.p;
    if (!latest()) return;
    const n = Math.max(1, Math.min(cell.size, Math.round(px * (globalThis.devicePixelRatio || 1))));
    if (canvas.width !== n) canvas.width = canvas.height = n;
    const g = canvas.getContext('2d');
    if (!g) throw new Error('no 2d context');
    g.imageSmoothingQuality = 'high';
    g.clearRect(0, 0, n, n);
    g.drawImage(src, cell.x, cell.y, cell.size, cell.size, 0, 0, n, n);
  } finally {
    release(cell.url, d);
  }
}

/** One cell of a recipe's picture box (drawPlate): its category's tile (its tint, its glyph's path on a 24 × 24 grid,
 *  in `ink`), and the ingredient's picture over it when it has one (the tile when its sheet can't be had). */
export type PlateCell = { tint: string; glyph: string; ink: string; img?: FoodImg | null };
/** A plate's tile tint by night: the box's (FoodThumb's CSS: 78 % of it over the night's navy, #1F2A5E), as the canvas
 *  holds it under the night's `brightness(.85)` on pictures, so it shows as a plain tile's. */
export const nightTint = (hex: string): string =>
  `#${[1, 3, 5].map((i) => Math.min(255, Math.round((parseInt(hex.slice(i, i + 2), 16) * 0.78 + parseInt('1F2A5E'.slice(i - 1, i + 1), 16) * 0.22) / 0.85)).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
/** Each layout's rectangles in a unit box (x, y, w, h): 1 whole, 2 halves, 3 a half and two quarters, 4 a 2 × 2. */
const LAYOUT: [number, number, number, number][][] = [
  [[0, 0, 1, 1]],
  [[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]],
  [[0, 0, 0.5, 1], [0.5, 0, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
  [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]]
];
/** Rectangles of a box of `n` px for `k` cells, a `gap` between them (whole pixels, nothing lost at the edges). */
export function plateRects(k: number, n: number, gap: number): [number, number, number, number][] {
  const half = Math.round((n - gap) / 2), at = (v: number) => (v === 0 ? 0 : v === 0.5 ? half + gap : n);
  return (LAYOUT[Math.min(k, LAYOUT.length) - 1] ?? []).map(([x, y, w, h]) => {
    const x0 = at(x), y0 = at(y), x1 = w === 1 ? n : x === 0 ? half : n, y1 = h === 1 ? n : y === 0 ? half : n;
    return [x0, y0, x1 - x0, y1 - y0];
  });
}
/** A picture in a cell of several is zoomed in this much (the generated pictures sit on paper with a margin: at a
 *  quarter of a 40 px box the food itself would be a few px). */
const ZOOM = 1.35;
/** Plates drawn, kept to draw again at once (a row scrolled back, the search re-rendered): the last few dozen. */
const PLATES_MAX = 48;
const plates = new Map<string, Promise<{ src: CanvasImageSource; whole: boolean }>>();
const newCanvas = (n: number): HTMLCanvasElement | null => {
  const c = globalThis.document?.createElement('canvas');
  if (c) c.width = c.height = n;
  return c ?? null;
};

/** Draw a recipe's picture box (`cells`: FoodThumb's plate, at most 4) into `canvas` for a box of `px` CSS px, at the
 *  screen's pixels: each picture's cell, zoomed and cut to its rectangle, each tile its tint and glyph, a gap between
 *  them (the box's own tint shows through). Kept by what it holds (PLATES_MAX), so a row drawn again costs one
 *  drawImage; one with a picture missing (its sheet failed: its tile instead) isn't kept, so the next draw asks again.
 *  Rejects only with no canvas (FoodThumb: the tile again). */
export async function drawPlate(canvas: HTMLCanvasElement, cells: readonly PlateCell[], px: number): Promise<void> {
  const latest = ask(canvas);
  const n = Math.max(1, Math.round(px * (globalThis.devicePixelRatio || 1)));
  const key = `${n}|${JSON.stringify(cells)}`;
  let p = plates.get(key);
  if (p) plates.delete(key);
  else {
    p = paintPlate(cells, n);
    p.catch(() => plates.get(key) === p && plates.delete(key));
  }
  plates.set(key, p);
  while (plates.size > PLATES_MAX) plates.delete(plates.keys().next().value!);
  const { src, whole } = await p;
  if (!whole && plates.get(key) === p) plates.delete(key);
  if (!latest()) return;
  if (canvas.width !== n) canvas.width = canvas.height = n;
  const g = canvas.getContext('2d');
  if (!g) throw new Error('no 2d context');
  g.clearRect(0, 0, n, n);
  g.drawImage(src, 0, 0);
}
async function paintPlate(cells: readonly PlateCell[], n: number): Promise<{ src: CanvasImageSource; whole: boolean }> {
  const c = newCanvas(n);
  if (!c) throw new Error('no canvas');
  const g = c.getContext('2d');
  if (!g) throw new Error('no 2d context');
  const k = Math.min(cells.length, LAYOUT.length);
  const rects = plateRects(k, n, k > 1 ? Math.max(1, Math.round(n * 0.04)) : 0);
  const sheets = cells.slice(0, k).map((x) => (x.img ? { url: x.img.url, d: take(x.img.url) } : null));
  let whole = true;
  try {
    const srcs = (await Promise.allSettled(sheets.map((s) => s?.d.p))).map((r) => (r.status === 'fulfilled' ? r.value : ((whole = false), undefined)));
    g.imageSmoothingQuality = 'high';
    cells.slice(0, k).forEach((x, i) => {
      const [rx, ry, rw, rh] = rects[i];
      if (x.img && srcs[i]) {
        // the cell's middle, as wide as the rectangle's shape (a half: a tall strip), zoomed in with several
        const z = k > 1 ? ZOOM : 1, ch = x.img.size / z, cw = Math.min(x.img.size, (ch * rw) / rh);
        g.drawImage(srcs[i], x.img.x + (x.img.size - cw) / 2, x.img.y + (x.img.size - ch) / 2, cw, ch, rx, ry, rw, rh);
        return;
      }
      g.fillStyle = x.tint;
      g.fillRect(rx, ry, rw, rh);
      const s = Math.min(rw, rh) * 0.6;
      g.save();
      g.translate(rx + (rw - s) / 2, ry + (rh - s) / 2);
      g.scale(s / 24, s / 24);
      g.strokeStyle = x.ink;
      g.lineWidth = 2;
      g.lineCap = g.lineJoin = 'round';
      g.stroke(new Path2D(x.glyph));
      g.restore();
    });
  } finally {
    sheets.forEach((s) => s && release(s.url, s.d));
  }
  return { src: c, whole };
}

/** Tests: what's held (decoded sheets, sheets' bytes). */
export const held = (): { decoded: number; bytes: number; plates: number } => ({ decoded: decoded.size, bytes: bytes.size, plates: plates.size });
