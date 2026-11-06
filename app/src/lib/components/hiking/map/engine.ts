// トレイル's map, the MapLibre side (docs/hiking.md "Map"): the lazy chunk TrailMap.svelte imports only when it draws
// (never under drawOff()), on the trip map's CSP-safe path (its worker our own file:
// travel/map/engine.ts). One map per trail view; destroy() drops its WebGL context the way the trip map's does (leaks).
import { AttributionControl, Map as GLMap, getGlobalDispatcher, setWorkerUrl, type GeoJSONSource, type LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { Region } from '#lib/hiking/types.ts';
import type { Prepared } from '#lib/hiking/track.ts';
import { buildStyle, SRC, TOPO } from './style.ts';

export interface Fix { lon: number; lat: number }
export type EngineMode = 'ready' | 'offline' | 'lost';
export interface Engine {
  setTrack(p: Prepared | null): void;
  setScrub(p: Fix | null): void;
  setFix(f: Fix | null, fly: boolean): void;
  /** The whole track in the band between the header and the sheet (`bottom` px kept clear). */
  fit(bottom: number): void;
  zoom(by: 1 | -1): void;
  center(): [number, number];
  destroy(): void;
}

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const fc = (features: unknown[]) => ({ type: 'FeatureCollection', features }) as never;
const pt = (lon: number, lat: number, props: Record<string, unknown> = {}) => ({ type: 'Feature', properties: props, geometry: { type: 'Point', coordinates: [lon, lat] } });

/** The track's box (sw, ne). */
export function boundsOf(p: Prepared): LngLatBoundsLike {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const [lon, lat] of p.pts) ((w = Math.min(w, lon)), (e = Math.max(e, lon)), (s = Math.min(s, lat)), (n = Math.max(n, lat)));
  return [[w, s], [e, n]];
}

export function createEngine(el: HTMLElement, i: { region: Region; center: Fix; bottom: number }, on: { mode(m: EngineMode): void }): Engine {
  setWorkerUrl(workerUrl);
  const map = new GLMap({
    container: el,
    style: buildStyle(i.region),
    attributionControl: false,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    maxPitch: 0,
    // (the hiking app's: z10 the overview, each source's own ceiling the closest)
    minZoom: 9,
    maxZoom: TOPO[i.region].maxzoom,
    renderWorldCopies: false,
    fadeDuration: 120,
    validateStyle: import.meta.env.DEV,
    center: [i.center.lon, i.center.lat],
    zoom: 13
  });
  map.touchZoomRotate.disableRotation();
  map.keyboard.disableRotation();
  map.addControl(new AttributionControl({ compact: false }), 'bottom-right');

  let loaded = false, lost = false;
  let base: 'wait' | 'ok' | 'down' = 'wait';
  let track: Prepared | null = null, scrub: Fix | null = null, fix: Fix | null = null, bottom = i.bottom;
  const report = () => loaded && on.mode(lost ? 'lost' : base === 'down' ? 'offline' : 'ready');
  const src = (id: string) => map.getSource<GeoJSONSource>(id);

  function fit(): void {
    if (!track) return;
    const h = el.clientHeight || 600;
    const cam = map.cameraForBounds(boundsOf(track), { padding: { top: 70, bottom: Math.min(h * 0.9 - 70, bottom + 30), left: 30, right: 30 }, maxZoom: 16 });
    // a whole zoom, as Leaflet fitted it: the topo's tiles at their own scale (a fractional zoom blurs their labels)
    if (cam) map.jumpTo({ center: cam.center, zoom: Math.floor(cam.zoom ?? 13) });
  }
  function drawTrack(): void {
    if (!loaded) return;
    const p = track;
    src(SRC.track)?.setData(fc(p ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: p.pts.map(([lon, lat]) => [lon, lat]) } }] : []));
    const marks = p ? [...p.wpts.map((w) => pt(w.lon, w.lat, { kind: 'wpt' })), pt(p.pts[0][0], p.pts[0][1], { kind: 'start' }), ...(p.closed ? [] : [pt(p.pts.at(-1)![0], p.pts.at(-1)![1], { kind: 'end' })])] : [];
    src(SRC.marks)?.setData(fc(marks));
    fit();
  }
  const drawScrub = () => loaded && src(SRC.scrub)?.setData(fc(scrub ? [pt(scrub.lon, scrub.lat)] : []));
  const drawFix = (fly: boolean) => {
    if (!loaded) return;
    src(SRC.loc)?.setData(fc(fix ? [pt(fix.lon, fix.lat)] : []));
    if (fix && fly) map.easeTo({ center: [fix.lon, fix.lat], zoom: Math.max(map.getZoom(), 14), duration: reduced() ? 0 : 600 });
  };

  let flyOnLoad = false;
  map.on('load', () => {
    loaded = true;
    drawTrack();
    drawScrub();
    drawFix(flyOnLoad);
    report();
  });
  map.on('data', (e) => {
    const d = e as { dataType?: string; sourceId?: string; tile?: unknown };
    if (d.dataType === 'source' && d.sourceId === SRC.base && d.tile && base !== 'ok') ((base = 'ok'), report());
  });
  map.on('error', (e) => {
    if ((e as { sourceId?: string }).sourceId === SRC.base) {
      if (base !== 'down') ((base = 'down'), report());
    } else console.error(e.error);
  });
  map.on('webglcontextlost', () => ((lost = true), report()));
  map.on('webglcontextrestored', () => ((lost = false), report()));

  return {
    setTrack(p) {
      track = p;
      drawTrack();
    },
    setScrub(p) {
      scrub = p;
      drawScrub();
    },
    setFix(f, fly) {
      fix = f;
      if (loaded) drawFix(fly);
      else flyOnLoad ||= fly;
    },
    fit(b) {
      bottom = b;
      map.resize();
      if (loaded) fit();
    },
    zoom(by) {
      if (by > 0) map.zoomIn({ duration: reduced() ? 0 : 250 });
      else map.zoomOut({ duration: reduced() ? 0 : 250 });
    },
    center() {
      const c = map.getCenter();
      return [c.lng, c.lat];
    },
    destroy() {
      map.remove();
      // (the trip map's leak fix: reading the dispatcher's abort reason's stack lets remove()'s frames go: travel/map/engine.ts)
      void ((getGlobalDispatcher() as unknown as { workersAbortController?: AbortController }).workersAbortController?.signal.reason as Error | undefined)?.stack;
    }
  };
}
