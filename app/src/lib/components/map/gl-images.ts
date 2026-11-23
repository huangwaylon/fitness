// The maps' canvas-drawn images (docs/design.md "Maps"): a canvas at twice the size (pixelRatio PR) for addImage, the
// app's font in before a glyph is drawn, and images drawn only as the map first asks for one (a resolver per map; each
// caller's ids its own). DOM only (the engines' chunks); no MapLibre value imported.
import type { Map as GLMap } from 'maplibre-gl';

const PR = 2;
export type Img = { width: number; height: number; data: Uint8ClampedArray };

/** A `w`×`h` px image drawn by `draw` on a canvas scaled by PR (draw in px). */
export function canvasImage(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): Img {
  const cv = document.createElement('canvas');
  cv.width = Math.round(w * PR);
  cv.height = Math.round(h * PR);
  const g = cv.getContext('2d')!;
  g.scale(PR, PR);
  draw(g);
  return { width: cv.width, height: cv.height, data: g.getImageData(0, 0, cv.width, cv.height).data };
}

/** The app's font in for `text`'s glyphs before they are drawn (a second at most: a canvas draws in a fallback face). */
async function glyphsReady(text: string): Promise<void> {
  await Promise.race([document.fonts?.load(`700 12px "Zen Maru Gothic"`, text).catch(() => {}), new Promise((r) => setTimeout(r, 1000))]);
}

type Draw = (id: string) => (() => Img) | null;
const resolvers = new WeakMap<GLMap, Set<{ draw: Draw; text: string; glyphs: Promise<void> | null }>>();

/** Images drawn as the map first asks for each: `draw(id)` is null for an id not the caller's, else the image's maker,
 *  run once `text`'s glyphs are in (nothing to wait for: ''). Several callers share the map's one resolver. Returns
 *  the caller's teardown (an answer after it is dropped). */
export function lazyImages(map: GLMap, draw: Draw, text = ''): () => void {
  let set = resolvers.get(map);
  if (!set) {
    const mine = new Set<{ draw: Draw; text: string; glyphs: Promise<void> | null }>();
    resolvers.set(map, (set = mine));
    map.setMissingStyleImageResolver(async (id) => {
      for (const r of mine) {
        const make = r.draw(id);
        if (!make) continue;
        if (r.text) await (r.glyphs ??= glyphsReady(r.text));
        // (dropped, or the style gone with a lost WebGL context while the glyphs came: gl.ts styleLife)
        if (mine.has(r) && map.style && !map.hasImage(id)) map.addImage(id, make(), { pixelRatio: PR });
        return;
      }
    });
  }
  const r = { draw, text, glyphs: null };
  set.add(r);
  return () => void set.delete(r);
}
