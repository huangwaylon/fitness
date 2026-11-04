// The 3D island (docs/design.md "World", docs/decisions.md "The island in 3D"): the island drawn in three.js, NH's way,
// under the island's DOM (IslandScene: its World places every DOM node through this camera, and the DOM
// keeps the taps, the popups, the balloons and the marks; their art goes invisible where a model or a card draws it).
//   The camera: NH's fixed, high island camera with a long lens, the rolling log bending the world away (bend.ts, every
//   material). One finger scrolls along the island (z) with a free fling and soft ends; two pinch the zoom (clamped,
//   eased back at the limits, the pitch lowering as it zooms in, as NH's does). Its x is always the island's middle;
//   it never rotates, and nothing but the finger moves it.
//   The ground: the layout's (terrain.ts buildGround: its land, cliffs and water, bent here).
//   The things: NH's models (things.ts); the villagers and what has no model yet: cards (cards.ts).
//   The lights: lights.ts (always-on emissive and halos, faded point lights). Shadows on by default.
//   The frames: せってい's frame rate (30 or 60: store/frameRate.svelte.ts) while anything moves; while only the
//   ambience does (the water, the season's fall, a fire's flicker, a sleeper's zzz, a blink) `ambient` a second (30 at
//   most; a software renderer's few); none when nothing does, none hidden or paused (a sheet over the island). The
//   World's step runs in each frame before it draws, so the DOM moves with the picture.
// Plain TS; world3d/Island3D.svelte drives it.
import {
  Box3, Color, DirectionalLight, Fog, HemisphereLight, Mesh, PerspectiveCamera, Scene, SRGBColorSpace, Texture, Vector3,
  WebGLRenderer, PCFSoftShadowMap, type Material, type Object3D
} from 'three';
import { bend, bendPoint, bendU, unbendRay } from './bend.ts';
import { waterFog, waterU } from './water.ts';
import { createThings, type Things } from './things.ts';
import { createCards, type Cards } from './cards.ts';
import { createEffects, type FxKind, type FxOpts } from './effects.ts';
import { createLights, lampFog, type LampSpot } from './lights.ts';
import type { Inst } from './objects.ts';
import { drawOff } from '../../ui-state/testMode.ts';
import { releaseAll, resourcesOf } from './release.ts';
import { due, frameRate } from '#lib/store/frameRate.svelte.ts';

type Tod = 'day' | 'dusk' | 'night';

/** @public */
export interface Land {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  r: number;
}
/** @public The ground the island stands on (the layout's: terrain.ts buildGround): its own meshes (the land, the cliffs
 *  and all its water), added once and bent here. */
export interface BuiltGround {
  group: Object3D;
  heightAt(x: number, z: number): number;
  /** Where a walker's feet are (a bridge's deck); the ground's height if absent. */
  feet?(x: number, z: number): number;
  land: Land;
  /** Its bands (a row of chunks across the island), culled with the camera. */
  chunks?(): { z0: number; z1: number; meshes: Mesh[] }[];
  /** Called in each frame (its water's time, a paint stroke's rebuild): true while it moves (frames at the full rate),
   *  'ambient' while only its ambience does (its water: the ambient rate), false when still. */
  update?(t: number): Want;
  dispose?(): void;
}
/** What a frame's part wants next: true something moves (the full rate), 'ambient' only its ambience (the ambient rate),
 *  false nothing. */
type Want = boolean | 'ambient';

export interface Options {
  dpr: number;
  shadows: boolean;
  /** Frames a second while only the ambience moves (the water, the fall, a flicker): 0 none (it holds still). */
  ambient: number;
}
interface Stats {
  fps: number;
  /** CPU per frame (ms: the World's step, three's work and the GL calls) and the interval between frames drawn. */
  cpu: [number, number];
  gap: [number, number];
  calls: number;
  tris: number;
  textures: number;
  geometries: number;
  dpr: number;
  frames: number;
  loading: number;
  camZ: number;
  zoom: number;
  points: number;
  lamps: number;
  /** The flourishes playing (effects.ts). */
  fx: number;
  /** How many flourishes' parts (not the ambience's) have come on so far (a short one may be over when it's read). */
  fxShown: number;
  /** What wanted the last frame (`~`: its ambience only), and whether the island is paused. */
  why: string[];
  paused: boolean;
  /** False in the e2e's logic mode (testMode.ts drawOff): the frames run, nothing is drawn. */
  drawn: boolean;
}

/** The camera: vertical field of view (a long lens), the pitch at zoom 1 / fully in / fully out, the zoom's range. */
const FOV = 30;
const PITCH = { def: 58, near: 40, far: 63 };
/** The zoom's range: the default (1) is the widest the island rests at (the user: zoomed out past it, a pinch gives
 *  rubber-band resistance and springs back on release, ZOOM_BACK_MS); fully in (the user: "increase the maximum zoom
 *  level", 1.8 before) close enough for a villager's face and a flower: the camera ~420u off, its near plane 20. */
const ZOOM = { min: 1, max: 3.2 };
/** How far past a limit a pinch may go (eased back on release), as a factor: in past the end ZOOM_OVER, out past the
 *  default ZOOM_UNDER (further, a felt stretch). */
const ZOOM_OVER = 1.12, ZOOM_UNDER = 1.2;
/** A pinch released zoomed out past the default goes back to it over this, eased out (the user's approved move). */
const ZOOM_BACK_MS = 350;
/** Zoomed in past the default, the view may pan sideways over the land and this much sea (u) either side… */
const SEA_X = 24;
/** …the sideways room growing in over this much zoom past the default (so it's exactly centred at the default). */
const X_RAMP = 0.3;
/** Where the camera may look (the pivot's world z): the sea in front of まえ … the falls and the forest above the cliff. */
const CAM_Z = { min: 30, max: 1000 } as const;
/** The island's middle (the camera's x, always). */
const MID_X = 195;
/** The width the camera shows at the pivot at zoom 1 (u): the land is 470 (its beaches just off the sides). */
const VIEW_W = 420;
/** How far below the screen's middle the pivot sits (a share of the height). */
const PIVOT_DROP = 0.16;
/** The haze's start and end, as shares of the horizon's view depth: only what stands by the horizon fades a little. */
const LAND_HAZE = [0.8, 1.35] as const;
/** The shadow map's box moves in steps of this (u): it redraws when it steps, not on every frame of a scroll. */
const SHADOW_STEP = 40;
/** The shadow box's least half width (u; its reach ahead 1.4 of it). */
const SHADOW_MIN = 200;
/** The cards lean back this share of the camera's pitch. */
const LEAN = 0.42;
const now = () => performance.now();
const pctl = (a: number[], p: number) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};

interface TodLook {
  fog: number;
  hemi: [number, number, number];
  sun: [number, number];
  sunAt: [number, number, number];
  tint: number;
  lamps: number;
  villager: number;
  /** NH's flat, soft look: each model lit a little by its own colour, whatever way its faces turn. */
  lift: number;
}
const TOD: Record<Tod, TodLook> = {
  day: { fog: 0xd7f0ff, hemi: [0xffffff, 0xe6efd4, 3.0], sun: [0xfff3df, 1.5], sunAt: [-0.55, 1, 0.75], tint: 0xffffff, lamps: 0, villager: 0xffffff, lift: 0.32 },
  dusk: { fog: 0xf2b996, hemi: [0xffd2b4, 0xb09ab0, 2.5], sun: [0xffa66a, 1.3], sunAt: [0.9, 0.45, 0.4], tint: 0xffd6c0, lamps: 0.7, villager: 0xffd9c4, lift: 0.22 },
  night: { fog: 0x223463, hemi: [0x7d93d6, 0x3a4570, 1.7], sun: [0xa9bcff, 0.5], sunAt: [-0.3, 1, 0.5], tint: 0x8795c8, lamps: 1, villager: 0x9aa6d6, lift: 0.08 }
};

export interface Island3 {
  resize(): void;
  /** What stands on the island (a full list: only what changed rebuilds). */
  place(list: readonly Inst[]): Promise<void>;
  things: Things;
  cards: Cards;
  /** Extra lights beside the models' (a decoration's lamp, a Halloween lantern). */
  glows(list: readonly LampSpot[]): void;
  /** The time of day, and a wet day's darkening (0 … 1) and its colour. */
  tod(t: Tod, wet?: number, fog?: string): void;
  // ---- the finger ----
  /** Scroll by a drag of `dy` client px (down: toward まえ). */
  pan(dy: number, dx?: number): void;
  /** Zoom by a factor, about a screen y (the pinch's middle: the ground there stays put). */
  zoom(f: number, sy?: number): void;
  /** A release's fling (px/ms). */
  fling(vy: number, vx?: number): void;
  touching(on: boolean): void;
  /** The camera (the e2e, the way back from the tent). */
  view(): { camZ: number; zoom: number; pitch: number; camX: number };
  /** `free`: past the ends if need be (the e2e's camera, at world.ts's old stops: the ends widen to take it); `x` the
   *  camera's x (clamped: centred at the default zoom). */
  go(camZ: number, zoom?: number, free?: boolean, x?: number): void;
  /** How far the camera's x may be from the middle at this zoom (u): 0 at the default or wider. */
  xRoom(zoom?: number): number;
  /** The zoom's range (the default, fully in). */
  zoomRange(): { min: number; max: number };
  limits(): { min: number; max: number };
  /** The test hook's (docs/ops/testing.md): what's drawn now with a NaN in its bounds, or reaching far off the island
   *  (`reach` u past the ground's plan): a stray vertex (a quantized mesh baked wrong) draws a line across the screen. */
  strays(reach?: number): { name: string; box: number[] }[];
  /** The test hook's: drawn materials whose blending writes the canvas's alpha with light (three's additive, subtractive,
   *  multiply): over the transparent sky they draw a box (bend.ts glow()). */
  alphaBlends(): string[];
  /** Frame one thing (the bulletin board: the user's one exception to "nothing but the finger moves the camera"): the
   *  camera eases to it over `ms` (600), centred on it, `zoom` (2.2) and `pitch` (degrees, 30) its own; the finger does
   *  nothing until restore(), which eases back to exactly where the camera was. */
  focusOn(target: { x: number; z: number; lift?: number }, o?: { zoom?: number; pitch?: number; ms?: number }): Promise<void>;
  /** The bulletin board's focus (docs/board.md): a rect (its middle x, z on the ground, y up, w × h u) framed face-on
   *  in the screen above `bottom` px, filling `fill` of it; called again while focused it re-frames from where it is. */
  frame(f: { x: number; z: number; y: number; w: number; h: number; yaw?: number; top?: number; bottom?: number; fill?: number }, ms?: number): Promise<void>;
  restore(ms?: number): Promise<void>;
  /** A flourish in the world (effects.ts): a tap's dust, a splash, sparkles, a 「！」. */
  fx(kind: FxKind, x: number, z: number, lift?: number, o?: FxOpts): void;
  /** A built model of the scene's own stood on the island (a home, a bridge, stairs: world3d/home.ts, structure.ts),
   *  its origin on the ground at (x, z) (or at `y`), turned by `yaw`, bent with the island, casting shadows; again
   *  with the same id replaces it, null takes it away. */
  placeGroup(id: string, obj: Object3D | null, at?: { x: number; z: number; yaw?: number; y?: number }): void;
  /** The ids of the groups placed (the e2e's). */
  placedGroups(): string[];
  /** Something of the scene's own in the world (a fishing line), bent with the island; its removal returned. */
  add(obj: Object3D): () => void;
  /** Every flourish's model loaded and on the GPU ahead of its first use (effects.ts warm): once, after the island loads. */
  warmFx(): Promise<void>;
  fxWarmed(): boolean;
  /** How many flourishes play (with this ambient tag). */
  fxCount(tag?: string): number;
  /** The ids of the lamps lit now (the e2e's: a model's id, a stand-in's `s:` prefixed). */
  lamps(): string[];
  /** The GPU's name (a software renderer, CI's: the scene draws at its lightest). */
  gpu(): string;
  /** The camera's ends for this screen (the scene fits them: まえ's shore, おく's campsite). */
  setLimits(min: number, max: number): void;
  // ---- the projection (the World's Proj3; px from the canvas's top-left) ----
  at(x: number, z: number, lift: number): { sx: number; sy: number; k: number; up: number; ground: number; depth: number; visible: boolean };
  groundAt(sx: number, sy: number): { x: number; z: number } | null;
  horizon(): number;
  rev(): number;
  kick(): void;
  /** Nothing moving (the ambience may still run at its rate). */
  idle(): boolean;
  /** No frames at all while paused (a sheet over the island); a frame at once when it ends. */
  pause(on: boolean): void;
  /** Paused (pause()). */
  isPaused(): boolean;
  /** The camera at rest: no finger, fling, spring back, settle or focus move under way (whatever else moves). */
  camStill(): boolean;
  /** Called in every frame before it draws: true wants another at the full rate (something moves), 'ambient' at the
   *  ambient rate. */
  onFrame(fn: ((t: number) => Want) | null): void;
  options(o: Partial<Options>): void;
  stats(): Stats;
  dispose(): void;
}

export function createIsland(canvas: HTMLCanvasElement, makeGround: (renderer: WebGLRenderer) => BuiltGround, init: Partial<Options> & { aa?: boolean } = {}): Island3 {
  const opts: Options = { dpr: Math.min(2, window.devicePixelRatio || 1), shadows: true, ambient: 30, ...init };
  // the e2e's logic mode (testMode.ts): every frame runs (the scene, the cameras, the hooks), nothing is drawn
  const noDraw = drawOff();
  if (noDraw) Object.assign(opts, { dpr: 1, shadows: false });
  const renderer = new WebGLRenderer({ canvas, antialias: init.aa ?? true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(opts.dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = opts.shadows;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  bendU.uBendR.value = 1300;
  // (a ground built on this renderer: the layout's terrain bakes its look on the GPU)
  const ground = makeGround(renderer);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 20, 6000);
  const fog = new Fog(0xd7f0ff, 1400, 3200);
  scene.fog = fog;
  const hemi = new HemisphereLight(0xeaf6ff, 0x9ac276, 1.55);
  const sun = new DirectionalLight(0xfff3df, 1.9);
  sun.castShadow = opts.shadows;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 1.2;
  sun.shadow.radius = 3;
  scene.add(hemi, sun, sun.target);
  let todLook = TOD.day;

  // ---- the ground (built on the layout), bent here ----
  const src = { height: (x: number, z: number) => ground.heightAt(x, z), feet: (x: number, z: number) => (ground.feet ?? ground.heightAt)(x, z) };
  ground.group.traverse((n) => {
    const m = (n as Mesh).material as Material | Material[] | undefined;
    for (const x of m ? (Array.isArray(m) ? m : [m]) : []) bend(x);
    (n as Mesh).frustumCulled = false;
  });
  scene.add(ground.group);

  // ---- the things, the cards, the lights ----
  const things = createThings(scene, src.height, (sh = true, soon = false) => (sh && (shadowsDirty = true), soon && (raf || timer) ? undefined : kick()));
  const cards = createCards(scene, (sh) => (sh && (shadowsDirty = true), kick()));
  const lights = createLights(scene);
  const effects = createEffects(scene, src.feet, () => kick());
  let extraGlows: readonly LampSpot[] = [];
  const relight = () => lights.set([...things.lamps(), ...extraGlows]);
  async function place(list: readonly Inst[]) {
    await things.place(list);
    relight();
    shadowsDirty = true;
    kick();
  }

  // ---- the camera ----
  const lim = { min: CAM_Z.min as number, max: CAM_Z.max as number };
  let camZ = lim.min, zoomK = 1, pitch = (PITCH.def * Math.PI) / 180, rev = 0, shadowKey = '';
  let W = 1, H = 1, D0 = 1500, focal = 1;
  const pitchAt = (k: number) => {
    const kk = Math.max(ZOOM.min, Math.min(ZOOM.max, k));
    const deg = kk >= 1 ? PITCH.def + (PITCH.near - PITCH.def) * ((kk - 1) / (ZOOM.max - 1)) : PITCH.def + (PITCH.far - PITCH.def) * ((1 - kk) / (1 - ZOOM.min));
    return (deg * Math.PI) / 180;
  };
  /** A focus (the bulletin board's: docs/decisions.md "The island in 3D"): the camera framing one thing, its own x,
   *  pitch, height and pivot drop, eased in (k 0 … 1) over the finger's camera. */
  let camX = MID_X, fx = MID_X, fy = 0, fpitch = 0, fk = 0, fdrop = 0, drop = PIVOT_DROP;
  function aim() {
    pitch = pitchAt(zoomK);
    if (fk > 0) pitch += (fpitch - pitch) * fk;
    const D = D0 / zoomK, cx = camX + (fx - camX) * fk, cy = fy * fk;
    camera.position.set(cx, cy + D * Math.sin(pitch), -camZ + D * Math.cos(pitch));
    camera.lookAt(cx, cy, -camZ);
    const d = PIVOT_DROP + (fdrop - PIVOT_DROP) * fk;
    if (d !== drop) {
      drop = d;
      camera.setViewOffset(W, H, 0, -drop * H, W, H);
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
    things.camera(camera.quaternion);
    bendU.uBendZ.value = -camZ;
    // NH's haze: the far sea (and what stands far off) fades into the sky's horizon colour, all of it by the log's
    // horizon, so the sea meets the sky in one soft line at every scroll and zoom (no hard band of open sea)
    const hd = horizonDepth();
    fog.near = hd * LAND_HAZE[0];
    fog.far = hd * LAND_HAZE[1];
    waterFog(fog);
    lampFog.near.value = fog.near;
    lampFog.far.value = fog.far;
    // the shadow's box follows the pivot, as wide as the view, in steps (the shadow map redraws only when it steps)
    const zq = Math.round(camZ / SHADOW_STEP) * SHADOW_STEP, kq = Math.round(zoomK * 8) / 8;
    const xq = Math.round(camX / SHADOW_STEP) * SHADOW_STEP;
    const key = `${zq}:${kq}:${xq}:${todLook.sunAt}`;
    if (key !== shadowKey) {
      shadowKey = key;
      // (zoomed right in the low pitch sees further ahead of the pivot than the width: at least SHADOW_MIN)
      const half = Math.max(SHADOW_MIN, (VIEW_W / Math.max(ZOOM.min, kq - 0.0625)) * 0.75 + SHADOW_STEP);
      Object.assign(sun.shadow.camera, { left: -half, right: half, top: half * 1.4, bottom: -half * 1.1, near: 10, far: 1800 });
      sun.shadow.camera.updateProjectionMatrix();
      sun.position.set(xq + todLook.sunAt[0] * 700, todLook.sunAt[1] * 700, -zq - 120 + todLook.sunAt[2] * 700);
      sun.target.position.set(xq, 0, -zq - 120);
      sun.target.updateMatrixWorld();
      shadowsDirty = true;
    }
    // the ground's bands in reach (the bend drops the far ones behind the horizon)
    if (ground.chunks)
      for (const b of ground.chunks()) {
        const on = b.z1 > camZ - 700 && b.z0 < camZ + 1500;
        for (const m of b.meshes) m.visible = on;
      }
    rev++;
    horizonY = NaN;
  }
  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    D0 = VIEW_W / (2 * Math.tan(((FOV / 2) * Math.PI) / 180) * camera.aspect);
    // the pivot (the ground the camera looks at) a little below the middle: more island ahead, the horizon high
    camera.setViewOffset(W, H, 0, -drop * H, W, H);
    camera.updateProjectionMatrix();
    focal = H / 2 / Math.tan(((FOV / 2) * Math.PI) / 180);
    aim();
    kick();
  }

  // ---- the projection ----
  const v3 = new Vector3();
  /** A three-space point (already bent) → canvas px and its view depth. */
  function screen(x: number, y: number, z: number): [number, number, number] {
    v3.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
    const depth = -v3.z;
    v3.applyMatrix4(camera.projectionMatrix);
    return [((v3.x + 1) / 2) * W, ((1 - v3.y) / 2) * H, depth];
  }
  function at(x: number, z: number, lift: number) {
    const R = bendU.uBendR.value, pz = -camZ;
    const gy = src.feet(x, z);
    const [bx, by, bz] = bendPoint(x, gy + lift, -z, pz, R);
    const [sx, sy, depth] = screen(bx, by, bz);
    const k = depth > 1 ? focal / depth : 0;
    // the foreshortening of an upright (a model's height) and of the ground, here
    const [ux, uy, uz] = bendPoint(x, gy + lift + 10, -z, pz, R), [, uy2] = screen(ux, uy, uz);
    const [fx, fy, fz] = bendPoint(x, gy, -(z + 6), pz, R), [, fy2] = screen(fx, fy, fz);
    const up = k ? Math.max(0.05, (sy - uy2) / (10 * k)) : 1, ground = k ? Math.max(0, (sy - fy2) / (6 * k)) : 0;
    // in front of the horizon: the ground faces the camera here (a tall thing's top may still show over it)
    const th = (z - camZ) / R, ny = Math.cos(th), nz = -Math.sin(th);
    const cy = camera.position.y - by, cz = camera.position.z - bz;
    const visible = depth > 1 && (ny * cy + nz * cz) / Math.hypot(cy, cz) > -0.12;
    return { sx, sy, k, up, ground, depth, visible };
  }
  function groundAt(sx: number, sy: number): { x: number; z: number } | null {
    v3.set((sx / W) * 2 - 1, -(sy / H) * 2 + 1, 0.5).unproject(camera);
    const o = camera.position, d = v3.sub(o).normalize();
    let h = 3, hitP: { x: number; z: number } | null = null;
    for (let i = 0; i < 3; i++) {
      const p = unbendRay([o.x, o.y, o.z], [d.x, d.y, d.z], h, -camZ, bendU.uBendR.value);
      if (!p) return hitP;
      hitP = { x: p[0], z: -p[1] };
      h = Math.max(-2, src.height(hitP.x, hitP.z));
    }
    return hitP;
  }
  /** The view depth of the log's horizon (the far tangent from the camera, in the y-z plane). */
  function horizonDepth(): number {
    const [y, z] = tangent();
    v3.set(camera.position.x, y, z).applyMatrix4(camera.matrixWorldInverse);
    return Math.max(100, -v3.z);
  }
  function tangent(): [number, number] {
    const R = bendU.uBendR.value + 3, oy = -bendU.uBendR.value, oz = -camZ;
    const cy = camera.position.y - oy, cz = camera.position.z - oz, L = Math.hypot(cy, cz);
    const base = Math.atan2(cy, cz), a = Math.acos(Math.min(1, R / L));
    const t1 = base + a, t2 = base - a;
    const p1: [number, number] = [oy + R * Math.sin(t1), oz + R * Math.cos(t1)], p2: [number, number] = [oy + R * Math.sin(t2), oz + R * Math.cos(t2)];
    return p1[1] < p2[1] ? p1 : p2;
  }
  let horizonY = NaN;
  /** Where the ground's silhouette is on screen: the tangent from the camera to the log, seen in the y-z plane. */
  function horizon(): number {
    if (!Number.isNaN(horizonY)) return horizonY;
    // the far tangent point (beyond the pivot: three's −z)
    const far = tangent();
    horizonY = Math.max(0, screen(camera.position.x, far[0], far[1])[1]);
    return horizonY;
  }
  /** How much a card must stretch to show as tall as it's wide-scaled: the inverse of its height's foreshortening. */
  function stretch(x: number, y: number, z: number, lean: number): number {
    const R = bendU.uBendR.value, pz = -camZ;
    const [bx, by, bz] = bendPoint(x, y, -z, pz, R);
    const [, sy, depth] = screen(bx, by, bz);
    const th = (z - camZ) / R, a = lean + th;
    // its up: leaning back by its lean and the log's slope there
    const [, ty] = screen(bx, by + 10 * Math.cos(a), bz - 10 * Math.sin(a));
    const k = depth > 1 ? focal / depth : 1;
    return Math.min(2.2, Math.max(1, (10 * k) / Math.max(0.1, sy - ty)));
  }

  // ---- the finger ----
  let touch = false, vel = 0, lastT = 0, settling = false;
  const unitsPerPx = () => (2 * (D0 / zoomK) * Math.tan(((FOV / 2) * Math.PI) / 180)) / H;
  /** Past an end the scroll gives less and less (iOS's rubber band). */
  const rubber = (over: number) => (over <= 0 ? 0 : (1 - 1 / (over / 160 + 1)) * 160);
  let rawZ = camZ;
  const clampZ = (z: number) => (z < lim.min ? lim.min - rubber(lim.min - z) : z > lim.max ? lim.max + rubber(z - lim.max) : z);
  /** A lighter pixel ratio while the camera moves (the tent's way), back once it's still; never for a tap. */
  let lightened = false;
  function light(on: boolean) {
    if (on === lightened || opts.dpr <= 1.5) return;
    lightened = on;
    renderer.setPixelRatio(on ? 1.5 : opts.dpr);
    renderer.setSize(W, H, false);
  }
  /** The sideways room at a zoom (u either side of the middle): none at the default or wider; zoomed in, as far as
   *  keeps the view over the land and SEA_X of sea, growing in over X_RAMP of zoom. */
  function xRoom(k = zoomK): number {
    if (k <= ZOOM.min) return 0;
    const L = ground.land, half = (L.x1 - L.x0) / 2 + SEA_X, view = VIEW_W / (2 * k);
    return Math.max(0, half - view) * Math.min(1, (k - ZOOM.min) / X_RAMP);
  }
  const clampX = (x: number, k = zoomK) => {
    const r = xRoom(k);
    return Math.max(MID_X - r, Math.min(MID_X + r, x));
  };
  function pan(dy: number, dx = 0) {
    if (focus) return;
    light(true);
    settling = false;
    rawZ += (dy * unitsPerPx()) / Math.sin(pitch);
    camZ = clampZ(rawZ);
    // sideways only zoomed in (the drag's x moves the view with the finger)
    if (dx) camX = clampX(camX - dx * unitsPerPx());
    aim();
    activity();
  }
  let rawK = zoomK;
  const clampK = (k: number) => {
    const lo = ZOOM.min, hi = ZOOM.max;
    if (k < lo) return lo / (1 + (ZOOM_UNDER - 1) * (1 - 1 / ((lo / k - 1) * 4 + 1)));
    if (k > hi) return hi * (1 + (ZOOM_OVER - 1) * (1 - 1 / ((k / hi - 1) * 4 + 1)));
    return k;
  };
  function zoom(f: number, sy = H * (0.5 + PIVOT_DROP), sx = W / 2) {
    if (focus) return;
    light(true);
    settling = false;
    zoomBack = null;
    const before = groundAt(sx, sy);
    rawK *= f;
    zoomK = clampK(rawK);
    // (toward the default the sideways room shrinks: x eases to the middle, exactly there at the default)
    camX = clampX(camX);
    aim();
    // the ground under the pinch stays put (its x only as far as the sideways room lets it)
    const after = groundAt(sx, sy);
    if (before && after) {
      camZ += before.z - after.z;
      rawZ = camZ;
      camZ = Math.max(lim.min - 160, Math.min(lim.max + 160, camZ));
      camX = clampX(camX + before.x - after.x);
      aim();
    }
    activity();
  }
  let velX = 0;
  function fling(vy: number, vx = 0) {
    if (focus) return;
    vel = vy;
    velX = xRoom() > 0 ? vx : 0;
    lastT = now();
    activity();
  }
  /** The spring back to the default zoom after a pinch released zoomed out past it (eased out over ZOOM_BACK_MS). */
  let zoomBack: { t0: number; k0: number } | null = null;
  const easeOut = (k: number) => 1 - (1 - k) ** 3;
  /** Back inside the limits (a released rubber band, the zoom past its end), eased. */
  function settle(dt: number): boolean {
    let more = false;
    const zt = Math.max(lim.min, Math.min(lim.max, camZ)), kt = Math.max(ZOOM.min, Math.min(ZOOM.max, zoomK));
    const e = 1 - Math.exp(-dt / 90);
    if (Math.abs(zt - camZ) > 0.05) {
      camZ += (zt - camZ) * e;
      more = true;
    } else camZ = zt;
    // zoomed out past the default: back to it over ZOOM_BACK_MS, eased out (x is centred all the while)
    if (!zoomBack && zoomK < ZOOM.min - 0.0005) zoomBack = { t0: now(), k0: zoomK };
    if (zoomBack) {
      const k = Math.min(1, (now() - zoomBack.t0) / ZOOM_BACK_MS);
      zoomK = zoomBack.k0 + (ZOOM.min - zoomBack.k0) * easeOut(k);
      if (k >= 1) zoomBack = null;
      else more = true;
    } else if (Math.abs(kt - zoomK) > 0.0005) {
      zoomK += (kt - zoomK) * e;
      more = true;
    } else zoomK = kt;
    camX = clampX(camX);
    rawZ = camZ;
    rawK = zoomK;
    aim();
    return more;
  }

  // ---- a focus: the camera frames one thing, then goes back exactly where it was (the board's; nothing else moves it) ----
  interface Cam {
    z: number;
    k: number;
    fk: number;
    x: number;
    y: number;
    pitch: number;
    drop: number;
  }
  interface Move {
    t0: number;
    ms: number;
    from: Cam;
    to: Cam;
    done: () => void;
  }
  let focus: { back: { z: number; k: number; x: number } } | null = null, move: Move | null = null;
  /** NH's dolly: a cubic in and out. */
  const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
  const camNow = (): Cam => ({ z: camZ, k: zoomK, fk, x: fx, y: fy, pitch: fpitch, drop: fdrop });
  function moveTo(to: Cam, ms: number): Promise<void> {
    move?.done();
    vel = 0;
    settling = false;
    return new Promise((done) => {
      move = { t0: now(), ms: Math.max(1, ms), from: camNow(), to, done };
      activity(ms + 100);
    });
  }
  function stepMove(t: number): boolean {
    if (!move) return false;
    const m = move, k = ease(Math.min(1, (t - m.t0) / m.ms)), lerp = (a: number, b: number) => a + (b - a) * k;
    camZ = rawZ = lerp(m.from.z, m.to.z);
    zoomK = rawK = lerp(m.from.k, m.to.k);
    fk = lerp(m.from.fk, m.to.fk);
    // (the framed point eases from where the last focus left it; the first one from the island's own view)
    const first = m.from.fk === 0;
    fx = first ? m.to.x : lerp(m.from.x, m.to.x);
    fy = first ? m.to.y : lerp(m.from.y, m.to.y);
    fpitch = first ? m.to.pitch : lerp(m.from.pitch, m.to.pitch);
    fdrop = first ? m.to.drop : lerp(m.from.drop, m.to.drop);
    aim();
    if (k >= 1) {
      move = null;
      m.done();
      return false;
    }
    return true;
  }
  /** The bulletin board's (docs/board.md): look at a rect face-on, framed in the screen above `bottom`. */
  function frameRect(f: { x: number; z: number; y: number; w: number; h: number; yaw?: number; top?: number; bottom?: number; fill?: number }, ms = 600): Promise<void> {
    if (!focus) focus = { back: { z: camZ, k: zoomK, x: camX } };
    const fill = f.fill ?? 0.9, bottom = Math.max(0, Math.min(H * 0.7, f.bottom ?? 0)), top = Math.max(0, Math.min(H * 0.5, f.top ?? 0));
    const free = Math.max(H * 0.2, H - bottom - top), t = Math.tan(((FOV / 2) * Math.PI) / 180);
    // the distance that fits its height in the free screen (between the HUD and the keyboard) and its width across
    const D = Math.max((f.h * H) / (fill * free * 2 * t), f.w / (fill * 2 * t * camera.aspect));
    // a little from above, as NH's board view; its middle at the free screen's middle
    const pitch = (8 * Math.PI) / 180;
    return moveTo({ z: f.z, k: D0 / D, fk: 1, x: f.x, y: src.feet(f.x, f.z) + f.y, pitch, drop: (top - bottom) / (2 * H) }, ms);
  }
  function focusOn(target: { x: number; z: number; lift?: number }, o: { zoom?: number; pitch?: number; ms?: number } = {}): Promise<void> {
    if (!focus) focus = { back: { z: camZ, k: zoomK, x: camX } };
    const to = { z: target.z, k: o.zoom ?? 2.2, fk: 1, x: target.x, y: src.feet(target.x, target.z) + (target.lift ?? 0), pitch: ((o.pitch ?? 30) * Math.PI) / 180, drop: 0 };
    return moveTo(to, o.ms ?? 600);
  }
  function restore(ms = 600): Promise<void> {
    if (!focus) return Promise.resolve();
    const back = focus.back;
    return moveTo({ ...camNow(), z: back.z, k: back.k, fk: 0 }, ms).then(() => {
      focus = null;
      camZ = rawZ = back.z;
      zoomK = rawK = back.k;
      camX = back.x;
      fk = 0;
      aim();
    });
  }

  // ---- time of day ----
  function tod(t: Tod, wet = 0, fogCss?: string) {
    todLook = TOD[t];
    const dim = 1 - 0.35 * wet;
    fog.color.set(fogCss && /^#[0-9a-f]{6}$/i.test(fogCss) ? fogCss : todLook.fog);
    hemi.color.set(todLook.hemi[0]);
    hemi.groundColor.set(todLook.hemi[1]);
    hemi.intensity = todLook.hemi[2] * dim;
    sun.color.set(todLook.sun[0]);
    sun.intensity = todLook.sun[1] * (1 - 0.6 * wet);
    waterU.uTint.value.set(todLook.tint).multiplyScalar(dim);
    things.tod(todLook.lamps, todLook.lift * dim);
    lights.level(todLook.lamps);
    cards.tint(new Color(todLook.villager).multiplyScalar(0.94 + 0.06 * dim).getHex());
    aim();
    activity();
  }

  // ---- options ----
  function options(o: Partial<Options>) {
    Object.assign(opts, o);
    if (o.dpr !== undefined) {
      lightened = false;
      renderer.setPixelRatio(opts.dpr);
      resize();
    }
    if (o.shadows !== undefined && renderer.shadowMap.enabled !== opts.shadows) {
      renderer.shadowMap.enabled = opts.shadows;
      sun.castShadow = opts.shadows;
      scene.traverse((n) => {
        const m = (n as Mesh).material as Material | Material[] | undefined;
        for (const x of m ? (Array.isArray(m) ? m : [m]) : []) x.needsUpdate = true;
      });
      shadowsDirty = true;
    }
    activity();
  }

  // ---- the frames ----
  let raf = 0, timer: ReturnType<typeof setTimeout> | 0 = 0, frames = 0, disposed = false, shadowsDirty = true, activeUntil = 0, lastFrame = 0;
  /** The last frame's: something moved (the full rate), only the ambience did. */
  let busy = false, ambience = false, paused = false, inFrame = false;
  let hook: ((t: number) => Want) | null = null;
  const groupsPlaced = new Map<string, { obj: Object3D; off: () => void }>();
  /** A placed group's resources once it was replaced or removed (a もようがえ's home, bridge or pond: the models'
   *  cache's, maybe in nothing else in the scene by the end): let go of with the scene's at the end, or they keep this
   *  renderer alive. */
  const unplaced: ReturnType<typeof resourcesOf> = new Set();
  function addObj(obj: Object3D): () => void {
    obj.traverse((n) => {
      const m = (n as Mesh).material as Material | Material[] | undefined;
      for (const x of m ? (Array.isArray(m) ? m : [m]) : []) bend(x);
      n.frustumCulled = false;
    });
    scene.add(obj);
    kick();
    return () => {
      scene.remove(obj);
      kick();
    };
  }
  const cpu: number[] = [], gaps: number[] = [], stamps: number[] = [];
  /** What wanted the last frames (the e2e's and perf's: which part keeps the island drawing). */
  const why = new Set<string>();
  const activity = (ms = 300) => {
    activeUntil = Math.max(activeUntil, now() + ms);
    kick();
  };
  /** A frame as soon as the display has one (a change from outside: a model in, a tap, the camera). A kick from inside
   *  a frame is that frame's own (what it changed is drawn in it): its parts' wants say whether another follows. */
  function kick() {
    if (inFrame || disposed) return;
    if (timer) {
      clearTimeout(timer);
      timer = 0;
    }
    if (!raf) raf = requestAnimationFrame(frame);
  }
  /** The next frame after `ms` (the ambient rate: no display frames woken in between). */
  function later(ms: number) {
    if (raf || timer || disposed) return;
    if (ms <= 12) raf = requestAnimationFrame(frame);
    else timer = setTimeout(() => {
      timer = 0;
      if (!raf && !disposed) raf = requestAnimationFrame(frame);
    }, ms - 8);
  }
  const want = (w: Want, name: string) => {
    if (w === true) busy = true, why.add(name);
    else if (w === 'ambient') ambience = true, why.add(`~${name}`);
  };
  /** The last frame drawn's display time (its rAF's): the full rate's pacing. */
  let lastVsync = 0;
  function frame(vsync = now()) {
    raf = 0;
    if (disposed || document.hidden || paused) return;
    const t = now();
    const active = touch || t < activeUntil || busy;
    // (the full rate is せってい's frame rate, a finger's too: at 30 a display frame in between is skipped)
    if (active && !due(vsync, lastVsync, frameRate.fps)) {
      raf = requestAnimationFrame(frame);
      return;
    }
    lastVsync = vsync;
    inFrame = true;
    busy = ambience = false;
    why.clear();
    try {
      draw(t);
    } finally {
      inFrame = false;
    }
    // something moves: the next display frame; only the ambience (the water included): at its rate; else none
    if (busy || touch || now() < activeUntil) raf = requestAnimationFrame(frame);
    else if (ambience && opts.ambient > 0) later(Math.max(0, 1000 / Math.min(opts.ambient, frameRate.fps) - (now() - t)));
  }
  function draw(t: number) {
    // (the real time since the last frame, up to a quarter second: a slow GPU settles as soon as a fast one)
    const dt = lastFrame ? Math.min(250, t - lastFrame) : 16;
    want(stepMove(t), 'focus');
    // the fling: iOS's deceleration, firmer past an end
    if (!touch && (vel || velX) && !focus) {
      const step = Math.min(50, t - lastT);
      lastT = t;
      rawZ += (vel * step * unitsPerPx()) / Math.sin(pitch);
      const out = rawZ < lim.min || rawZ > lim.max;
      vel *= Math.exp(-step / (out ? 60 : 325));
      camZ = clampZ(rawZ);
      if (velX) {
        const x = clampX(camX - velX * step * unitsPerPx());
        // (a side's edge stops it: no rubber band sideways)
        velX = x === camX ? 0 : velX * Math.exp(-step / 325);
        camX = x;
        if (Math.abs(velX) < 0.01) velX = 0;
      }
      if (Math.abs(vel) < 0.01 && !velX) vel = 0;
      aim();
      want(true, 'fling');
    }
    if (!touch && !vel && !velX && !focus && !move) {
      if (settling || zoomBack || camZ < lim.min || camZ > lim.max || zoomK < ZOOM.min || zoomK > ZOOM.max) {
        settling = settle(dt);
        want(settling, 'settle');
      }
      if (!busy) light(false);
    }
    // (a wobbling model moves its shadow: the map redraws; a walker's is a blob)
    if (things.frame(t)) {
      shadowsDirty = true;
      want(true, 'things');
    }
    if (hook) want(hook(t), 'scene');
    want(cards.frame(pitch * LEAN, stretch, src.feet), 'cards');
    want(effects.frame(t, camera), 'fx');
    if (ground.update) want(ground.update(t), 'ground');
    want(lights.frame(t, camX, camZ + 110, bendU.uBendR.value, -camZ), 'lights');
    if (opts.shadows && shadowsDirty) {
      renderer.shadowMap.needsUpdate = true;
      shadowsDirty = false;
    }
    if (!noDraw) renderer.render(scene, camera);
    // (nothing drawn: the counts are none, whatever the layout's ground baked on the GPU as it was built)
    else renderer.info.reset();
    cpu.push(now() - t);
    if (lastFrame) gaps.push(t - lastFrame);
    lastFrame = t;
    stamps.push(t);
    while (stamps.length && stamps[0] < t - 1000) stamps.shift();
    if (cpu.length > 300) cpu.shift();
    if (gaps.length > 300) gaps.shift();
    frames++;
  }
  const onVis = () => {
    lastFrame = 0;
    if (!document.hidden && !paused) kick();
  };
  document.addEventListener('visibilitychange', onVis);
  // a lost context (the phone reclaiming the GPU): three restores what it can; draw again once it's back
  const onLost = (e: Event) => e.preventDefault();
  const onRestored = () => {
    shadowsDirty = true;
    resize();
  };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);

  resize();
  tod('day');

  return {
    resize, place, things, cards, tod, pan, zoom, fling, options,
    glows(list) {
      extraGlows = list;
      relight();
      kick();
    },
    touching(on) {
      touch = on;
      if (on) {
        vel = velX = 0;
        zoomBack = null;
        settling = false;
        rawZ = camZ;
        rawK = zoomK;
      } else {
        settling = true;
        if (!vel) light(false);
      }
      activity();
    },
    view: () => ({ camZ, zoom: zoomK, pitch, camX }),
    xRoom,
    zoomRange: () => ({ ...ZOOM }),
    go(z, k, free, x) {
      if (free) {
        lim.min = Math.min(lim.min, z);
        lim.max = Math.max(lim.max, z);
      }
      camZ = rawZ = Math.max(lim.min, Math.min(lim.max, z));
      if (k) zoomK = rawK = Math.max(ZOOM.min, Math.min(ZOOM.max, k));
      camX = clampX(x ?? camX);
      vel = velX = 0;
      zoomBack = null;
      aim();
      activity();
    },
    limits: () => ({ min: lim.min, max: lim.max }),
    alphaBlends() {
      const out = new Set<string>();
      scene.traverseVisible((n) => {
        const m = (n as Mesh).material as Material | Material[] | undefined;
        for (const x of m ? (Array.isArray(m) ? m : [m]) : []) if (x.blending >= 2 && x.blending <= 4) out.add(`${x.type}:${n.name || n.parent?.name || '?'}`);
      });
      return [...out];
    },
    strays(reach = 900) {
      const out: { name: string; box: number[] }[] = [], b = new Box3();
      scene.updateMatrixWorld();
      scene.traverseVisible((n) => {
        const m = n as Mesh & { isInstancedMesh?: boolean; isLine?: boolean; isPoints?: boolean; count?: number; computeBoundingBox?: () => void; boundingBox?: Box3 | null };
        if (!(m.isMesh || m.isLine || m.isPoints) || !m.geometry || m.userData.backdrop) return;
        if (m.isInstancedMesh) {
          if (!m.count) return;
          m.computeBoundingBox!();
          b.copy(m.boundingBox!);
        } else {
          m.geometry.computeBoundingBox();
          b.copy(m.geometry.boundingBox!);
        }
        if (b.isEmpty()) return;
        b.applyMatrix4(m.matrixWorld);
        // the sea and the water's flat planes reach to the horizon
        if (b.max.y - b.min.y < 2 && Number.isFinite(b.max.y)) return;
        const v = [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z];
        const L = ground.land;
        const far = b.min.x < L.x0 - reach || b.max.x > L.x1 + reach || b.min.y < -reach || b.max.y > reach || b.max.z > -L.z0 + reach || b.min.z < -L.z1 - reach;
        if (v.some((x) => !Number.isFinite(x)) || far) out.push({ name: `${m.type}:${m.name || m.parent?.name || '?'}`, box: v.map((x) => Math.round(x)) });
      });
      return out;
    },
    focusOn, restore, frame: frameRect,
    setLimits(min, max) {
      lim.min = min;
      lim.max = Math.max(min, max);
      camZ = rawZ = Math.max(lim.min, Math.min(lim.max, camZ));
      aim();
      activity();
    },
    lamps: () => lights.lit(),
    fxCount: (tag) => effects.count(tag),
    placeGroup(id, obj, at) {
      const was = groupsPlaced.get(id);
      if (was) {
        was.off();
        resourcesOf(was.obj, unplaced);
        groupsPlaced.delete(id);
      }
      if (obj && at) {
        obj.position.set(at.x, at.y ?? src.height(at.x, at.z), -at.z);
        obj.rotation.y = at.yaw ?? 0;
        obj.updateMatrixWorld(true);
        groupsPlaced.set(id, { obj, off: addObj(obj) });
      }
      shadowsDirty = true;
      kick();
    },
    add: addObj,
    placedGroups: () => [...groupsPlaced.keys()],
    warmFx: () => effects.warm(renderer, camera),
    fxWarmed: () => effects.warmed(),
    fx(kind, x, z, lift, o) {
      effects.spawn(kind, x, z, lift, o);
      // (an ambient one, tagged: the fall, a sleeper's zzz, an emitter's, plays at the ambient rate)
      if (o?.tag) kick();
      else activity(400);
    },
    gpu() {
      const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
      return String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    },
    at, groundAt, horizon,
    rev: () => rev,
    kick: () => kick(),
    camStill: () => !touch && !vel && !velX && !zoomBack && !settling && !move,
    isPaused: () => paused,
    pause(on) {
      if (on === paused) return;
      paused = on;
      lastFrame = 0;
      if (on) {
        if (raf) cancelAnimationFrame(raf);
        if (timer) clearTimeout(timer);
        raf = timer = 0;
      } else kick();
    },
    idle: () => !busy && !touch && !vel && !velX && !zoomBack && !settling && now() > activeUntil,
    onFrame(fn) {
      hook = fn;
      kick();
    },
    stats: () => {
      const l = lights.stats();
      return {
        fps: stamps.length, cpu: [pctl(cpu, 0.5), pctl(cpu, 0.95)], gap: [pctl(gaps, 0.5), pctl(gaps, 0.95)],
        calls: renderer.info.render.calls, tris: renderer.info.render.triangles, textures: renderer.info.memory.textures,
        geometries: renderer.info.memory.geometries, dpr: renderer.getPixelRatio(), frames,
        loading: things.pending() + cards.pending(), camZ, zoom: zoomK, points: l.points, lamps: l.lamps, fx: effects.count(),
        fxShown: effects.shown(), why: [...why], paused, drawn: !noDraw
      };
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      // every geometry, material and texture still in the scene (and once placed) let go of on this renderer: three's
      // listeners on each keep it, and one shared with the next island (a cached home's, bridge's or villager's model)
      // kept this whole renderer and its context alive, one more a room's round trip (~1 MB of heap each in Chromium)
      releaseAll([scene], unplaced);
      things.dispose();
      cards.dispose();
      effects.dispose();
      lights.dispose();
      ground.dispose?.();
      for (const v of Object.values(sun.shadow)) if (v instanceof Texture) v.dispose();
      sun.shadow.map?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    }
  };
}
