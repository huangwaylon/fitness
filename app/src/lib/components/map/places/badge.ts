// A saved place's square on the non-places maps (docs/places.md "Map", docs/hiking.md "Saved places"): a 16 px
// ink-brown rounded square with a cream rim and its family's glyph in cream; the plain square (no glyph: the far
// zooms); the chosen one's yuzu ring with a brown hairline. Drawn at twice the size (gl-images PR). DOM only.
import type { PlaceCat } from '#lib/contract/places.ts';
import { CAT_STYLE } from '#lib/places/cats.ts';
import { canvasImage, type Img } from '../gl-images.ts';
import { C } from '../theme.ts';

/** The glyphs' characters (glyphsReady's text). */
export const CAT_GLYPHS = Object.values(CAT_STYLE).map((s) => s.glyph).join('');
const FONT = '"Zen Maru Gothic", "Hiragino Maru Gothic ProN", sans-serif';

/** A glyph centred on (cx, cy), `px` tall, in the app's font. */
export function drawGlyph(g: CanvasRenderingContext2D, ch: string, cx: number, cy: number, px: number, color: string): void {
  g.fillStyle = color;
  g.font = `700 ${px}px ${FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(ch, cx, cy + px * 0.06);
}

/** The square's images by id: `tp-<cat>` (with its glyph), `tp-<cat>-sel` (ringed: layer.ts builds both), and this,
 *  the plain one. */
export const PLAIN_SQUARE = 'tp-sq';

/** The 16 px square (18 with its rim) about (c, c); `cat` null: no glyph. */
function square(g: CanvasRenderingContext2D, c: number, cat: PlaceCat | null): void {
  g.beginPath();
  g.roundRect(c - 8, c - 8, 16, 16, 4.5);
  g.fillStyle = C.cream;
  g.fill();
  g.beginPath();
  g.roundRect(c - 6.4, c - 6.4, 12.8, 12.8, 3.2);
  g.fillStyle = C.ink;
  g.fill();
  if (cat) drawGlyph(g, CAT_STYLE[cat].glyph, c, c, 9, C.cream);
}

/** The trail map's square: 18 px across (16 and the rim's), its glyph unless `cat` is null; `sel` ringed in yuzu (26). */
export function trailBadge(cat: PlaceCat | null, sel = false): Img {
  const W = sel ? 26 : 18;
  return canvasImage(W, W, (g) => {
    if (sel) {
      g.beginPath();
      g.roundRect(1, 1, 24, 24, 7);
      g.fillStyle = C.yuzu;
      g.fill();
      g.lineWidth = 1;
      g.strokeStyle = C.edge;
      g.stroke();
    }
    square(g, W / 2, cat);
  });
}
