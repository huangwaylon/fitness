// The trip map's and a trail's MapLibre parts in common (./engine.ts, hiking/map/engine.ts): what the map shows
// (watchMode), and the map let go of entirely (removeMap) (the trip map's and a trail's destroy: ./engine.ts, hiking/map/engine.ts).
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

export type EngineMode = 'ready' | 'offline' | 'lost';

/** What the map shows, told to `mode` once its style is in (the returned `loaded`, from its load handler): 'ready' (the
 *  basemap's tiles coming), 'offline' (none came, or failing since the last one in: offline, the TileJSON or tiles refused),
 *  'lost' (no WebGL context). The basemap failing is shown (the map's note), not logged; any other error is logged. */
export function watchMode(map: GLMap, base: string, mode: (m: EngineMode) => void): () => void {
  let loaded = false, lost = false;
  let tiles: 'wait' | 'ok' | 'down' = 'wait';
  const report = () => loaded && mode(lost ? 'lost' : tiles === 'down' ? 'offline' : 'ready');
  map.on('data', (e) => {
    const d = e as { dataType?: string; sourceId?: string; tile?: unknown };
    if (d.dataType === 'source' && d.sourceId === base && d.tile && tiles !== 'ok') ((tiles = 'ok'), report());
  });
  map.on('error', (e) => {
    if ((e as { sourceId?: string }).sourceId === base) {
      if (tiles !== 'down') ((tiles = 'down'), report());
    } else console.error(e.error);
  });
  map.on('webglcontextlost', () => ((lost = true), report()));
  map.on('webglcontextrestored', () => ((lost = false), report()));
  return () => ((loaded = true), report());
}
