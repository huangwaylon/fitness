// A MapLibre map let go of entirely (the trip map's and a trail's destroy: ./engine.ts, hiking/map/engine.ts).
// map.remove() alone leaves two things behind (MapLibre 6.16):
// - the style's font faces (fonts.ts: Zen Maru's slices, each a FontFace holding its woff2) stay in document.fonts:
//   remove() only detaches the style (Style._remove), and its GlyphManager, which deletes them, is destroyed only on a
//   context loss. ~19 a guide's map opened over Okinawa's labels, for the page's life (leaks.spec).
// - the last map's remove() ends the workers by aborting the page-wide dispatcher's controller with an Error made
//   inside remove(): until the next map, that Error's unformatted stack held remove()'s receivers, the whole map and its
//   WebGL context. Reading its stack formats it, which lets the frames go.
import { getGlobalDispatcher, type Map as GLMap } from 'maplibre-gl';

export function removeMap(map: GLMap): void {
  const glyphs = map.style?.glyphManager;
  map.remove(); // loses its WebGL context (WEBGL_lose_context) and empties the container
  glyphs?.destroy();
  void ((getGlobalDispatcher() as unknown as { workersAbortController?: AbortController }).workersAbortController?.signal.reason as Error | undefined)?.stack;
}
