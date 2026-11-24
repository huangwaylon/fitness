// 保存した場所's map, the MapLibre side (docs/places.md "Map"): the lazy chunk PlacesMap.svelte imports only when it draws
// (never under mapStub()), on the trip map's CSP-safe path (its worker our own file, the tiles through the page so the
// service worker keeps them: map/tiles.ts). One GeoJSON source of the matches, clustered (setData
// on each search, at most once a frame, and only when the matches changed: a new order alone draws nothing); the
// places drawn as soon as the style is in (not after the basemap's first tiles); each badge drawn when the map first
// asks for it (none under z14), after the glyphs' font; a cluster's tap zooms in to where it splits, a place's opens
// its card; a long press (500 ms, the finger still) drops a pin; a pan by hand is told (このあたりで探す). Rotation and
// pitch off. destroy() lets go of it all (map/gl.ts removeMap).
import type { GeoJSONSource } from 'maplibre-gl';
import numFont from '@fontsource/fredoka/files/fredoka-latin-700-normal.woff2?url';
import { PLACE_CAT_KEYS, type PlaceCat } from '#lib/contract/places.ts';
import type { Locale } from '#lib/i18n/index.ts';
import type { LL } from '#lib/places/geo.ts';
import { fontFaces } from '../../map/fonts.ts';
import { fitBox, fromUser, locDot, makeMap, removeMap, settledOf, styleLife, tapRouter, watchMode, type EngineMode } from '../../map/gl.ts';
import { lazyImages } from '../../map/gl-images.ts';
import { longPress } from '../../map/gestures.ts';
import { bboxOf, fc, pt } from '../../map/geojson.ts';
import { LOC_LAYERS } from '../../map/style.ts';
import type { Fix } from '../../map/types.ts';
import { CAT_GLYPHS } from '../../map/places/badge.ts';
import { tagOf } from '../../map/places/layer.ts';
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
  /** The location dot (null: none), grey once `stale`. */
  setFix(at: Fix | null, stale: boolean): void;
  /** The map brought to a point (zoomed in to `z` at least), centred between the pads. */
  fly(at: LL, z?: number): void;
  /** The px the sheet covers at the bottom and the controls at the top: a flight centres in between. */
  setPad(bottom: number, top: number): void;
  /** The map's centre and the metres to the nearer edge of what shows between the pads. */
  view(): { center: LL; r: number };
  /** The map between `top` and `bottom` px (browse mode's box: PlacesView): [west, south, east, north]. */
  bounds(bottom: number, top: number): [number, number, number, number];
  /** All of them shown between the pads (全体を見る), a lone one at z15; `now`: jumped, not eased (the first view). */
  fit(lls: readonly LL[], bottom: number, top: number, now?: boolean): void;
  cam(): Cam;
  /** The specs' view: the matches, what's drawn (clusters, badges, the chosen one's ring, the location dot), the cluster's point nearest the middle, the chosen place on screen (px in the map). */
  state(): { features: number; clusters: number; badges: number; ring: number; loc: number; cluster: [number, number] | null; selAt: [number, number] | null; z: number; settled: boolean; attrib: string };
  destroy(): void;
}

export function createEngine(
  el: HTMLElement,
  i: { locale: Locale; cam: Cam; bottom: number; top: number },
  on: { mode(m: EngineMode): void; tile(): void; select(id: string): void; point(at: LL): void; moved(): void; cam(c: Cam): void }
): Engine {
  // (the shared options, the tiles through the page, the attribution, iOS's page pinch and long-press callout off: map/gl.ts)
  const map = makeMap(el, { style: buildStyle(i.locale, fontFaces(), new URL(numFont, location.href).href), via: true, view: { center: i.cam.center, zoom: i.cam.zoom } });

  let loaded = false, gone = false;
  let pts: readonly Pt[] = [], sel: Sel | null = null, pin: LL | null = null, fix: Fix | null = null, stale = false;
  /** The matches on the map, by id (what setData last drew). */
  let drawn = new Map<string, Pt>();
  let pad = { bottom: i.bottom, top: i.top, left: 0, right: 0 };
  let queued = 0;
  /** The map has drawn since the matches last changed (its next `idle`: setData's worker round and the tiles after it). */
  let drawnOut = true;
  // (the first basemap tile: the map's loading note goes)
  const loadedNow = watchMode(map, SRC.base, 'places', on.mode, on.tile);
  const drawLoc = locDot(map, SRC.loc);
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
    drawnOut = false;
    src(SRC.places)?.setData(fc(pts.map((p) => pt(p.lng, p.lat, { id: p.id, cat: p.cat }))) as never);
  };
  const drawSel = () => loaded && src(SRC.sel)?.setData(fc(sel ? [pt(sel.lng, sel.lat, { cat: sel.cat, name: tagOf(sel.name) })] : []) as never);
  const drawPin = () => loaded && src(SRC.pin)?.setData(fc(pin ? [pt(pin[0], pin[1])] : []) as never);
  const drawFix = () => loaded && drawLoc(fix, stale);
  const flyTo = (at: LL, z?: number) => map.easeTo({ center: at, zoom: Math.max(map.getZoom(), z ?? 15), padding: pad, duration: 600, essential: true });

  // a tap (map/gl.ts tapRouter: the nearest within a fingertip): a cluster zooms in to where it splits, a place opens
  const taps = tapRouter(map);
  const coords = (f: { geometry: unknown }) => (f.geometry as { coordinates: LL }).coordinates;
  taps.add(['clusters'], (f) => {
    // (the cluster gone by the worker's answer: a search's setData between, or the map closed)
    void src(SRC.places)!.getClusterExpansionZoom(f.properties.cluster_id as number).catch(() => null).then((z) => {
      if (z !== null && !gone) map.easeTo({ center: coords(f), zoom: Math.min(z + 0.2, 18), padding: pad, duration: 500 });
    });
  }, () => loaded);
  taps.add(['dots', 'badges'], (f) => f.properties.id && on.select(f.properties.id as string), () => loaded);

  // a long press: the finger down and still for HOLD_MS (a mouse's right click too: map/gestures.ts)
  const cancel = longPress(map, el, (at) => on.point(at));

  map.on('movestart', (e) => (cancel(), fromUser(e) && on.moved()));
  map.on('moveend', () => {
    const c = map.getCenter();
    on.cam({ center: [c.lng, c.lat], zoom: Math.round(map.getZoom() * 100) / 100 });
  });

  map.on('idle', () => (drawnOut = true));
  // (each style.load: a WebGL context restored loads the style's snapshot again, the changes since drawn on it)
  styleLife(map, () => {
    loaded = true;
    drawPlaces();
    drawSel();
    drawPin();
    drawFix();
    loadedNow();
  }, () => (loaded = false));

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
    setFix(at, old) {
      ((fix = at), (stale = old));
      drawFix();
    },
    setPad(bottom, top) {
      pad = { ...pad, bottom, top };
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
    fit(lls, bottom, top, now = false) {
      const box = bboxOf(lls);
      if (box) fitBox(map, box, { pad: { top: top + 24, bottom: bottom + 24, left: 32, right: 32 }, maxZoom: 15, duration: now ? 0 : 600 });
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
      const s = sel && map.project([sel.lng, sel.lat]);
      return {
        features: pts.length, clusters: cl.length, badges: q('badges').length, ring: q('sel').length, loc: q(LOC_LAYERS.dot).length, cluster: at ? [Math.round(at.x), Math.round(at.y)] : null,
        selAt: s ? [Math.round(s.x), Math.round(s.y)] : null,
        z: Math.round(map.getZoom() * 10) / 10,
        // (and the matches drawn: a search's setData queued for the next frame, or not drawn since)
        settled: settledOf(map, loaded) && !queued && drawnOut, attrib: el.querySelector('.maplibregl-ctrl-attrib')?.textContent ?? ''
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
