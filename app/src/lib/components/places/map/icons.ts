// The places' markers drawn on a canvas for MapLibre's addImage (docs/places.md "Map"): a badge in its family's shape
// and colour (circle, diamond, square) with a cream rim, a brown hairline and its glyph in the app's font; the chosen
// one bigger with a yuzu ring; the long-pressed point's yuzu pin (the other maps' squares: map/places/badge.ts). Drawn
// at twice the size (map/gl-images.ts PR). DOM only (the engine's chunk).
import type { PlaceCat } from '#lib/contract/places.ts';
import { CAT_STYLE, type Shape } from '#lib/places/cats.ts';
import { canvasImage, type Img } from '../../map/gl-images.ts';
import { drawGlyph } from '../../map/places/badge.ts';
import { C } from '../../map/theme.ts';

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

/** A badge `size` px across (22, the chosen one 28 with its yuzu ring). */
export function badge(cat: PlaceCat, size: number, sel = false): Img {
  const s = CAT_STYLE[cat], pad = sel ? 4 : 2, W = size + pad * 2;
  const c = W / 2, r = size / 2 - 1.5;
  return canvasImage(W, W, (g) => {
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
    drawGlyph(g, s.glyph, c, c, size * (s.shape === 'diamond' ? 0.46 : 0.52), s.ink);
  });
}

/** The long-pressed point: a yuzu drop with a brown edge, its tip at the bottom. */
export function dropPin(): Img {
  return canvasImage(26, 34, (g) => {
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
  });
}
