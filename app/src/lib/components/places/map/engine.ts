// 保存した場所's map, the MapLibre side (docs/places.md "Map"): the lazy chunk PlacesMap.svelte imports only when it draws
// (never under mapStub()), on the trip map's CSP-safe path (its worker our own file, the tiles through the page so the
// service worker keeps them: map/tiles.ts). One GeoJSON source of the matches, clustered (setData
// on each search, at most once a frame, and only when the matches changed: a new order alone draws nothing); the
// places drawn as soon as the style is in (not after the basemap's first tiles); each badge drawn when the map first
// asks for it (none under z14), after the glyphs' font; a cluster's tap zooms in to where it splits, a place's opens
// its card; a long press (500 ms, the finger still) drops a pin; a pan by hand is told (このあたりで探す). Rotation and
// pitch off. destroy() lets go of it all (map/gl.ts removeMap).
import type { GeoJSONSource, MapGeoJSONFeature } from 'maplibre-gl';
import numFont from '@fontsource/fredoka/files/fredoka-latin-700-normal.woff2?url';
import { PLACE_CAT_KEYS, type PlaceCat } from '#lib/contract/places.ts';
import type { Locale } from '#lib/i18n/index.ts';
import type { LL } from '#lib/places/geo.ts';
import { fontFaces } from '../../map/fonts.ts';
import { fitBox, fromUser, HIT, makeMap, removeMap, settledOf, watchMode, type EngineMode } from '../../map/gl.ts';
import { lazyImages } from '../../map/gl-images.ts';
import { longPress } from '../../map/gestures.ts';
import { bboxOf } from '../../map/geojson.ts';
import { CAT_GLYPHS } from '../../map/places/badge.ts';
import { buildStyle, SRC } from './style.ts';
import { badge, dropPin } from './icons.ts';

export interface Pt {
  id: string;
  lng: number;
  lat: number;
  cat: PlaceCat;
}
export interface Sel extends Pt {
  name: string;
}
export interface Cam {
  center: LL;
  zoom: number;
}

export interface Engine {
  setPlaces(pts: readonly Pt[]): void;
  /** The chosen place (null: none). */
  setSelected(s: Sel | null): void;
  setPin(at: LL | null): void;
  setFix(at: LL | null): void;
  /** The map brought to a point (zoomed in to `z` at least), centred between the pads. */
  fly(at: LL, z?: number): void;
  /** The px the sheet covers at the bottom and the controls at the top: a flight centres in between. */
  setPad(bottom: number, top: number): void;
  zoom(by: 1 | -1): void;
  /** The map's centre and the metres to the nearer edge of what shows between the pads. */
  view(): { center: LL; r: number };
  /** The map between `top` and `bottom` px (browse mode's box: PlacesView): [west, south, east, north]. */
  bounds(bottom: number, top: number): [number, number, number, number];
  /** All of them shown between the pads (全体を見る), a lone one at z15. */
  fit(lls: readonly LL[], bottom: number, top: number): void;
  cam(): Cam;
  /** The specs' view: the matches, what's drawn (clusters, badges, the chosen one's ring), the cluster's point nearest the middle. */
  state(): { features: number; clusters: number; badges: number; ring: number; cluster: [number, number] | null; z: number; settled: boolean; attrib: string };
  destroy(): void;
}

const fc = (features: unknown[]) => ({ type: 'FeatureCollection', features }) as never;
const pt = (lng: number, lat: number, props: Record<string, unknown> = {}) => ({ type: 'Feature', properties: props, geometry: { type: 'Point', coordinates: [lng, lat] } });

export function createEngine(
  el: HTMLElement,
  i: { locale: Locale; cam: Cam; bottom: number; top: number },
  on: { mode(m: EngineMode): void; select(id: string): void; point(at: LL): void; moved(): void; cam(c: Cam): void }
): Engine {
  // (the shared options, the tiles through the page, the attribution, iOS's page pinch and long-press callout off: map/gl.ts)
  const map = makeMap(el, { style: buildStyle(i.locale, fontFaces(), new URL(numFont, location.href).href), via: true, view: { center: i.cam.center, zoom: i.cam.zoom } });

  let loaded = false, gone = false;
  let pts: readonly Pt[] = [], sel: Sel | null = null, pin: LL | null = null, fix: LL | null = null;
  /** The matches on the map, by id (what setData last drew). */
  let drawn = new Map<string, Pt>();
  let pad = { bottom: i.bottom, top: i.top, left: 0, right: 0 };
  let queued = 0;
  const loadedNow = watchMode(map, SRC.base, on.mode);
  const src = (id: string) => map.getSource<GeoJSONSource>(id);

  // the badges and the pin drawn as the map first asks for each (~1 ms a badge; all 27 up front were 10–25 ms an
  // opening, and none shows under z14), the glyphs' font in first (a canvas draws in a fallback face)
  const dropImages = lazyImages(map, (id) => {
    const m = /^pl-(.+?)(-sel)?$/.exec(id);
    if (id !== 'drop-pin' && !(m && (PLACE_CAT_KEYS as string[]).includes(m[1]))) return null;
    return () => (m ? badge(m[1] as PlaceCat, m[2] ? 28 : 22, !!m[2]) : dropPin());
  }, CAT_GLYPHS);
  const same = () => pts.length === drawn.size && pts.every((p) => ((q) => !!q && q.lng === p.lng && q.lat === p.lat && q.cat === p.cat)(drawn.get(p.id)));
  const drawPlaces = () => {
    queued = 0;
    if (!loaded || same()) return;
    drawn = new Map(pts.map((p) => [p.id, p]));
    src(SRC.places)?.setData(fc(pts.map((p) => pt(p.lng, p.lat, { id: p.id, cat: p.cat }))));
  };
  const drawSel = () => loaded && src(SRC.sel)?.setData(fc(sel ? [pt(sel.lng, sel.lat, { cat: sel.cat, name: sel.name })] : []));
  const drawPin = () => loaded && src(SRC.pin)?.setData(fc(pin ? [pt(pin[0], pin[1])] : []));
  const drawFix = () => loaded && src(SRC.loc)?.setData(fc(fix ? [pt(fix[0], fix[1])] : []));
  const flyTo = (at: LL, z?: number) => map.easeTo({ center: at, zoom: Math.max(map.getZoom(), z ?? 15), padding: pad, duration: 600, essential: true });

  // a tap: a cluster zooms in, a place (the nearest within a fingertip) opens
  map.on('click', async (e) => {
    if (!loaded) return;
    const { x, y } = e.point;
    const box: [[number, number], [number, number]] = [[x - HIT, y - HIT], [x + HIT, y + HIT]];
    const d = (f: MapGeoJSONFeature) => {
      const c = map.project((f.geometry as unknown as { coordinates: LL }).coordinates);
      return Math.hypot(c.x - x, c.y - y);
    };
    const hit = map.queryRenderedFeatures(box, { layers: ['clusters', 'dots', 'badges'] }).sort((a, b) => d(a) - d(b))[0];
    if (!hit) return;
    const props = hit.properties as { cluster_id?: number; id?: string };
    if (props.cluster_id !== undefined) {
      // (the cluster gone by the worker's answer: a search's setData between, or the map closed)
      const z = await src(SRC.places)!.getClusterExpansionZoom(props.cluster_id).catch(() => null);
      if (z !== null && !gone) map.easeTo({ center: (hit.geometry as unknown as { coordinates: LL }).coordinates, zoom: Math.min(z + 0.2, 18), padding: pad, duration: 500 });
    } else if (props.id) on.select(props.id);
  });

  // a long press: the finger down and still for HOLD_MS (a mouse's right click too: map/gestures.ts)
  const { cancel } = longPress(map, el, (at) => on.point(at));

  map.on('movestart', (e) => (cancel(), fromUser(e) && on.moved()));
  map.on('moveend', () => {
    const c = map.getCenter();
    on.cam({ center: [c.lng, c.lat], zoom: Math.round(map.getZoom() * 100) / 100 });
  });

  map.once('style.load', () => {
    loaded = true;
    drawPlaces();
    drawSel();
    drawPin();
    drawFix();
  });
  map.on('load', loadedNow);

  return {
    setPlaces(p) {
      pts = p;
      if (!queued) queued = requestAnimationFrame(drawPlaces);
    },
    setSelected(s) {
      sel = s;
      drawSel();
    },
    fly: flyTo,
    setPin(at) {
      pin = at;
      drawPin();
    },
    setFix(at) {
      fix = at;
      drawFix();
    },
    setPad(bottom, top) {
      pad = { ...pad, bottom, top };
    },
    zoom(by) {
      if (by > 0) map.zoomIn({ duration: 250 });
      else map.zoomOut({ duration: 250 });
    },
    view() {
      const h = el.clientHeight || 600, w = el.clientWidth || 390;
      const midY = pad.top + Math.max(1, h - pad.top - pad.bottom) / 2;
      const c = map.unproject([w / 2, midY]);
      const edge = map.unproject([w / 2, Math.max(pad.top, midY - Math.min(w / 2, (h - pad.top - pad.bottom) / 2))]);
      const r = Math.max(300, Math.abs(edge.lat - c.lat) * 111_320);
      return { center: [c.lng, c.lat], r };
    },
    bounds(bottom, top) {
      const h = el.clientHeight || 600, w = el.clientWidth || 390;
      const nw = map.unproject([0, Math.min(top, h - 1)]), se = map.unproject([w, Math.max(top + 1, h - bottom)]);
      // (zoomed out past the world's width: all of it)
      if (se.lng - nw.lng >= 360) return [-180, Math.max(-90, se.lat), 180, Math.min(90, nw.lat)];
      const wrap = (x: number) => ((((x + 180) % 360) + 360) % 360) - 180;
      return [wrap(nw.lng), Math.max(-90, se.lat), wrap(se.lng), Math.min(90, nw.lat)];
    },
    fit(lls, bottom, top) {
      const box = bboxOf(lls);
      if (box) fitBox(map, box, { pad: { top: top + 24, bottom: bottom + 24, left: 32, right: 32 }, maxZoom: 15 });
    },
    cam() {
      const c = map.getCenter();
      return { center: [c.lng, c.lat], zoom: map.getZoom() };
    },
    state() {
      const q = (layer: string) => (loaded ? map.queryRenderedFeatures({ layers: [layer] }) : []);
      // (the cluster nearest the middle between the pads: clear of the sheet and the buttons)
      const midY = pad.top + (el.clientHeight - pad.top - pad.bottom) / 2, cl = q('clusters');
      const at = cl.map((f) => map.project((f.geometry as unknown as { coordinates: LL }).coordinates)).sort((u, v) => Math.hypot(u.x - el.clientWidth / 2, u.y - midY) - Math.hypot(v.x - el.clientWidth / 2, v.y - midY))[0];
      return {
        features: pts.length, clusters: cl.length, badges: q('badges').length, ring: q('sel').length, cluster: at ? [Math.round(at.x), Math.round(at.y)] : null,
        z: Math.round(map.getZoom() * 10) / 10,
        settled: settledOf(map, loaded), attrib: el.querySelector('.maplibregl-ctrl-attrib')?.textContent ?? ''
      };
    },
    destroy() {
      gone = true;
      dropImages();
      cancel();
      cancelAnimationFrame(queued);
      removeMap(map);
    }
  };
}
