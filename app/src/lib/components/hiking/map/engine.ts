// トレイル's map, the MapLibre side (docs/hiking.md "Map", "In-hike map"): the lazy chunk TrailMap.svelte imports only
// when it draws (never under drawOff()), on the trip map's CSP-safe path (its worker our own file: travel/map/engine.ts).
// One map per trail view; destroy() lets go of it the way the trip map's does (travel/map/glmap.ts).
// Two-finger rotation on (MapLibre's own threshold: 25 px along the fingers' circle before a pinch turns the map; tune on
// a phone), drag-rotate and pitch off. The camera follows the location button's mode (follow.ts Cam): follow keeps the
// dot in the band between the controls and the sheet; heading turns the map to the phone's heading too (the dot lower,
// more of the way ahead shown). A one-finger pan lets go (on.pan), a two-finger turn leaves heading mode (on.rotate); a
// pinch keeps following (zoomed about the dot).
import { AttributionControl, Map as GLMap, setWorkerUrl, type GeoJSONSource, type LngLatBoundsLike, type MapLibreEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { Region } from '#lib/hiking/types.ts';
import type { Prepared } from '#lib/hiking/track.ts';
import { pointAt } from '#lib/hiking/track.ts';
import type { NetFile } from '#lib/hiking/net.ts';
import { buildStyle, C, CONES, coneImage, NET_LAYERS, SRC, TOPO } from './style.ts';
import type { Cam } from './follow.ts';
import { SAVED_MAX_Z } from '#lib/offline/plan.ts';
import { removeMap, watchMode, type EngineMode } from '../../travel/map/glmap.ts';

export interface Fix { lon: number; lat: number }
export interface Loc extends Fix { acc: number }
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
  setCam(c: Cam, keepBearing?: boolean): void;
  /** Hike mode: walked up to `d` (m) drawn faded, null the whole route as one. */
  setWalked(d: number | null): void;
  /** Off the route: the line from the dot to the route's nearest point. */
  setOff(line: [Fix, Fix] | null): void;
  /** OSM's other trails: their lines; the forks only when `forks` (the file built from this track). */
  setNet(net: NetFile | null, forks: boolean, shown: boolean): void;
  setHighlight(h: Highlight | null): void;
  /** The compass disc: north up. */
  north(): void;
  /** The whole track in the band between the controls and the sheet (`top` and `bottom` px kept clear). */
  fit(bottom: number, top: number): void;
  zoom(by: 1 | -1): void;
  /** (the specs' hook) turn the map as a gesture would: `user`, as the fingers' (heading mode let go). */
  rotateTo(deg: number, user?: boolean): void;
  /** What's on screen (the specs' hook: TrailMap's `window.__trailMap`): the drawn features by layer, the track's box
   *  on the map in px (top, bottom), the bearing, the camera mode, the attribution's text. */
  state(): EngineState;
  destroy(): void;
}

export interface EngineState {
  track: number; scrub: number; box: [number, number] | null; bearing: number; cam: Cam;
  loc: number; cone: number; acc: number; walked: number; off: number; net: number; forks: number; hl: number; attrib: string;
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
  const k = 111_320, cos = Math.cos((c.lat * Math.PI) / 180), ring: LL[] = [];
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * 2 * Math.PI;
    ring.push([c.lon + (c.acc * Math.sin(a)) / (k * cos), c.lat + (c.acc * Math.cos(a)) / k]);
  }
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } };
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

/** `savedOnly`: drawn offline from a saved area (lib/offline: the topo to z16), the source capped there so MapLibre
 *  scales those up past it rather than asking for tiles never saved. */
export function createEngine(
  el: HTMLElement,
  i: { region: Region; center: Fix; bottom: number; top: number; savedOnly?: boolean },
  on: { mode(m: EngineMode): void; bearing?(deg: number): void; pan?(): void; rotate?(): void }
): Engine {
  setWorkerUrl(workerUrl);
  const map = new GLMap({
    container: el,
    style: buildStyle(i.region, i.savedOnly ? Math.min(SAVED_MAX_Z, TOPO[i.region].maxzoom) : undefined),
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
  }
  /** The route: walked (faded) and ahead, split at `walked`. */
  function drawRoute(): void {
    if (!loaded) return;
    const p = track;
    if (!p) return (src(SRC.track)?.setData(fc([])), void src(SRC.walked)?.setData(fc([])));
    const all = p.pts.map(([lon, lat]) => [lon, lat] as LL);
    if (walked === null || walked <= 0) {
      src(SRC.track)?.setData(fc([ln(all)]));
      src(SRC.walked)?.setData(fc([]));
      return;
    }
    const at = pointAt(p, walked), mid: LL = [at.lon, at.lat];
    const k = p.d.findIndex((d) => d > walked!);
    const cut = k < 0 ? all.length : k;
    src(SRC.walked)?.setData(fc([ln([...all.slice(0, cut), mid])]));
    src(SRC.track)?.setData(fc(cut < all.length ? [ln([mid, ...all.slice(cut)])] : []));
  }
  function drawTrack(): void {
    if (!loaded) return;
    const p = track;
    drawRoute();
    const marks = p ? [...p.wpts.map((w) => pt(w.lon, w.lat, { kind: 'wpt' })), pt(p.pts[0][0], p.pts[0][1], { kind: 'start' }), ...(p.closed ? [] : [pt(p.pts.at(-1)![0], p.pts.at(-1)![1], { kind: 'end' })])] : [];
    src(SRC.marks)?.setData(fc(marks));
    fit();
  }
  const drawScrub = () => loaded && src(SRC.scrub)?.setData(fc(scrub ? [pt(scrub.lon, scrub.lat)] : []));
  function drawLoc(): void {
    if (!loaded) return;
    src(SRC.loc)?.setData(fc(fix ? [pt(fix.lon, fix.lat, heading ? { heading: heading.deg, cone: coneImage(heading.half) } : {})] : []));
    src(SRC.acc)?.setData(fc(fix && fix.acc > 0 ? [circle(fix)] : []));
  }
  function drawNet(): void {
    if (!loaded) return;
    src(SRC.net)?.setData(fc(net ? net.lines.map((l, k) => ln(l.c, { k, h: l.h })) : []));
    src(SRC.forks)?.setData(fc(net && netForks ? net.forks.map((f) => pt(f.p[0], f.p[1])) : []));
    for (const id of NET_LAYERS) map.setLayoutProperty(id, 'visibility', netShown ? 'visible' : 'none');
  }
  const drawHl = () => loaded && src(SRC.hl)?.setData(fc(hl ? [...hl.others.map((c) => ln(c, { k: 'other' })), ln(hl.take, { k: 'take' })] : []));
  const drawOff = () => loaded && src(SRC.off)?.setData(fc(off ? [ln([[off[0].lon, off[0].lat], [off[1].lon, off[1].lat]])] : []));

  /** Where the dot sits on screen: the band's middle (follow), lower in it (heading: the way ahead shown). */
  function offset(): [number, number] {
    const h = el.clientHeight || 600, band = Math.max(1, h - bottom - top);
    return [0, top + band * (cam === 'heading' ? 0.66 : 0.5) - h / 2];
  }
  /** The camera to the dot (follow, heading), `bearing` given or kept. */
  function recenter(duration: number, bearing?: number): void {
    if (!loaded || !fix || busy || (cam !== 'follow' && cam !== 'heading')) return;
    map.easeTo({ center: [fix.lon, fix.lat], offset: offset(), duration, ...(bearing === undefined ? {} : { bearing }), essential: true });
  }

  // the fingers: a one-finger pan lets go; a two-finger turn leaves heading mode; any gesture holds the camera till it ends
  const user = (e: MapLibreEvent<unknown>) => !!(e as { originalEvent?: Event }).originalEvent;
  map.on('dragstart', (e) => {
    if (!user(e)) return;
    const t = (e.originalEvent as TouchEvent | undefined)?.touches;
    if (!t || t.length < 2) on.pan?.();
  });
  map.on('rotatestart', (e) => user(e) && on.rotate?.());
  map.on('movestart', (e) => user(e) && (busy = true));
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

  let flyOnLoad = false;
  map.on('load', () => {
    addImages();
    loaded = true;
    drawTrack();
    drawScrub();
    drawNet();
    drawHl();
    drawOff();
    drawLoc();
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
      drawLoc();
      if (!f) return;
      if (cam === 'follow' || cam === 'heading') {
        if (fly && !busy) map.easeTo({ center: [f.lon, f.lat], offset: offset(), zoom: Math.max(map.getZoom(), 15), duration: 600, essential: true });
        else recenter(400, cam === 'heading' && heading ? heading.deg : undefined);
      } else if (fly) map.easeTo({ center: [f.lon, f.lat], zoom: Math.max(map.getZoom(), 14), duration: 600 });
    },
    setHeading(h) {
      heading = h;
      drawLoc();
      if (h && cam === 'heading') recenter(200, h.deg);
    },
    setCam(c, keepBearing = false) {
      const was = cam;
      cam = c;
      // following: a pinch zooms about the dot (the screen's centre), not the fingers
      map.touchZoomRotate.enable(c === 'follow' || c === 'heading' ? { around: 'center' } : undefined);
      if (c === was) return;
      if (c === 'heading') recenter(300, heading?.deg ?? map.getBearing());
      else if (c === 'follow' && fix && loaded && !busy)
        map.easeTo({ center: [fix.lon, fix.lat], offset: offset(), zoom: Math.max(map.getZoom(), 15), duration: 500, ...(keepBearing ? {} : { bearing: 0 }), essential: true });
    },
    setWalked(d) {
      walked = d;
      drawRoute();
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
    north() {
      busy = false;
      if (cam === 'follow' && fix) recenter(300, 0);
      else map.easeTo({ bearing: 0, duration: 300 });
    },
    fit(b, t) {
      bottom = b;
      top = t;
      map.resize();
      if (loaded && cam !== 'follow' && cam !== 'heading') fit();
      else recenter(250);
    },
    zoom(by) {
      const around = (cam === 'follow' || cam === 'heading') && fix ? { around: [fix.lon, fix.lat] as LL } : {};
      if (by > 0) map.zoomIn({ duration: 250, ...around });
      else map.zoomOut({ duration: 250, ...around });
    },
    rotateTo(deg, userTurn = false) {
      if (userTurn) on.rotate?.();
      map.jumpTo({ bearing: deg });
      on.bearing?.(Math.round(map.getBearing() * 10) / 10);
    },
    state: () => {
      const ys = track?.pts.map(([lon, lat]) => map.project([lon, lat]).y);
      const n = (layers: string[]) => (loaded ? map.queryRenderedFeatures({ layers }).length : 0);
      return {
        track: n(['track']), scrub: n(['scrub']), box: ys ? [Math.min(...ys), Math.max(...ys)] : null,
        bearing: Math.round(map.getBearing() * 10) / 10, cam,
        loc: n(['loc']), cone: n(['cone']), acc: fix?.acc ?? 0, walked: n(['walked']), off: n(['off']),
        net: netShown ? n(['net']) : 0, forks: netShown ? n(['forks']) : 0, hl: n(['hl-take']),
        attrib: el.querySelector('.maplibregl-ctrl-attrib')?.textContent ?? ''
      };
    },
    destroy() {
      removeMap(map);
    }
  };
}
