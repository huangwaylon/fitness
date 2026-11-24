// トレイル's map, the MapLibre side (docs/hiking.md "Map", "In-hike map"): the lazy chunk TrailMap.svelte imports only
// when it draws (never under drawOff()), made by the maps' shared makeMap (map/gl.ts: the CSP-safe worker, the
// attribution, the page-pinch guard), drawn as soon as its style is in (style.load: the overlays never wait for tiles).
// The saved places near the track: the shared layer (map/places/layer.ts), its taps and an empty map's through the
// map's one tap router. One map per trail view; destroy() lets go of it (map/gl.ts removeMap).
// Two-finger rotation on (MapLibre's own threshold: 25 px along the fingers' circle before a pinch turns the map; tune on
// a phone), drag-rotate and pitch off. The camera follows the location button's mode (follow.ts Cam): follow keeps the
// dot in the band between the controls and the sheet. The phone's heading only turns the dot's cone, never the map. A
// one-finger pan lets go (on.pan); a pinch or a two-finger turn keeps following (about the dot, the turn kept).
import type { Region } from '#lib/hiking/types.ts';
import type { Prepared } from '#lib/hiking/track.ts';
import type { NetFile } from '#lib/hiking/net.ts';
import { buildStyle, C, CONES, coneImage, NET_LAYERS, PLACES_BEFORE, ROUTE, SRC, TOPO } from './style.ts';
import { progressOf, splitAt, stepAt } from './route.ts';
import type { Cam } from './follow.ts';
import { SAVED_MAX_Z } from '#lib/offline/plan.ts';
import { attribOf, fitBox, fromUser, makeMap, removeMap, revealAbove, setData, settledOf, styleLife, tapRouter, watchMode, type EngineMode } from '../../map/gl.ts';
import { canvasImage } from '../../map/gl-images.ts';
import { FONT, fontFaces } from '../../map/fonts.ts';
import { bboxOf, fc, ln, pt, type LL } from '../../map/geojson.ts';
import { LOC_LAYERS } from '../../map/style.ts';
import type { Fix as MapFix } from '../../map/types.ts';
import { placesLayer, type MapPlace } from '../../map/places/layer.ts';

/** A point on the trail map (the scrub's, the off-route line's ends). */
export interface Fix { lon: number; lat: number }
/** The location: the maps' fix (its accuracy, m); `stale` from before the page last hid (a locked screen): drawn grey
 *  and hollow, no cone, till a fresh fix. */
export type Loc = MapFix & { stale?: boolean };
/** The phone's heading (true, deg) and the cone's half-angle. */
export interface Heading { deg: number; half: number }
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
  /** The saved places near the track (shown: the layer's toggle; small: hike mode's smaller squares). */
  setPlaces(pts: readonly MapPlace[], shown: boolean, small: boolean): void;
  /** The chosen square ringed (null: none). */
  selectPlace(p: MapPlace | null): void;
  /** The chosen square kept clear of the floating card over the map's bottom `cover` px: the map eased up only if
   *  the square would sit under it. */
  reveal(p: MapPlace, cover: number): void;
  /** The compass disc: north up. */
  north(): void;
  /** The band between the controls and the sheet changed (`top` and `bottom` px kept clear): the whole track fitted in
   *  it again unless the camera follows (the dot kept in it) or the map was moved by hand since (its view kept). */
  fit(bottom: number, top: number): void;
  /** (the specs' hook) turn the map as two fingers would. */
  rotateTo(deg: number): void;
  /** What's on screen (the specs' hook: TrailMap's `window.__trailMap`): the drawn features by layer, the track's box
   *  on the map in px (top, bottom), the bearing, the camera mode, the attribution's text. */
  state(): EngineState;
  destroy(): void;
}

interface EngineState {
  track: number; scrub: number; box: [number, number] | null; bearing: number; cam: Cam;
  loc: number; cone: number; acc: number; stale: boolean; walked: number; off: number; net: number; forks: number; hl: number; attrib: string;
  /** The topo source's maxzoom (z16 while the area is saved), the map's zoom (to a tenth), and whether it has settled
   *  (not moving, every tile asked for answered). */
  topoMax: number;
  z: number;
  settled: boolean;
  /** The saved places drawn; each [id, x, y] (px in the map), the chosen one's tag. */
  places: number;
  squares: [string, number, number][];
  tag: string;
}

/** The heading cone: a sky wedge from the dot outward, fading (pointing up: icon-rotate turns it). */
const coneImg = (half: number) =>
  canvasImage(96, 96, (g) => {
    const r = 48, a = (half * Math.PI) / 180;
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
  });
/** A fork's ring: yuzu, cream inside, ⑂ in ink. */
const forkImg = () =>
  canvasImage(22, 22, (g) => {
    g.beginPath();
    g.arc(11, 11, 8, 0, 2 * Math.PI);
    g.fillStyle = C.rim;
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = C.wpt;
    g.stroke();
    g.fillStyle = '#4A3B2A';
    g.font = '700 12px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('⑂', 11, 12);
  });

/** Following: a fix within STILL px of the band's middle moves no camera, one within STEP jumps, a farther one eases. */
const STILL = 16, STEP = 80;

/** `saved`: the trail's area is saved (lib/offline: the topo to z16), the source capped there, online or not, so
 *  MapLibre scales those up past it rather than asking for tiles never saved (a valley with no signal often still says
 *  onLine: a pinch there showed blank z17–18). setSaved changes it on a drawn map (the source swapped in place). */
const topoMax = (r: Region, saved: boolean) => (saved ? Math.min(SAVED_MAX_Z, TOPO[r].maxzoom) : TOPO[r].maxzoom);

export function createEngine(
  el: HTMLElement,
  i: { region: Region; center: Fix; bottom: number; top: number; saved?: boolean },
  on: { mode(m: EngineMode): void; tiles?(): void; bearing?(deg: number): void; pan?(): void; place?(id: string): void; miss?(): void }
): Engine {
  const map = makeMap(el, {
    style: buildStyle(i.region, topoMax(i.region, !!i.saved), i.center.lat, fontFaces()),
    // (the hiking app's: z9 the overview, each source's own ceiling the closest)
    zoom: { min: 9, max: TOPO[i.region].maxzoom },
    rotate: true,
    // (no labels to fade on the topo: a fade made each fix's setData of the dot and its cone ~7 frames, not 1)
    fade: 0,
    view: { center: [i.center.lon, i.center.lat], zoom: 13 }
  });
  // the canvas-drawn icons, in before any feature asks for them (the fork rings, the cones by width)
  const addImages = () => {
    if (!map.hasImage('fork')) map.addImage('fork', forkImg(), { pixelRatio: 2 });
    for (const h of CONES) if (!map.hasImage(`cone-${h}`)) map.addImage(`cone-${h}`, coneImg(h), { pixelRatio: 2 });
  };
  // the saved places near the track, under the route's marks (the raster topo has no labels to make room); the chosen
  // one ringed, its name over it in the app's font (every map's tag: DECISIONS 3); a tap on empty map closes the card
  const places = placesLayer(map, { before: PLACES_BEFORE, font: [FONT], yieldLabels: false, onplace: (id) => on.place?.(id) });
  const dropMiss = tapRouter(map).miss(() => on.miss?.());

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
  // (the first topo tile: the map's loading note goes)
  const loadedNow = watchMode(map, SRC.base, 'hike', on.mode, on.tiles);

  function fit(): void {
    const box = track && bboxOf(track.pts);
    if (!box) return;
    const h = el.clientHeight || 600;
    const t = Math.max(top, 30);
    // a whole zoom, as Leaflet fitted it: the topo's tiles at their own scale (a fractional zoom blurs their labels)
    fitBox(map, box, { pad: { top: t, bottom: Math.max(30, Math.min(h * 0.9 - t, bottom + 30)), left: 30, right: 30 }, maxZoom: 16, whole: true });
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
  /** The track last drawn (a style loaded again draws it without refitting the view). */
  let drawnTrack: Prepared | null | undefined;
  function drawTrack(): void {
    if (!loaded) return;
    const p = track, again = p === drawnTrack;
    drawnTrack = p;
    prog = p ? progressOf(p) : [];
    painted = -1;
    setData(map, SRC.track, fc(p ? [ln(p.pts.map(([lon, lat]) => [lon, lat] as LL))] : []));
    drawWalked();
    const marks = p ? [...p.wpts.map((w) => pt(w.lon, w.lat, { kind: 'wpt' })), pt(p.pts[0][0], p.pts[0][1], { kind: 'start' }), ...(p.closed ? [] : [pt(p.pts.at(-1)![0], p.pts.at(-1)![1], { kind: 'end' })])] : [];
    setData(map, SRC.marks, fc(marks));
    if (!again) fit();
  }
  const drawScrub = () => loaded && setData(map, SRC.scrub, fc(scrub ? [pt(scrub.lon, scrub.lat)] : []));
  /** The dot: its accuracy halo (map/style.ts locLayers), its cone (a stale dot has none). */
  function drawDot(): void {
    if (!loaded) return;
    const props = fix ? { acc: fix.acc, ...(fix.stale ? { stale: true } : heading ? { heading: heading.deg, cone: coneImage(heading.half) } : {}) } : {};
    setData(map, SRC.loc, fc(fix ? [pt(fix.lon, fix.lat, props)] : []));
  }
  function drawNet(): void {
    if (!loaded) return;
    setData(map, SRC.net, fc(net ? net.lines.map((l, k) => ln(l.c as LL[], { k, h: l.h })) : []));
    setData(map, SRC.forks, fc(net && netForks ? net.forks.map((f) => pt(f.p[0], f.p[1])) : []));
    for (const id of NET_LAYERS) map.setLayoutProperty(id, 'visibility', netShown ? 'visible' : 'none');
  }
  const drawHl = () => loaded && setData(map, SRC.hl, fc(hl ? [...hl.others.map((c) => ln(c, { k: 'other' })), ln(hl.take, { k: 'take' })] : []));
  const drawOff = () => loaded && setData(map, SRC.off, fc(off ? [ln([[off[0].lon, off[0].lat], [off[1].lon, off[1].lat]])] : []));

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
  /** A fix while following (hike mode's one a second): the camera left alone while the dot is within STILL px of the
   *  band's middle (a walker's second is under a px at z15: each 400 ms ease was ~25 frames), jumped for a step under
   *  STEP px, eased past it. */
  function follow(): void {
    if (!loaded || !fix || busy || cam !== 'follow') return;
    const p = map.project([fix.lon, fix.lat]), [, dy] = offset();
    const d = Math.hypot(p.x - el.clientWidth / 2, p.y - (el.clientHeight / 2 + dy));
    // (an ease under way, a flight to the dot: left to land, unless the dot has left it)
    if (d < STILL) return;
    recenter(d < STEP && !map.isMoving() ? 0 : 400);
  }

  // the fingers: a one-finger pan lets go; any gesture holds the camera till it ends
  map.on('dragstart', (e) => {
    if (!fromUser(e)) return;
    const t = (e.originalEvent as TouchEvent | undefined)?.touches;
    if (!t || t.length < 2) on.pan?.();
  });
  map.on('movestart', (e) => fromUser(e) && ((busy = true), (moved = true)));
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
  // (the style in, not its tiles: the route, the dot and the places draw over a topo still coming; each style.load: a
  // WebGL context restored loads the style's snapshot again, drawn again from here, the view kept)
  styleLife(map, (first) => {
    addImages();
    loaded = true;
    capTopo();
    drawTrack();
    drawScrub();
    drawNet();
    drawHl();
    drawOff();
    drawDot();
    if (first && flyOnLoad && fix) map.easeTo({ center: [fix.lon, fix.lat], zoom: Math.max(map.getZoom(), 14), duration: 600 });
    loadedNow();
  }, () => (loaded = false));

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
      if (!f) return;
      if (cam === 'follow') {
        if (fly && !busy) map.easeTo({ center: [f.lon, f.lat], offset: offset(), zoom: Math.max(map.getZoom(), 15), duration: 600, essential: true });
        else follow();
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
    setPlaces(p, shown, small) {
      places.set(p, shown, small);
    },
    selectPlace(p) {
      places.select(p);
    },
    reveal: (p, cover) => revealAbove(map, [p.lng, p.lat], cover),
    north() {
      busy = false;
      if (cam === 'follow' && fix) recenter(300, 0);
      else map.easeTo({ bearing: 0, duration: 300 });
    },
    fit(b, t) {
      bottom = b;
      top = t;
      if (cam === 'follow') recenter(250);
      else if (loaded && !moved) fit();
    },
    rotateTo(deg) {
      map.jumpTo({ bearing: deg });
      on.bearing?.(Math.round(map.getBearing() * 10) / 10);
    },
    state: () => {
      const ys = track?.pts.map(([lon, lat]) => map.project([lon, lat]).y);
      const n = (layers: string[]) => (loaded ? map.queryRenderedFeatures({ layers }).length : 0);
      const saved = places.state();
      return {
        track: n(['track']), scrub: n(['scrub']), box: ys ? [Math.min(...ys), Math.max(...ys)] : null,
        bearing: Math.round(map.getBearing() * 10) / 10, cam,
        loc: n([LOC_LAYERS.dot]), cone: n(['cone']), acc: fix?.acc ?? 0, stale: !!fix?.stale, walked: Math.max(0, painted), off: n(['off']),
        net: netShown ? n(['net']) : 0, forks: netShown ? n(['forks']) : 0, hl: n(['hl-take']),
        attrib: attribOf(el),
        topoMax: (map.getSource(SRC.base) as unknown as { maxzoom: number } | undefined)?.maxzoom ?? 0,
        z: Math.round(map.getZoom() * 10) / 10,
        settled: settledOf(map, loaded),
        places: saved.squares.length,
        ...saved
      };
    },
    destroy() {
      places.destroy();
      dropMiss();
      removeMap(map);
    }
  };
}
