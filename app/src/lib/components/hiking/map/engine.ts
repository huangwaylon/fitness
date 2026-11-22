// トレイル's map, the MapLibre side (docs/hiking.md "Map", "In-hike map"): the lazy chunk TrailMap.svelte imports only
// when it draws (never under drawOff()), on the trip map's CSP-safe path (its worker our own file: travel/map/engine.ts).
// One map per trail view; destroy() lets go of it the way the trip map's does (travel/map/glmap.ts).
// Two-finger rotation on (MapLibre's own threshold: 25 px along the fingers' circle before a pinch turns the map; tune on
// a phone), drag-rotate and pitch off. The camera follows the location button's mode (follow.ts Cam): follow keeps the
// dot in the band between the controls and the sheet. The phone's heading only turns the dot's cone, never the map. A
// one-finger pan lets go (on.pan); a pinch or a two-finger turn keeps following (about the dot, the turn kept).
import { AttributionControl, Map as GLMap, setWorkerUrl, type GeoJSONSource, type LngLatBoundsLike, type MapLibreEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { Region } from '#lib/hiking/types.ts';
import type { Prepared } from '#lib/hiking/track.ts';
import type { NetFile } from '#lib/hiking/net.ts';
import { M_LAT, mLon } from '#lib/hiking/flat.ts';
import { buildStyle, C, CONES, coneImage, NET_LAYERS, ROUTE, SRC, TOPO } from './style.ts';
import { progressOf, splitAt, stepAt } from './route.ts';
import type { Cam } from './follow.ts';
import { SAVED_MAX_Z } from '#lib/offline/plan.ts';
import { removeMap, watchMode, type EngineMode } from '../../travel/map/glmap.ts';

export interface Fix { lon: number; lat: number }
export interface Loc extends Fix {
  acc: number;
  /** From before the page last hid (a locked screen): drawn grey and hollow, no cone, till a fresh fix. */
  stale?: boolean;
}
/** The phone's heading (true, deg) and the cone's half-angle. */
export interface Heading { deg: number; half: number }
type LL = [number, number];
/** The fork ahead's highlight: the route's way out (thick) and the other ways' first metres (grey). */
export interface Highlight { take: LL[]; others: LL[][] }

export interface Engine {
  setTrack(p: Prepared | null): void;
  setScrub(p: Fix | null): void;
  setFix(f: Loc | null, fly: boolean): void;
  setHeading(h: Heading | null): void;
  setCam(c: Cam): void;
  /** Hike mode: walked up to `d` (m) drawn faded, null the whole route as one (a paint value: route.ts). */
  setWalked(d: number | null): void;
  /** Off the route: the line from the dot to the route's nearest point. */
  setOff(line: [Fix, Fix] | null): void;
  /** OSM's other trails: their lines; the forks only when `forks` (the file built from this track). */
  setNet(net: NetFile | null, forks: boolean, shown: boolean): void;
  setHighlight(h: Highlight | null): void;
  /** The trail's area saved for offline (lib/offline: the topo to z16): the topo capped there, online or not. */
  setSaved(on: boolean): void;
  /** The compass disc: north up. */
  north(): void;
  /** The band between the controls and the sheet changed (`top` and `bottom` px kept clear): the whole track fitted in
   *  it again unless the camera follows (the dot kept in it) or the map was moved by hand since (its view kept). */
  fit(bottom: number, top: number): void;
  zoom(by: 1 | -1): void;
  /** (the specs' hook) turn the map as two fingers would. */
  rotateTo(deg: number): void;
  /** What's on screen (the specs' hook: TrailMap's `window.__trailMap`): the drawn features by layer, the track's box
   *  on the map in px (top, bottom), the bearing, the camera mode, the attribution's text. */
  state(): EngineState;
  destroy(): void;
}

export interface EngineState {
  track: number; scrub: number; box: [number, number] | null; bearing: number; cam: Cam;
  loc: number; cone: number; acc: number; stale: boolean; walked: number; off: number; net: number; forks: number; hl: number; attrib: string;
  /** The topo source's maxzoom (z16 while the area is saved), and the map's zoom (to a tenth). */
  topoMax: number;
  z: number;
}

const fc = (features: unknown[]) => ({ type: 'FeatureCollection', features }) as never;
const pt = (lon: number, lat: number, props: Record<string, unknown> = {}) => ({ type: 'Feature', properties: props, geometry: { type: 'Point', coordinates: [lon, lat] } });
const ln = (c: LL[], props: Record<string, unknown> = {}) => ({ type: 'Feature', properties: props, geometry: { type: 'LineString', coordinates: c } });

/** The track's box (sw, ne). */
function boundsOf(p: Prepared): LngLatBoundsLike {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const [lon, lat] of p.pts) ((w = Math.min(w, lon)), (e = Math.max(e, lon)), (s = Math.min(s, lat)), (n = Math.max(n, lat)));
  return [[w, s], [e, n]];
}

/** A circle of `r` metres about a point, as a polygon (the accuracy circle: true to scale at every zoom). */
function circle(c: Loc): unknown {
  const kx = mLon(c.lat), ring: LL[] = [];
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * 2 * Math.PI;
    ring.push([c.lon + (c.acc * Math.sin(a)) / kx, c.lat + (c.acc * Math.cos(a)) / M_LAT]);
  }
  return { type: 'Feature', properties: c.stale ? { stale: true } : {}, geometry: { type: 'Polygon', coordinates: [ring] } };
}

const PR = 2;
/** The heading cone: a sky wedge from the dot outward, fading (pointing up: icon-rotate turns it). */
function coneData(half: number): { width: number; height: number; data: Uint8ClampedArray } {
  const s = 96 * PR, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d')!;
  const r = s / 2, a = (half * Math.PI) / 180;
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, 'rgba(79,155,224,0.85)');
  grad.addColorStop(0.6, 'rgba(79,155,224,0.4)');
  grad.addColorStop(1, 'rgba(79,155,224,0)');
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(r, r);
  g.arc(r, r, r, -Math.PI / 2 - a, -Math.PI / 2 + a);
  g.closePath();
  g.fill();
  return { width: s, height: s, data: g.getImageData(0, 0, s, s).data };
}
/** A fork's ring: yuzu, cream inside, ⑂ in ink. */
function forkData(): { width: number; height: number; data: Uint8ClampedArray } {
  const s = 22 * PR, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d')!;
  g.beginPath();
  g.arc(s / 2, s / 2, s / 2 - 3 * PR, 0, 2 * Math.PI);
  g.fillStyle = C.rim;
  g.fill();
  g.lineWidth = 3 * PR;
  g.strokeStyle = C.wpt;
  g.stroke();
  g.fillStyle = '#4A3B2A';
  g.font = `700 ${12 * PR}px sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('⑂', s / 2, s / 2 + PR);
  return { width: s, height: s, data: g.getImageData(0, 0, s, s).data };
}

/** `saved`: the trail's area is saved (lib/offline: the topo to z16), the source capped there, online or not, so
 *  MapLibre scales those up past it rather than asking for tiles never saved (a valley with no signal often still says
 *  onLine: a pinch there showed blank z17–18). setSaved changes it on a drawn map (the source swapped in place). */
const topoMax = (r: Region, saved: boolean) => (saved ? Math.min(SAVED_MAX_Z, TOPO[r].maxzoom) : TOPO[r].maxzoom);

export function createEngine(
  el: HTMLElement,
  i: { region: Region; center: Fix; bottom: number; top: number; saved?: boolean },
  on: { mode(m: EngineMode): void; bearing?(deg: number): void; pan?(): void }
): Engine {
  setWorkerUrl(workerUrl);
  const map = new GLMap({
    container: el,
    style: buildStyle(i.region, topoMax(i.region, !!i.saved)),
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
  map.keyboard.disableRotation();
  map.addControl(new AttributionControl({ compact: false }), 'bottom-left');
  // the canvas-drawn icons, in before any feature asks for them (the fork rings, the cones by width)
  const addImages = () => {
    if (!map.hasImage('fork')) map.addImage('fork', forkData(), { pixelRatio: PR });
    for (const h of CONES) if (!map.hasImage(`cone-${h}`)) map.addImage(`cone-${h}`, coneData(h), { pixelRatio: PR });
  };

  let loaded = false;
  /** The map moved by hand since the track was last fitted (a sheet's change keeps that view). */
  let moved = false;
  /** Each track point's share of the drawn line (route.ts), and the walked share last painted. */
  let prog: number[] = [], painted = -1;
  let track: Prepared | null = null, scrub: Fix | null = null, fix: Loc | null = null, bottom = i.bottom, top = i.top;
  let heading: Heading | null = null, cam: Cam = 'off', walked: number | null = null;
  let net: NetFile | null = null, netForks = false, netShown = true, hl: Highlight | null = null, off: [Fix, Fix] | null = null;
  /** A gesture is moving the map: the camera holds still for it. */
  let busy = false;
  const loadedNow = watchMode(map, SRC.base, on.mode);
  const src = (id: string) => map.getSource<GeoJSONSource>(id);

  function fit(): void {
    if (!track) return;
    const h = el.clientHeight || 600;
    const t = Math.max(top, 30);
    const cam = map.cameraForBounds(boundsOf(track), { padding: { top: t, bottom: Math.max(30, Math.min(h * 0.9 - t, bottom + 30)), left: 30, right: 30 }, maxZoom: 16, bearing: 0 });
    // a whole zoom, as Leaflet fitted it: the topo's tiles at their own scale (a fractional zoom blurs their labels)
    if (cam) map.jumpTo({ center: cam.center, zoom: Math.floor(cam.zoom ?? 13), bearing: 0 });
    moved = false;
  }
  /** The walked part: the route's colours stepped at its share of the line (one paint value a fix, only on a change). */
  function drawWalked(): void {
    if (!loaded || !track) return;
    const at = Math.round(splitAt(track, prog, walked) * 1e5) / 1e5;
    if (at === painted) return;
    painted = at;
    map.setPaintProperty('track', 'line-gradient', stepAt(at, ROUTE.walked, ROUTE.ahead) as never);
    map.setPaintProperty('track-halo', 'line-gradient', stepAt(at, ROUTE.haloWalked, ROUTE.halo) as never);
  }
  function drawTrack(): void {
    if (!loaded) return;
    const p = track;
    prog = p ? progressOf(p) : [];
    painted = -1;
    src(SRC.track)?.setData(fc(p ? [ln(p.pts.map(([lon, lat]) => [lon, lat] as LL))] : []));
    drawWalked();
    const marks = p ? [...p.wpts.map((w) => pt(w.lon, w.lat, { kind: 'wpt' })), pt(p.pts[0][0], p.pts[0][1], { kind: 'start' }), ...(p.closed ? [] : [pt(p.pts.at(-1)![0], p.pts.at(-1)![1], { kind: 'end' })])] : [];
    src(SRC.marks)?.setData(fc(marks));
    fit();
  }
  const drawScrub = () => loaded && src(SRC.scrub)?.setData(fc(scrub ? [pt(scrub.lon, scrub.lat)] : []));
  /** The dot (and its cone: a stale dot has none). */
  function drawDot(): void {
    if (!loaded) return;
    src(SRC.loc)?.setData(fc(fix ? [pt(fix.lon, fix.lat, fix.stale ? { stale: true } : heading ? { heading: heading.deg, cone: coneImage(heading.half) } : {})] : []));
  }
  const drawAcc = () => loaded && src(SRC.acc)?.setData(fc(fix && fix.acc > 0 ? [circle(fix)] : []));
  function drawNet(): void {
    if (!loaded) return;
    src(SRC.net)?.setData(fc(net ? net.lines.map((l, k) => ln(l.c, { k, h: l.h })) : []));
    src(SRC.forks)?.setData(fc(net && netForks ? net.forks.map((f) => pt(f.p[0], f.p[1])) : []));
    for (const id of NET_LAYERS) map.setLayoutProperty(id, 'visibility', netShown ? 'visible' : 'none');
  }
  const drawHl = () => loaded && src(SRC.hl)?.setData(fc(hl ? [...hl.others.map((c) => ln(c, { k: 'other' })), ln(hl.take, { k: 'take' })] : []));
  const drawOff = () => loaded && src(SRC.off)?.setData(fc(off ? [ln([[off[0].lon, off[0].lat], [off[1].lon, off[1].lat]])] : []));

  /** Where the dot sits on screen: the band's middle. */
  function offset(): [number, number] {
    const h = el.clientHeight || 600, band = Math.max(1, h - bottom - top);
    return [0, top + band * 0.5 - h / 2];
  }
  /** The camera to the dot (following), `bearing` given or kept. */
  function recenter(duration: number, bearing?: number): void {
    if (!loaded || !fix || busy || cam !== 'follow') return;
    map.easeTo({ center: [fix.lon, fix.lat], offset: offset(), duration, ...(bearing === undefined ? {} : { bearing }), essential: true });
  }

  // the fingers: a one-finger pan lets go; any gesture holds the camera till it ends
  const user = (e: MapLibreEvent<unknown>) => !!(e as { originalEvent?: Event }).originalEvent;
  map.on('dragstart', (e) => {
    if (!user(e)) return;
    const t = (e.originalEvent as TouchEvent | undefined)?.touches;
    if (!t || t.length < 2) on.pan?.();
  });
  map.on('movestart', (e) => user(e) && ((busy = true), (moved = true)));
  map.on('moveend', () => {
    if (!busy) return;
    // (after the gesture's handlers let go: an ease a gesture interrupted ends while the fingers still move)
    queueMicrotask(() => {
      if (!busy || map.isMoving()) return;
      busy = false;
      // a pinch while following: back on the dot (zoomed about it already, `around: center`)
      recenter(250);
    });
  });
  let told = 0;
  map.on('rotate', () => {
    const b = Math.round(map.getBearing() * 10) / 10;
    if (Math.abs(b - told) >= 0.5 || (b === 0 && told !== 0)) ((told = b), on.bearing?.(b));
  });
  map.on('rotateend', () => {
    const b = Math.round(map.getBearing() * 10) / 10;
    if (b !== told) ((told = b), on.bearing?.(b));
  });

  // the topo's cap: the source made again at the other maxzoom, under the same layer order
  let saved = !!i.saved, capped = saved;
  function capTopo(): void {
    if (!loaded || capped === saved) return;
    capped = saved;
    const spec = buildStyle(i.region, topoMax(i.region, saved));
    const before = map.getStyle().layers[map.getStyle().layers.findIndex((l) => l.id === 'topo') + 1]?.id;
    map.removeLayer('topo');
    map.removeSource(SRC.base);
    map.addSource(SRC.base, spec.sources[SRC.base]);
    map.addLayer(spec.layers.find((l) => l.id === 'topo')!, before);
  }

  let flyOnLoad = false;
  map.on('load', () => {
    addImages();
    loaded = true;
    capTopo();
    drawTrack();
    drawScrub();
    drawNet();
    drawHl();
    drawOff();
    drawDot();
    drawAcc();
    if (flyOnLoad && fix) map.easeTo({ center: [fix.lon, fix.lat], zoom: Math.max(map.getZoom(), 14), duration: 600 });
    loadedNow();
  });

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
      if (!loaded) return void (flyOnLoad ||= fly);
      drawDot();
      drawAcc();
      if (!f) return;
      if (cam === 'follow') {
        if (fly && !busy) map.easeTo({ center: [f.lon, f.lat], offset: offset(), zoom: Math.max(map.getZoom(), 15), duration: 600, essential: true });
        else recenter(400);
      } else if (fly) map.easeTo({ center: [f.lon, f.lat], zoom: Math.max(map.getZoom(), 14), duration: 600 });
    },
    setHeading(h) {
      heading = h;
      drawDot();
    },
    setCam(c) {
      const was = cam;
      cam = c;
      // following: a pinch zooms about the dot (the screen's centre), not the fingers
      map.touchZoomRotate.enable(c === 'follow' ? { around: 'center' } : undefined);
      if (c === was) return;
      if (c === 'follow' && fix && loaded && !busy)
        map.easeTo({ center: [fix.lon, fix.lat], offset: offset(), zoom: Math.max(map.getZoom(), 15), duration: 500, bearing: 0, essential: true });
    },
    setWalked(d) {
      walked = d;
      drawWalked();
    },
    setOff(line) {
      off = line;
      drawOff();
    },
    setNet(n, forks, shown) {
      ((net = n), (netForks = forks), (netShown = shown));
      drawNet();
    },
    setHighlight(h) {
      hl = h;
      drawHl();
    },
    setSaved(on) {
      saved = on;
      capTopo();
    },
    north() {
      busy = false;
      if (cam === 'follow' && fix) recenter(300, 0);
      else map.easeTo({ bearing: 0, duration: 300 });
    },
    fit(b, t) {
      bottom = b;
      top = t;
      map.resize();
      if (cam === 'follow') recenter(250);
      else if (loaded && !moved) fit();
    },
    zoom(by) {
      const around = cam === 'follow' && fix ? { around: [fix.lon, fix.lat] as LL } : {};
      if (by > 0) map.zoomIn({ duration: 250, ...around });
      else map.zoomOut({ duration: 250, ...around });
    },
    rotateTo(deg) {
      map.jumpTo({ bearing: deg });
      on.bearing?.(Math.round(map.getBearing() * 10) / 10);
    },
    state: () => {
      const ys = track?.pts.map(([lon, lat]) => map.project([lon, lat]).y);
      const n = (layers: string[]) => (loaded ? map.queryRenderedFeatures({ layers }).length : 0);
      return {
        track: n(['track']), scrub: n(['scrub']), box: ys ? [Math.min(...ys), Math.max(...ys)] : null,
        bearing: Math.round(map.getBearing() * 10) / 10, cam,
        loc: n(['loc']), cone: n(['cone']), acc: fix?.acc ?? 0, stale: !!fix?.stale, walked: Math.max(0, painted), off: n(['off']),
        net: netShown ? n(['net']) : 0, forks: netShown ? n(['forks']) : 0, hl: n(['hl-take']),
        attrib: el.querySelector('.maplibregl-ctrl-attrib')?.textContent ?? '',
        topoMax: (map.getSource(SRC.base) as unknown as { maxzoom: number } | undefined)?.maxzoom ?? 0,
        z: Math.round(map.getZoom() * 10) / 10
      };
    },
    destroy() {
      removeMap(map);
    }
  };
}
