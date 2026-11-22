// The places' markers drawn on a canvas for MapLibre's addImage (docs/places.md "Map"): a badge in its family's shape
// and colour (circle, diamond, square) with a cream rim, a brown hairline and its glyph in the app's font; the chosen
// one bigger with a yuzu ring; the long-pressed point's yuzu pin; the trail map's ink-brown rounded squares. Drawn at
// twice the size (pixelRatio 2). DOM only (the engines' chunks).
import type { PlaceCat } from '#lib/contract/places.ts';
import { CAT_STYLE, type Shape } from '#lib/places/cats.ts';
import { C } from './colors.ts';

export const PR = 2;
type Img = { width: number; height: number; data: Uint8ClampedArray };
const FONT = '"Zen Maru Gothic", "Hiragino Maru Gothic ProN", sans-serif';

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const cv = document.createElement('canvas');
  cv.width = w * PR;
  cv.height = h * PR;
  const g = cv.getContext('2d')!;
  g.scale(PR, PR);
  return [cv, g];
}
const img = (cv: HTMLCanvasElement): Img => ({ width: cv.width, height: cv.height, data: cv.getContext('2d')!.getImageData(0, 0, cv.width, cv.height).data });

function path(g: CanvasRenderingContext2D, shape: Shape, cx: number, cy: number, r: number): void {
  g.beginPath();
  if (shape === 'circle') g.arc(cx, cy, r, 0, Math.PI * 2);
  else if (shape === 'square') g.roundRect(cx - r * 0.9, cy - r * 0.9, r * 1.8, r * 1.8, r * 0.38);
  else {
    // a diamond with soft corners
    const k = r * 1.08, s = r * 0.22;
    g.moveTo(cx, cy - k + s);
    g.quadraticCurveTo(cx, cy - k, cx + s, cy - k + s);
    g.lineTo(cx + k - s, cy - s);
    g.quadraticCurveTo(cx + k, cy, cx + k - s, cy + s);
    g.lineTo(cx + s, cy + k - s);
    g.quadraticCurveTo(cx, cy + k, cx - s, cy + k - s);
    g.lineTo(cx - k + s, cy + s);
    g.quadraticCurveTo(cx - k, cy, cx - k + s, cy - s);
    g.closePath();
  }
}

function glyph(g: CanvasRenderingContext2D, ch: string, cx: number, cy: number, px: number, color: string): void {
  g.fillStyle = color;
  g.font = `700 ${px}px ${FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(ch, cx, cy + px * 0.06);
}

/** A badge `size` px across (22, the chosen one 28 with its yuzu ring). */
export function badge(cat: PlaceCat, size: number, sel = false): Img {
  const s = CAT_STYLE[cat], pad = sel ? 4 : 2, W = size + pad * 2;
  const [cv, g] = canvas(W, W);
  const c = W / 2, r = size / 2 - 1.5;
  if (sel) {
    path(g, s.shape, c, c, r + 3.5);
    g.fillStyle = C.yuzu;
    g.fill();
    g.lineWidth = 1;
    g.strokeStyle = C.edge;
    g.stroke();
  }
  path(g, s.shape, c, c, r + 1);
  g.fillStyle = C.edge;
  g.fill();
  path(g, s.shape, c, c, r);
  g.fillStyle = C.cream;
  g.fill();
  path(g, s.shape, c, c, r - 1.8);
  g.fillStyle = s.fill;
  g.fill();
  glyph(g, s.glyph, c, c, size * (s.shape === 'diamond' ? 0.46 : 0.52), s.ink);
  return img(cv);
}

/** The long-pressed point: a yuzu drop with a brown edge, its tip at the bottom. */
export function dropPin(): Img {
  const [cv, g] = canvas(26, 34);
  g.beginPath();
  g.moveTo(13, 33);
  g.bezierCurveTo(9, 26, 2, 20, 2, 12.5);
  g.arc(13, 12.5, 11, Math.PI, 0);
  g.bezierCurveTo(24, 20, 17, 26, 13, 33);
  g.closePath();
  g.fillStyle = C.yuzu;
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = C.edge;
  g.stroke();
  g.beginPath();
  g.arc(13, 12.5, 4, 0, Math.PI * 2);
  g.fillStyle = C.edge;
  g.fill();
  return img(cv);
}

/** The trail map's: a 16 px ink-brown rounded square, a cream rim, a cream glyph. */
export function trailBadge(cat: PlaceCat): Img {
  const W = 18;
  const [cv, g] = canvas(W, W);
  g.beginPath();
  g.roundRect(1, 1, 16, 16, 4.5);
  g.fillStyle = C.cream;
  g.fill();
  g.beginPath();
  g.roundRect(2.6, 2.6, 12.8, 12.8, 3.2);
  g.fillStyle = C.ink;
  g.fill();
  glyph(g, CAT_STYLE[cat].glyph, 9, 9, 9, C.cream);
  return img(cv);
}

/** The app's font in for the glyphs before they are drawn (a second at most: a canvas draws in a fallback face). */
export async function glyphsReady(): Promise<void> {
  const text = Object.values(CAT_STYLE).map((s) => s.glyph).join('');
  await Promise.race([document.fonts?.load(`700 12px "Zen Maru Gothic"`, text).catch(() => {}), new Promise((r) => setTimeout(r, 1000))]);
}
