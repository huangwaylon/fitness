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
//   The frames: the frame rate (30: store/frameRate.ts) while anything moves; while only the
//   ambience does (the water, the season's fall, a fire's flicker, a sleeper's zzz, a blink) `ambient` a second (30 at
//   most; a software renderer's few; REST_FPS at rest: REST_MS), the water's only while some
//   is on screen; none when nothing does, none hidden or paused (a sheet over the island). The
//   World's step runs in each frame before it draws, so the DOM moves with the picture.
// Plain TS; world3d/Island3D.svelte drives it.
import {
  Box3, Color, DirectionalLight, Fog, Frustum, HemisphereLight, Matrix4, Mesh, PerspectiveCamera, Scene, Sphere, Texture, Vector3,
  PCFSoftShadowMap, MeshDepthMaterial, RGBADepthPacking, FrontSide, BackSide, DoubleSide, type Material, type MeshLambertMaterial, type Object3D, type Side, type WebGLRenderer
} from 'three';
import { cubicInOut, cubicOut } from '#lib/math.ts';
import { bendTree, bendU, pointMask, unbendRay } from './bend.ts';
import { waterFog, waterU } from './water.ts';
import { createThings, type Things } from './things.ts';
import { shadowBox, sunOn, type ShadowBox } from './shadowBox.ts';
import { DAY_SUN, FOV, PIVOT_DROP, VIEW_W, ZOOM, backAt, cullBands, dropPivot, focalOf, haze, horizonAt, pitchAt, pose } from './islandCam.ts';
import { createCards, type Cards } from './cards.ts';
import { createEffects, type FxKind, type FxOpts } from './effects.ts';
import { createBiteMarks, type MarkState } from './biteMark.ts';
import { createLights, lampFog, type LampSpot } from './lights.ts';
import type { Inst } from './objects.ts';
import { drawOff } from '../../ui-state/testMode.ts';
import { DPR_MOVING, endRenderer, makeRenderer, watchContext } from './stage.ts';
import { releaseAll, resourcesOf } from './release.ts';
import { FPS } from '#lib/store/frameRate.ts';
import { pacer } from './pace.ts';
import type { BootWait } from './boot.ts';
import { createWarmup, texturesOf } from './warmup.ts';
import { ktx2Target } from './ktx2.ts';
import { SEA_X, midXOf } from '#lib/layout/model.ts';
import { SEA_Y } from '#lib/layout/height.ts';

type Tod = 'day' | 'dusk' | 'night';

/** A world point on screen (engine at(); camera.svelte.ts Proj3's). */
export interface At { sx: number; sy: number; k: number; up: number; ground: number; depth: number; visible: boolean }

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
  chunks?(): readonly { z0: number; z1: number; meshes: Mesh[] }[];
  /** A frame's camera (each draw, not each pose: Island3D's fitEnds solves through a hundred): the bands in its reach
   *  given targets and every bake due done (terrain.ts near), before the culling. */
  near?(camZ: number): void;
  /** Called in each frame (its water's time, a paint stroke's rebuild): true while it moves (frames at the full rate),
   *  'ambient' while only its ambience does (its water: the ambient rate), false when still. */
  update?(t: number): Want;
  /** A lost context back: what it baked on the GPU baked again. */
  restore?(): void;
  /** The light now (the time of day's, the weather's): the hemisphere's sky and the sun's colour × intensity, the sun's
   *  height (terrain.ts: the deep seabed's flat colour). */
  light?(sky: Color, sun: Color, up: number): void;
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
  /** The models' textures from their KTX2 (ktx2.ts; default on): off, their WebPs (`?ktx2=0`, an A/B). */
  ktx2?: boolean;
  /** The pixel ratio while the camera moves (stage.ts DPR_MOVING; `?dprmove=`, an A/B: at `dpr` or above, no swap). */
  dprMoving?: number;
  /** The shadow map's size (2048; `?shadow=`, an A/B). */
  shadowSize?: number;
  /** A still model's nearest instances out of view left undrawn (things.ts cull; default on): off, all drawn
   *  (`?cull=0`, an A/B). */
  cull?: boolean;
  /** The real point lights (lights.ts POINTS: 6; `?points=`, an A/B of their GPU cost by day). */
  points?: number;
  /** Each point light's work skipped in the shaders while it's off (bend.ts pointMask): the island's
   *  default since r3 L4 (Mac GPU −16–21 % a frame by day, the iOS Simulator's dusk and night drawn the same); Island3D's
   *  `?pointmask=0` turns it off. */
  pointMask?: boolean;
}
interface Stats {
  fps: number;
  /** CPU per frame (ms: the World's step, three's work and the GL calls) and the interval between frames drawn. */
  cpu: [number, number];
  gap: [number, number];
  /** The last frame's draw calls and triangles (with the shadow map's, when it redrew), and the last frame's without a
   *  shadow redraw (the scene alone: perf.rest). */
  calls: number;
  tris: number;
  sceneCalls: number;
  sceneTris: number;
  textures: number;
  geometries: number;
  /** The GPU programs compiled (three's). */
  programs: number;
  /** The shadow map's redraws so far. */
  shadows: number;
  /** The scene's compiles ahead (programs: hold), and materials linking now. */
  compiles: number;
  linking: number;
  dpr: number;
  /** The shadow map's size. */
  shadowSize: number;
  frames: number;
  /** The last frame's time (performance.now's clock: what the scene moved to; a sampler's own may be a tick off). */
  at: number;
  /** The last finger's (or wheel's) time on the camera. */
  input: number;
  loading: number;
  camZ: number;
  zoom: number;
  points: number;
  lamps: number;
  /** The real point lights (lit or not) and whether their shader mask is on (bend.ts pointMask). */
  slots: number;
  pointMask: boolean;
  /** The flourishes playing (effects.ts). */
  fx: number;
  /** How many flourishes' parts (not the ambience's) have come on so far (a short one may be over when it's read). */
  fxShown: number;
  /** What wanted the last frame (`~`: its ambience only), and whether the island is paused. */
  why: string[];
  /** The frames drawn at the full rate so far (another asked for at once), and what asked for them, each name's count
   *  (`touch` a finger, `active` a change's while; perf.rest's top three). */
  full: number;
  fullWhy: Readonly<Record<string, number>>;
  paused: boolean;
  /** False in the e2e's logic mode (testMode.ts drawOff): the frames run, nothing is drawn. */
  drawn: boolean;
}

/** How far past a limit a pinch may go (eased back on release), as a factor: in past the end ZOOM_OVER, out past the
 *  default ZOOM_UNDER (further, a felt stretch). */
const ZOOM_OVER = 1.12, ZOOM_UNDER = 1.2;
/** A pinch released zoomed out past the default goes back to it over this, eased out (the user's approved move). */
const ZOOM_BACK_MS = 350;
/** Zoomed in past the default, the view may pan sideways over the land and SEA_X (model.ts) of sea either side, the
 *  sideways room growing in over this much zoom past the default (so it's exactly centred at the default). */
const X_RAMP = 0.3;
/** Where the camera may look (the pivot's world z): the sea in front of まえ … the falls and the forest above the cliff. */
const CAM_Z = { min: 30, max: 1000 } as const;
/** The cards lean back this share of the camera's pitch. */
const LEAN = 0.42;
/** At rest the ambience draws REST_FPS a second (the battery and the phone's heat: the water, the fall, the weather and
 *  a slow critter still move, at a calm rate; the user's call, 2026-11-07). At rest: no finger on the island for REST_MS,
 *  and the last frame wanted only the ambience (no camera move under way: a fling, a spring back, a focus; nothing
 *  moving at the full rate: a walk, a fast critter, a flourish, a jiggle); either of those draws at the full rate at
 *  once. At rest the shadow map redraws at most every REST_SHADOW_MS whatever moves (a walking villager's frames, its
 *  shadow a blob, redrew it for a crawling bug's), once more after the last change; else a slow caster's move (a bug's,
 *  a thing shown or hidden: things.ts) at most every SLOW_SHADOW_MS, while a finger or a fling moves the camera every
 *  MOVING_SHADOW_MS (a crawling bug's speck, a thing at the view's edge: 13 of a pinch's 18 redraws a second), the
 *  rest's in their frame. */
const REST_MS = 2000, REST_FPS = 12, REST_SHADOW_MS = 250, SLOW_SHADOW_MS = 66, MOVING_SHADOW_MS = 200;
/** A fling faster than this (px/ms) rushes (Island3['rushing']): a touch on it only stops it, as iOS's scroll. */
const RUSH_V = 0.1;
/** The flourishes' warm-up waits this long after the last held-back batch was drawn (ms): its programs' first uses
 *  are sync reads that wait for the GPU, which is still busy with the island's first whole frames (a 70-84 ms frame
 *  in the iOS Simulator right after the island appeared). */
const FX_CALM_MS = 1500;
/** The screen's samples (columns × rows, below the horizon) where the camera's view is looked for water. */
const WATER_COLS = 12, WATER_ROWS = 20;
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
  sunAt: readonly [number, number, number];
  tint: number;
  lamps: number;
  villager: number;
  /** NH's flat, soft look: each model lit a little by its own colour, whatever way its faces turn. */
  lift: number;
}
const TOD: Record<Tod, TodLook> = {
  day: { fog: 0xd7f0ff, hemi: [0xffffff, 0xe6efd4, 3.0], sun: [0xfff3df, 1.5], sunAt: DAY_SUN, tint: 0xffffff, lamps: 0, villager: 0xffffff, lift: 0.32 },
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
  /** The camera moving fast under a gesture: a finger's drag or pinch, or a fling faster than RUSH_V. The DOM's tap
   *  areas may lag it meanwhile (the World places only what shows), and a touch landing on a fast fling only stops it. */
  rushing(): boolean;
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
  /** The bite's 「！」 over a villager's head (biteMark.ts: `at` its anchor, three's space, set each frame it's held;
   *  null pops it out), and as last drawn (the e2e's). */
  bite(slot: string, at: Vector3 | null): void;
  biteState(slot: string): MarkState | null;
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
  /** Its renderer (a still through it, into a render target: the players' portraits, person3d). */
  renderer(): WebGLRenderer;
  /** The camera's ends for this screen (the scene fits them: まえ's shore, おく's campsite). */
  setLimits(min: number, max: number): void;
  // ---- the projection (the World's Proj3; px from the canvas's top-left) ----
  /** (`out`: written into and returned, no object a call: the projector's hot path) */
  at(x: number, z: number, lift: number, out?: At): At;
  /** An instance's silhouette on screen (its outline's points, bent, as px from the canvas's top-left; null: no such
   *  model built, or some of it behind the camera). One array reused: valid till the next call. */
  outline(id: string): readonly (readonly [number, number])[] | null;
  groundAt(sx: number, sy: number): { x: number; z: number } | null;
  horizon(): number;
  rev(): number;
  kick(): void;
  /** Nothing moving (the ambience may still run at its rate). */
  idle(): boolean;
  /** One frame `ms` from now (a still villager's next blink): the soonest asked for wins; nothing else is drawn for it. */
  wake(ms: number): void;
  /** Where the island's water is (the sea, a river, a pond: true at a world x, z): its ambience (the ground's water
   *  moving) is drawn only while some of it is on screen. Again when the water changes (a layout's edit). */
  water(at: ((x: number, z: number) => boolean) | null): void;
  /** No frames at all while paused (a sheet over the island); a frame at once when it ends. */
  pause(on: boolean): void;
  /** Paused (pause()). */
  isPaused(): boolean;
  /** The camera at rest: no finger, fling, spring back, settle or focus move under way (whatever else moves), and its
   *  last move framed (the DOM's tap areas placed for it: a tap now lands on what the picture shows). */
  camStill(): boolean;
  /** Called in every frame before it draws: true wants another at the full rate (something moves), 'ambient' at the
   *  ambient rate. */
  onFrame(fn: ((t: number) => Want) | null): void;
  /** In onFrame's hook: what of the scene wanted the full rate (perf.rest's names: contract/log.ts LOG_FULL_WHY). */
  tag(name: string): void;
  /** After each frame drawn: its start and end (ms) and what held some of it back (programs linking, models or cards
   *  loading), null: it was whole (the launch's clock, boot.ts). */
  onDrawn(fn: ((t0: number, t1: number, wait: BootWait) => void) | null): void;
  /** Each pixel-ratio swap a gesture makes (light: down as the camera starts moving, back once it's still): the ms of
   *  setPixelRatio and setSize, and the first frame's own after it (its CPU: the buffers made again as it draws). */
  onSwap(fn: ((on: boolean, setMs: number, frameMs: number) => void) | null): void;
  options(o: Partial<Options>): void;
  stats(): Stats;
  dispose(): void;
}

export function createIsland(canvas: HTMLCanvasElement, makeGround: (renderer: WebGLRenderer) => BuiltGround, init: Partial<Options> & { aa?: boolean } = {}): Island3 {
  const opts: Options = { dpr: Math.min(2, window.devicePixelRatio || 1), shadows: true, ambient: 30, ...init };
  // (before any material compiles: bend.ts reads it then)
  pointMask.on = !!opts.pointMask;
  // the e2e's logic mode (testMode.ts): every frame runs (the scene, the cameras, the hooks), nothing is drawn
  const noDraw = drawOff();
  if (noDraw) Object.assign(opts, { dpr: 1, shadows: false });
  const { renderer } = makeRenderer(canvas, { antialias: init.aa ?? true, alpha: true, dpr: opts.dpr });
  ktx2Target(renderer, opts.ktx2 ?? true);
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
  sun.shadow.mapSize.set(opts.shadowSize ?? 2048, opts.shadowSize ?? 2048);
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 1.2;
  scene.add(hemi, sun, sun.target);
  let todLook = TOD.day;

  // ---- the ground (built on the layout), bent here ----
  const src = { height: (x: number, z: number) => ground.heightAt(x, z), feet: (x: number, z: number) => (ground.feet ?? ground.heightAt)(x, z) };
  bendTree(ground.group);
  scene.add(ground.group);

  // ---- the things, the cards, the lights ----
  const things = createThings(scene, src.height, (sh = true) => (sh && shadowed(sh === 'slow'), kick()), { cull: opts.cull !== false });
  const cards = createCards(scene, (sh) => (sh && shadowed(), kick()));
  const lights = createLights(scene, opts.points);
  const effects = createEffects(scene, src.feet, () => kick());
  const marks = createBiteMarks(addObj);
  let extraGlows: readonly LampSpot[] = [];
  const relight = () => lights.set([...things.lamps(), ...extraGlows]);
  async function place(list: readonly Inst[]) {
    await things.place(list);
    relight();
    shadowed();
    kick();
  }

  // ---- the camera ----
  const lim = { min: CAM_Z.min as number, max: CAM_Z.max as number };
  let camZ = lim.min, zoomK = 1, pitch = pitchAt(1), rev = 0;
  let shadowAim: ShadowBox | null = null;
  /** The camera's rev in the last frame's scene step (its DOM nodes placed for it). */
  let framedRev = -1;
  let W = 1, H = 1, D0 = 1500, focal = 1;
  /** A focus (the bulletin board's: docs/decisions.md "The island in 3D"): the camera framing one thing, its own x,
   *  pitch, height and pivot drop, eased in (k 0 … 1) over the finger's camera. */
  /** The island's middle (the camera's x at the default zoom): its land's (model.ts midXOf), followed as it grows. */
  const midX = () => midXOf(ground.land);
  let camX = midX(), fx = camX, fy = 0, fpitch = 0, fk = 0, fdrop = 0, drop = PIVOT_DROP;
  function aim() {
    pitch = pitchAt(zoomK);
    if (fk > 0) pitch += (fpitch - pitch) * fk;
    const d = PIVOT_DROP + (fdrop - PIVOT_DROP) * fk;
    if (d !== drop) dropPivot(camera, W, H, (drop = d));
    pose(camera, camX + (fx - camX) * fk, fy * fk, camZ, D0 / zoomK, pitch);
    things.camera(camera.quaternion);
    bendU.uBendZ.value = -camZ;
    haze(fog, camera, camZ);
    waterFog(fog);
    lampFog.near.value = fog.near;
    lampFog.far.value = fog.far;
    // the shadow's box follows the pivot (shadowBox.ts): the map redraws only when it moves on, mid-gesture less
    const box = shadowBox(shadowAim, camZ, camX, zoomK, todLook.sunAt, VIEW_W, ZOOM.min, touch || rushing());
    if (box) {
      sunOn(sun, (shadowAim = box), todLook.sunAt);
      shadowed();
    }
    rev++;
    horizonY = NaN;
  }
  /** The size the drawing buffer was last given: the ResizeObserver's first call (as the island mounts) is the size
   *  createIsland gave it, and setting a canvas's width reallocates its buffer even to the same value (~70 ms at 4×
   *  CPU before the first frame). */
  let sizedW = 0, sizedH = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    if (W !== sizedW || H !== sizedH) renderer.setSize((sizedW = W), (sizedH = H), false);
    camera.aspect = W / H;
    D0 = backAt(camera.aspect);
    dropPivot(camera, W, H, drop);
    focal = focalOf(H);
    aim();
    kick();
  }

  // ---- the projection ----
  const v3 = new Vector3();
  // (the projection's scratch: at() runs for every moving node each frame, every node while the camera moves, stretch
  // for every card; bendPoint's and a screen point's tuples were six arrays a call)
  const bp = new Float64Array(3), sp = new Float64Array(3);
  /** bendPoint into bp. */
  function bendTo(x: number, y: number, z: number, pivotZ: number, R: number) {
    const th = (pivotZ - z) / R, r = R + y;
    bp[0] = x;
    bp[1] = r * Math.cos(th) - R;
    bp[2] = pivotZ - r * Math.sin(th);
  }
  /** A three-space point (already bent) → canvas px and its view depth, into sp. */
  function screenTo(x: number, y: number, z: number) {
    v3.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
    const depth = -v3.z;
    v3.applyMatrix4(camera.projectionMatrix);
    sp[0] = ((v3.x + 1) / 2) * W;
    sp[1] = ((1 - v3.y) / 2) * H;
    sp[2] = depth;
  }
  function at(x: number, z: number, lift: number, out?: At): At {
    const R = bendU.uBendR.value, pz = -camZ;
    const gy = src.feet(x, z);
    bendTo(x, gy + lift, -z, pz, R);
    const by = bp[1], bz = bp[2];
    screenTo(bp[0], by, bz);
    const sx = sp[0], sy = sp[1], depth = sp[2];
    const k = depth > 1 ? focal / depth : 0;
    // the foreshortening of an upright (a model's height) and of the ground, here
    bendTo(x, gy + lift + 10, -z, pz, R);
    screenTo(bp[0], bp[1], bp[2]);
    const uy2 = sp[1];
    bendTo(x, gy, -(z + 6), pz, R);
    screenTo(bp[0], bp[1], bp[2]);
    const fy2 = sp[1];
    const up = k ? Math.max(0.05, (sy - uy2) / (10 * k)) : 1, ground = k ? Math.max(0, (sy - fy2) / (6 * k)) : 0;
    // in front of the horizon: the ground faces the camera here (a tall thing's top may still show over it)
    const th = (z - camZ) / R, ny = Math.cos(th), nz = -Math.sin(th);
    const cy = camera.position.y - by, cz = camera.position.z - bz;
    const visible = depth > 1 && (ny * cy + nz * cz) / Math.hypot(cy, cz) > -0.12;
    if (!out) return { sx, sy, k, up, ground, depth, visible };
    out.sx = sx;
    out.sy = sy;
    out.k = k;
    out.up = up;
    out.ground = ground;
    out.depth = depth;
    out.visible = visible;
    return out;
  }
  // (outline's points: one array of pairs kept and refilled, no arrays a point a frame: 1.1 MB/s while dragging)
  const shape: [number, number][] = [];
  // (its pairs kept apart: the list's cut to each outline's length, a longer one's next refilled the same pairs)
  const pairs: [number, number][] = [];
  let shapeN = 0, behind = false;
  const toShape = (p: Vector3) => {
    if (behind) return;
    bendTo(p.x, p.y, p.z, -camZ, bendU.uBendR.value);
    screenTo(bp[0], bp[1], bp[2]);
    if (sp[2] <= 1) return void (behind = true);
    const q = (shape[shapeN] = pairs[shapeN] ??= [0, 0]);
    q[0] = sp[0];
    q[1] = sp[1];
    shapeN++;
  };
  function outline(id: string): readonly (readonly [number, number])[] | null {
    shapeN = 0;
    behind = false;
    if (!things.outlineEach(id, toShape) || behind || !shapeN) return null;
    shape.length = shapeN;
    return shape;
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
  let horizonY = NaN;
  const tg = new Float64Array(2);
  /** Where the ground's silhouette is on screen: the tangent from the camera to the log, seen in the y-z plane. */
  function horizon(): number {
    if (!Number.isNaN(horizonY)) return horizonY;
    horizonAt(camera, camZ, tg);
    screenTo(camera.position.x, tg[0], tg[1]);
    horizonY = Math.max(0, sp[1]);
    return horizonY;
  }
  /** How much a card must stretch to show as tall as it's wide-scaled: the inverse of its height's foreshortening. */
  function stretch(x: number, y: number, z: number, lean: number): number {
    const R = bendU.uBendR.value;
    bendTo(x, y, -z, -camZ, R);
    const bx = bp[0], by = bp[1], bz = bp[2];
    screenTo(bx, by, bz);
    const sy = sp[1], depth = sp[2];
    const th = (z - camZ) / R, a = lean + th;
    // its up: leaning back by its lean and the log's slope there
    screenTo(bx, by + 10 * Math.cos(a), bz - 10 * Math.sin(a));
    const ty = sp[1];
    const k = depth > 1 ? focal / depth : 1;
    return Math.min(2.2, Math.max(1, (10 * k) / Math.max(0.1, sy - ty)));
  }

  // ---- the finger ----
  let touch = false, vel = 0, lastT = 0, settling = false;
  /** The finger has moved the camera since it touched (a drag or a pinch, not a tap). */
  let moved = false;
  const rushing = () => (touch ? moved : !focus && (Math.abs(vel) > RUSH_V || Math.abs(velX) > RUSH_V));
  /** The ground's units across a px at the pivot (VIEW_W across the screen at zoom 1). */
  const unitsPerPx = () => VIEW_W / (W * zoomK);
  /** Past an end the scroll gives less and less (iOS's rubber band). */
  const rubber = (over: number) => (over <= 0 ? 0 : (1 - 1 / (over / 160 + 1)) * 160);
  let rawZ = camZ;
  const clampZ = (z: number) => (z < lim.min ? lim.min - rubber(lim.min - z) : z > lim.max ? lim.max + rubber(z - lim.max) : z);
  /** A lighter pixel ratio while the camera moves (the tent's way), back once it's still; never for a tap. */
  let lightened = false;
  /** A swap made, its first frame not yet drawn: when, the set's ms, which way (onSwap). */
  let swapAt = 0, swapSet = 0, swapOn = false;
  let swapHook: ((on: boolean, setMs: number, frameMs: number) => void) | null = null;
  function light(on: boolean) {
    const moving = opts.dprMoving ?? DPR_MOVING;
    if (on === lightened || opts.dpr <= moving) return;
    lightened = on;
    const t0 = now();
    renderer.setPixelRatio(on ? moving : opts.dpr);
    renderer.setSize(W, H, false);
    swapAt = t0;
    swapSet = now() - t0;
    swapOn = on;
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
    const m = midX();
    return Math.max(m - r, Math.min(m + r, x));
  };
  function pan(dy: number, dx = 0) {
    lastInput = now();
    if (focus) return;
    light(true);
    settling = false;
    moved ||= touch;
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
    lastInput = now();
    if (focus) return;
    light(true);
    settling = false;
    moved ||= touch;
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
    lastInput = now();
    if (focus) return;
    vel = vy;
    velX = xRoom() > 0 ? vx : 0;
    lastT = now();
    activity();
  }
  /** The spring back to the default zoom after a pinch released zoomed out past it (eased out over ZOOM_BACK_MS). */
  let zoomBack: { t0: number; k0: number } | null = null;
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
      zoomK = zoomBack.k0 + (ZOOM.min - zoomBack.k0) * cubicOut(k);
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
    const m = move, k = cubicInOut(Math.min(1, (t - m.t0) / m.ms)), lerp = (a: number, b: number) => a + (b - a) * k;
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
  const skyNow = new Color(), sunNow = new Color();
  function tod(t: Tod, wet = 0, fogCss?: string) {
    todLook = TOD[t];
    const dim = 1 - 0.35 * wet;
    fog.color.set(fogCss && /^#[0-9a-f]{6}$/i.test(fogCss) ? fogCss : todLook.fog);
    hemi.color.set(todLook.hemi[0]);
    hemi.groundColor.set(todLook.hemi[1]);
    hemi.intensity = todLook.hemi[2] * dim;
    sun.color.set(todLook.sun[0]);
    sun.intensity = todLook.sun[1] * (1 - 0.6 * wet);
    const [sx, sy, sz] = todLook.sunAt;
    ground.light?.(skyNow.copy(hemi.color).multiplyScalar(hemi.intensity), sunNow.copy(sun.color).multiplyScalar(sun.intensity), sy / Math.hypot(sx, sy, sz));
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
      shadowed();
    }
    activity();
  }

  // ---- the frames ----
  let frames = 0, sceneCalls = 0, sceneTris = 0, shadowsDrawn = 0, shadowAt = 0, disposed = false, activeUntil = 0, lastFrame = 0, lastInput = now();
  /** The ground's water wanted its ambience in the last frame; the water's test and whether it's in view (as of
   *  the camera's rev `waterRev`). */
  let groundAmb = false, waterAt: ((x: number, z: number) => boolean) | null = null, waterRev = -1, waterOn = true;
  /** Whether any water is on screen: the screen's samples below the horizon on the ground (once a camera's rev). */
  function waterSeen(): boolean {
    if (!waterAt) return true;
    if (waterRev === rev) return waterOn;
    waterRev = rev;
    const top = Math.min(H - 1, horizon() + 2);
    for (let r = 0; r < WATER_ROWS; r++)
      for (let c = 0; c < WATER_COLS; c++) {
        const g = groundAt(((c + 0.5) / WATER_COLS) * W, top + ((r + 0.5) / WATER_ROWS) * (H - top));
        if (g && waterAt(g.x, g.z)) return (waterOn = true);
      }
    return (waterOn = false);
  }
  let wakeTimer: ReturnType<typeof setTimeout> | 0 = 0, wakeDue = Infinity;
  function wake(ms: number) {
    if (!Number.isFinite(ms) || disposed) return;
    const due = now() + Math.max(0, ms);
    if (wakeTimer && due >= wakeDue - 1) return;
    if (wakeTimer) clearTimeout(wakeTimer);
    wakeDue = due;
    wakeTimer = setTimeout(() => {
      wakeTimer = 0;
      wakeDue = Infinity;
      kick();
    }, Math.max(0, ms));
  }
  // (world3d/pace.ts: The full rate is せってい's frame rate, a finger's too: at 30 a display frame in
  // between is skipped; a kick from outside while nothing moves draws at once; the ambience's next is due at its own
  // rate: its timer lands just before, and a page with no other frames running has its rAF at once, not at a vsync)
  const pace = pacer(frame);
  /** When the shadow map is due to redraw (ms; Infinity: nothing changed since): a caster's change in the next frame,
   *  a slow caster's SLOW_SHADOW_MS after the last redraw; `shadowsNow`, changed from outside a frame (a model in, a
   *  layout's edit, the time of day): at once, at rest too, where the rest wait for REST_SHADOW_MS after the last. */
  let shadowDue = -Infinity, shadowsNow = false;
  /** The shadows changed (a caster moved or came or went; `slow`: a slow caster moved). */
  function shadowed(slow = false) {
    shadowDue = Math.min(shadowDue, slow ? shadowAt + (touch || rushing() ? MOVING_SHADOW_MS : SLOW_SHADOW_MS) : -Infinity);
    if (!inFrame && !slow) shadowsNow = true;
  }
  const shadowBy = (t: number) => (shadowsNow || !resting(t) ? shadowDue : Math.max(shadowDue, shadowAt + REST_SHADOW_MS));
  /** The last frame's: something moved (the full rate), only the ambience did. */
  let busy = false, ambience = false, paused = false, inFrame = false;
  let hook: ((t: number) => Want) | null = null;
  let drawnHook: ((t0: number, t1: number, wait: BootWait) => void) | null = null;
  const groupsPlaced = new Map<string, { obj: Object3D; off: () => void; ball: Sphere }>();
  /** The placed groups (a home, a bridge, a pond: still, bounds known) culled with the camera, as three can't: their
   *  meshes are bent in the shader, so each group's ball is bent here (its middle; its radius doubled, for the shadow
   *  it casts into view) and tested against the view (once a camera rev, or a group placed). */
  const frustum = new Frustum(), viewProj = new Matrix4(), bentBall = new Sphere();
  let culledRev = -1, culledThings = -1, culledSun: readonly number[] | null = null;
  /** A still thing's box (three's space, unbent: things.ts cull) in view, or its shadow: swept down the sun's way from
   *  its top to the ground as low as the sea's (one under the screen's bottom edge whose shadow falls on it stays
   *  drawn), its corners bent, a margin round them, tested against the view. */
  const swept = new Box3(), bentBox = new Box3(), corner = new Vector3();
  function thingSeen(box: Box3): boolean {
    const [sx, sy, sz] = todLook.sunAt;
    const reach = opts.shadows ? Math.max(0, box.max.y - SEA_Y) / Math.max(0.2, sy) : 0;
    swept.copy(box);
    swept.min.y = Math.min(swept.min.y, SEA_Y);
    swept.expandByPoint(corner.set(box.min.x - sx * reach, SEA_Y, box.min.z - sz * reach));
    swept.expandByPoint(corner.set(box.max.x - sx * reach, SEA_Y, box.max.z - sz * reach));
    bentBox.makeEmpty();
    const R = bendU.uBendR.value, pz = -camZ;
    for (let i = 0; i < 8; i++) {
      bendTo(i & 1 ? swept.max.x : swept.min.x, i & 2 ? swept.max.y : swept.min.y, i & 4 ? swept.max.z : swept.min.z, pz, R);
      bentBox.expandByPoint(corner.set(bp[0], bp[1], bp[2]));
    }
    return frustum.intersectsBox(bentBox.expandByScalar(20));
  }
  function cullGroups() {
    if (culledRev === rev && culledThings === things.cullRev() && culledSun === todLook.sunAt) return;
    culledRev = rev;
    culledThings = things.cullRev();
    culledSun = todLook.sunAt;
    viewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(viewProj);
    if (things.cull(thingSeen)) shadowed();
    const R = bendU.uBendR.value, pz = -camZ;
    for (const g of groupsPlaced.values()) {
      const c = g.ball.center;
      bendTo(c.x, c.y, c.z, pz, R);
      bentBall.center.set(bp[0], bp[1], bp[2]);
      bentBall.radius = g.ball.radius * 2 + 20;
      const on = frustum.intersectsSphere(bentBall);
      if (g.obj.visible !== on) {
        g.obj.visible = on;
        shadowed();
      }
    }
  }
  /** A placed group's resources once it was replaced or removed (a もようがえ's home, bridge or pond: the models'
   *  cache's, maybe in nothing else in the scene by the end): let go of with the scene's at the end, or they keep this
   *  renderer alive. */
  const unplaced: ReturnType<typeof resourcesOf> = new Set();
  function addObj(obj: Object3D): () => void {
    bendTree(obj);
    scene.add(obj);
    kick();
    return () => {
      scene.remove(obj);
      kick();
    };
  }
  // ---- what's new, made ready ahead: what's new in view is compiled before its first draw and not drawn until the GPU
  // has linked its programs (KHR_parallel_shader_compile: off the main thread), their first use is primed and its
  // textures are uploaded, a few a frame (warmup.ts). Drawn at once, a new material's link was waited for in the frame
  // (three's first use: its uniforms), 108-129 ms long tasks as the island loaded, and the island's ~180 textures went
  // up in the frame it appeared (255-533 ms in the iOS Simulator) ----
  const parallel = !noDraw && renderer.extensions.has('KHR_parallel_shader_compile');
  /** A kick since the last frame's look (a model in, a card, a flourish: maybe a new material). */
  let fresh = true;
  /** Compiled, not ready to draw yet (linking, its first use, its textures): what uses them is held back. */
  const warm = createWarmup(renderer);
  const heldBack: Object3D[] = [];
  const warming = (m: Material) => warm.has(m);
  let compiles = 0, holding = false, calmAt = 0;
  const materialsOf = (o: Object3D): Material[] => {
    const m = (o as Mesh).material as Material | Material[] | undefined;
    return !m || !drawn(o) ? [] : Array.isArray(m) ? m : [m];
  };
  const drawn = (o: Object3D) => (o as Mesh).isMesh || (o as unknown as { isPoints?: boolean }).isPoints || (o as unknown as { isLine?: boolean }).isLine;
  /** Whether one of `o`'s materials passes `test` (materialsOf without its array: hold looks at every object of the
   *  scene on a fresh kick, ~35 a second, and the arrays were 0.9 MB/s). */
  const someMaterial = (o: Object3D, test: (m: Material) => boolean): boolean => {
    const m = (o as Mesh).material as Material | Material[] | undefined;
    if (!m || !drawn(o)) return false;
    if (!Array.isArray(m)) return test(m);
    for (const x of m) if (test(x)) return true;
    return false;
  };
  const programList = () => (renderer.info.programs ?? []) as object[];
  /** `root`'s meshes compiled with the island's lights and fog, and what they need handed to the warm-up: its new
   *  materials (`news`; all of them when absent), and any whose program is new. */
  function prepare(root: Object3D, news?: Set<Material>) {
    const had = new Set(programList());
    const ms = renderer.compile(root, camera, scene);
    // (no parallel compile, or nothing drawn: no warm-up, its textures uploaded at once as before)
    if (!parallel) return void ms.forEach((m) => texturesOf(m).forEach((t) => renderer.initTexture(t)));
    const depths = news ? shadowsAhead(root) : [];
    const made = programList().filter((p) => !had.has(p));
    warm.add([...ms].filter((m) => !news || news.has(m) || made.includes((renderer.properties.get(m) as { currentProgram?: object }).currentProgram!)), made);
    warm.add(depths, []);
    kick(false);
  }
  /** The shadow map's depth materials, as its pass sets them up (three's WebGLShadowMap getDepthMaterial: a mesh's own
   *  customDepthMaterial or a plain RGBA one, its side, cut-out and map from the mesh's material), compiled ahead
   *  for `root`'s casters with the shadow map bound (its target's colour space: the same program keys): the pass
   *  compiled and linked them in the frame the island appeared, ~40 ms in the iOS Simulator. Its programs' links and
   *  first uses go through the warm-up too. None before the map exists (the first frame's). */
  const plainDepth = new Map<string, MeshDepthMaterial>();
  /** The pass draws into no scene of its own (three's empty one: no fog), with the island's lights. */
  const noScene = new Scene();
  const SHADOW_SIDE: Record<number, Side> = { [FrontSide]: BackSide, [BackSide]: FrontSide, [DoubleSide]: DoubleSide };
  function shadowsAhead(root: Object3D): Material[] {
    const map = sun.shadow.map;
    if (!opts.shadows || !map) return [];
    const out = new Set<Material>(), casters: [Mesh, Material][] = [];
    root.traverse((o) => {
      if (!(o as Mesh).isMesh || !o.castShadow) return;
      for (const m of materialsOf(o)) casters.push([o as Mesh, m]);
    });
    if (!casters.length) return [];
    const was = renderer.getRenderTarget();
    renderer.setRenderTarget(map);
    // (one pass: each caster seen with its depth material as the pass sets it up, its own put back after)
    renderer.compile({
      traverse(fn: (x: Object3D) => void) {
        for (const [o, m] of casters) {
          const s = m as MeshLambertMaterial;
          let d = o.customDepthMaterial as MeshDepthMaterial | undefined;
          if (!d) {
            const k = `${s.side}|${s.alphaTest > 0 && !!s.map}`;
            if (!plainDepth.has(k)) plainDepth.set(k, new MeshDepthMaterial({ depthPacking: RGBADepthPacking }));
            d = plainDepth.get(k)!;
          }
          Object.assign(d, { side: m.shadowSide ?? SHADOW_SIDE[m.side], alphaTest: m.alphaTest, map: s.map ?? null, alphaMap: s.alphaMap ?? null });
          const own = o.material;
          o.material = d;
          fn(o);
          o.material = own;
          out.add(d);
        }
      },
      traverseVisible: (fn: (x: Object3D) => void) => scene.traverseVisible(fn)
    } as unknown as Object3D, camera, noScene);
    renderer.setRenderTarget(was);
    return [...out];
  }
  /** Before a frame draws: a new material compiles (in view or not yet: what's coming too, prepare); what's
   *  waiting gets this frame's step (warmup.ts), and what uses it is hidden for this frame (hold's list, shown again
   *  after it). Held back together: what was waiting is drawn in one frame, as it all came. True: some is held back. */
  function hold(): boolean {
    if (!parallel || (!fresh && !warm.size())) return false;
    let any = fresh;
    fresh = false;
    if (any) {
      // (every new one, in view or not yet: what's coming too; its materials new to this renderer)
      const fresh: Object3D[] = [], news = new Set<Material>();
      const isNew = (m: Material) => !renderer.properties.has(m) && (news.add(m), true);
      scene.traverse((o) => {
        const m = (o as Mesh).material as Material | Material[] | undefined;
        if (!m || !drawn(o)) return;
        // (every new material of it noted, no closure an object: a fresh kick looks at the whole scene)
        let is = false;
        if (Array.isArray(m)) for (const x of m) is = isNew(x) || is;
        else is = isNew(m);
        if (is) fresh.push(o);
      });
      any = fresh.length > 0;
      if (any) {
        compiles++;
        // (theirs alone, in one pass: three's compile of the whole scene worked out every material's program again,
        // ~350 of them, a 79 ms frame in the iOS Simulator for a flourish's few; a material drawn before (a model's
        // shared one) waits only for a new program)
        prepare({ traverse: (fn: (o: Object3D) => void) => fresh.forEach(fn), traverseVisible: () => {} } as unknown as Object3D, news);
      }
    }
    if (!warm.size() || warm.step()) {
      // (what was held back is drawn now, its shadow too, at once)
      if (holding) (shadowed(), (shadowsNow = true), (calmAt = now()));
      return (holding = false);
    }
    scene.traverseVisible((o) => {
      if (someMaterial(o, warming)) heldBack.push(o);
    });
    for (const o of heldBack) o.visible = false;
    return (holding = true);
  }
  const cpu: number[] = [], gaps: number[] = [], stamps: number[] = [];
  /** What wanted the last frames (the e2e's and perf's: which part keeps the island drawing). */
  const why = new Set<string>();
  let full = 0, tagged = false;
  const fullWhy: Record<string, number> = {};
  const counted = (name: string) => void (fullWhy[name] = (fullWhy[name] ?? 0) + 1);
  const activity = (ms = 300) => {
    activeUntil = Math.max(activeUntil, now() + ms);
    kick(false);
  };
  /** A frame as soon as the display has one (a change from outside: a model in, a tap, the camera). A kick from inside
   *  a frame is that frame's own (what it changed is drawn in it): its parts' wants say whether another follows. At
   *  rest (no finger for REST_MS) with a frame already coming, it waits for that one (a critter's node, a falling
   *  leaf's model in: ~35 kicks a second on the demo, each a frame at once, held the ambience at 30, not REST_FPS).
   *  Paused or hidden, none: the frame would draw nothing (an animation frame asked for under a sheet, ~1 a second
   *  from a model in or a critter's tick); pause(false) and the page shown again kick. */
  function kick(changed = true) {
    // (something may be new in the scene: the frame looks for programs to compile first, `linking`)
    if (changed) fresh = true;
    if (inFrame || disposed || paused || document.hidden) return;
    if (pace.queued() && now() - lastInput > REST_MS) return;
    pace.kick();
  }
  const want = (w: Want, name: string) => {
    if (w === true) busy = true, why.add(name);
    else if (w === 'ambient') ambience = true, why.add(`~${name}`);
  };
  /** At rest (REST_MS): no finger for a while (the frame's own wants say whether anything moves). */
  const resting = (t: number) => !touch && t - lastInput > REST_MS && t >= activeUntil;
  /** The mount's task ends with no frame drawn: the first is a display frame later, not in the frame the mount ran
   *  into (back from a room: the mount's ~80 ms and the first frame's ~90 ms at 4x CPU were one 167 ms gap). */
  let mounting = true;
  function frame(vsync = now()) {
    if (disposed || document.hidden || paused) return;
    if (mounting) return void ((mounting = false), pace.kick());
    const t = now();
    const active = touch || t < activeUntil || busy;
    if (!pace.due(vsync, active ? FPS : 0)) return;
    inFrame = true;
    busy = ambience = groundAmb = tagged = false;
    why.clear();
    try {
      draw(t);
    } finally {
      inFrame = false;
    }
    // something moves: the next display frame; only the ambience: at its rate (calmer at rest), the water's only while
    // some of it is in view; else none
    if (busy || touch || now() < activeUntil) {
      full++;
      if (touch) counted('touch');
      else if (!busy) counted('active');
      // (the scene's own names in place of its `scene`)
      for (const w of why) if (w[0] !== '~' && !(tagged && w === 'scene')) counted(w);
      pace.kick();
    } else {
      if (groundAmb && !ambience && waterSeen()) (ambience = true), why.add('~ground');
      const fps = resting(now()) ? Math.min(opts.ambient, REST_FPS) : opts.ambient;
      if (ambience && fps > 0) pace.later(Math.min(fps, FPS));
      // (a shadow held back, at rest or a slow caster's, with no frame coming to draw it: one of its own)
      if (shadowDue < Infinity && opts.shadows && !pace.queued()) wake(Math.max(0, shadowBy(now()) - now()));
    }
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
    // (a wobbling model moves its shadow, a critter's fade brings its own or takes it: the map redraws; a walker's is a
    // blob, a fish's shadow casts none)
    const th = things.frame(t, thingSeen);
    if (th === 'cast') shadowed();
    want(th === 'cast' || th, 'things');
    if (hook) want(hook(t), 'scene');
    // (the scene placed its nodes for this camera: camStill waits for it)
    framedRev = rev;
    want(cards.frame(pitch * LEAN, stretch, src.feet), 'cards');
    want(effects.frame(t, camera), 'fx');
    want(marks.frame(t, camera, focal, W, H), 'bite');
    if (ground.update) {
      // (its water's ambience: whether it's in view is asked once nothing else wants a frame: frame())
      const g = ground.update(t);
      if (g === 'ambient') groundAmb = true;
      else want(g, 'ground');
    }
    want(lights.frame(t, camX, camZ + 110, bendU.uBendR.value, -camZ), 'lights');
    ground.near?.(camZ);
    if (ground.chunks) cullBands(ground.chunks(), camZ);
    cullGroups();
    // (new programs compiled ahead, what waits on them held back: before the shadow map's turn, which they join once in)
    const held = !noDraw && hold();
    // (the first frame only compiles: all of it is held back, and its draw was another ~20 ms of programs on top in one
    // frame; drawn in the next)
    const compileOnly = held && frames === 0;
    const shadowFrame = opts.shadows && !compileOnly && t >= shadowBy(t);
    if (shadowFrame) {
      renderer.shadowMap.needsUpdate = true;
      shadowDue = Infinity;
      shadowsNow = false;
      shadowAt = t;
      shadowsDrawn++;
    }
    if (!noDraw) {
      if (!compileOnly) renderer.render(scene, camera);
      if (!compileOnly && !shadowFrame) (sceneCalls = renderer.info.render.calls), (sceneTris = renderer.info.render.triangles);
      if (held) {
        for (const o of heldBack) o.visible = true;
        heldBack.length = 0;
        // (the GPU's links are polled: a frame again soon, till they're in)
        wake(16);
      }
    }
    // (nothing drawn: the counts are none, whatever the layout's ground baked on the GPU as it was built)
    else renderer.info.reset();
    const t1 = now();
    drawnHook?.(t, t1, held ? 'link' : things.pending() ? 'models' : cards.pending() ? 'cards' : null);
    if (swapAt && !noDraw && !compileOnly) {
      swapHook?.(swapOn, swapSet, t1 - t);
      swapAt = 0;
    }
    cpu.push(t1 - t);
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
  // a lost context: drawn again once it's back (three uploads the textures and programs again as they're drawn; the
  // ground's bakes came back blank)
  const unwatchGL = watchContext(canvas, 'island', () => {
    ground.restore?.();
    shadowed();
    resize();
  });

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
      // (a rush over: the World's next step places every node again, and camStill waits for it)
      if (rushing()) rev++;
      touch = on;
      moved = false;
      lastInput = now();
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
    rushing,
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
      // (the ends follow a layout change: the island's middle across too, its land's)
      camX = clampX(camX);
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
        groupsPlaced.set(id, { obj, off: addObj(obj), ball: new Box3().setFromObject(obj).getBoundingSphere(new Sphere()) });
        culledRev = -1;
      }
      shadowed();
      kick();
    },
    add: addObj,
    placedGroups: () => [...groupsPlaced.keys()],
    // (once nothing has waited for FX_CALM_MS: the island's own first, whole and drawn, then the flourishes', a few a frame)
    warmFx: () => new Promise<void>((done, fail) => {
      const go = () => (disposed ? done() : parallel && (warm.size() || fresh || now() - calmAt < FX_CALM_MS) ? setTimeout(go, 100) : effects.warm((s) => prepare(s)).then(done, fail));
      go();
    }),
    fxWarmed: () => effects.warmed(),
    bite: (slot, at) => marks.set(slot, at),
    biteState: (slot) => marks.state(slot),
    fx(kind, x, z, lift, o) {
      effects.spawn(kind, x, z, lift, o);
      // (an ambient one, tagged: the fall, a sleeper's zzz, an emitter's, plays at the ambient rate)
      if (o?.tag) kick();
      else activity(400);
    },
    renderer: () => renderer,
    gpu() {
      const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
      return String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    },
    at, outline, groundAt, horizon,
    rev: () => rev,
    kick: () => kick(),
    camStill: () => !touch && !vel && !velX && !zoomBack && !settling && !move && (framedRev === rev || paused || document.hidden),
    isPaused: () => paused,
    pause(on) {
      if (on === paused) return;
      paused = on;
      lastFrame = 0;
      if (on) pace.stop();
      else kick();
    },
    idle: () => !busy && !touch && !vel && !velX && !zoomBack && !settling && now() > activeUntil,
    wake,
    water(at) {
      waterAt = at;
      waterRev = -1;
      kick();
    },
    onFrame(fn) {
      hook = fn;
      kick();
    },
    tag(name) {
      if (inFrame) why.add(name), (tagged = true);
    },
    onDrawn(fn) {
      drawnHook = fn;
    },
    onSwap(fn) {
      swapHook = fn;
    },
    stats: () => {
      const l = lights.stats();
      return {
        fps: stamps.length, cpu: [pctl(cpu, 0.5), pctl(cpu, 0.95)], gap: [pctl(gaps, 0.5), pctl(gaps, 0.95)],
        calls: renderer.info.render.calls, tris: renderer.info.render.triangles, sceneCalls, sceneTris, textures: renderer.info.memory.textures,
        geometries: renderer.info.memory.geometries, programs: renderer.info.programs?.length ?? 0, shadows: shadowsDrawn, compiles, linking: warm.size(), dpr: renderer.getPixelRatio(), shadowSize: sun.shadow.mapSize.x, frames, at: lastFrame, input: lastInput,
        loading: things.pending() + cards.pending(), camZ, zoom: zoomK, points: l.points, lamps: l.lamps, slots: l.slots, pointMask: pointMask.on, fx: effects.count(),
        fxShown: effects.shown(), why: [...why], full, fullWhy: { ...fullWhy }, paused, drawn: !noDraw
      };
    },
    dispose() {
      disposed = true;
      warm.clear();
      for (const d of plainDepth.values()) d.dispose();
      pace.stop();
      if (wakeTimer) clearTimeout(wakeTimer);
      document.removeEventListener('visibilitychange', onVis);
      unwatchGL();
      // every geometry, material and texture still in the scene (and once placed) let go of on this renderer: three's
      // listeners on each keep it, and one shared with the next island (a cached home's, bridge's or villager's model)
      // kept this whole renderer and its context alive, one more a room's round trip (~1 MB of heap each in Chromium)
      releaseAll([scene], unplaced);
      things.dispose();
      cards.dispose();
      effects.dispose();
      marks.dispose();
      lights.dispose();
      ground.dispose?.();
      for (const v of Object.values(sun.shadow)) if (v instanceof Texture) v.dispose();
      sun.shadow.map?.dispose();
      endRenderer(renderer);
    }
  };
}
