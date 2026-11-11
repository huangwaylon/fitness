// The tent's room in 3D (docs/design.md "The tent"): three.js, loaded only when the tent opens (its own chunk). NH's
// largest room (8 × 8 tiles, grid.ts) or a smaller one (its size: grid.ts Bounds, the walls rebuilt round it) under NH's fixed, slightly top-down room camera and a warm interior light: the
// floor and three walls in NH's wallpaper and flooring, the furniture as the glTFs scripts/room-models.ts made, the
// villagers NH's own 3D models where they have one (villager3d/: the island's; walking, sitting, lying, a hop, their
// blinks), else billboards of their official renders, each with a soft round shadow. Drawn on demand: a frame only when something changed or moves (a walk, a
// piece popping in, a jiggle), nothing while still. Plain TS; the screen (TentRoom.svelte) drives it.
import {
  AmbientLight, BoxGeometry, CanvasTexture, CircleGeometry, Color, DirectionalLight, DoubleSide, Group, HemisphereLight,
  LineBasicMaterial, LineSegments, BufferGeometry, Float32BufferAttribute, Mesh, MeshBasicMaterial, MeshLambertMaterial,
  Box3, Object3D, PCFSoftShadowMap, PerspectiveCamera, Plane, PlaneGeometry, PointLight, Raycaster, RepeatWrapping, Scene, Sprite,
  SpriteMaterial, SRGBColorSpace, Texture, DataTexture, TextureLoader, Vector3, type MeshStandardMaterial
} from 'three';
import { cubicOut } from '#lib/math.ts';
import { FULL, HALF, TILE, centreOf, emitterOf, isCeiling, isSurface, isWallItem, onTop, rectOf, wallMid, wallSpot, type Bounds, type Facing, type Pt, type Spot } from './grid.ts';
import { footprint, glowUrl, ITEMS, modelBytes, modelUrl, texUrl } from './items.ts';
import { VILLAGER_S, createVillager, type Villager3D } from '../villager3d/villager3d.ts';
import { hitsSkinned } from '../player3d/hit.ts';
import type { Person3 } from '../person3d/person3d.ts';
import { seatOf } from '../villager3d/poses.ts';
import type { Anchor } from '../villager3d/seats3d.ts';
import { DPR_MOVING, endRenderer, makeRenderer } from '../world3d/stage.ts';
import { LIDS, lidK, lidMoving, lidOpen, lidOpenIn, lidWant, splitLid, type Lid } from './lid.ts';
import { freeModel, modelCache } from '../world3d/modelCache.ts';
import { glbLoader } from '../world3d/gltf.ts';
import { softDisc } from '../world3d/cards.ts';
import { FPS } from '#lib/store/frameRate.ts';
import { pacer } from '../world3d/pace.ts';
import { ENTRY_HOLD_MS, PACE, VILLAGER_H, along, panBox, roomScreen, walkLens, type Insets, type Walk } from '../rooms/view.ts';
import { roomPan } from '../rooms/pan.ts';
import { EYE_MARGIN, camAz, clampEye, firstPerson as createFirstPerson, headAnchor, type Rect } from '../rooms/firstPerson.ts';

/** The walls' height (RoomMdlWall: 40 model units, four tiles). */
const WALL_H = 40;
/** Camera: degrees down from the horizontal and the lens (NH's room camera: steep, a long lens). */
const PITCH = 47;
const FOV = 32;
/** How many lamps light the room at night (a point light each, nearest the middle first). */
const LIGHTS_MAX = 4;

/** Whose villager (the guest's too: docs/design.md "The guest"). */
export type Who = 'A' | 'B' | 'G';
/** Who stands in the room: a person's villager, or one of the place's own characters (`n:<id>`: the shop's twins). */
type Actor = Who | `n:${string}`;
/**
 * A building's own inside drawn in the room's place (the shop: shop/plan.ts): NH's model of it, its parts by side so
 * the cutaway takes the walls between the camera and the room (`side`: which wall a triangle's middle belongs to, or
 * null: the floor and what stands on it), the floor's rect (where the camera frames and the eye keeps to), its walls'
 * height, and its door in the front wall (the doormat inside it; the first person's closed door in it).
 */
export interface Shell {
  url: string;
  rect: [x0: number, x1: number, z0: number, z1: number];
  h: number;
  /** The front wall's plane (z) and the door's middle (x) and width in it. */
  front: number;
  door: [x: number, w: number];
  /** A wall's side (0 back, 1 left, 2 right) for a point of the model over the floor, or null. */
  side(x: number, y: number, z: number): 0 | 1 | 2 | null;
  /** Too wide for a phone held upright at the whole room's framing: the default view this near (× the whole room's
   *  distance), its middle following the followed villager within these bounds (model units). */
  follow?: { k: number; x: [number, number]; z: [number, number] };
}
export interface Look {
  /** The render's URL and its aspect (width / height). */
  url: string;
  aspect: number;
  /** The render looks toward the viewer's right as drawn; never mirror it (a logo on the outfit). */
  looksRight: boolean;
  noMirror: boolean;
  /** Its 3D model (person3d: the villager's, when NH has one, or the human player's): drawn instead of the render. */
  person?: Person3;
  /** Its render never drawn, only its tap area (a human player: not its villager's picture while its model loads). */
  cardless?: boolean;
}
type Hit = { kind: 'piece'; id: string } | { kind: 'villager'; who: Who } | { kind: 'npc'; id: string } | { kind: 'door' } | { kind: 'floor'; x: number; z: number };
interface Placed extends Spot {
  id: string;
  /** How high it stands (a surface's top: a small thing on a table), and its middle there (model units). */
  y?: number;
  at?: readonly [number, number];
  /** A light's switch (1 on, 0 off; none: on, as it came). */
  l?: 0 | 1;
}
/** A villager sitting or lying: where (model units), how high, and the piece's front (it faces that way). */
export interface Pose {
  at: Pt;
  y: number;
  lie: boolean;
  front: Pt;
  /** Its model's own seat (villager3d/seats3d.ts): a 3D villager sits or lies on it there (villager3d sitAt). */
  a?: Anchor;
  /** The piece's id (a lid shuts over who lies in it: lid.ts). */
  id?: string;
}
interface Ghost {
  item: string;
  x: number;
  z: number;
  f: Facing;
  ok: boolean;
  /** On a surface: how high, and its middle there (model units). */
  y?: number;
  at?: readonly [number, number];
  /** What stands on it (a table carried with its things): each one's slot and facing on it. */
  kids?: readonly { item: string; x: number; z: number; f: Facing }[];
}

export interface Tent {
  /** The canvas's size changed (or what covers it). */
  resize(insets?: Insets): void;
  /** The camera at rest (no framing or view easing under way): the e2e's taps aim then. */
  still(): boolean;
  surfaces(wall: string, floor: string): void;
  /** The room's size (grid.ts Bounds: its floor, walls and the camera's framing fitted to it). */
  size(b: Bounds): void;
  /** These pieces' footprints glow red a moment (what a shrink would leave outside). */
  warn(list: readonly Spot[]): void;
  /** What stands in the room (by id: new ones load and pop in, gone ones go, moved ones move). */
  pieces(list: readonly Placed[]): void;
  /** Hide these pieces where they stand (the one I'm moving, the ones the partner holds). */
  hide(ids: readonly string[]): void;
  /** What the partner holds, where their finger has it (model units, the piece's middle): lifted, eased there. */
  held(list: readonly { id: string; item: string; x: number; z: number; f: Facing }[]): void;
  /** The piece under client px, a rug too (the edit mode's pick), furniture first. */
  pick(cx: number, cy: number): string | null;
  /** The wall under client px and where on it (across from its left end, up; model units). */
  wallAt(cx: number, cy: number): { wall: number; u: number; y: number } | null;
  ghost(g: Ghost | null): void;
  /** Whether client px is on what I hold: `on` its drawn shape, `near` it (its bounds on screen grown by `slop` px), or
   *  not (null). */
  onHeld(cx: number, cy: number, slop: number): 'on' | 'near' | null;
  /** What I hold shakes its head (a tap on another piece while holding it). */
  nudge(): void;
  /** A footprint flashes red there a moment (a tap where what I hold can't go: it stays where it was). */
  flash(g: Omit<Ghost, 'ok' | 'kids'> | null): void;
  /** The point (model units) on the top of a surface under client px (not `except`, not a thing on a top), or null. */
  surfacePoint(cx: number, cy: number, except?: string): [number, number] | null;
  /** The edit mode's grid on the floor. */
  grid(on: boolean): void;
  /** A piece jiggles where it stands (a tap). */
  bump(id: string): void;
  /** NH's room light switch (off: the room's own light goes down). */
  room(on: boolean): void;
  /** A villager sits or lies (null: it stands where it is). */
  pose(who: Who, p: Pose | null): void;
  /** One of the place's own characters (the shop's twins): NH's model (`m.id`'s, at `m.url`) standing at `at`, turned
   *  to the camera as the villagers are; a tap on it is `{kind: 'npc', id}`. Null: gone. */
  npc(id: string, m: { id: string; url: string } | null, at?: Pt): void;
  /** Where a piece's top is (model units: its middle, over its height), or null: not in the room. */
  pieceTop(id: string): [number, number, number] | null;
  /** Whose villager the camera follows in a building's inside (Shell `follow`), from where it is now. */
  follow(who: Actor | null): void;
  /** 0 day … 1 night: the light, and the lamps on. */
  night(n: number): void;
  villager(who: Who, look: Look | null): void;
  /** The test hook's: a 3D villager's state, the box its skinned meshes fill now (bones applied) relative to its group's
   *  spot, that spot and its head bone (room units), or null (no model, or a card). */
  v3(who: Who): { state: string; box: [number[], number[]]; at: number[]; head: number[] | null } | null;
  /** The model drawn for `who` (person3d's key: `v:<roster id>`, `p:…` a human player), null till one is in. */
  model(who: Who): string | null;
  /** Where a villager stands now (model units). */
  at(who: Actor): [number, number] | null;
  /** Put a villager at a point, facing left (-1) or right (1). */
  put(who: Who, p: Pt, face?: number): void;
  /** Walk a villager along `pts` from `from` (its spot now when left out), starting `ago` ms ago, at PACE. Returns
   *  the walk's length (ms). */
  walk(who: Who, pts: readonly Pt[], o?: { from?: Pt; ago?: number; ms?: number }): number;
  walking(who: Who): boolean;
  /** Ms till `who` gets up (a lid opening over it first: lid.ts), 0 when nothing holds it. */
  upIn(who: Who): number;
  /** The test hook's: how shut a piece's lid is (0 open … 1 shut), null with none. */
  lid(id: string): number | null;
  /** A villager turns toward a point (left or right) or hops (a tap on it). */
  face(who: Actor, toward: Pt): void;
  hop(who: Actor): void;
  /** The top of a villager's head (model units; null: not in here): a speech balloon's anchor (Says, by way of the
   *  camera). Now the top of its card (its render's head; the 3D model is as tall); the head bone's when it's switched. */
  headPoint(who: Actor): [number, number, number] | null;
  /** The first-person view (docs/design.md "First person"): the camera at `who`'s eyes (null: the room's camera), a
   *  short glide there (`snap`: at once); its body hidden from it. Local only: nothing is sent. */
  firstPerson(who: Who | null, snap?: boolean): void;
  /** A finger's move in the first-person view (px): the head turns. */
  look(dx: number, dy: number): void;
  /** The first-person view now (the e2e): wanted on, fully in, still gliding or easing, where it looks (radians), the eye (model units). */
  fpv(): { on: boolean; inside: boolean; busy: boolean; yaw: number; pitch: number; eye: [number, number, number] };
  /** Whether a model point is in front of the camera and on the canvas (a balloon's anchor: not behind the eyes). */
  inView(x: number, y: number, z: number): boolean;
  /** Turn the camera round the room's middle and tilt it (radians), zoom it (a factor: > 1 nearer); all clamped. */
  orbit(dAz: number, dPitch: number): void;
  zoom(f: number): void;
  /** Two fingers (rooms/gesture.ts RoomCam): the zoom about their middle, the pan by its move; and a fling on. */
  pinch(scale: number, dx: number, dy: number, mx: number, my: number): void;
  fling(vx: number, vy: number): void;
  /** Back to NH's view (eased); whether it's there. */
  resetView(): void;
  isDefault(): boolean;
  /** A gesture under way (a lighter pixel ratio while the camera moves). */
  moving(on: boolean): void;
  /** After each frame drawn (the scene's overlays that follow the camera: a speech balloon carried with its speaker). */
  onDrawn(fn: (() => void) | null): void;
  /** Where the floor's middle and the usable band's middle are on screen (client px). */
  centre(): { at: [number, number]; band: [number, number] };
  /** What a tap at client px hits, in front first. */
  hit(cx: number, cy: number): Hit | null;
  /** The floor point under client px (model units), or null off the floor. */
  floorAt(cx: number, cy: number): [number, number] | null;
  /** A model point's client px (the e2e and the overlays). */
  client(x: number, y: number, z: number): [number, number];
  /** Pieces still loading. */
  loading(): number;
  /** Frames drawn, and the last frame's draw calls and triangles (the e2e's budget); `queued`: a frame is asked for
   *  (something moves: a walk, a camera glide, a model popping in); `mem`: the GPU's geometries, textures and programs. */
  stats(): { frames: number; shadows: number; calls: number; tris: number; dpr: number; cost: number[]; queued: boolean; mem: [number, number, number]; models: ReturnType<typeof furniture.stats> };
  /** The first frame was drawn (the room on screen). */
  ready: Promise<void>;
  dispose(): void;
}

const now = () => performance.now();
/** A clear pixel: the card of one with no render (its model only). */
const BLANK_PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=';
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The ceiling from below (the first person's): warm plaster crossed by two wooden beams, tiled. */
function beams(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#efe3cc';
  g.fillRect(0, 0, 128, 128);
  for (const y of [0, 64]) {
    g.fillStyle = '#b48a5c';
    g.fillRect(0, y, 128, 10);
    g.fillStyle = '#8e6a44';
    g.fillRect(0, y + 8, 128, 2);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(4, 4);
  return t;
}

/** NH's doormat at the door: a woven mat, its stripes. */
function matTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 48;
  const g = c.getContext('2d')!;
  g.fillStyle = '#B98A55';
  g.beginPath();
  g.roundRect(2, 2, 124, 44, 12);
  g.fill();
  g.strokeStyle = '#8E6236';
  g.lineWidth = 3;
  for (let x = 14; x < 120; x += 10) {
    g.beginPath();
    g.moveTo(x, 9);
    g.lineTo(x, 39);
    g.stroke();
  }
  g.strokeStyle = '#E9D2A8';
  g.lineWidth = 4;
  g.beginPath();
  g.roundRect(6, 6, 116, 36, 9);
  g.stroke();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** The furniture as loaded, by item, kept across the rooms' visits (world3d/modelCache.ts: where every one of the 440
 *  ever shown stayed for the page's life), the MODEL_KEEP last used of those no room uses. */
const MODEL_KEEP = 48;
/** A piece's model: its own file, or cut from its pack (items.ts modelBytes: the packed rest of NH's catalogue). */
const loadPiece = async (code: string) => {
  if (!ITEMS[code]?.pk) return glbLoader({ plain: true }).loadAsync(modelUrl(code));
  const b = await modelBytes(code);
  if (!b) throw new Error(`tent: no pack for ${code}`);
  return glbLoader({ plain: true }).parseAsync(b, '');
};
const furniture = modelCache(MODEL_KEEP, (code) => loadPiece(code).then((g) => {
  g.scene.traverse((n) => {
    const m = n as Mesh;
    if (!m.isMesh) return;
    m.castShadow = !ITEMS[code]?.rug;
    m.receiveShadow = true;
    // Lambert, as the museum's and the island's are (the models' own are standard, rough 1, metal 0: the same light
    // but a faint sheen; their programs ~3× the size, the room's first entry a long compile): a lamp's glow off
    // till it's switched on (lights)
    const lam = (x: MeshStandardMaterial) => {
      const l = new MeshLambertMaterial({
        name: x.name, map: x.map, color: x.color, alphaTest: x.alphaTest, side: x.side, transparent: x.transparent, opacity: x.opacity,
        depthWrite: x.depthWrite, emissive: x.emissive, emissiveMap: x.emissiveMap, emissiveIntensity: x.emissiveMap ? 0 : x.emissiveIntensity,
        // a rug lies on the floor: drawn over it, never fighting it
        ...(ITEMS[code]?.rug ? { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 } : {})
      });
      x.dispose();
      return l;
    };
    m.material = Array.isArray(m.material) ? (m.material as MeshStandardMaterial[]).map(lam) : lam(m.material as MeshStandardMaterial);
  });
  // a lid of its own (lid.ts): cut out once, under its hinge, the clones sharing it
  if (LIDS[code]) splitLid(g.scene, LIDS[code]);
  return g;
}), 'tent: model');

/** NH's standard material as the rooms' Lambert (as the furniture's: `furniture`). A see-through two-sided one (the
 *  shop's window panes: flat, nothing of their own behind them) drawn in one pass: one program and one draw, not
 *  three's two (back, then front). */
const toLambert = (x: MeshStandardMaterial): MeshLambertMaterial =>
  new MeshLambertMaterial({ name: x.name, map: x.map, color: x.color, alphaTest: x.alphaTest, side: x.side, transparent: x.transparent, opacity: x.opacity, depthWrite: x.depthWrite,
    forceSinglePass: x.transparent && x.side === DoubleSide });
/** The buildings' insides (Shell) as loaded, kept page-wide: the shop comes back with no fetch or decode. */
const shells = modelCache(1, (url) => glbLoader({ plain: true }).loadAsync(url), 'tent: shell');

export function createTent(canvas: HTMLCanvasElement, o: { shell?: Shell } = {}): Tent {
  const sh = o.shell ?? null;
  const shellModels = shells.user();
  // (noDraw: the e2e's logic mode, testMode.ts: every frame runs, nothing is drawn)
  const { renderer, noDraw, dpr } = makeRenderer(canvas);
  renderer.shadowMap.enabled = !noDraw;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const scene = new Scene();
  scene.background = new Color(0x2a1f17);
  const camera = new PerspectiveCamera(FOV, 1, 10, 2000);
  const screen = roomScreen(camera, canvas), { client, inView } = screen;
  let insets: Insets = { top: 0, bottom: 0 };
  /** The first-person view (rooms/firstPerson.ts) and whose eyes it's at. */
  const fp = createFirstPerson();
  let fpWho: Who | null = null;

  // the warm interior light: a soft sky over a warm floor bounce, the key from the upper front left with soft shadows
  const hemi = new HemisphereLight(0xfff3dc, 0x9a7656, 1.5);
  const key = new DirectionalLight(0xfff0d6, 2.1);
  key.position.set(-34, 90, 60);
  key.target.position.set(0, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  // (a building's inside is wider than the largest room: its whole floor in the shadow's view)
  const shadowR = sh ? Math.max(60, ...sh.rect.map(Math.abs)) + 8 : 60;
  Object.assign(key.shadow.camera, { left: -shadowR, right: shadowR, top: shadowR, bottom: -shadowR, near: 10, far: 260 });
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.4;
  const amb = new AmbientLight(0xffe8cc, 0.35);
  // a soft fill from the camera's side, so the back wall and the fronts of things aren't in the dark
  const fill = new DirectionalLight(0xfff4e6, 0.9);
  fill.position.set(10, 50, 140);
  scene.add(hemi, key, key.target, amb, fill);

  // ---- the room: the floor on its base and four walls (the front one with the door), each with its cut top; a wall
  //      between the camera and the room is cut away (NH's Happy Home Paradise), so the room shows from any side ----
  const tex = new TextureLoader();
  /** A 1×1 map of a surface's colour till its own arrives: the material has its map from the first frame, so the
   *  wallpaper's and the flooring's arrival only swaps it (the same program; a map added later compiled another). */
  const swatch = (hex: number) => {
    const t = new DataTexture(new Uint8Array([hex >> 16, (hex >> 8) & 255, hex & 255, 255]), 1, 1);
    t.colorSpace = SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  };
  const floorMat = new MeshLambertMaterial({ map: swatch(0xd8c4a0) });
  const wallMat = new MeshLambertMaterial({ map: swatch(0xe8dcc6) });
  const trimMat = new MeshLambertMaterial({ color: 0x5b4330 });
  const capMat = new MeshLambertMaterial({ color: 0xf1e6cf });
  const gridMat = new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, depthWrite: false });
  const T = 2;
  /** The room's size, its floor's rect in model units (x0, x1, z0, z1) and middle, its side (model units). */
  let bounds: Bounds = FULL;
  let floorRect = sh ? sh.rect : rectOf(bounds), L = bounds.n * TILE;
  /** The walls' height (a building's own: its model's). */
  const wallH = sh?.h ?? WALL_H;
  const midX = () => (floorRect[0] + floorRect[1]) / 2, midZ = () => (floorRect[2] + floorRect[3]) / 2;
  /** A wall's face from u0 to u1 along it (its own middle at 0) and y0 to y1 up, its UVs the wallpaper's (two tiles
   *  across, the wall's height). */
  const wallFace = (u0: number, u1: number, y0: number, y1: number) => {
    const g = new PlaneGeometry(u1 - u0, y1 - y0);
    g.translate((u0 + u1) / 2, (y0 + y1) / 2, 0);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + L / 2) / (2 * TILE), p.getY(i) / WALL_H);
    return g;
  };
  interface Wall {
    g: Group;
    /** Its outward normal (x, z): cut away when the camera is out on that side. */
    n: [number, number];
  }
  const walls: Wall[] = [];
  /** A wall along u (its middle at 0, L long), facing in; `door`: the front one's opening (two tiles wide, three high,
   *  in its middle: the front wall's middle is the largest room's in every size). */
  function wall(n: [number, number], door = false): Wall {
    const g = new Group();
    const h = L / 2;
    const faces = door ? [wallFace(-h, -TILE, 0, WALL_H), wallFace(TILE, h, 0, WALL_H), wallFace(-TILE, TILE, 30, WALL_H)] : [wallFace(-h, h, 0, WALL_H)];
    const index = walls.length;
    for (const f of faces) {
      const m = new Mesh(f, wallMat);
      m.receiveShadow = true;
      m.userData.wall = index;
      g.add(m);
    }
    // its cut top and the dark frame just outside it (a hair off: their faces never fight the wallpaper's)
    const top = new Mesh(new BoxGeometry(L + T * 2, 1, T), capMat);
    top.position.set(0, WALL_H + 0.5, -T / 2 - 0.15);
    const back = new Mesh(new BoxGeometry(L + T * 2, WALL_H, T), trimMat);
    back.position.set(0, WALL_H / 2, -T / 2 - 0.15);
    g.add(top, back);
    // placed on its side of the room, turned to face in
    g.position.set(midX() + n[0] * h, 0, midZ() + n[1] * h);
    g.rotation.y = Math.atan2(-n[0], -n[1]);
    const w = { g, n };
    walls.push(w);
    scene.add(g);
    return w;
  }
  const floor = new Mesh(new PlaneGeometry(1, 1), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  const base = new Mesh(new BoxGeometry(1, 4, 1), trimMat);
  const mat = new Mesh(new PlaneGeometry(18, 6.5), new MeshLambertMaterial({ map: matTexture(), transparent: true }));
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(sh ? sh.door[0] : 0, 0.06, (sh ? sh.front : HALF) - 3.6);
  mat.receiveShadow = true;
  mat.renderOrder = 1;
  scene.add(floor, base, mat);
  // the ceiling at the walls' top (facing down) and a closed door in the doorway (facing in): the first person's only
  // (unlit: the room's lights all shine down, so a lit ceiling was a muddy brown; dimmed with the room's light)
  const ceilingMat = new MeshBasicMaterial({ map: beams() });
  const ceiling = new Mesh(new PlaneGeometry(1, 1), ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = wallH;
  const door = new Mesh(new PlaneGeometry(sh ? sh.door[1] : 2 * TILE, 30), new MeshLambertMaterial({ color: 0x7a5234 }));
  door.position.set(sh ? sh.door[0] : 0, 15, (sh ? sh.front : HALF) + 0.08);
  door.rotation.y = Math.PI;
  ceiling.visible = door.visible = false;
  scene.add(ceiling, door);
  // ---- the grid (edit mode) ----
  const gridLines = new LineSegments(new BufferGeometry(), gridMat);
  gridLines.visible = false;
  gridLines.renderOrder = 2;
  scene.add(gridLines);
  /** The room's shell for its size: the floor, its base and the ceiling sized, the walls built round it (what hangs on
   *  them moved onto the new ones), the grid over its tiles. */
  function shell(b: Bounds) {
    bounds = b;
    if (sh) return shellOf(sh);
    floorRect = rectOf(b);
    L = b.n * TILE;
    const [x0, x1, z0, z1] = floorRect;
    floor.scale.set(L, L, 1);
    floor.position.set(midX(), 0, midZ());
    base.scale.set(L + T * 2 + 0.6, 1, L + T * 2 + 0.6);
    base.position.set(midX(), -2.01, midZ());
    ceiling.scale.set(L + 0.2, L + 0.2, 1);
    ceiling.position.set(midX(), WALL_H, midZ());
    const was = walls.splice(0);
    for (const [i, [n, d]] of ([[[0, -1], false], [[-1, 0], false], [[1, 0], false], [[0, 1], true]] as [[number, number], boolean][]).entries()) {
      const w = wall(n, d);
      const old = was[i];
      if (!old) continue;
      w.g.visible = old.g.visible;
      // its wall things and a ghost on it, in the new wall's frame (their u is the largest room's: placeRoot)
      for (const c of [...old.g.children]) if (c.userData.wall === undefined && !(c as Mesh).isMesh) w.g.add(c);
      for (const c of [...old.g.children]) if (c === foot || c === ring) w.g.add(c);
      old.g.removeFromParent();
      old.g.traverse((o) => (o as Mesh).geometry?.dispose());
    }
    const v: number[] = [];
    for (let i = b.x0; i <= b.x1; i++) v.push(-HALF + i * TILE, 0.4, z0, -HALF + i * TILE, 0.4, z1);
    for (let i = b.z0; i <= b.z1; i++) v.push(x0, 0.4, -HALF + i * TILE, x1, 0.4, -HALF + i * TILE);
    gridLines.geometry.dispose();
    gridLines.geometry = new BufferGeometry().setAttribute('position', new Float32BufferAttribute(v, 3));
    // a floor is four tiles to a texture's repeat
    if (floorMat.map) floorMat.map.repeat.set(b.n / 4, b.n / 4);
  }
  /**
   * A building's inside (`sh`) in the room's place, once: its model's triangles split by side into the walls' groups
   * (back, left, right: the cutaway's, as the room's own walls), the rest (the floor and what stands on it) in the
   * room; a front wall of its own with the doorway (NH's model has none: seen at the eyes, or from behind). The room's
   * own floor and walls aren't drawn. Its model is kept across visits (shellModels).
   */
  function shellOf(s: Shell) {
    if (walls.length) return;
    const [x0, x1, z0, z1] = s.rect;
    floor.visible = base.visible = false;
    for (const n of [[0, -1], [-1, 0], [1, 0], [0, 1]] as [number, number][]) {
      const g = new Group();
      walls.push({ g, n });
      scene.add(g);
    }
    // the back wall's group on its plane, facing in: what hangs on it at its spot across (placeRoot)
    walls[0].g.position.set(0, 0, z0);
    // the front wall: either side of the door and over it, facing in
    const [dx, dw] = s.door, frontMat = new MeshLambertMaterial({ color: 0xd8b07a });
    // (from world x a to b, y0 to y1: turned to face in, its own x is the world's mirrored)
    const face = (a: number, b: number, y0: number, y1: number) => {
      const m = new Mesh(new PlaneGeometry(b - a, y1 - y0).translate(-(a + b) / 2, (y0 + y1) / 2, 0), frontMat);
      m.rotation.y = Math.PI;
      m.position.z = s.front;
      m.receiveShadow = true;
      walls[3].g.add(m);
    };
    face(x0 - 3, dx - dw / 2, 0, s.h);
    face(dx + dw / 2, x1 + 3, 0, s.h);
    face(dx - dw / 2, dx + dw / 2, 30, s.h);
    target.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
    ceiling.scale.set(x1 - x0 + 6, z1 - z0 + 6, 1);
    ceiling.position.set((x0 + x1) / 2, s.h, (z0 + z1) / 2);
    void shellModels.load(s.url).then((g) => {
      if (disposed || !g) return;
      g.scene.updateMatrixWorld(true);
      const parts: Mesh[] = [];
      g.scene.traverse((n) => void ((n as Mesh).isMesh && parts.push(n as Mesh)));
      const v = new Vector3(), c = new Vector3();
      for (const m of parts) {
        const geo = m.geometry, pos = geo.attributes.position, idx = geo.index, n = idx ? idx.count : pos.count;
        const bins: number[][] = [[], [], [], []];
        for (let t = 0; t < n; t += 3) {
          c.set(0, 0, 0);
          for (let k = 0; k < 3; k++) c.add(v.fromBufferAttribute(pos, idx ? idx.getX(t + k) : t + k));
          c.multiplyScalar(1 / 3).applyMatrix4(m.matrixWorld);
          const bin = bins[s.side(c.x, c.y, c.z) ?? 3];
          for (let k = 0; k < 3; k++) bin.push(idx ? idx.getX(t + k) : t + k);
        }
        const mat = toLambert(m.material as MeshStandardMaterial);
        bins.forEach((list, b) => {
          if (!list.length) return;
          const part = new BufferGeometry();
          for (const [name, a] of Object.entries(geo.attributes)) part.setAttribute(name, a);
          part.setIndex(list);
          const mesh = new Mesh(part, mat);
          mesh.applyMatrix4(m.matrixWorld);
          mesh.receiveShadow = true;
          // (what stands in the room casts; the walls don't: the cutaway would change the floor's shadows)
          mesh.castShadow = b === 3;
          scene.add(mesh);
          if (b < 3) walls[b].g.attach(mesh);
        });
      }
      shadowsDirty = true;
      invalidate();
    }, () => {});
  }
  /** The walls between the camera and the room go (its side's outward normal toward the camera); at the eyes all stand,
   *  the ceiling and the door's closed door with them (seen from above the ceiling is its back: culled, nothing drawn). */
  function cutaway() {
    const cx = Math.sin(view.az), cz = Math.cos(view.az), inside = fp.inside();
    let changed = false;
    for (const w of walls) {
      const on = inside || w.n[0] * cx + w.n[1] * cz < 0.25;
      if (w.g.visible !== on) (w.g.visible = on), (changed = true);
    }
    ceiling.visible = door.visible = fp.mix > 0;
    // (a wall's things go with it: the shadow map again, the one change of what casts a view makes)
    if (changed) shadowsDirty = true;
  }

  function surfaces(wallCode: string, fl: string) {
    const load = async (code: string, kind: 'wall' | 'floor', m: MeshLambertMaterial, rx: number, ry: number) => {
      // its picture, and its glow where NH's has one (lit in the dark: night, or the room's light off)
      const [url, glow] = await Promise.all([texUrl(kind, code), glowUrl(code)]);
      const get = (u: string | null) => (u ? tex.loadAsync(u).catch(() => null) : Promise.resolve(null));
      const [t, e] = await Promise.all([get(url), get(glow)]);
      if (disposed || cur[kind] !== code) return void (t?.dispose(), e?.dispose());
      for (const x of [t, e]) if (x) {
        x.colorSpace = SRGBColorSpace;
        x.wrapS = x.wrapT = RepeatWrapping;
        x.repeat.set(rx, ry);
        x.anisotropy = 4;
      }
      if (t) {
        m.map?.dispose();
        m.map = t;
      }
      m.emissiveMap?.dispose();
      m.emissiveMap = e;
      m.emissive.set(e ? 0xffffff : 0x000000);
      m.needsUpdate = true;
      glows();
      invalidate();
    };
    // a wallpaper's tiling is in the walls' UVs; a floor is four tiles each way
    if (wallCode !== cur.wall) void load((cur.wall = wallCode), 'wall', wallMat, 1, 1);
    if (fl !== cur.floor) void load((cur.floor = fl), 'floor', floorMat, bounds.n / 4, bounds.n / 4);
  }
  /** A wallpaper's or a floor's glow: on in the dark, as NH's glowing ones (the static look of the moving ones:
   *  docs/world3d-assets.md "Wallpapers and floors"). */
  function glows() {
    const k = roomOn ? Math.max(0, (nightN - 0.3) / 0.7) : 1;
    for (const m of [wallMat, floorMat]) m.emissiveIntensity = m.emissiveMap ? 0.15 + 0.85 * k : 1;
  }
  const cur = { wall: '', floor: '' };


  // ---- the furniture ----
  /** The items this room has asked for, handed back on dispose. */
  const models = furniture.user();
  const model = models.load;
  interface Live {
    spot: Placed;
    root: Group;
    body: Object3D | null;
    pop: number;
    bump: number;
    on: boolean | null;
    lit: MeshLambertMaterial[];
    /** Its lid's hinge (lid.ts) and its motion. */
    lid: { pivot: Object3D; run: Lid } | null;
  }
  const live = new Map<string, Live>();
  /** Pieces not drawn where they stand: the one I'm moving, the ones the partner holds. */
  let hidden = new Set<string>();
  let pending = 0;
  const placeRoot = (root: Group, s: Spot & { y?: number; at?: readonly [number, number] }, lift = 0) => {
    // a wall thing in its wall's own frame (the wall's group: it goes with the wall when the wall is cut away)
    if (isWallItem(s.item)) {
      const [u, y] = sh && s.at ? [s.at[0] + wallMid(s.f, bounds), s.y ?? 20] : wallSpot(s);
      root.position.set(u - wallMid(s.f, bounds), y, 0.2 + lift * 0.3);
      root.rotation.set(0, 0, 0);
      return;
    }
    const [cx, cz] = s.at ?? centreOf(s);
    // (a ceiling piece hangs from the ceiling: its model's origin is its top; held, a little lower)
    root.position.set(cx, isCeiling(s.item) ? WALL_H - lift : (s.y ?? 0) + lift, cz);
    root.rotation.y = (s.f * Math.PI) / 2;
  };
  /** Where a piece stands (a light's switch apart: the room's one shadow is the key light's, no lamp casts). */
  const standsAt = (s: Placed) => `${s.x},${s.z},${s.f},${s.on ?? ''},${s.y ?? ''},${s.at ?? ''}`;
  const letGo = (l: Live) => {
    l.root.removeFromParent();
    for (const m of l.lit) m.dispose();
  };
  function pieces(list: readonly Placed[]) {
    const ids = new Set(list.map((p) => p.id));
    // (the shadow map redrawn only when a piece came, went or moved: a light switched alone redrew it)
    let moved = false;
    for (const [id, l] of live) if (!ids.has(id)) {
      letGo(l);
      live.delete(id);
      moved = true;
    }
    for (const s of list) {
      const was = live.get(s.id);
      if (was && was.spot.item === s.item && (!isWallItem(s.item) || was.spot.f === s.f)) {
        if (standsAt(was.spot) !== standsAt(s)) moved = true;
        was.spot = s;
        placeRoot(was.root, s);
        continue;
      }
      moved = true;
      if (was) {
        // (another item in its place: the old one's lamp materials too)
        letGo(was);
        live.delete(s.id);
      }
      const root = new Group();
      root.userData.id = s.id;
      placeRoot(root, s);
      root.visible = !hidden.has(s.id);
      const l: Live = { spot: s, root, body: null, pop: 0, bump: 0, on: null, lit: [], lid: null };
      live.set(s.id, l);
      (isWallItem(s.item) ? walls[s.f]?.g ?? scene : scene).add(root);
      pending++;
      void model(s.item).then((g) => {
        if (!--pending) warmSoon();
        if (disposed || live.get(s.id) !== l || !g) return;
        const body = g.scene.clone(true);
        // a lamp's own material, so one lamp turns on or off alone
        if (ITEMS[s.item]?.lit) body.traverse((n) => {
          const m = n as Mesh;
          if (!m.isMesh) return;
          const x = m.material as MeshLambertMaterial;
          if (x.emissiveMap) {
            const c = x.clone();
            l.lit.push(c);
            m.material = c;
          }
        });
        body.traverse((n) => (n.userData.id = s.id));
        const pivot = LIDS[s.item] ? body.getObjectByName('lid') : undefined;
        l.lid = pivot ? { pivot, run: lidOpen() } : null;
        l.body = body;
        l.pop = now();
        root.add(body);
        lights();
        shadowsDirty = true;
        invalidate();
      });
    }
    lights();
    tallOnes();
    if (moved) shadowsDirty = true;
    invalidate();
  }
  function hide(ids: readonly string[]) {
    const was = hidden;
    hidden = new Set(ids);
    for (const [id, l] of live) l.root.visible = !hidden.has(id);
    tallOnes();
    lights();
    if (hidden.size !== was.size || [...hidden].some((id) => !was.has(id))) shadowsDirty = true;
    invalidate();
  }

  // ---- what the partner holds: lifted where their finger has it, a soft yellow footprint, eased between updates ----
  interface Held {
    item: string;
    root: Group;
    ring: LineSegments;
    to: [number, number];
    at: [number, number];
    f: Facing;
    t: number;
  }
  const heldBy = new Map<string, Held>();
  const heldMat = new LineBasicMaterial({ color: 0xffd84d, transparent: true, opacity: 0.95, depthWrite: false });
  const rect = (w: number, d: number) => {
    const hw = (w * TILE) / 2 - 0.4, hd = (d * TILE) / 2 - 0.4, y = 0.6;
    return new BufferGeometry().setAttribute('position', new Float32BufferAttribute([
      -hw, y, -hd, hw, y, -hd, hw, y, -hd, hw, y, hd, hw, y, hd, -hw, y, hd, -hw, y, hd, -hw, y, -hd
    ], 3));
  };
  function held(list: readonly { id: string; item: string; x: number; z: number; f: Facing }[]) {
    const ids = new Set(list.map((h) => h.id));
    for (const [id, h] of heldBy) if (!ids.has(id) || h.item !== list.find((x) => x.id === id)?.item) {
      scene.remove(h.root, h.ring);
      h.ring.geometry.dispose();
      heldBy.delete(id);
    }
    for (const x of list) {
      let h = heldBy.get(x.id);
      if (!h) {
        const root = new Group();
        const [w, d] = footprint(x.item, x.f);
        const ring = new LineSegments(rect(w, d), heldMat);
        ring.renderOrder = 4;
        // from where the piece stands (or straight where the finger is, a new one)
        const from = live.get(x.id)?.root.position;
        h = { item: x.item, root, ring, to: [x.x, x.z], at: from ? [from.x, from.z] : [x.x, x.z], f: x.f, t: now() };
        heldBy.set(x.id, h);
        scene.add(root, ring);
        const hh = h;
        void model(x.item).then((g) => {
          if (!g || disposed || heldBy.get(x.id) !== hh) return;
          root.add(g.scene.clone(true));
          invalidate();
        });
      }
      if (h.f !== x.f) {
        const [w, d] = footprint(x.item, x.f);
        h.ring.geometry.dispose();
        h.ring.geometry = rect(w, d);
      }
      h.to = [x.x, x.z];
      h.f = x.f;
    }
    invalidate();
  }

  // ---- the ghost: what's held, lifted, its footprint green or red ----
  const ghostRoot = new Group();
  // (over a rug: rugs sit a little over the floor, drawn nearer by their polygon offset)
  const footMat = new MeshBasicMaterial({ color: 0x78dc78, transparent: true, opacity: 0.5, depthWrite: false, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 });
  const foot = new Mesh(new PlaneGeometry(1, 1), footMat);
  foot.rotation.x = -Math.PI / 2;
  foot.renderOrder = 3;
  const ring = new LineSegments(new BufferGeometry(), new LineBasicMaterial({ color: 0xffffff }));
  ring.renderOrder = 4;
  scene.add(ghostRoot, foot, ring);
  foot.visible = ring.visible = false;
  let ghostKey = '';
  let ghostBody: Object3D | null = null;
  let ghostT = 0, ghostY = 0, ghostKidsKey = '[]', wallGhost = false;
  const ghostKids = new Group();
  ghostRoot.add(ghostKids);
  let ghostTurn: { from: number; to: number; t0: number } | null = null;
  function ghost(g: Ghost | null) {
    foot.visible = ring.visible = ghostRoot.visible = handle.visible = !!g;
    if (!g) {
      ghostKey = '';
      ghostKidsKey = '[]';
      ghostKids.clear();
      if (ghostBody) ghostRoot.remove(ghostBody);
      ghostBody = null;
      invalidate();
      return;
    }
    if (isWallItem(g.item)) {
      // on its wall: the ghost and its footprint (an outline on the wallpaper) in the wall's frame
      const wg = walls[g.f]?.g ?? scene, m = ITEMS[g.item], w = (m?.w ?? 1) * TILE, h = m?.h ?? 5;
      const [u, y] = wallSpot(g);
      for (const o of [ghostRoot, foot, ring]) if (o.parent !== wg) wg.add(o);
      const um = u - wallMid(g.f, bounds);
      ghostRoot.position.set(um, y, 0.2);
      ghostRoot.rotation.set(0, 0, 0);
      ghostY = y;
      foot.rotation.set(0, 0, 0);
      foot.scale.set(w - 0.8, h + 1, 1);
      foot.position.set(um, y, 0.25);
      footMat.color.set(g.ok ? 0x78dc78 : 0xf05a50);
      ring.geometry.dispose();
      const hw = w / 2 - 0.4, hh = (h + 1) / 2;
      ring.geometry = new BufferGeometry().setAttribute('position', new Float32BufferAttribute([-hw, -hh, 0, hw, -hh, 0, hw, -hh, 0, hw, hh, 0, hw, hh, 0, -hw, hh, 0, -hw, hh, 0, -hw, -hh, 0], 3));
      ring.position.set(um, y, 0.3);
      ring.rotation.set(0, 0, 0);
      if (ghostKey !== g.item) {
        ghostKey = g.item;
        if (ghostBody) ghostRoot.remove(ghostBody);
        ghostBody = null;
        void model(g.item).then((mm) => {
          if (!mm || disposed || ghostKey !== g.item) return;
          ghostBody = mm.scene.clone(true);
          ghostRoot.add(ghostBody);
          ghostT = now();
          invalidate();
        });
      }
      wallGhost = true;
      invalidate();
      return;
    }
    if (wallGhost) {
      // back on the floor: the ghost and its footprint in the room again
      for (const o of [ghostRoot, foot, ring]) scene.add(o);
      foot.rotation.set(-Math.PI / 2, 0, 0);
      wallGhost = false;
    }
    const [w, d] = footprint(g.item, g.f);
    const [cx, cz] = g.at ?? centreOf(g);
    foot.scale.set(w * TILE - 0.8, d * TILE - 0.8, 1);
    foot.position.set(cx, (g.y ?? 0) + 0.5, cz);
    footMat.color.set(g.ok ? 0x78dc78 : 0xf05a50);
    const hw = (w * TILE) / 2 - 0.4, hd = (d * TILE) / 2 - 0.4, y = 0.6;
    ring.geometry.dispose();
    ring.geometry = new BufferGeometry().setAttribute('position', new Float32BufferAttribute([
      -hw, y, -hd, hw, y, -hd, hw, y, -hd, hw, y, hd, hw, y, hd, -hw, y, hd, -hw, y, hd, -hw, y, -hd
    ], 3));
    ring.position.set(cx, g.y ?? 0, cz);
    const was = ghostRoot.rotation.y, same = ghostKey === g.item;
    placeRoot(ghostRoot, g, 3);
    ghostY = g.y ?? 0;
    // its things ride with it, each on its slot (the table's own frame: they turn with it)
    const kidsKey = JSON.stringify(g.kids ?? []);
    if (kidsKey !== ghostKidsKey) {
      ghostKidsKey = kidsKey;
      ghostKids.clear();
      for (const k of g.kids ?? []) {
        const holder = new Group();
        holder.position.set(...onTop(g.item, k));
        holder.rotation.y = (k.f * Math.PI) / 2;
        ghostKids.add(holder);
        void model(k.item).then((mm) => {
          if (mm && !disposed && ghostKids.children.includes(holder)) (holder.add(mm.scene.clone(true)), invalidate());
        });
      }
    }
    // a quarter turn eases round (the shortest way), the footprint already where it lands
    const to = ghostRoot.rotation.y;
    if (same && Math.abs(Math.atan2(Math.sin(to - was), Math.cos(to - was))) > 0.01) {
      ghostTurn = { from: was, to: was + Math.atan2(Math.sin(to - was), Math.cos(to - was)), t0: now() };
      ghostRoot.rotation.y = was;
    }
    if (ghostKey !== g.item) {
      ghostKey = g.item;
      if (ghostBody) ghostRoot.remove(ghostBody);
      ghostBody = null;
      ghostT = now();
      void model(g.item).then((m) => {
        if (!m || disposed || ghostKey !== g.item) return;
        ghostBody = m.scene.clone(true);
        ghostBody.traverse((n) => (n.userData.ghost = true));
        ghostRoot.add(ghostBody);
        ghostT = now();
        invalidate();
      });
    }
    invalidate();
  }
  // ---- what I hold, made plain: a handle bobbing over it (NH's raised piece), a head-shake when a tap on another piece
  //      is refused, and a red footprint flashed where a tap can't put it ----
  const handleTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d')!;
    x.fillStyle = '#ffd84d';
    x.strokeStyle = '#fff';
    x.lineWidth = 6;
    x.lineJoin = 'round';
    x.beginPath();
    x.moveTo(10, 14);
    x.lineTo(54, 14);
    x.lineTo(32, 52);
    x.closePath();
    x.stroke();
    x.fill();
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
  })();
  const handle = new Sprite(new SpriteMaterial({ map: handleTex, depthTest: false, transparent: true }));
  handle.scale.set(4.2, 4.2, 1);
  handle.renderOrder = 6;
  handle.visible = false;
  scene.add(handle);
  let nudgeT = 0;
  function nudge() {
    if (!ghostRoot.visible) return;
    nudgeT = now();
    invalidate();
  }
  const nopeMat = new MeshBasicMaterial({ color: 0xf05a50, transparent: true, opacity: 0, depthWrite: false, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 });
  const nope = new Mesh(new PlaneGeometry(1, 1), nopeMat);
  nope.rotation.x = -Math.PI / 2;
  nope.renderOrder = 3;
  nope.visible = false;
  scene.add(nope);
  let nopeT = 0;
  function flash(g: Omit<Ghost, 'ok' | 'kids'> | null) {
    if (!g || isWallItem(g.item)) return void (nope.visible = false);
    const [w, d] = footprint(g.item, g.f), [cx, cz] = g.at ?? centreOf(g);
    nope.scale.set(w * TILE - 0.8, d * TILE - 0.8, 1);
    nope.position.set(cx, (g.y ?? 0) + 0.55, cz);
    nope.visible = true;
    nopeT = now();
    invalidate();
  }
  /** What a shrink would leave outside: each one's footprint (a wall thing's outline on its wall) pulsing red a while. */
  // (drawn over the piece itself: its footprint is under it, and it's the piece that's being pointed at)
  const warnMat = nopeMat.clone();
  warnMat.depthTest = false;
  const warned: Mesh[] = [];
  let warnT = 0;
  const WARN_MS = 2600;
  function warn(list: readonly Spot[]) {
    for (const m of warned.splice(0)) m.removeFromParent();
    for (const s of list) {
      const m = new Mesh(nope.geometry, warnMat);
      m.renderOrder = 3;
      if (isWallItem(s.item)) {
        const it = ITEMS[s.item], [u, y] = wallSpot(s);
        m.scale.set((it?.w ?? 1) * TILE - 0.8, (it?.h ?? 5) + 1, 1);
        m.position.set(u - wallMid(s.f, bounds), y, 0.35);
        (walls[s.f]?.g ?? scene).add(m);
      } else {
        const [w, d] = footprint(s.item, s.f), [cx, cz] = centreOf(s);
        m.rotation.x = -Math.PI / 2;
        m.scale.set(w * TILE - 0.8, d * TILE - 0.8, 1);
        m.position.set(cx, 0.6, cz);
        m.renderOrder = 4;
        scene.add(m);
      }
      warned.push(m);
    }
    warnT = now();
    invalidate();
  }
  /** The room's size: its shell rebuilt, the camera's target its floor's middle, the framing fitted again. */
  function size(b: Bounds) {
    if (b.n === bounds.n) return;
    shell(b);
    target.set(midX(), 0, midZ());
    tallOnes();
    fit();
  }
  function onHeld(cx: number, cy: number, slop: number): 'on' | 'near' | null {
    if (!ghostRoot.visible) return null;
    toNdc(cx, cy);
    if (ray.intersectObject(ghostRoot, true).length) return 'on';
    return onScreen(ghostRoot, cx, cy, slop) ? 'near' : null;
  }
  /** Whether client px is on a thing's drawn shape (its bounds projected to the screen), grown by `slop` px. */
  function onScreen(o: Object3D, cx: number, cy: number, slop: number): boolean {
    o.updateMatrixWorld();
    const b = new Box3().setFromObject(o);
    if (b.isEmpty()) return false;
    const r = canvas.getBoundingClientRect();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < 8; i++) {
      const v = new Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).project(camera);
      const sx = r.left + ((v.x + 1) / 2) * r.width, sy = r.top + ((1 - v.y) / 2) * r.height;
      x0 = Math.min(x0, sx);
      x1 = Math.max(x1, sx);
      y0 = Math.min(y0, sy);
      y1 = Math.max(y1, sy);
    }
    return cx >= x0 - slop && cx <= x1 + slop && cy >= y0 - slop && cy <= y1 + slop;
  }
  function surfacePoint(cx: number, cy: number, except?: string): [number, number] | null {
    toNdc(cx, cy);
    const tops = [...live.values()].filter((l) => shown(l) && !l.spot.on && l.spot.id !== except && isSurface(l.spot.item));
    const h = ray.intersectObjects(tops.map((l) => l.root), true)[0];
    if (!h) return null;
    const id = h.object.userData.id as string | undefined, l = id ? live.get(id) : undefined;
    if (!l) return null;
    // kept on its tiles (a hit on its front face is at its edge)
    const [w, d] = footprint(l.spot.item, l.spot.f), x0 = -HALF + l.spot.x * TILE, z0 = -HALF + l.spot.z * TILE;
    return [Math.min(x0 + w * TILE - 1, Math.max(x0 + 1, h.point.x)), Math.min(z0 + d * TILE - 1, Math.max(z0 + 1, h.point.z))];
  }
  function grid(on: boolean) {
    gridLines.visible = on;
    invalidate();
  }
  function bump(id: string) {
    const l = live.get(id);
    if (!l) return;
    l.bump = now();
    invalidate();
  }

  // ---- night: dimmer, warmer, and the lamps lit ----
  let nightN = 0;
  const pointLights: PointLight[] = [];
  for (let i = 0; i < LIGHTS_MAX; i++) {
    const p = new PointLight(0xffc27a, 0, 42, 1.6);
    pointLights.push(p);
    scene.add(p);
  }
  /** A lamp's point light where it glows (grid.ts emitterOf: NH's light locator or its emissive part, turned with the
   *  piece; a wall thing's through its wall's frame), in the room's frame. */
  function emitterAt(l: Live): Vector3 {
    const wall = isWallItem(l.spot.item);
    const at = new Vector3(...emitterOf(l.spot.item, wall ? 0 : l.spot.f)).add(l.root.position);
    const g = l.root.parent;
    if (wall && g) {
      g.updateWorldMatrix(true, false);
      g.localToWorld(at);
    }
    return at;
  }
  /** NH's room light switch: off, the room's own light goes down (the lamps that are on light it). */
  let roomOn = true;
  function lights() {
    // a light glows while it's switched on (NH's lamps: at any hour); in the dark (night, or the room's light off) the
    // ones on light the room round them (a few point lights: the phone's budget)
    const dark = nightN > 0.5 || !roomOn;
    const lamps = [...live.values()].filter((l) => ITEMS[l.spot.item]?.lt && l.root.visible).map((l) => {
      const on = (l.spot.l ?? 1) === 1;
      for (const m of l.lit) m.emissiveIntensity = on ? 1.4 : 0;
      return { l, on, at: on ? emitterAt(l) : null };
    }).filter((x) => x.at);
    const off = (v: Vector3) => Math.hypot(v.x - midX(), v.z - midZ());
    lamps.sort((a, b) => off(a.at!) - off(b.at!));
    pointLights.forEach((p, i) => {
      const x = dark ? lamps[i] : undefined;
      p.intensity = x ? 900 : 0;
      if (x) p.position.copy(x.at!);
    });
  }
  function room(on: boolean) {
    roomOn = on;
    night(nightN);
  }
  function night(n: number) {
    nightN = Math.max(0, Math.min(1, n));
    const k = nightN, dim = roomOn ? 1 : 0.32;
    hemi.intensity = (1.5 - 0.75 * k) * dim;
    hemi.color.set(0xfff3dc).lerp(new Color(0xc9c4e8), k * 0.6);
    key.intensity = (2.1 - 1.3 * k) * dim;
    key.color.set(0xfff0d6).lerp(new Color(0xffd29a), k);
    amb.intensity = (0.35 - 0.1 * k) * (roomOn ? 1 : 0.6);
    fill.intensity = (0.9 - 0.4 * k) * dim;
    ceilingMat.color.setScalar((0.86 - 0.36 * k) * (roomOn ? 1 : 0.45));
    glows();
    for (const v of villagers.values()) {
      v.mat.color.set(0xffffff).lerp(new Color(0xd8cfe8), k * 0.35);
      v.v3?.lift(v3Lift());
    }
    lights();
    invalidate();
  }

  // ---- the villagers: billboards of their renders standing at their feet, turned to the camera about the up axis
  //      only (and leaning back a little toward it, so a steep view doesn't squash them), cut out by alpha (depth
  //      sorted with the furniture: behind a table it hides them, in front of it they cover it), a soft round shadow ----
  interface Walker {
    look: Look;
    card: Mesh;
    mat: MeshBasicMaterial;
    shadow: Mesh;
    pos: [number, number];
    /** -1 left, 1 right. */
    face: number;
    path: Walk | null;
    hop: number;
    /** Sitting or lying (a walk stands it up). */
    pose: Pose | null;
    /** The render's alpha, small (a tap hits the villager, not the clear around it). */
    alpha: { w: number; h: number; a: Uint8ClampedArray } | null;
    /** Its 3D model once loaded (the card then only its tap area, undrawn), where it was last frame, its heading. */
    v3: Villager3D | null;
    was: [number, number];
    yaw: number;
    /** Posed in the last frame (one more pose once it stops: settled). */
    posing: boolean;
    /** Where it last went or turned to (a yaw: its forward (sin, cos)): the first person's view starts looking there. */
    heading: number;
    /** Getting up then (now's clock: a lid opens over it first), still lying till then; 0 not held. */
    upAt: number;
  }
  /** The villagers' models are in the island's units (80 u tall): the room's are VILLAGER_H. */
  const V3_SCALE = VILLAGER_H / 80;
  const v3Lift = () => (0.3 - 0.18 * nightN) * (roomOn ? 1 : 0.5);
  const villagers = new Map<Actor, Walker>();
  const disc = softDisc('40,25,10');
  const cardGeo = new PlaneGeometry(1, 1).translate(0, 0.5, 0);
  const shadowGeo = new CircleGeometry(4.2, 24);
  const shadowMat = new MeshBasicMaterial({ map: disc, transparent: true, depthWrite: false });
  /** Its 3D model up (`look`'s person), placed where the walker is, once loaded; over the one it had (another look:
   *  swapped in place, the walk, the seat and the first person going on with the new model). */
  function model3(who: Actor, w: Walker, look: Look) {
    // (staggered: a person's by their letter, the place's own characters each by their name)
    const p = look.person?.create(who.length > 1 ? [...who].reduce((a, c) => a + c.charCodeAt(0), 0) * 0.37 : who.charCodeAt(0) * 0.7);
    if (p) v3Pending++;
    if (p) void p.finally(() => v3Pending--).then((v) => {
      if (disposed || villagers.get(who) !== w || w.look !== look) return v.dispose();
      if (w.v3) w.v3.dispose();
      else w.yaw = az + w.face * 0.5;
      w.v3 = v;
      v.group.scale.setScalar(V3_SCALE);
      v.lift(v3Lift());
      scene.add(v.group);
      // the card stays as its tap area, undrawn; the model has its own shadow
      w.mat.visible = false;
      w.shadow.visible = false;
      w.posing = true;
      place(w);
      invalidate();
    }, () => {});
  }
  function villager(who: Actor, look: Look | null) {
    const was = villagers.get(who);
    // the same render, another model (a look changed: theirs or mine): swapped in place
    if (was && look && was.look.url === look.url && (was.look.person?.key ?? null) !== (look.person?.key ?? null)) {
      was.look = look;
      return model3(who, was, look);
    }
    if (was && (!look || was.look.url !== look.url)) {
      scene.remove(was.card, was.shadow);
      was.v3?.dispose();
      was.mat.map?.dispose();
      was.mat.dispose();
      villagers.delete(who);
      invalidate();
    }
    // (the same look again, or none again: nothing to draw; the frames stay on demand)
    if (!look || villagers.has(who)) return;
    const mat = new MeshBasicMaterial({ alphaTest: 0.5, side: DoubleSide });
    mat.visible = false;
    const card = new Mesh(cardGeo, mat);
    card.rotation.order = 'YXZ';
    card.userData.who = who;
    const shadow = new Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.renderOrder = 2;
    const w: Walker = { look, card, mat, shadow, pos: [who === 'A' ? -6 : who === 'B' ? 6 : 0, 20], face: who === 'A' ? 1 : -1, path: null, hop: 0, alpha: null, pose: null, v3: null, was: [0, 0], yaw: 0, posing: true, heading: Math.PI, upAt: 0 };
    w.was = [...w.pos];
    villagers.set(who, w);
    scene.add(card, shadow);
    model3(who, w, look);
    tex.loadAsync(look.url).then((t) => {
      if (disposed || villagers.get(who) !== w) return t.dispose();
      t.colorSpace = SRGBColorSpace;
      mat.map = t;
      mat.visible = !w.v3 && !w.look.cardless;
      mat.needsUpdate = true;
      const img = t.image as CanvasImageSource & { width: number; height: number };
      const ah = 48, aw = Math.max(1, Math.round((ah * img.width) / img.height));
      const c = document.createElement('canvas');
      c.width = aw;
      c.height = ah;
      const g = c.getContext('2d', { willReadFrequently: true });
      if (g) {
        g.drawImage(img, 0, 0, aw, ah);
        const d = g.getImageData(0, 0, aw, ah).data, a = new Uint8ClampedArray(aw * ah);
        for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3];
        w.alpha = { w: aw, h: ah, a };
      }
      night(nightN);
      place(w);
      invalidate();
    }, () => {});
    place(w);
  }
  function setFace(w: Walker, face: number) {
    w.face = face;
  }
  /** As drawn the render looks left (most) or right; mirrored to face the other way (never a no-mirror one). The
   *  facing is on screen: left and right as the camera sees them. */
  function place(w: Walker, bob = 0, squash = 0) {
    const P = w.pose;
    // seated, it faces the piece's front as the camera sees it
    if (P) w.face = screenSide(P.front[0], P.front[1]) || w.face;
    const flip = !w.look.noMirror && (w.face > 0) !== w.look.looksRight;
    if (w.v3) {
      placeCard(w, P, flip, bob, squash);
      const g = w.v3.group;
      // on its model's own seat: the villager sits down there itself (and the group is its own till it gets up)
      if (P?.a) return w.v3.sitAt(P.a);
      if (w.v3.seat()) w.v3.sitAt(null);
      if (P) {
        // its hips on the seat's top (lying: its middle on the bed), facing the piece's front
        g.position.set(P.at[0], P.lie ? P.y : P.y - seatOf(w.v3.rig.body) * VILLAGER_S * V3_SCALE, P.at[1]);
        g.rotation.set(0, Math.atan2(P.front[0], P.front[1]), 0);
      } else {
        g.position.set(w.pos[0], 0, w.pos[1]);
        g.rotation.set(0, w.yaw, 0);
      }
      return;
    }
    if (P) {
      // the renders have no sitting or lying art: sitting, the billboard sinks into the seat to the hips, a little
      // shorter; lying, it lies back along the bed, its head toward the bed's back, facing up at the camera
      w.card.position.set(P.at[0], P.lie ? P.y + 0.3 : P.y - VILLAGER_H * 0.22, P.at[1]);
      w.card.rotation.set(P.lie ? -Math.PI / 2 + 0.35 : lean, az, 0);
      w.card.scale.set(VILLAGER_H * w.look.aspect * (flip ? -1 : 1), VILLAGER_H * (P.lie ? 0.95 : 0.92), 1);
      w.shadow.visible = false;
      return;
    }
    w.shadow.visible = true;
    w.card.position.set(w.pos[0], bob, w.pos[1]);
    w.card.rotation.set(lean, az, 0);
    w.card.scale.set(VILLAGER_H * w.look.aspect * (flip ? -1 : 1) * (1 + squash), VILLAGER_H * (1 - squash), 1);
    w.shadow.position.set(w.pos[0], 0.1, w.pos[1]);
    const s = 1 - Math.min(0.3, bob / 8);
    w.shadow.scale.set(s, s, s);
  }
  /** The card as the 3D villager's tap area: where its render would be (undrawn). */
  function placeCard(w: Walker, P: Pose | null, flip: boolean, bob: number, squash: number) {
    w.card.position.set(P ? P.at[0] : w.pos[0], P ? P.y - VILLAGER_H * 0.22 : bob, P ? P.at[1] : w.pos[1]);
    w.card.rotation.set(lean, az, 0);
    w.card.scale.set(VILLAGER_H * w.look.aspect * (flip ? -1 : 1) * (1 + squash), VILLAGER_H * (1 - squash), 1);
  }
  function pose(who: Who, p: Pose | null) {
    const w = villagers.get(who);
    if (!w) return;
    w.pose = p;
    w.upAt = 0;
    if (p) {
      w.path = null;
      w.heading = Math.atan2(p.front[0], p.front[1]);
      // (sat on its model's seat: it gets up a step in front, where it walks off from)
      w.pos = p.a ? [p.a.from[0], p.a.from[1]] : [p.at[0], p.at[1]];
    }
    place(w);
    invalidate();
  }
  /** Lying under a lid that's shut (or shutting): it opens, and `w` stays lying till it has (upAt). The ms that takes. */
  function rise(w: Walker): number {
    const l = w.pose?.lie && w.pose.id ? live.get(w.pose.id)?.lid : null;
    if (!l) return 0;
    const t = now();
    if (w.upAt) return Math.max(0, w.upAt - t);
    l.run = lidWant(l.run, false, t, reduced());
    const wait = lidOpenIn(l.run, t);
    if (wait > 0) w.upAt = t + wait;
    invalidate();
    return wait;
  }
  function walk(who: Who, pts: readonly Pt[], o: { from?: Pt; ago?: number; ms?: number } = {}): number {
    const w = villagers.get(who);
    if (!w || !pts.length) return 0;
    const from: [number, number] = o.from ? [o.from[0], o.from[1]] : [...w.pos];
    const { lens, total } = walkLens(from, pts);
    const ms = o.ms ?? (total / PACE) * 1000;
    // (a lid over it opens first: the walk starts once it has)
    const wait = rise(w);
    if (!wait) w.pose = null;
    w.path = { from, pts: [...pts], t0: now() - (o.ago ?? 0) + wait, ms: Math.max(1, ms), lens, total };
    invalidate();
    return ms;
  }
  /** Left (-1) or right (1) on screen for a heading (x, z) in the room, as the camera now looks. */
  const screenSide = (dx: number, dz: number) => {
    const s = dx * Math.cos(az) - dz * Math.sin(az);
    return Math.abs(s) < 0.3 ? 0 : s > 0 ? 1 : -1;
  };
  function face(who: Actor, toward: Pt) {
    const w = villagers.get(who);
    if (!w) return;
    w.heading = Math.atan2(toward[0] - w.pos[0], toward[1] - w.pos[1]);
    const s = screenSide(toward[0] - w.pos[0], toward[1] - w.pos[1]);
    if (!s) return;
    setFace(w, s);
    place(w);
    invalidate();
  }
  function hop(who: Actor) {
    const w = villagers.get(who);
    if (!w) return;
    w.hop = now();
    w.v3?.act('hop');
    invalidate();
  }
  const headV = new Vector3();
  function headPoint(who: Actor): [number, number, number] | null {
    const w = villagers.get(who);
    if (!w) return null;
    // a 3D villager: over its head bone as it moves now (NH's head joint is at the head's base: its top is about half
    // the villager's height above), upright whatever its pose
    const hb = w.v3?.head();
    if (hb) {
      w.v3!.group.updateMatrixWorld(true);
      const p = hb.getWorldPosition(headV);
      return [p.x, p.y + (w.pose?.lie ? VILLAGER_H * 0.2 : VILLAGER_H * 0.5), p.z];
    }
    // the card's top middle as it stands now (a hop, a seat, the camera's turn): its geometry is 0…1 up
    w.card.updateMatrixWorld();
    const p = w.card.localToWorld(headV.set(0, 1, 0));
    return [p.x, p.y, p.z];
  }

  // ---- the camera: NH's room camera to start with (the whole room in view, its floor's middle at the middle of
  //      what the controls leave of the screen), then the player's to turn round that middle, tilt and zoom, within
  //      limits (the walls never clip: the near ones cut away); the limits are soft under a pinch and eased back to ----
  const DEF = { az: 0, pitch: (PITCH * Math.PI) / 180, k: sh?.follow?.k ?? 1 };
  const PITCH_MIN = (28 * Math.PI) / 180, PITCH_MAX = (78 * Math.PI) / 180;
  /** Zoom (× the fitted distance): in to about two and a half tiles across, out to a little past the whole room. */
  const K_MIN = 0.3, K_MAX = 1.6;
  const view = { ...DEF };
  /** The camera's heading as it is now (the view's az, or the eyes' in the first person) and how far the cards lean
   *  back toward it (none at the eyes): what turns to face the camera turns by these. */
  let az = DEF.az, lean = DEF.pitch * 0.45, orbitNear = 10;
  const azV = new Vector3();
  const target = new Vector3(0, 0, 0);
  /** The default view's distance (fitted to the screen) and the vertical offset (px) that puts the target at the
   *  middle of the usable band; eased to when the band changes (the edit tray opening). */
  let baseD = 300, shiftY = 0;
  let framing: { from: [number, number]; to: [number, number]; t0: number } | null = null;
  let easing: { from: typeof DEF; t0: number; to?: typeof DEF } | null = null;
  /** The room's camera where the view has it (the first person's glide starts from it). */
  function aimOrbit() {
    // a corner-on view of the square room is wider than a side-on one: the camera steps back to keep it in
    const corner = Math.abs(Math.cos(view.az)) + Math.abs(Math.sin(view.az));
    const d = baseD * view.k * (1 + (corner - 1) * 0.85);
    camera.position.set(
      target.x + Math.sin(view.az) * Math.cos(view.pitch) * d,
      target.y + Math.sin(view.pitch) * d,
      target.z + Math.cos(view.az) * Math.cos(view.pitch) * d
    );
    camera.lookAt(target);
    camera.fov = FOV;
    // near enough to see one piece well: the near plane comes in with it
    camera.near = orbitNear = Math.max(1, d * 0.05);
  }
  function aim() {
    aimOrbit();
    // (then toward the eyes, as far as the first person's glide has it)
    fp.apply(camera, FOV, orbitNear, target);
    az = fp.mix > 0 ? camAz(camera, azV) : view.az;
    lean = view.pitch * 0.45 * (1 - fp.mix);
    cutaway();
    for (const w of villagers.values()) place(w);
  }
  /** The two-finger pan (rooms/pan.ts), and as the view has it now: none at the eyes (it fades with the glide). */
  const pan = roomPan(), panned: [number, number] = [0, 0];
  const offset = () => {
    const W = canvas.clientWidth || 1, H = canvas.clientHeight || 1, k = 1 - fp.mix;
    panned[0] = pan.x * k;
    panned[1] = pan.y * k;
    camera.setViewOffset(W, H, -panned[0], shiftY - panned[1], W, H);
    camera.updateProjectionMatrix();
  };
  /** The room (its floor and its walls' tops) on the canvas without the pan, and the band it may use. */
  const box = () => {
    const [x0, x1, z0, z1] = floorRect;
    const pts: [number, number, number][] = [[x0, 0, z0], [x1, 0, z0], [x0, 0, z1], [x1, 0, z1], [x0, wallH, z0], [x1, wallH, z0], [x0, wallH, z1], [x1, wallH, z1]];
    return panBox(camera, pts, canvas.clientWidth || 1, canvas.clientHeight || 1, panned, insets);
  };
  /** The distance and offset for this screen and these insets (the default view), without moving the camera. */
  function framingFor(): [number, number] {
    const W = canvas.clientWidth || 1, H = canvas.clientHeight || 1;
    camera.aspect = W / H;
    const [x0, x1, z0, z1] = floorRect;
    const corners = [
      [x0 - 2, 0, z1 + 2], [x1 + 2, 0, z1 + 2], [x0 - 2, wallH + 1, z0 - 2], [x1 + 2, wallH + 1, z0 - 2],
      [x0 - 2, wallH + 1, z1], [x1 + 2, wallH + 1, z1], [midX(), -4, z1 + 2]
    ].map(([x, y, z]) => new Vector3(x, y, z));
    const bandH = Math.max(0.3 * H, H - insets.top - insets.bottom);
    const was = { ...view, baseD, shiftY }, aimed = target.clone();
    camera.clearViewOffset();
    // (the whole room at the default's turn and tilt, from its middle: a building's nearer default is a share of it)
    Object.assign(view, DEF, { k: 1 });
    target.set(midX(), 0, midZ());
    // the target projects to the canvas's middle (no offset); the room must fit within half the band either side of it
    const fits = (D: number) => {
      baseD = D;
      aimOrbit();
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);
      let x = 0, y = 0;
      for (const c of corners) {
        const p = c.clone().project(camera);
        x = Math.max(x, Math.abs(p.x));
        y = Math.max(y, Math.abs(p.y));
      }
      return x <= 0.95 && y <= (bandH / H) * 0.96;
    };
    let lo = 40, hi = 2000;
    for (let i = 0; i < 32; i++) {
      const D = (lo + hi) / 2;
      if (fits(D)) hi = D;
      else lo = D;
    }
    // the band's middle (px from the top) is where the target goes: the view moves by the difference from the canvas's
    const mid = insets.top + bandH / 2;
    const out: [number, number] = [hi, H / 2 - mid];
    Object.assign(view, { az: was.az, pitch: was.pitch, k: was.k });
    target.copy(aimed);
    baseD = was.baseD;
    shiftY = was.shiftY;
    return out;
  }
  let fitted = false;
  /** Refit (`ease`: to the new framing over a moment, as when the edit tray opens). */
  function fit(ease = false) {
    if (disposed) return;
    const W = canvas.clientWidth || 1, H = canvas.clientHeight || 1;
    renderer.setSize(W, H, false);
    const to = framingFor();
    if (ease && fitted) framing = { from: [baseD, shiftY], to, t0: now() };
    else [baseD, shiftY] = to;
    fitted = true;
    offset();
    aim();
    // (the shadow map stays: the key light and its camera are fixed, only the furniture casts; setSize cleared the
    // canvas: drawn again now, not at the next due frame)
    if (frames) redraw();
    invalidate();
  }
  /** The scene drawn now, between frames: every resize of the canvas's buffer (setSize, setPixelRatio: a gesture's
   *  lighter pixel ratio, a turn of the phone) clears it, and WebKit shows the cleared canvas until the next draw (the
   *  museum's black flashes, 3928d20f), so a resize is drawn over in the same task. */
  function redraw() {
    if (disposed) return;
    if (shadowsDirty) (renderer.shadowMap.needsUpdate = true), (shadowsDirty = false), shadowPasses++;
    if (!noDraw) renderer.render(scene, camera);
  }
  const still = () => !framing && !easing && !fp.busy() && !followBusy() && !pan.busy();
  function resize(i?: Insets) {
    const changed = !!i && (i.top !== insets.top || i.bottom !== insets.bottom);
    if (i) insets = i;
    fit(changed);
  }
  /** Inside the limits, or a little past them under a finger (a soft give, eased back when it lets go). */
  const soft = (v: number, lo: number, hi: number, give: number) =>
    v < lo ? lo - give * (1 - Math.exp(-(lo - v) / give)) : v > hi ? hi + give * (1 - Math.exp(-(v - hi) / give)) : v;
  const clampView = (hard = false) => {
    view.pitch = hard ? Math.min(PITCH_MAX, Math.max(PITCH_MIN, view.pitch)) : soft(view.pitch, PITCH_MIN, PITCH_MAX, 0.06);
    view.k = hard ? Math.min(K_MAX, Math.max(K_MIN, view.k)) : soft(view.k, K_MIN, K_MAX, 0.06);
    view.az = Math.atan2(Math.sin(view.az), Math.cos(view.az));
  };
  function orbit(dAz: number, dPitch: number) {
    easing = null;
    view.az += dAz;
    view.pitch += dPitch;
    clampView();
    aim();
    invalidate();
  }
  function zoom(f: number) {
    easing = null;
    view.k /= f;
    clampView();
    aim();
    invalidate();
  }
  /** The canvas's corner, read once a gesture starts (not a layout read each move). */
  let rectAt: DOMRect | null = null;
  function pinch(scale: number, dx: number, dy: number, mx: number, my: number) {
    easing = null;
    const k0 = view.k;
    view.k /= scale;
    clampView();
    aim();
    const r = (rectAt ??= canvas.getBoundingClientRect()), b = box();
    pan.drag(dx, dy, b);
    pan.zoomAbout(k0 / view.k, mx - r.left - (canvas.clientWidth || 1) / 2, my - r.top - ((canvas.clientHeight || 1) / 2 - shiftY), b);
    offset();
    invalidate();
  }
  function fling(vx: number, vy: number) {
    pan.fling(vx, vy);
    invalidate();
  }
  /** Back inside the limits, eased (a pinch let go past one). */
  function settle() {
    const want = { ...view };
    const k0 = view.k, p0 = view.pitch;
    Object.assign(want, { k: Math.min(K_MAX, Math.max(K_MIN, k0)), pitch: Math.min(PITCH_MAX, Math.max(PITCH_MIN, p0)) });
    if (want.k === k0 && want.pitch === p0) return;
    easing = { from: { ...view }, t0: now(), to: want };
    invalidate();
  }
  /** Back to NH's view, eased (the shortest way round). */
  function resetView() {
    easing = { from: { ...view }, t0: now() };
    pan.home(now(), 420);
    invalidate();
  }
  const isDefault = () => Math.abs(view.az) < 0.02 && Math.abs(view.pitch - DEF.pitch) < 0.02 && Math.abs(view.k - DEF.k) < 0.02 && pan.isHome();
  /** The villager a building's camera follows (Shell `follow`), and where its middle goes for it. */
  let followed: Actor | null = null;
  const followAt = (w: Walker): [number, number] | null => {
    const f = sh?.follow;
    return f ? [Math.min(f.x[1], Math.max(f.x[0], w.pos[0])), Math.min(f.z[1], Math.max(f.z[0], w.pos[1]))] : null;
  };
  /** The camera still on its way after the villager it follows (or that villager walking). */
  function followBusy(): boolean {
    const w = followed ? villagers.get(followed) : undefined, fa = w && !fp.on ? followAt(w) : null;
    return !!fa && (!!w?.path || Math.abs(fa[0] - target.x) + Math.abs(fa[1] - target.z) > 0.05);
  }
  /** A gesture under way: a lighter pixel ratio while the camera moves, the full one when it rests. */
  /** A gesture under way (and REST_DPR_MS after it): drawn at DPR_MOVING, the ratio set in the frame (before its draw:
   *  a resize clears the canvas), not a buffer resize, a fit and a draw of their own at each start and end. */
  let movingNow = false, light = false, restTimer: ReturnType<typeof setTimeout> | undefined;
  const REST_DPR_MS = 160;
  function moving(on: boolean) {
    clearTimeout(restTimer);
    pan.hold(on);
    rectAt = null;
    if (on) {
      movingNow = light = true;
      invalidate();
    } else {
      settle();
      if (!movingNow) return;
      movingNow = false;
      restTimer = setTimeout(() => ((light = false), invalidate()), REST_DPR_MS);
    }
  }
  /** Where the floor's middle is on screen and where the usable band's middle is (client px: the e2e's check). */
  function centre(): { at: [number, number]; band: [number, number] } {
    const r = canvas.getBoundingClientRect();
    const H = canvas.clientHeight || 1;
    const bandH = Math.max(0.3 * H, H - insets.top - insets.bottom);
    return { at: client(target.x, target.y, target.z), band: [r.left + r.width / 2, r.top + insets.top + bandH / 2] };
  }

  // ---- the first person's eye: my villager's (its model's eyes, else its card's), kept off the walls and the tall ----
  const eyeT = new Vector3(), eyeXZ: [number, number] = [0, 0];
  /** A card's eyes (a render has no bones), and a piece taller than this stands in the eye's way. */
  const EYE_H = VILLAGER_H * 0.7;
  /** The floor a wall's depth in from each wall (what hangs on one stands out of it), and the pieces taller than the eye. */
  const roomIn = (): Rect[] => [{ x0: floorRect[0] + 1, x1: floorRect[1] - 1, z0: floorRect[2] + 1, z1: floorRect[3] - 1 }], NONE: Rect[] = [];
  let tall: Rect[] = [];
  function tallOnes() {
    tall = [];
    for (const l of live.values()) {
      const m = ITEMS[l.spot.item];
      if (!m || m.rug || m.cl || l.spot.on || isWallItem(l.spot.item) || !l.root.visible || (l.spot.y ?? 0) + (m.h ?? 0) < EYE_H - 2) continue;
      const [w, d] = footprint(l.spot.item, l.spot.f), x0 = -HALF + l.spot.x * TILE, z0 = -HALF + l.spot.z * TILE;
      tall.push({ x0, x1: x0 + w * TILE, z0, z1: z0 + d * TILE });
    }
  }
  function headOf(w: Walker): Vector3 {
    if (w.v3) {
      w.v3.group.updateMatrixWorld(true);
      if (w.v3.eyes(eyeT)) return eyeT;
    }
    const P = w.pose;
    if (P) eyeT.set(P.at[0], P.lie ? P.y + 3 : P.y + VILLAGER_H * 0.45, P.at[1]);
    else eyeT.set(w.pos[0], EYE_H, w.pos[1]);
    return eyeT;
  }
  /** The eye's anchor (rooms/firstPerson.ts headAnchor): held once my villager is still (its idle never moves the camera). */
  const anchor = headAnchor();
  function eyeOf(w: Walker, t: number): Vector3 {
    const P = w.pose;
    eyeT.copy(anchor(t, w.path ? null : [w.pos[0], w.pos[1], w.yaw, w.posing ? 1 : 0, P ? P.at[0] : -1e9, P ? P.at[1] : -1e9], () => headOf(w)));
    // (seated, the seat is under it: only the walls)
    clampEye(eyeT.x, eyeT.z, roomIn(), w.pose ? NONE : tall, EYE_MARGIN, eyeXZ);
    eyeT.x = eyeXZ[0];
    eyeT.z = eyeXZ[1];
    return eyeT;
  }
  /** The villager whose eyes the camera is at (wanted on). */
  const eyes = () => (fpWho && fp.on ? villagers.get(fpWho) : undefined);
  function firstPerson(who: Who | null, snap = false) {
    if (who === (fp.on ? fpWho : null)) return;
    const w = who ? villagers.get(who) : eyes();
    if (who) fpWho = who;
    else if (w) {
      // back out of its eyes, it faces where it looked
      w.heading = w.yaw = fp.yaw;
      w.posing = true;
    }
    fp.set(!!who, now(), w?.heading ?? Math.PI, snap);
    invalidate();
  }

  // ---- taps ----
  const ray = new Raycaster();
  const ground = new Plane(new Vector3(0, 1, 0), 0);
  const toNdc = (cx: number, cy: number) => {
    // what changed since the last frame (a piece just placed, a frame not drawn yet) is where it is
    scene.updateMatrixWorld();
    screen.aim(ray, cx, cy);
  };
  function floorAt(cx: number, cy: number): [number, number] | null {
    toNdc(cx, cy);
    const p = ray.ray.intersectPlane(ground, new Vector3());
    if (!p || p.x < floorRect[0] || p.x > floorRect[1] || p.z < floorRect[2] || p.z > floorRect[3]) return null;
    return [p.x, p.z];
  }
  /** The wall under client px (one that shows), and where on it: across from its left end and up (model units). */
  function wallAt(cx: number, cy: number): { wall: number; u: number; y: number } | null {
    toNdc(cx, cy);
    const faces: Object3D[] = [];
    for (const w of walls) if (w.g.visible) w.g.children.forEach((c) => c.userData.wall !== undefined && faces.push(c));
    const h = ray.intersectObjects(faces, false)[0];
    if (!h) return null;
    const wi = h.object.userData.wall as number, local = walls[wi].g.worldToLocal(h.point.clone());
    return { wall: wi, u: local.x + wallMid(wi, bounds), y: local.y };
  }
  /** Drawn: not hidden, and (a wall thing) its wall not cut away. */
  const shown = (l: { root: Group; spot: Spot }) => l.root.visible && (!isWallItem(l.spot.item) || !!walls[l.spot.f]?.g.visible);
  function pick(cx: number, cy: number): string | null {
    toNdc(cx, cy);
    let rug: string | null = null;
    for (const h of ray.intersectObjects([...live.values()].filter(shown).map((l) => l.root), true)) {
      const id = h.object.userData.id as string | undefined;
      if (!id) continue;
      if (!ITEMS[live.get(id)?.spot.item ?? '']?.rug) return kidNear(cx, cy, id) ?? id;
      rug ??= id;
    }
    return rug ?? onTiles(cx, cy);
  }
  /** A small thing on `parent`'s top near client px (KID_SLOP): a near miss on a lamp is the lamp, not its table. */
  const KID_SLOP = 10;
  function kidNear(cx: number, cy: number, parent: string): string | null {
    for (const l of live.values()) if (l.spot.on === parent && shown(l) && onScreen(l.root, cx, cy, KID_SLOP)) return l.spot.id;
    return null;
  }
  /** The piece whose tiles are under client px (a tap between a model's legs, a piece still popping in): furniture
   *  before a rug. */
  function onTiles(cx: number, cy: number): string | null {
    const p = floorAt(cx, cy);
    if (!p) return null;
    const tx = Math.floor((p[0] + HALF) / TILE), tz = Math.floor((p[1] + HALF) / TILE);
    let rug: string | null = null;
    // what stands highest first: a lamp on a table before the table
    for (const l of [...live.values()].sort((a, b) => (b.spot.y ?? 0) - (a.spot.y ?? 0))) {
      if (!l.root.visible || isWallItem(l.spot.item) || isCeiling(l.spot.item)) continue;
      const [w, d] = footprint(l.spot.item, l.spot.f);
      if (tx < l.spot.x || tz < l.spot.z || tx >= l.spot.x + w || tz >= l.spot.z + d) continue;
      if (!ITEMS[l.spot.item]?.rug) return l.spot.id;
      rug ??= l.spot.id;
    }
    return rug;
  }
  /** Whether a 3D model is drawn under client px, or within a finger of it (a human player has no render to read its
   *  outline off: its meshes as posed, boxed by joint, player3d/hit.ts; the ray put back as it was). */
  const FINGER = 12;
  function modelUnder(v: Villager3D, cx: number, cy: number): boolean {
    const at = ray.ray.clone();
    let on = false;
    for (const [dx, dy] of [[0, 0], [FINGER, 0], [-FINGER, 0], [0, FINGER], [0, -FINGER]]) {
      screen.aim(ray, cx + dx, cy + dy);
      if (hitsSkinned(v.group, ray.ray)) { on = true; break; }
    }
    ray.ray.copy(at);
    return on;
  }
  function hit(cx: number, cy: number): Hit | null {
    toNdc(cx, cy);
    // (at my villager's eyes, not itself; the closed door in the doorway goes out as the doormat does)
    const me = eyes();
    // (what hangs from the ceiling isn't in the way of a tap: the floor under it is; もようがえ picks it: pick)
    const objs: Object3D[] = [...[...villagers.values()].filter((v) => v !== me).map((v) => v.card), ...[...live.values()].filter((l) => shown(l) && !isCeiling(l.spot.item)).map((l) => l.root), mat, ...(door.visible ? [door] : [])];
    for (const h of ray.intersectObjects(objs, true)) {
      if (h.object === mat || h.object === door) return { kind: 'door' };
      if (h.object.userData.who) {
        // only where the render is drawn (a little grown: a 44 px finger); a player's (no render drawn) its card's box
        const actor = h.object.userData.who as Actor, w = villagers.get(actor);
        if (w?.alpha && h.uv && !w.look.cardless) {
          const { w: aw, h: ah, a } = w.alpha;
          const u = h.uv.x;
          const px = Math.round(u * (aw - 1)), py = Math.round((1 - h.uv.y) * (ah - 1));
          let solid = false;
          for (let dy = -3; dy <= 3 && !solid; dy++) for (let dx = -3; dx <= 3 && !solid; dx++) {
            const x = px + dx, y = py + dy;
            if (x >= 0 && y >= 0 && x < aw && y < ah && a[y * aw + x] > 40) solid = true;
          }
          if (!solid) continue;
        } else if (w?.v3 && w.look.cardless && !modelUnder(w.v3, cx, cy)) continue;
        return actor.startsWith('n:') ? { kind: 'npc', id: actor.slice(2) } : { kind: 'villager', who: actor as Who };
      }
      const id = h.object.userData.id as string | undefined;
      if (id && !ITEMS[live.get(id)?.spot.item ?? '']?.rug) return { kind: 'piece', id };
      if (id) {
        // a rug is floor to walk on (but a piece of its own in the edit mode: the screen asks pick() for that)
        const p = floorAt(cx, cy);
        return p ? { kind: 'floor', x: p[0], z: p[1] } : null;
      }
    }
    // a tap on a piece's own tiles (between its legs, or before its model is in) is the piece
    const on = onTiles(cx, cy);
    if (on && !ITEMS[live.get(on)?.spot.item ?? '']?.rug) return { kind: 'piece', id: on };
    const p = floorAt(cx, cy);
    return p ? { kind: 'floor', x: p[0], z: p[1] } : null;
  }

  // ---- the frames: on demand ----
  let frames = 0, shadowPasses = 0, disposed = false, shadowsDirty = true;
  // (the frames: a change's at the next display frame, at most FPS a second: world3d/pace.ts, the island's and the museum's)
  const pace = pacer((vsync) => frame(vsync));
  /** The first frame waits for the villagers' models asked for by then (up to ENTRY_HOLD_MS): their programs (skinned,
   *  ~6) compile with the room's in that one frame, behind the door's black; drawn in a frame of their own once the
   *  iris had opened, they froze it (the iOS Simulator, cold: 1039 ms, after the room's own first frame of 654 ms). */
  let v3Pending = 0;
  const born = now(), holding = () => !frames && v3Pending > 0 && now() - born < ENTRY_HOLD_MS;
  const holdT = setTimeout(() => invalidate(), ENTRY_HOLD_MS + 20);
  const cost: number[] = [];
  let readyFn: () => void = () => {};
  const ready = new Promise<void>((r) => (readyFn = r));
  function invalidate() {
    if (!disposed) pace.kick();
  }
  const POP_MS = 320, BUMP_MS = 360, HOP_MS = 420, GYROID_MS = 2400;
  /** A 3D villager's frame: its walk (its heading turned to, the stride by the distance), its seat, its hop; posed
   *  only while it moves (or the camera does), else only its face (a blink). True while it wants frames. */
  let lastT3 = 0;
  function stepV3(w: Walker, t: number): boolean {
    const v = w.v3!, dt = lastT3 ? Math.min(100, t - lastT3) : 16;
    let busy = false;
    if (w.path) {
      const a = along(w.path!, t);
      w.pos = a.p;
      if (Math.hypot(a.d[0], a.d[1]) > 0.01) {
        w.heading = Math.atan2(a.d[0], a.d[1]);
        let d = w.heading - w.yaw;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        w.yaw += d * Math.min(1, (14 * dt) / 1000);
      }
      const side = screenSide(a.d[0], a.d[1]);
      if (side) setFace(w, side);
      if (a.done) w.path = null;
      busy = true;
    }
    else if (!w.pose) {
      // standing: it turns to the camera, a little to the side it last faced (NH's); at its own eyes, to where it looks
      let d = (w === eyes() ? fp.yaw : az + w.face * 0.45) - w.yaw;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      if (Math.abs(d) > 0.01) {
        w.yaw += d * Math.min(1, (6 * dt) / 1000);
        busy = true;
      }
    }
    const moved = Math.hypot(w.pos[0] - w.was[0], w.pos[1] - w.was[1]);
    w.was = [w.pos[0], w.pos[1]];
    const state = w.pose ? (w.pose.lie ? 'lie' : 'sit') : w.path ? 'walk' : 'idle';
    if (v.state() !== state) w.posing = true;
    v.set(state);
    if (w.hop && t - w.hop < 1400) busy = true;
    else w.hop = 0;
    place(w);
    if (busy || w.posing || cameraMoving) {
      // (its stride in its own units: the room's are V3_SCALE of the island's)
      // (posed till it settles: a state's crossfade, an action, and once more after it stops)
      const going = v.step(t, moved / V3_SCALE, w.path ? (moved / V3_SCALE / Math.max(1, dt)) * 1000 : 0);
      w.posing = busy || going;
      return w.posing;
    }
    v.blink(t);
    return false;
  }
  /** The camera moved since the last frame (the 3D villagers are posed while it does). */
  let cameraMoving = false, camRev = '';
  let drawn: (() => void) | null = null;
  function frame(vsync = now()) {
    // (the first frame's programs made ready while it holds for the villagers too)
    if (disposed || (!frames && (!primed() || holding())) || !pace.due(vsync, FPS)) return;
    const t = now();
    let more = false;
    const rv = `${view.az}:${view.pitch}:${view.k}`;
    cameraMoving = rv !== camRev;
    camRev = rv;
    for (const l of live.values()) {
      if (!l.body) continue;
      let sx = 1, sy = 1;
      if (l.pop) {
        const k = (t - l.pop) / POP_MS;
        if (k >= 1) l.pop = 0;
        else {
          // a little overshoot: popping in
          const e = 1 + Math.sin(k * Math.PI) * 0.12 * (1 - k);
          sx = sy = 0.7 + 0.3 * cubicOut(k);
          sy *= e;
          more = true;
        }
      }
      if (l.bump) {
        // a gyroid bobs to its beat a while (NH's: it plays and dances; here silent), the rest jiggle
        const gy = ITEMS[l.spot.item]?.gy, k = (t - l.bump) / (gy ? GYROID_MS : BUMP_MS);
        if (k >= 1) l.bump = 0;
        else {
          const s = gy ? Math.abs(Math.sin(k * Math.PI * 8)) * 0.1 * Math.min(1, (1 - k) * 4) : Math.sin(k * Math.PI * 3) * 0.07 * (1 - k);
          sx *= 1 + (gy ? -s / 2 : s);
          sy *= 1 + (gy ? s : -s);
          more = true;
        }
      }
      l.body.scale.set(sx, sy, sx);
    }
    // getting up from under a lid once it's open; a lid shut while someone lies in it (and not getting up)
    for (const w of villagers.values()) if (w.upAt && t >= w.upAt) {
      w.upAt = 0;
      w.pose = null;
    }
    for (const l of live.values()) {
      if (!l.lid) continue;
      const id = l.spot.id, spec = LIDS[l.spot.item], inIt = [...villagers.values()].filter((w) => w.pose?.lie && w.pose.id === id);
      l.lid.run = lidWant(l.lid.run, inIt.some((w) => !w.upAt), t, reduced());
      const k = lidK(l.lid.run, t), z = spec.shut * k;
      if (lidMoving(l.lid.run, t)) more = true;
      if (z === l.lid.pivot.rotation.z) continue;
      l.lid.pivot.rotation.z = z;
      shadowsDirty = more = true;
      // (the sleeper a little deeper under it, posed while it moves)
      for (const w of inIt) if (w.v3) (w.v3.lower(spec.sink * k), (w.posing = true));
    }
    for (const h of heldBy.values()) {
      // eased toward the latest spot heard (updates come ~10 a second): a glide, not a jump
      const dt = Math.min(100, t - h.t);
      h.t = t;
      const k = 1 - Math.exp(-dt / 70);
      h.at = [h.at[0] + (h.to[0] - h.at[0]) * k, h.at[1] + (h.to[1] - h.at[1]) * k];
      h.root.position.set(h.at[0], 3 + Math.sin(t / 260) * 0.6, h.at[1]);
      h.root.rotation.y = (h.f * Math.PI) / 2;
      h.ring.position.set(h.to[0], 0, h.to[1]);
      more = true;
    }
    if (ghostTurn) {
      const k = Math.min(1, (t - ghostTurn.t0) / 160);
      ghostRoot.rotation.y = ghostTurn.from + (ghostTurn.to - ghostTurn.from) * cubicOut(k);
      if (k >= 1) ghostTurn = null;
      else more = true;
    }
    if (ghostBody) {
      const k = Math.min(1, (t - ghostT) / POP_MS);
      if (wallGhost) ghostRoot.position.z = 0.2 + 1.5 + Math.sin(k * Math.PI) * 1.2;
      else ghostRoot.position.y = ghostY + 3 + Math.sin(k * Math.PI) * 2.5;
      if (k < 1) more = true;
    }
    if (ghostRoot.visible) {
      // the head-shake: a few quick turns either way, dying out
      const k = nudgeT ? (t - nudgeT) / 420 : 1;
      if (k >= 1) nudgeT = 0;
      else more = true;
      ghostRoot.rotation.z = k < 1 ? Math.sin(k * Math.PI * 6) * 0.09 * (1 - k) : 0;
      // the handle over its top (on a wall: over the thing); still (frames stay on demand)
      ghostRoot.updateMatrixWorld();
      handle.position.copy(ghostRoot.localToWorld(new Vector3(0, wallGhost ? (ITEMS[ghostKey]?.h ?? 5) / 2 + 3 : (ITEMS[ghostKey]?.h ?? 8) + 3.2, wallGhost ? 1 : 0)));
      handle.visible = !!ghostBody;
    }
    if (warned.length) {
      const k = (t - warnT) / WARN_MS;
      warnMat.opacity = k < 1 ? 0.35 + 0.3 * Math.cos(k * Math.PI * 6) ** 2 : 0;
      if (k >= 1) for (const m of warned.splice(0)) m.removeFromParent();
      else more = true;
    }
    if (nope.visible) {
      const k = (t - nopeT) / 700;
      nopeMat.opacity = k < 1 ? 0.6 * (1 - k * k) : 0;
      if (k >= 1) nope.visible = false;
      else more = true;
    }
    if (framing) {
      // to the new framing (the edit tray opening or closing): the room glides to the middle of what's left
      const k = Math.min(1, (t - framing.t0) / 320), e = cubicOut(k);
      baseD = framing.from[0] + (framing.to[0] - framing.from[0]) * e;
      shiftY = framing.from[1] + (framing.to[1] - framing.from[1]) * e;
      offset();
      aim();
      if (k >= 1) framing = null;
      else more = true;
    }
    if (easing) {
      // back to NH's view, or back inside the limits
      const k = Math.min(1, (t - easing.t0) / (easing.to ? 240 : 420)), e = cubicOut(k), f = easing.from, to = easing.to ?? DEF;
      const dAz = Math.atan2(Math.sin(to.az - f.az), Math.cos(to.az - f.az));
      view.az = f.az + dAz * e;
      view.pitch = f.pitch + (to.pitch - f.pitch) * e;
      view.k = f.k + (to.k - f.k) * e;
      aim();
      if (k >= 1) easing = null;
      else more = true;
    }
    // a building's camera after the villager it follows (eased; not at the eyes)
    const fw = followed ? villagers.get(followed) : undefined, fa = fw && !fp.on ? followAt(fw) : null;
    if (fa && Math.abs(fa[0] - target.x) + Math.abs(fa[1] - target.z) > 0.05) {
      const k = 1 - Math.exp(-(lastT3 ? Math.min(100, t - lastT3) : 16) / 280);
      target.x += (fa[0] - target.x) * k;
      target.z += (fa[1] - target.z) * k;
      aim();
      cameraMoving = more = true;
    }
    // the first person: the glide, the head, the eye following my villager's (kept off the walls and what stands tall)
    if (fpWho && (fp.on || fp.mix > 0)) {
      const w = villagers.get(fpWho);
      if (w && fp.step(t, lastT3 ? Math.min(100, t - lastT3) : 16, eyeOf(w, t))) {
        aim();
        cameraMoving = more = true;
      }
      if (w) {
        // (its body hidden once the camera is near its head; its shadow stays)
        const hide = fp.mix > 0.5;
        if (w.v3) w.v3.show(!hide);
        else if (w.mat.map && !w.look.cardless) w.mat.visible = !hide;
      }
      if (!fp.on && !fp.mix) fpWho = null;
    }
    // the two-finger pan: its fling, its ease back inside, its way home (and its range again, the view having moved)
    if (!pan.isHome() || pan.busy()) {
      if (pan.step(t, box())) more = true;
      offset();
    }
    for (const w of villagers.values()) {
      let bob = 0, squash = 0;
      if (w.v3) {
        if (stepV3(w, t)) more = true;
        continue;
      }
      if (w.path) {
        const a = along(w.path!, t);
        w.pos = a.p;
        if (Math.hypot(a.d[0], a.d[1]) > 0.01) w.heading = Math.atan2(a.d[0], a.d[1]);
        const side = screenSide(a.d[0], a.d[1]);
        if (side) setFace(w, side);
        if (a.done) w.path = null;
        else {
          // NH's trot: a bob a step and a little squash as each foot lands (the renders have no walk frames)
          const ph = ((t - w.path.t0) / 1000) * Math.PI * 4.2;
          bob = Math.abs(Math.sin(ph)) * 0.9;
          squash = Math.max(0, Math.cos(ph * 2)) * 0.04;
          more = true;
        }
      }
      if (w.hop) {
        const k = (t - w.hop) / HOP_MS;
        if (k >= 1) w.hop = 0;
        else {
          bob += Math.sin(k * Math.PI) * 3.2;
          more = true;
        }
      }
      place(w, bob, squash);
    }
    if (shadowsDirty) {
      shadowPasses++;
      renderer.shadowMap.needsUpdate = true;
      shadowsDirty = false;
    }
    // pieces still popping change their shadows
    if (more && [...live.values()].some((l) => l.pop || l.bump)) shadowsDirty = true;
    const ratio = light || pan.busy() ? Math.min(DPR_MOVING, dpr) : dpr;
    if (ratio !== renderer.getPixelRatio()) renderer.setPixelRatio(ratio);
    if (!noDraw) renderer.render(scene, camera);
    drawn?.();
    // the frame's own cost (the CPU side: three's work and the GL calls), for the budget checks
    cost.push(now() - t);
    if (cost.length > 600) cost.shift();
    frames++;
    if (frames === 1) readyFn();
    lastT3 = t;
    if (more) invalidate();
    else blinkSoon();
  }
  // ---- the programs ahead: WebKit says a program is compiled (KHR_parallel_shader_compile) long before it is, and
  //      compiles every program made so far at the next query that waits on the GPU (a first use: 10-100 ms each). So
  //      each mesh's programs are made and first used (three's compile, getUniforms) one new program a timer tick, its
  //      textures uploaded with it. ----
  type Prog = { getUniforms(): unknown };
  const warmedTex = new WeakSet<Texture>();
  /** Up to the next new program among `meshes` (taken off its front): made, first used, the textures uploaded. */
  function primeNext(meshes: Object3D[]) {
    const n0 = renderer.info.programs?.length ?? 0;
    while (meshes.length && (renderer.info.programs?.length ?? 0) === n0) {
      const o = meshes.shift()!;
      if (!o.parent) continue;
      for (const m of renderer.compile(o, camera, scene)) {
        // (a see-through two-sided one is two programs, a side each: three's programs by key; one already in use
        // has its uniforms: at once)
        for (const p of (renderer.properties.get(m) as { programs?: Map<string, Prog> }).programs?.values() ?? []) p.getUniforms();
        for (const v of Object.values(m)) if (v instanceof Texture && !warmedTex.has(v)) (warmedTex.add(v), renderer.initTexture(v));
      }
    }
  }
  const meshesOf = (visible: boolean) => {
    const out: Object3D[] = [];
    scene[visible ? 'traverseVisible' : 'traverse']((n) => void ((n as Mesh).material && out.push(n)));
    return out;
  };
  // the first frame's: what's in view by then made ready a program a tick behind the door's black, so the frame only
  // draws (it compiled the shop's ~16 programs at once: 230-430 ms in the iOS Simulator, every entry, cold or warm;
  // now a step each, the dearest ~50 ms: a see-through one's; what arrives meanwhile is taken up too). Its shadow
  // pass's few depth programs are the frame's own (~40 ms the first time, ~12 after).
  let primeT: ReturnType<typeof setTimeout> | undefined, priming = false;
  const unprimed = (o: Object3D) => [(o as Mesh).material].flat().some((m) => m && !renderer.properties.has(m));
  function primed(): boolean {
    if (noDraw) return true;
    if (priming) return false;
    const list = meshesOf(true).filter(unprimed);
    if (!list.length) return true;
    priming = true;
    const step = () => {
      if (disposed) return;
      primeNext(list);
      // (the next after a frame is drawn: two back to back were one 65 ms gap)
      if (list.length) return void requestAnimationFrame(() => (primeT = setTimeout(step, 0)));
      priming = false;
      invalidate();
    };
    primeT = setTimeout(step, 0);
    return false;
  }

  // ---- the warm-up: what the room hasn't drawn yet made ready once it's in and still (the first person's ceiling
  //      and door, the edit mode's grid and footprints: in the scene, hidden), so turning them on compiles nothing:
  //      a program a tick (primeNext), only while no frame is wanted ----
  let warmT: ReturnType<typeof setTimeout> | undefined;
  function warmSoon() {
    clearTimeout(warmT);
    if (!noDraw && !disposed) warmT = setTimeout(warm, 400);
  }
  /** Hidden mid-way: taken up again when shown (a frame asked for while hidden never comes, and the warm-up waited on
   *  it, a timer every 100-400 ms the whole time). */
  let warmHeld = false;
  function warm() {
    if (disposed) return;
    if (document.hidden) return void (warmHeld = true);
    if (pending || pace.queued() || !frames) return warmSoon();
    const meshes = meshesOf(false);
    const step = () => {
      if (disposed) return;
      if (document.hidden) return void (warmHeld = true);
      if (pace.queued()) return void (warmT = setTimeout(step, 100));
      primeNext(meshes);
      if (meshes.length) warmT = setTimeout(step, 20);
    };
    step();
  }

  // the 3D villagers' blinks while the room is still: a timer to the next time a face changes (a blink's start or end,
  // a snore: villager3d nextBlink), a frame only when one did (a texture's offset); asked again after every frame (it
  // was a check 8 times a second)
  let blinkT: ReturnType<typeof setTimeout> | undefined;
  function blinkSoon() {
    clearTimeout(blinkT);
    if (disposed) return;
    const t = now();
    let next = Infinity;
    for (const w of villagers.values()) if (w.v3) next = Math.min(next, w.v3.nextBlink(t));
    if (next < Infinity) blinkT = setTimeout(blinks, next + 2);
  }
  function blinks() {
    blinkT = undefined;
    if (disposed) return;
    // (hidden: no timer till it's shown again, onVis; a frame coming: its own step shows the face, and asks again)
    if (document.hidden) return;
    if (pace.queued()) return blinkSoon();
    let changed = false;
    for (const w of villagers.values()) if (w.v3 && !w.path && !w.posing && w.v3.blink(now())) changed = true;
    if (changed) invalidate();
    else blinkSoon();
  }

  // (shown again: the faces' timer from now, a frame for what changed meanwhile)
  const onVis = () => {
    if (document.hidden || disposed) return;
    invalidate();
    blinkSoon();
    if (warmHeld) (warmHeld = false), warmSoon();
  };
  document.addEventListener('visibilitychange', onVis);

  shell(FULL);
  fit();
  night(0);
  warmSoon();

  return {
    resize, still, surfaces, size, warn, pieces, hide, held, pick, wallAt, ghost, onHeld, nudge, flash, surfacePoint, grid, bump, room, pose, night, villager,
    firstPerson, inView, onDrawn: (fn: (() => void) | null) => void (drawn = fn),
    look(dx, dy) {
      fp.look(dx, dy, canvas.clientWidth);
      invalidate();
    },
    fpv: () => ({ on: fp.on, inside: fp.inside(), busy: fp.busy(), yaw: fp.yaw, pitch: fp.pitch, eye: [fp.eye.x, fp.eye.y, fp.eye.z] }),
    at: (who) => (villagers.get(who)?.pos.slice() as [number, number] | undefined) ?? null,
    npc(id, m, at) {
      const key = `n:${id}` as const;
      if (!m) return villager(key, null);
      // (no render: the model only; till it's in, its card's box is its tap area)
      const person = { key, kind: 'villager' as const, villager: m.id, has3d: true, create: (seed: number) => createVillager(m.id, m.url, seed) };
      villager(key, { url: BLANK_PX, aspect: 0.62, looksRight: false, noMirror: true, person, cardless: true });
      const w = villagers.get(key);
      if (w && at) {
        w.pos = [at[0], at[1]];
        w.was = [at[0], at[1]];
        place(w);
        invalidate();
      }
    },
    follow(who) {
      followed = who;
      const w = who ? villagers.get(who) : undefined, fa = w ? followAt(w) : null;
      // (from where it is now: no glide in)
      if (fa) {
        target.set(fa[0], 0, fa[1]);
        aim();
        invalidate();
      }
    },
    pieceTop(id) {
      const l = live.get(id);
      if (!l) return null;
      l.root.updateWorldMatrix(true, false);
      const p = l.root.getWorldPosition(new Vector3()), m = ITEMS[l.spot.item];
      // (a wall thing's origin is its middle)
      return [p.x, p.y + (isWallItem(l.spot.item) ? (m?.h ?? 5) / 2 : (m?.h ?? 8)), p.z];
    },
    put(who, p, f) {
      const w = villagers.get(who);
      if (!w) return;
      w.path = null;
      if (!rise(w)) w.pose = null;
      w.pos = [p[0], p[1]];
      if (f) setFace(w, f);
      place(w);
      invalidate();
    },
    model: (who) => (villagers.get(who)?.v3 ? (villagers.get(who)!.look.person?.key ?? null) : null),
    v3(who) {
      const w = villagers.get(who), v = w?.v3;
      if (!v) return null;
      const b = new Box3(), m = new Box3(), o = v.group.position;
      v.group.updateMatrixWorld(true);
      v.group.traverse((n) => {
        const sm = n as Mesh & { isSkinnedMesh?: boolean; computeBoundingBox(): void; boundingBox: Box3 | null };
        if (!sm.isSkinnedMesh || !sm.visible) return;
        sm.computeBoundingBox();
        b.union(m.copy(sm.boundingBox!).applyMatrix4(sm.matrixWorld));
      });
      const hb = v.head()?.getWorldPosition(new Vector3());
      return { state: v.state(), box: [[b.min.x - o.x, b.min.y - o.y, b.min.z - o.z], [b.max.x - o.x, b.max.y - o.y, b.max.z - o.z]], at: [o.x, o.y, o.z], head: hb ? [hb.x, hb.y, hb.z] : null };
    },
    walk, walking: (who) => !!villagers.get(who)?.path, face,
    upIn: (who) => Math.max(0, (villagers.get(who)?.upAt ?? 0) - now()),
    lid: (id) => ((l) => (l ? lidK(l.run, now()) : null))(live.get(id)?.lid), hop, headPoint, hit, floorAt, client, orbit, zoom, pinch, fling, resetView, isDefault, moving, centre,
    loading: () => pending,
    stats: () => ({ frames, shadows: shadowPasses, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, dpr: renderer.getPixelRatio(), cost: cost.slice(), queued: pace.queued(),
      mem: [renderer.info.memory.geometries, renderer.info.memory.textures, renderer.info.programs?.length ?? 0], models: furniture.stats() }),
    ready,
    dispose() {
      // (once: a second call ended an ended renderer, and the room's failure path may follow its own)
      if (disposed) return;
      disposed = true;
      pace.stop();
      clearTimeout(restTimer);
      clearTimeout(blinkT);
      clearTimeout(holdT);
      clearTimeout(primeT);
      document.removeEventListener('visibilitychange', onVis);
      clearTimeout(warmT);
      for (const w of villagers.values()) w.v3?.dispose();
      const seen = new Set<object>();
      freeModel(scene, false, seen);
      // the models it asked for, at once, and handed back
      models.release(seen);
      shellModels.release(seen);
      disc.dispose();
      endRenderer(renderer);
      live.clear();
      villagers.clear();
    }
  };
}
