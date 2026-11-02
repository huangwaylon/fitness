// The 3D island (docs/design.md "World", docs/decisions.md "The island in 3D"): the island drawn in three.js, NH's way,
// under the same island the 2D one runs (IslandScene: its World places every DOM node through this camera, and the DOM
// keeps the taps, the popups, the balloons and the marks; their art goes invisible where a model or a card draws it).
//   The camera: NH's fixed, high island camera with a long lens, the rolling log bending the world away (bend.ts, every
//   material). One finger scrolls along the island (z) with a free fling and soft ends; two pinch the zoom (clamped,
//   eased back at the limits, the pitch lowering as it zooms in, as NH's does). Its x is always the island's middle;
//   it never rotates, and nothing but the finger moves it.
//   The ground: the island's baked chunks on a heightfield (ground.ts, from the layout); the water live (water.ts).
//   The things: NH's models (things.ts); the villagers and what has no model yet: cards (cards.ts).
//   The lights: lights.ts (always-on emissive and halos, faded point lights). Water and shadows on by default.
//   The frames: 60 a second while anything moves, 30 while only the water does, none hidden. The World's step runs in
//   each frame before it draws, so the DOM moves with the picture.
// Plain TS; world3d/Island3D.svelte drives it.
import {
  BufferGeometry, Color, DirectionalLight, Float32BufferAttribute, Fog, HemisphereLight, Mesh, MeshLambertMaterial,
  PerspectiveCamera, Scene, SRGBColorSpace, Texture, TextureLoader, Uint32BufferAttribute, Vector3, WebGLRenderer,
  PCFSoftShadowMap, type Material, type Object3D
} from 'three';
import { bend, bendPoint, bendU, unbendRay } from './bend.ts';
import { createWater, seaFog, waterFog, waterU } from './water.ts';
import { createThings, type Things } from './things.ts';
import { createCards, type Cards } from './cards.ts';
import { createEffects, type FxKind, type FxOpts } from './effects.ts';
import { createLights, lampFog, type LampSpot, type Lights } from './lights.ts';
import type { Inst } from './layout3d.ts';

type Tod = 'day' | 'dusk' | 'night';

/** @public The ground the island stands on (ground.ts from world.ts today; the island layout's terrain once it lands). */
export interface GroundSource {
  /** How many chunks, and one chunk's heightfield (three's space) with uvs into its baked texture. */
  chunks: number;
  grid(i: number): { pos: Float32Array; uv: Float32Array; index: Uint32Array };
  /** A chunk's world z extent. */
  span(i: number): [number, number];
  /** The ground's height, and where a walker's feet are (a bridge's deck). */
  height(x: number, z: number): number;
  feet(x: number, z: number): number;
  /** The land's box (world units; its corners rounded by r): the sea's shallows round it, the sea's length past it. */
  land: Land;
}
/** @public */
export interface Land {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  r: number;
}
/** @public A ground built elsewhere (the island layout's terrain.ts buildGround): its own meshes (the land, the cliffs and all
 *  its water), added once and bent here; the engine's water is not drawn. */
export interface BuiltGround {
  group: Object3D;
  heightAt(x: number, z: number): number;
  /** Where a walker's feet are (a bridge's deck); the ground's height if absent. */
  feet?(x: number, z: number): number;
  land: Land;
  /** Called in each frame (its water's time, a paint stroke's rebuild): true while it wants frames. */
  update?(t: number): boolean;
  dispose?(): void;
}
export type Ground = GroundSource | BuiltGround;
const built = (g: Ground): g is BuiltGround => 'group' in g;

export interface Options {
  dpr: number;
  water: boolean;
  shadows: boolean;
  /** Frames a second at most (30 or 60). */
  cap: 30 | 60;
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
}

/** The camera: vertical field of view (a long lens), the pitch at zoom 1 / fully in / fully out, the zoom's range. */
const FOV = 30;
const PITCH = { def: 58, near: 44, far: 63 };
const ZOOM = { min: 0.66, max: 1.8 };
/** How far past a limit a pinch may go (eased back on release), as a factor. */
const ZOOM_OVER = 1.12;
/** Where the camera may look (the pivot's world z): the sea in front of まえ … the falls and the forest above the cliff. */
const CAM_Z = { min: 30, max: 1000 } as const;
/** The island's middle (the camera's x, always). */
const MID_X = 195;
/** The width the camera shows at the pivot at zoom 1 (u): the land is 470 (its beaches just off the sides). */
const VIEW_W = 420;
/** The baked ground already has its light painted in: under the models' brighter light it's dimmed back to the bake. */
const GROUND_K = 0xe2e2e2;
/** How far below the screen's middle the pivot sits (a share of the height). */
const PIVOT_DROP = 0.16;
/** The haze's start and end, as shares of the horizon's view depth. */
const HAZE = [0.66, 1.0] as const;
/** The land's (and the models'): only what stands by the horizon fades a little. */
const LAND_HAZE = [0.8, 1.35] as const;
/** …and the haze at most this deep (u): zoomed out, the island itself stays clear. */
const HAZE_U = 800;
/** The shadow map's box moves in steps of this (u): it redraws when it steps, not on every frame of a scroll. */
const SHADOW_STEP = 40;
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
  /** The ground's baked look (its chunk URLs). */
  groundLook(urls: readonly string[]): void;
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
  pan(dy: number): void;
  /** Zoom by a factor, about a screen y (the pinch's middle: the ground there stays put). */
  zoom(f: number, sy?: number): void;
  /** A release's fling (px/ms). */
  fling(vy: number): void;
  touching(on: boolean): void;
  /** The camera (the e2e, the way back from the tent). */
  view(): { camZ: number; zoom: number; pitch: number };
  /** `free`: past the ends if need be (the e2e's camera, at the 2D island's stops: the ends widen to take it). */
  go(camZ: number, zoom?: number, free?: boolean): void;
  limits(): { min: number; max: number };
  /** Frame one thing (the bulletin board: the user's one exception to "nothing but the finger moves the camera"): the
   *  camera eases to it over `ms` (600), centred on it, `zoom` (2.2) and `pitch` (degrees, 30) its own; the finger does
   *  nothing until restore(), which eases back to exactly where the camera was. */
  focusOn(target: { x: number; z: number; lift?: number }, o?: { zoom?: number; pitch?: number; ms?: number }): Promise<void>;
  /** The bulletin board's focus (docs/board.md): a rect (its middle x, z on the ground, y up, w × h u) framed face-on
   *  in the screen above `bottom` px, filling `fill` of it; called again while focused it re-frames from where it is. */
  frame(f: { x: number; z: number; y: number; w: number; h: number; yaw?: number; bottom?: number; fill?: number }, ms?: number): Promise<void>;
  restore(ms?: number): Promise<void>;
  focused(): boolean;
  /** A flourish in the world (effects.ts): a tap's dust, a splash, sparkles, a 「！」. */
  fx(kind: FxKind, x: number, z: number, lift?: number, o?: FxOpts): void;
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
  /** Nothing moving (the water may still run at 30). */
  idle(): boolean;
  /** Called in every frame before it draws: true wants another (something moves). */
  onFrame(fn: ((t: number) => boolean) | null): void;
  options(o: Partial<Options>): void;
  stats(): Stats;
  dispose(): void;
}

export function createIsland(canvas: HTMLCanvasElement, ground: Ground, init: Partial<Options> & { aa?: boolean } = {}): Island3 {
  const opts: Options = { dpr: Math.min(2, window.devicePixelRatio || 1), water: true, shadows: true, cap: 60, ...init };
  const renderer = new WebGLRenderer({ canvas, antialias: init.aa ?? true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(opts.dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = opts.shadows;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  bendU.uBendR.value = 1300;

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

  // ---- the ground: its chunks, each its baked texture (or a ground built elsewhere, bent here) ----
  const own = built(ground) ? null : ground;
  const src = {
    height: built(ground) ? (x: number, z: number) => ground.heightAt(x, z) : ground.height,
    feet: built(ground) ? (x: number, z: number) => (ground.feet ?? ground.heightAt)(x, z) : ground.feet,
    land: ground.land
  };
  if (built(ground)) {
    ground.group.traverse((n) => {
      const m = (n as Mesh).material as Material | Material[] | undefined;
      for (const x of m ? (Array.isArray(m) ? m : [m]) : []) bend(x);
      (n as Mesh).frustumCulled = false;
    });
    scene.add(ground.group);
  }
  const tex = new TextureLoader();
  const chunks: Mesh[] = [];
  for (let i = 0; i < (own?.chunks ?? 0); i++) {
    const src = own!;
    const g = src.grid(i);
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(g.pos, 3));
    geo.setAttribute('uv', new Float32BufferAttribute(g.uv, 2));
    geo.setIndex(new Uint32BufferAttribute(g.index, 1));
    geo.computeVertexNormals();
    const m = new Mesh(geo, bend(new MeshLambertMaterial({ color: GROUND_K })));
    m.frustumCulled = false;
    m.receiveShadow = true;
    m.userData.span = src.span(i);
    chunks.push(m);
    scene.add(m);
  }
  let groundUrls: readonly string[] = [];
  function groundLook(urls: readonly string[]) {
    if (urls.join() === groundUrls.join()) return;
    groundUrls = urls;
    urls.forEach((u, i) => {
      if (!chunks[i]) return;
      pending++;
      tex.loadAsync(u).then((t) => {
        pending--;
        if (disposed || groundUrls !== urls) return t.dispose();
        t.colorSpace = SRGBColorSpace;
        t.anisotropy = 4;
        const mm = chunks[i].material as MeshLambertMaterial;
        mm.map?.dispose();
        mm.map = t;
        mm.needsUpdate = true;
        kick();
      }, () => void pending--);
    });
  }

  // ---- the water, the things, the cards, the lights ----
  const water = built(ground) ? { all: [] as Mesh[] } : createWater(src.land);
  for (const m of water.all) scene.add(m);
  const things = createThings(scene, src.height, (sh = true) => (sh && (shadowsDirty = true), kick()));
  const cards = createCards(scene, (sh) => (sh && (shadowsDirty = true), kick()));
  const lights = createLights(scene);
  const effects = createEffects(scene, src.feet);
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
  let fx = MID_X, fy = 0, fpitch = 0, fk = 0, fdrop = 0, drop = PIVOT_DROP;
  function aim() {
    pitch = pitchAt(zoomK);
    if (fk > 0) pitch += (fpitch - pitch) * fk;
    const D = D0 / zoomK, cx = MID_X + (fx - MID_X) * fk, cy = fy * fk;
    camera.position.set(cx, cy + D * Math.sin(pitch), -camZ + D * Math.cos(pitch));
    camera.lookAt(cx, cy, -camZ);
    const d = PIVOT_DROP + (fdrop - PIVOT_DROP) * fk;
    if (d !== drop) {
      drop = d;
      camera.setViewOffset(W, H, 0, -drop * H, W, H);
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
    bendU.uBendZ.value = -camZ;
    // NH's haze: the far sea (and what stands far off) fades into the sky's horizon colour, all of it by the log's
    // horizon, so the sea meets the sky in one soft line at every scroll and zoom (no hard band of open sea)
    const hd = horizonDepth();
    fog.near = hd * LAND_HAZE[0];
    fog.far = hd * LAND_HAZE[1];
    waterFog(fog);
    lampFog.near.value = fog.near;
    lampFog.far.value = fog.far;
    // (the sea's own, deeper: it meets the sky in the haze; the land only softens near the horizon)
    seaFog.uFogNear.value = Math.max(hd * HAZE[0], hd - HAZE_U);
    seaFog.uFogFar.value = hd * HAZE[1];
    // the shadow's box follows the pivot, as wide as the view, in steps (the shadow map redraws only when it steps)
    const zq = Math.round(camZ / SHADOW_STEP) * SHADOW_STEP, kq = Math.round(zoomK * 8) / 8;
    const key = `${zq}:${kq}:${todLook.sunAt}`;
    if (key !== shadowKey) {
      shadowKey = key;
      const half = (VIEW_W / Math.max(ZOOM.min, kq - 0.0625)) * 0.75 + SHADOW_STEP;
      Object.assign(sun.shadow.camera, { left: -half, right: half, top: half * 1.4, bottom: -half * 1.1, near: 10, far: 1800 });
      sun.shadow.camera.updateProjectionMatrix();
      sun.position.set(MID_X + todLook.sunAt[0] * 700, todLook.sunAt[1] * 700, -zq - 120 + todLook.sunAt[2] * 700);
      sun.target.position.set(MID_X, 0, -zq - 120);
      sun.target.updateMatrixWorld();
      shadowsDirty = true;
    }
    // the ground chunks in reach (the bend drops the far ones behind the horizon)
    for (const c of chunks) {
      const [z0, z1] = c.userData.span as [number, number];
      c.visible = z1 > camZ - 700 && z0 < camZ + 1500;
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
    v3.set(MID_X, y, z).applyMatrix4(camera.matrixWorldInverse);
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
    horizonY = Math.max(0, screen(MID_X, far[0], far[1])[1]);
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
  function pan(dy: number) {
    if (focus) return;
    light(true);
    settling = false;
    rawZ += (dy * unitsPerPx()) / Math.sin(pitch);
    camZ = clampZ(rawZ);
    aim();
    activity();
  }
  let rawK = zoomK;
  const clampK = (k: number) => {
    const lo = ZOOM.min, hi = ZOOM.max;
    if (k < lo) return lo / (1 + (ZOOM_OVER - 1) * (1 - 1 / ((lo / k - 1) * 4 + 1)));
    if (k > hi) return hi * (1 + (ZOOM_OVER - 1) * (1 - 1 / ((k / hi - 1) * 4 + 1)));
    return k;
  };
  function zoom(f: number, sy = H * (0.5 + PIVOT_DROP)) {
    if (focus) return;
    light(true);
    settling = false;
    const before = groundAt(W / 2, sy);
    rawK *= f;
    zoomK = clampK(rawK);
    aim();
    // the ground under the pinch stays put (along z: the camera's x never moves)
    const after = groundAt(W / 2, sy);
    if (before && after) {
      camZ += before.z - after.z;
      rawZ = camZ;
      camZ = Math.max(lim.min - 160, Math.min(lim.max + 160, camZ));
      aim();
    }
    activity();
  }
  function fling(vy: number) {
    if (focus) return;
    vel = vy;
    lastT = now();
    activity();
  }
  /** Back inside the limits (a released rubber band, the zoom past its end), eased. */
  function settle(dt: number): boolean {
    let more = false;
    const zt = Math.max(lim.min, Math.min(lim.max, camZ)), kt = Math.max(ZOOM.min, Math.min(ZOOM.max, zoomK));
    const e = 1 - Math.exp(-dt / 90);
    if (Math.abs(zt - camZ) > 0.05) {
      camZ += (zt - camZ) * e;
      more = true;
    } else camZ = zt;
    if (Math.abs(kt - zoomK) > 0.0005) {
      zoomK += (kt - zoomK) * e;
      more = true;
    } else zoomK = kt;
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
  let focus: { back: { z: number; k: number } } | null = null, move: Move | null = null;
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
  function frameRect(f: { x: number; z: number; y: number; w: number; h: number; yaw?: number; bottom?: number; fill?: number }, ms = 600): Promise<void> {
    if (!focus) focus = { back: { z: camZ, k: zoomK } };
    const fill = f.fill ?? 0.9, bottom = Math.max(0, Math.min(H * 0.7, f.bottom ?? 0)), t = Math.tan(((FOV / 2) * Math.PI) / 180);
    // the distance that fits its height in the free screen and its width across
    const D = Math.max((f.h * H) / (fill * (H - bottom) * 2 * t), f.w / (fill * 2 * t * camera.aspect));
    // a little from above, as NH's board view; its middle at the free screen's middle
    const pitch = (8 * Math.PI) / 180;
    return moveTo({ z: f.z, k: D0 / D, fk: 1, x: f.x, y: src.feet(f.x, f.z) + f.y, pitch, drop: -bottom / (2 * H) }, ms);
  }
  function focusOn(target: { x: number; z: number; lift?: number }, o: { zoom?: number; pitch?: number; ms?: number } = {}): Promise<void> {
    if (!focus) focus = { back: { z: camZ, k: zoomK } };
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
      fk = 0;
      aim();
    });
  }

  // ---- time of day ----
  let wetK = 0;
  function tod(t: Tod, wet = 0, fogCss?: string) {
    todLook = TOD[t];
    wetK = wet;
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
    for (const m of water.all) m.visible = opts.water;
    activity();
  }

  // ---- the frames ----
  let raf = 0, frames = 0, disposed = false, shadowsDirty = true, pending = 0, activeUntil = 0, lastFrame = 0, busy = false;
  let hook: ((t: number) => boolean) | null = null;
  const cpu: number[] = [], gaps: number[] = [], stamps: number[] = [];
  const activity = (ms = 300) => {
    activeUntil = Math.max(activeUntil, now() + ms);
    kick();
  };
  function kick() {
    if (!raf && !disposed) raf = requestAnimationFrame(frame);
  }
  function frame() {
    raf = 0;
    if (disposed || document.hidden) return;
    const t = now();
    const active = touch || t < activeUntil || busy;
    // 30 a second when only the water moves (or at the 30 cap): display frames in between are skipped
    const minGap = !active || opts.cap === 30 ? 1000 / 30 - 4 : 1000 / 60 - 4;
    if (lastFrame && t - lastFrame < minGap) {
      raf = requestAnimationFrame(frame);
      return;
    }
    // (the real time since the last frame, up to a quarter second: a slow GPU settles as soon as a fast one)
    const dt = lastFrame ? Math.min(250, t - lastFrame) : 16;
    let more = false;
    if (stepMove(t)) more = true;
    // the fling: iOS's deceleration, firmer past an end
    if (!touch && vel && !focus) {
      const step = Math.min(50, t - lastT);
      lastT = t;
      rawZ += (vel * step * unitsPerPx()) / Math.sin(pitch);
      const out = rawZ < lim.min || rawZ > lim.max;
      vel *= Math.exp(-step / (out ? 60 : 325));
      camZ = clampZ(rawZ);
      if (Math.abs(vel) < 0.01) vel = 0;
      aim();
      more = true;
    }
    if (!touch && !vel && !focus && !move) {
      if (settling || camZ < lim.min || camZ > lim.max || zoomK < ZOOM.min || zoomK > ZOOM.max) {
        settling = settle(dt);
        more ||= settling;
      }
      if (!more) light(false);
    }
    // (a wobbling model moves its shadow: the map redraws; a walker's is a blob)
    if (things.frame(t)) more = shadowsDirty = true;
    if (hook?.(t)) more = true;
    if (cards.frame(pitch * LEAN, stretch, src.feet)) more = true;
    if (effects.frame(t, camera)) more = true;
    if (built(ground) && ground.update?.(t)) more = true;
    if (lights.frame(t, MID_X, camZ + 110, bendU.uBendR.value, -camZ)) more = true;
    if (opts.water) waterU.uTime.value = (t / 1000) % 3600;
    if (opts.shadows && shadowsDirty) {
      renderer.shadowMap.needsUpdate = true;
      shadowsDirty = false;
    }
    renderer.render(scene, camera);
    cpu.push(now() - t);
    if (lastFrame) gaps.push(t - lastFrame);
    lastFrame = t;
    stamps.push(t);
    while (stamps.length && stamps[0] < t - 1000) stamps.shift();
    if (cpu.length > 300) cpu.shift();
    if (gaps.length > 300) gaps.shift();
    frames++;
    busy = more;
    // the water keeps the loop going (at 30 when still); without it, only what moves does
    if (more || active || opts.water) kick();
  }
  const onVis = () => {
    lastFrame = 0;
    if (!document.hidden) kick();
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
  options({ water: opts.water });

  return {
    resize, groundLook, place, things, cards, tod, pan, zoom, fling, options,
    glows(list) {
      extraGlows = list;
      relight();
      kick();
    },
    touching(on) {
      touch = on;
      if (on) {
        vel = 0;
        settling = false;
        rawZ = camZ;
        rawK = zoomK;
      } else {
        settling = true;
        if (!vel) light(false);
      }
      activity();
    },
    view: () => ({ camZ, zoom: zoomK, pitch }),
    go(z, k, free) {
      if (free) {
        lim.min = Math.min(lim.min, z);
        lim.max = Math.max(lim.max, z);
      }
      camZ = rawZ = Math.max(lim.min, Math.min(lim.max, z));
      if (k) zoomK = rawK = Math.max(ZOOM.min, Math.min(ZOOM.max, k));
      vel = 0;
      aim();
      activity();
    },
    limits: () => ({ min: lim.min, max: lim.max }),
    focusOn, restore, frame: frameRect,
    setLimits(min, max) {
      lim.min = min;
      lim.max = Math.max(min, max);
      camZ = rawZ = Math.max(lim.min, Math.min(lim.max, camZ));
      aim();
      activity();
    },
    focused: () => !!focus,
    fx(kind, x, z, lift, o) {
      effects.spawn(kind, x, z, lift, o);
      activity(400);
    },
    gpu() {
      const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
      return String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    },
    at, groundAt, horizon,
    rev: () => rev,
    kick: () => kick(),
    idle: () => !busy && !touch && !vel && !settling && now() > activeUntil,
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
        loading: pending + things.pending() + cards.pending(), camZ, zoom: zoomK, points: l.points, lamps: l.lamps, fx: effects.count()
      };
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      things.dispose();
      cards.dispose();
      effects.dispose();
      lights.dispose();
      for (const c of chunks) {
        c.geometry.dispose();
        const m = c.material as MeshLambertMaterial;
        m.map?.dispose();
        m.dispose();
      }
      if (built(ground)) ground.dispose?.();
      for (const m of water.all) {
        m.geometry.dispose();
        (m.material as Material).dispose();
      }
      for (const v of Object.values(sun.shadow)) if (v instanceof Texture) v.dispose();
      sun.shadow.map?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    }
  };
}
