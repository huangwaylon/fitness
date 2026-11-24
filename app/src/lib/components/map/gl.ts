// The maps' MapLibre side in common (docs/design.md "Maps"; the trip's, a trail's and 保存した場所's engines: travel/,
// hiking/, places/map/engine.ts): one of the few modules that import MapLibre's values (vite.config.ts names its chunk
// maplibre.*). makeMap: the shared options on MapLibre's CSP-safe path (its worker a file of our own origin,
// `?worker&url` under _app/immutable/workers: no blob: worker, no eval; the basemap's tiles through the page, tiles.ts),
// the attribution bottom-left, pitch off, rotation only if asked, iOS's page pinch kept off the map. tapRouter: one
// click handler a map, the nearest feature within a fingertip across every layer asked for. fitBox, revealAbove,
// settledOf, fromUser; the location dot (locDot); what the map shows (watchMode); and the map let go of entirely (removeMap).
// map.remove() alone leaves two things behind (MapLibre 6.16):
// - the style's font faces (fonts.ts: Zen Maru's slices, each a FontFace holding its woff2) stay in document.fonts:
//   remove() only detaches the style (Style._remove), and its GlyphManager, which deletes them, is destroyed only on a
//   context loss. ~19 a guide's map opened over Okinawa's labels, for the page's life (leaks.spec).
// - the last map's remove() ends the workers by aborting the page-wide dispatcher's controller with an Error made
//   inside remove(): until the next map, that Error's unformatted stack held remove()'s receivers, the whole map and its
//   WebGL context. Reading its stack formats it, which lets the frames go.
import {
  addProtocol, AttributionControl, getGlobalDispatcher, LngLatBounds, Map as GLMap, setWorkerUrl,
  type GeoJSONSource, type LngLatBoundsLike, type MapGeoJSONFeature, type MapLibreEvent, type StyleSpecification
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// (bundled as our own worker chunk, a .js: a raw .mjs is served as application/octet-stream by some hosts, which a
// module worker under nosniff refuses)
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { swallowed } from '#lib/quiet.ts';
import { log } from '#lib/sync/log.ts';
import { loadViaPage, VIA, viaPage } from './tiles.ts';
import { haloRadius, locData, LOC_LAYERS, TILE_ORIGIN, ZOOM } from './style.ts';
import type { Fix } from './types.ts';
import { nearestHit, type Px } from './hits.ts';

export interface MakeMap {
  style: StyleSpecification;
  /** OpenFreeMap's tiles fetched by the page (tiles.ts: the service worker keeps them); off for the trail's raster topo. */
  via?: boolean;
  /** The zoom range (default ZOOM, the basemap's). */
  zoom?: { min: number; max: number };
  /** A symbol's fade in and out (ms; default 120: the basemap's labels as the map moves). */
  fade?: number;
  /** Two-finger rotation (the trail's); drag-rotate, keyboard rotation and pitch are always off. */
  rotate?: boolean;
  /** The first view: a centre and zoom, or a box fitted. */
  view: { center: [number, number]; zoom: number } | { bounds: LngLatBoundsLike; padding?: number; maxZoom?: number };
}

let protocol = false;

/** A map in `el` with the shared options (above). */
export function makeMap(el: HTMLElement, o: MakeMap): GLMap {
  setWorkerUrl(workerUrl);
  if (o.via && !protocol) ((protocol = true), addProtocol(VIA, loadViaPage()));
  const z = o.zoom ?? ZOOM;
  const v = o.view;
  const map = new GLMap({
    container: el,
    style: o.style,
    attributionControl: false,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    maxPitch: 0,
    minZoom: z.min,
    maxZoom: z.max,
    renderWorldCopies: false,
    fadeDuration: o.fade ?? 120,
    validateStyle: import.meta.env.DEV,
    ...(o.via ? { transformRequest: viaPage(TILE_ORIGIN) } : {}),
    ...('bounds' in v ? { bounds: v.bounds, fitBoundsOptions: { padding: v.padding ?? 56, maxZoom: v.maxZoom ?? 15 } } : { center: v.center, zoom: v.zoom })
  });
  if (!o.rotate) map.touchZoomRotate.disableRotation();
  map.keyboard.disableRotation();
  map.addControl(new AttributionControl({ compact: false }), 'bottom-left');
  // (iOS Safari's own page pinch and long-press callout: the map pinches itself)
  map.getCanvasContainer().addEventListener('gesturestart', (e) => e.preventDefault());
  return map;
}

/** A fingertip's reach round a tap (a 44 px hit). */
const HIT = 22;

interface Route { layers: readonly string[]; fn: (f: MapGeoJSONFeature) => void; when?: () => boolean }
export interface TapRouter {
  /** A tap's nearest feature on these layers goes to `fn` (while `when` holds). Returns the removal. */
  add(layers: readonly string[], fn: (f: MapGeoJSONFeature) => void, when?: () => boolean): () => void;
  /** A tap with no feature near (empty map: a floating card closes). Returns the removal. */
  miss(fn: () => void): () => void;
}
const routers = new WeakMap<GLMap, TapRouter>();

/** The map's one tap router (made on the first ask): one click handler, the nearest within HIT of every layer added. */
export function tapRouter(map: GLMap): TapRouter {
  const had = routers.get(map);
  if (had) return had;
  const routes = new Set<Route>(), misses = new Set<() => void>();
  map.on('click', (e) => {
    // (no style: its WebGL context lost, styleLife)
    if (map.style === null) return;
    const { x, y } = e.point;
    const live = [...routes].filter((r) => !r.when || r.when());
    const layers = [...new Set(live.flatMap((r) => r.layers))].filter((id) => map.getLayer(id));
    const hits = layers.length ? map.queryRenderedFeatures([[x - HIT, y - HIT], [x + HIT, y + HIT]], { layers }) : [];
    const f = nearestHit(hits, { x, y }, (h) => {
      const g = h.geometry;
      return g.type === 'Point' ? (map.project(g.coordinates as [number, number]) as Px) : null;
    });
    if (!f) return void misses.forEach((m) => m());
    live.find((r) => r.layers.includes(f.layer.id))?.fn(f);
  });
  const r: TapRouter = {
    add(layers, fn, when) {
      const route = { layers, fn, when };
      routes.add(route);
      return () => void routes.delete(route);
    },
    miss(fn) {
      misses.add(fn);
      return () => void misses.delete(fn);
    }
  };
  routers.set(map, r);
  return r;
}

/** The map fitted to `box` inside `pad` (px a side), zoomed in no further than `maxZoom`; `whole`: jumped to a whole
 *  zoom, north up (a raster topo's tiles at their own scale), else eased over `duration` ms. */
export function fitBox(map: GLMap, box: LngLatBoundsLike, o: { pad: { top: number; bottom: number; left: number; right: number }; maxZoom?: number; whole?: boolean; duration?: number }): void {
  const maxZoom = o.maxZoom ?? 15;
  if (o.whole) {
    const cam = map.cameraForBounds(box, { padding: o.pad, maxZoom, bearing: 0 });
    if (cam) map.jumpTo({ center: cam.center, zoom: Math.floor(cam.zoom ?? map.getZoom()), bearing: 0 });
    return;
  }
  // (a box no camera fits between the pads, or one past the world's width: MapLibre's fit of it lands anywhere, a
  // world-wide list's at z4 in the South Atlantic: its centre at z1 instead)
  const cam = map.cameraForBounds(box, { padding: o.pad, maxZoom });
  if (!cam || cam.zoom === undefined || cam.zoom < 1) {
    const c = LngLatBounds.convert(box).getCenter();
    return void map.easeTo({ center: c, zoom: 1, duration: o.duration ?? 600, essential: true });
  }
  map.fitBounds(box, { padding: o.pad, maxZoom, duration: o.duration ?? 600, essential: true });
}

/** The map at rest: its style in, not moving, every tile asked for answered (the specs' `settled`). */
export const settledOf = (map: GLMap, loaded: boolean): boolean => loaded && !map.isMoving() && map.areTilesLoaded();

/** The event came from a finger (or the mouse), not a camera call. */
export const fromUser = (e: MapLibreEvent<unknown>): boolean => !!(e as { originalEvent?: Event }).originalEvent;

/** The map eased up just enough that the point sits clear of a card over its bottom `cover` px (the ringed square's
 *  half and a margin); left alone if it already is. */
export function revealAbove(map: GLMap, at: [number, number], cover: number): void {
  const h = map.getContainer().clientHeight, y = map.project(at).y;
  const over = y - (h - cover - 24);
  if (h && over > 0) map.panBy([0, over], { duration: 300 });
}

/** The one location dot's drawing on `source` (style.ts locLayers, its halo laid out for latitude 0): the fix (null:
 *  none), grey once `stale`; the halo's metres a pixel set again once a fix is a degree of latitude away. Once the
 *  style is in. */
export function locDot(map: GLMap, source: string): (fix: Fix | null, stale?: boolean) => void {
  let lat = 0;
  return (fix, stale = false) => {
    if (fix && Math.abs(fix.lat - lat) > 1) map.setPaintProperty(LOC_LAYERS.halo, 'circle-radius', haloRadius((lat = fix.lat)));
    map.getSource<GeoJSONSource>(source)?.setData(locData(fix, stale) as never);
  };
}

export function removeMap(map: GLMap): void {
  const glyphs = map.style?.glyphManager;
  map.remove(); // loses its WebGL context (WEBGL_lose_context) and empties the container
  glyphs?.destroy();
  void ((getGlobalDispatcher() as unknown as { workersAbortController?: AbortController }).workersAbortController?.signal.reason as Error | undefined)?.stack;
}

export type EngineMode = 'ready' | 'offline' | 'lost';

/** The style's life on `map`: `load` at each style.load (`first`: the first; a WebGL context lost and restored, as iOS
 *  does to a page in the background, rebuilds the style from a snapshot and loads it again), `lost` as the context goes
 *  (the style with it: getSource and the setters throw till the next load). */
export function styleLife(map: GLMap, load: (first: boolean) => void, lost: () => void): void {
  let first = true;
  map.on('style.load', () => {
    const f = first;
    first = false;
    load(f);
  });
  map.on('webglcontextlost', lost);
}

/** What the map shows, told to `mode` once its style is in (the returned `loaded`, from its style.load handler; `tile`
 *  once the basemap's first tile is in: the maps' 「地図を読み込み中…」 goes): 'ready' (the
 *  basemap's tiles coming), 'offline' (none came, or failing since the last one in: offline, the TileJSON or tiles refused),
 *  'lost' (no WebGL context). The basemap failing is shown (the map's note) and counted once a map
 *  (`swallow:map.tiles.<where>`, `.off` while the phone says it's offline); any other error is logged.
 *  One tile failing is not offline (a flaky signal on a ridge, one 404 at a zoom's edge: the note flickered on and off
 *  with each): 'offline' after FAILS_OFFLINE tiles in a row with none coming between, or a source error that is no
 *  tile's (the TileJSON: no tile will come at all). */
const FAILS_OFFLINE = 3;
export function watchMode(map: GLMap, base: string, where: 'places' | 'trip' | 'hike', mode: (m: EngineMode) => void, tile?: () => void): () => void {
  let loaded = false, lost = false, fails = 0, first = !!tile, told = false;
  let tiles: 'wait' | 'ok' | 'down' = 'wait';
  const report = () => loaded && mode(lost ? 'lost' : tiles === 'down' ? 'offline' : 'ready');
  map.on('data', (e) => {
    const d = e as { dataType?: string; sourceId?: string; tile?: unknown };
    if (d.dataType === 'source' && d.sourceId === base && d.tile) {
      fails = 0;
      if (first) ((first = false), tile!());
      if (tiles !== 'ok') ((tiles = 'ok'), report());
    }
  });
  map.on('error', (e) => {
    const x = e as { sourceId?: string; tile?: unknown };
    if (x.sourceId === base) {
      fails = x.tile ? fails + 1 : FAILS_OFFLINE;
      if (fails >= FAILS_OFFLINE && tiles !== 'down') {
        tiles = 'down';
        if (!told) ((told = true), swallowed(`map.tiles.${where}${navigator.onLine === false ? '.off' : ''}`));
        report();
      }
    } else {
      console.error(e.error);
      // (counted, not its message: a MapLibre error can quote a URL)
      swallowed('map.error');
    }
  });
  map.on('webglcontextlost', () => ((lost = true), log('gl.lost', { where: 'map', restored: false }, 2), report()));
  map.on('webglcontextrestored', () => ((lost = false), report()));
  return () => ((loaded = true), report());
}
