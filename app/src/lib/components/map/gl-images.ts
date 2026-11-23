// The maps' canvas-drawn images (docs/design.md "Maps"): a canvas at twice the size (pixelRatio PR) for addImage, the
// app's font in before a glyph is drawn, and images drawn only as the map first asks for one (the map's one
// resolver). DOM only (the engines' chunks); no MapLibre value imported.
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

/** Images drawn as the map first asks for each: `draw(id)` is null for an id not ours, else the image's maker, run once
 *  `text`'s glyphs are in (nothing to wait for: ''). The map's one resolver (each map has one caller: places/map's
 *  engine, or the trip's and trail's saved-places layer). Returns the teardown (an answer after it is dropped). */
export function lazyImages(map: GLMap, draw: (id: string) => (() => Img) | null, text = ''): () => void {
  let live = true, glyphs: Promise<void> | null = null;
  map.setMissingStyleImageResolver(async (id) => {
    const make = live && draw(id);
    if (!make) return;
    if (text) await (glyphs ??= glyphsReady(text));
    // (dropped, or the style gone with a lost WebGL context while the glyphs came: gl.ts styleLife)
    if (live && map.style && !map.hasImage(id)) map.addImage(id, make(), { pixelRatio: PR });
  });
  return () => void (live = false);
}
