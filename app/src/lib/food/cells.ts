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
  const d = take(cell.url);
  try {
    const src = await d.p;
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

/** Tests: what's held (decoded sheets, sheets' bytes). */
export const held = (): { decoded: number; bytes: number } => ({ decoded: decoded.size, bytes: bytes.size });
