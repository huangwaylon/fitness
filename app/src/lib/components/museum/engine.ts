// The museum in 3D (docs/design.md "The museum"): three.js, loaded only when the museum opens (its own chunk). NH's
// museum on one floor (plan.ts): the entrance hall (its stone floor, NH's lobby brick, its red runner and spurs, the
// owl's medallion, Blathers at his desk), the bug garden to the left (garden.ts), the aquarium to the right (its tanks:
// aquarium.ts, the sea creatures' alcove: seaLife.ts), the fossils' three rooms and the gallery's two behind the hall
// (fossilWing.ts, gallery.ts), a plaque over each doorway. NH's floors and walls (scripts/world3d-models.ts
// --museum: static/room/museum/tex/), lit warm. The camera is the rooms' (tent/engine.ts): NH's steep view, a drag turns
// it, a pinch zooms; here each room framed for the phone (camera.ts), following my villager, and a wall between it and
// my villager is cut away.
// The villagers are NH's own 3D models (villager3d/), walking as in the rooms. Drawn on demand: the full rate while
// something moves (a walk, the camera), the exhibits' ambient rate (30 a second) while only they do, and nothing while
// nothing on screen does. Plain TS; the screen (MuseumRoom.svelte) drives it.
import {
  AmbientLight, Box3, BoxGeometry, CanvasTexture, CircleGeometry, Color, DirectionalLight, Frustum, Group, HemisphereLight,
  Matrix4, Mesh, Sphere, MeshBasicMaterial, MeshLambertMaterial, PerspectiveCamera, Plane, PlaneGeometry, DoubleSide, Raycaster, RepeatWrapping,
  Scene, SRGBColorSpace, TextureLoader, Vector3, BufferGeometry, DataTexture, Float32BufferAttribute, LinearFilter, LinearMipmapLinearFilter, type Material, type MeshStandardMaterial, type Object3D, type Texture
} from 'three';
import { swallowed } from '#lib/quiet.ts';
import { cubicOut } from '#lib/math.ts';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Villager3D } from '../villager3d/villager3d.ts';
import type { Person3 } from '../person3d/person3d.ts';
import type { Anchor } from '../villager3d/seats3d.ts';
import { DPR_MOVING, endRenderer, makeRenderer } from '../world3d/stage.ts';
import { decal } from './geometry.ts';
import { carpetGeometry, carpetTexture } from './carpet.ts';
import { FPS } from '#lib/store/frameRate.ts';
import { pacer } from '../world3d/pace.ts';
import { glbLoader } from '../world3d/gltf.ts';
import { nhLambert } from '../world3d/blank.ts';
import { softDisc } from '../world3d/cards.ts';
import { modelCache } from '../world3d/modelCache.ts';
import M from './models.json' with { type: 'json' };
import { modelBounds } from '../world3d/models3d.ts';
import { ENTRY_HOLD_MS, PACE, VILLAGER_H, along, roomScreen, walkLens, type Insets, type Walk } from '../rooms/view.ts';
import { EYE_MARGIN, clampEye, firstPerson as createFirstPerson, headAnchor, wrapAngle } from '../rooms/firstPerson.ts';
import {
  BUG_WING, CARPETS, DESK, DOOR_HALF, DOORMAT, G1, HALL, HALL_H, HALL_PLANTS, ISLAND_RUG, OPENINGS, PLAQUE, ROOMS, WALLS, WING_H, doorTop, inRect,
  navOf, roomHeld, roomIdAt, roomOf, walkable, wallEnds, wingOfRoom, type Nav, type Opening, type Pt, type Rect, type RoomId, type Wall, type Wing
} from './plan.ts';
import { GAIN, LIFT, LOOK, PORTAL, TINT, applyLook, lookAt, type Look as Light } from './look.ts';
import { FOV, PITCH, enter, follow, framingOf, type CamTune, type Framing } from './camera.ts';
/** The exhibits' rate (a second) while only they move; no finger on the room for REST_MS (the island's rest:
 *  world3d/engine.ts), REST_FPS: the battery and the phone's heat at rest. */
const AMBIENT = 30, REST_MS = 2500, REST_FPS = 15;
/** How long a wall takes to fade out or in (ms), the cutaway's. */
const WALL_FADE = 220;

export type Who = 'A' | 'B' | 'G';
/** Who draws a villager here (person3d: the look they wear). */
/** Who draws a person: its model, and for a villager with none (villagers.json none) its render, drawn as a card. */
export type Look = Person3 & { card?: { url: string; aspect: number } };
export type Hit = { kind: 'villager'; who: Who } | { kind: 'creature'; id: string } | { kind: 'seat'; id: string } | { kind: 'door' } | { kind: 'floor'; x: number; z: number };

/** One wing's exhibits (aquarium.ts, garden.ts): its group, what stands on the floor (the walk keeps off it), its frame
 *  (t ms; `seen`: whether a sphere is in the camera's view: what isn't rests), whether something on screen moved (the
 *  ambient rate), the creature nearest client px (its id, its distance in px). */
export interface Exhibit {
  group: Group;
  /** Its wing (what it shows), and the room it's drawn in (exhibits.ts sets it; else its wing's room). */
  wing: Wing;
  room?: RoomId;
  blocks: readonly Rect[];
  /** What one sits on (the aquarium's benches: seats.ts): its id, its box on the floor (`h` tall). The walk keeps off
   *  it; a tap on it is the seat's; a seated villager's eye may be over it. */
  seats?: readonly (Rect & { id: string; h: number })[];
  frame(t: number, dt: number, seen: (s: Sphere) => boolean): boolean;
  pick(project: (x: number, y: number, z: number) => [number, number] | null, cx: number, cy: number): { id: string; d: number } | null;
  /** A creature's world point (the card and the e2e), or null. */
  where(id: string): [number, number, number] | null;
  /** The species on show (ids). */
  shown(): string[];
  night(n: number): void;
  /** Its fading materials dithered (alphaHash) or solid again: the warm-up compiles their fading program up front, so a
   *  fade (the hour's fish) never compiles one mid-frame. Only those not fading now. */
  dither?(on: boolean): void;
  dispose(): void;
}
/** What an exhibit is built with: the textures and models the museum loads, its lights' warmth. */
export interface Kit {
  tex(name: string, repeat?: [number, number]): Texture;
  /** One of the museum's models (models.json; a pack's member: its node, the pack fetched whole once). */
  model(name: string): Promise<GLTF | null>;
  /** A prop placed by its own bounds (models.json): its middle over (x, z), its foot on the floor, turned, scaled;
   *  `origin`: by NH's own origin instead (a fossil's piece, an artwork: where NH's furniture stands). */
  prop(name: string, x: number, z: number, o?: { yaw?: number; s?: number; y?: number; parent?: Object3D; origin?: boolean }): Group;
  /** A catch's model (static/room/world3d/critters/<kind>/<id>.glb). */
  critter(kind: 'fish' | 'bugs' | 'sea', id: string): Promise<GLTF | null>;
  /** One of the island's models (static/room/world3d/<name>.glb: an oak, a palm, a clump of NH's flowers), and its bounds. */
  island(name: string): Promise<GLTF | null>;
  islandBounds(name: string): { min: number[]; max: number[] } | null;
  /** `layer`: a decal's on the floor (decal): a layer over what lies under it. */
  lambert(o: { color?: number; map?: Texture | null; transparent?: boolean; opacity?: number; layer?: number }): MeshLambertMaterial;
  invalidate(): void;
  noDraw: boolean;
}

export interface Museum {
  resize(insets?: Insets): void;
  /** The camera at rest (no easing under way): the e2e's taps aim then. */
  still(): boolean;
  villager(who: Who, look: Look | null): void;
  /** The model drawn for `who` (person3d's key: `v:<roster id>`, `p:…` a human player), null till one is in. */
  model(who: Who): string | null;
  /** Whether `who` is drawn as its card (a villager with no model: its render, standing), its picture in. */
  card(who: Who): boolean;
  at(who: Who): [number, number] | null;
  put(who: Who, p: Pt, yaw?: number): void;
  walk(who: Who, pts: readonly Pt[], o?: { from?: Pt; ago?: number; ms?: number }): number;
  walking(who: Who): boolean;
  hop(who: Who): void;
  face(who: Who, toward: Pt): void;
  /** A villager sits on a seat (its anchor: villager3d sitAt; it stands at the anchor's step, `from`, where it gets up
   *  and walks off from), or gets up there (null). A walk or a put gets it up too. */
  sit(who: Who, a: Anchor | null): void;
  /** Its seat (sitting down or seated), or null. */
  seated(who: Who): Anchor | null;
  headPoint(who: Who): [number, number, number] | null;
  /** Whose villager the camera follows (mine). */
  follow(who: Who): void;
  /** The first-person view (docs/design.md "First person"): the camera at the followed villager's eyes (on), a short
   *  glide there (`snap`: at once); its body hidden from it, the walls all standing, the ceilings on. Local only. */
  firstPerson(on: boolean, snap?: boolean): void;
  /** A finger's move in the first-person view (px): the head turns. */
  look(dx: number, dy: number): void;
  /** The first-person view now (the e2e): wanted on, fully in, still gliding or easing, where it looks (radians), the eye (model units). */
  fpv(): { on: boolean; inside: boolean; busy: boolean; yaw: number; pitch: number; eye: [number, number, number] };
  /** Whether a model point is in front of the camera and on the canvas (a balloon's anchor: not behind the eyes). */
  inView(x: number, y: number, z: number): boolean;
  orbit(dAz: number, dPitch: number): void;
  zoom(f: number): void;
  resetView(): void;
  isDefault(): boolean;
  moving(on: boolean): void;
  /** After each frame drawn (the scene's overlays that follow the camera: a speech balloon carried with its speaker). */
  onDrawn(fn: (() => void) | null): void;
  night(n: number): void;
  /** The wings' exhibits (each built once its data is in: MuseumRoom), and one taken down (rebuilt with new finds). */
  exhibit(e: Exhibit): void;
  drop(e: Exhibit): void;
  exhibits(): readonly Exhibit[];
  hit(cx: number, cy: number): Hit | null;
  client(x: number, y: number, z: number): [number, number];
  /** The walk grid (the floors less what stands on them). */
  nav(): Nav;
  /** Which walls the cutaway takes away (WALLS' order: 1 cut, 0 standing; the e2e). */
  walls(): string;
  /** The room drawn (only it: the one my villager is in). */
  room(): RoomId;
  /** Told when a doorway's dip starts (its colour) and ends (null): the screen fades to it and back; the room changes
   *  inside it. */
  onDip(fn: ((color: string | null) => void) | null): void;
  /** The room's look retuned (look.ts), or its camera (camera.ts: viewW for this room, the wings' all at once; pitch
   *  in degrees for every room): the dev hook's, the Simulator's tuning. */
  tune(over: Partial<Light> & CamTune): void;
  kit: Kit;
  stats(): { frames: number; draws: number; calls: number; tris: number; dpr: number; cost: number[]; queued: boolean; ambient: number; loading: number; warming: boolean; mem: [number, number, number] };
  ready: Promise<void>;
  dispose(): void;
}

const now = () => performance.now();
/** The top of the tallest thing in the museum (the hall's cornice): the near plane comes down to just over it. */
const TOP = 70;

/** NH's lobby medallion (the owl's emblem in its ring of gold), drawn once. */
function medallion(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d')!;
  const R = 250;
  g.translate(256, 256);
  const ring = (r: number, w: number, col: string) => {
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.lineWidth = w;
    g.strokeStyle = col;
    g.stroke();
  };
  g.beginPath();
  g.arc(0, 0, R, 0, Math.PI * 2);
  // (a warm walnut inlay: a near-black disc read as a hole in the floor)
  g.fillStyle = '#6a4632';
  g.fill();
  ring(R - 8, 12, '#c9a24a');
  ring(R - 40, 4, '#c9a24a');
  // the compass's points
  g.fillStyle = '#7c2a2c';
  for (let k = 0; k < 8; k++) {
    g.save();
    g.rotate((k * Math.PI) / 4);
    g.beginPath();
    g.moveTo(0, -(R - 46));
    g.lineTo(k % 2 ? 22 : 34, 0);
    g.lineTo(k % 2 ? -22 : -34, 0);
    g.closePath();
    g.fill();
    g.restore();
  }
  // the owl: a round face, its eyes, its brows (the museum's emblem)
  g.beginPath();
  g.arc(0, 0, 92, 0, Math.PI * 2);
  g.fillStyle = '#c9a24a';
  g.fill();
  g.fillStyle = '#2f2a2a';
  for (const s of [-1, 1]) {
    g.beginPath();
    g.arc(s * 34, -8, 22, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(s * 10, -40);
    g.lineTo(s * 70, -64);
    g.lineTo(s * 58, -36);
    g.closePath();
    g.fill();
  }
  g.fillStyle = '#c9a24a';
  for (const s of [-1, 1]) {
    g.beginPath();
    g.arc(s * 34, -8, 9, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#2f2a2a';
  g.beginPath();
  g.moveTo(-10, 16);
  g.lineTo(10, 16);
  g.lineTo(0, 36);
  g.closePath();
  g.fill();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** A doorway's plaque (NH's lobby plaques: the room beyond's name, cream on walnut in a gold rim), PLAQUE_W × PLAQUE_H
 *  model units; drawn again once the app's font is in (`then`: a frame for it). */
const PLAQUE_W = 30, PLAQUE_H = 8;
/** A side wall's plaque's turn from facing the room view (out from the wall into the room). */
const BLADE = Math.PI / 6;
const PLAQUE_FONT = '"Zen Maru Gothic", "Hiragino Maru Gothic ProN", system-ui, sans-serif';
function plaque(text: string, then: () => void): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 480;
  c.height = 128;
  const g = c.getContext('2d')!;
  const paint = () => {
    g.clearRect(0, 0, 480, 128);
    g.fillStyle = '#5b3f2a';
    g.beginPath();
    g.roundRect(3, 3, 474, 122, 22);
    g.fill();
    g.strokeStyle = '#d5ad55';
    g.lineWidth = 7;
    g.stroke();
    g.fillStyle = '#fbf2dc';
    g.font = `700 70px ${PLAQUE_FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 240, 68, 430);
  };
  paint();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  void document.fonts?.load(`700 70px "Zen Maru Gothic"`, text).then(() => {
    paint();
    t.needsUpdate = true;
    then();
  }, () => {});
  return t;
}

/** A doorway's glow (times its room's mood): full at the floor, deeper toward the top. */
function portalGlow(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 2;
  c.height = 64;
  const g = c.getContext('2d')!, v = g.createLinearGradient(0, 0, 0, 64);
  v.addColorStop(0, '#7a7a7a');
  v.addColorStop(0.7, '#ececec');
  v.addColorStop(1, '#ffffff');
  g.fillStyle = v;
  g.fillRect(0, 0, 2, 64);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** The garden's glass roof from under it (the first person's): a pale sky through panes in white frames, tiled. */
function glassRoof(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const sky = g.createLinearGradient(0, 0, 64, 64);
  sky.addColorStop(0, '#cfeaf2');
  sky.addColorStop(1, '#b4dbe9');
  g.fillStyle = sky;
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#f4f1e6';
  g.fillRect(0, 0, 64, 3);
  g.fillRect(0, 0, 3, 64);
  g.fillRect(0, 31, 64, 1.5);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

/** The hall's ceiling from below (the first person's): plaster coffers in a stone frame, a thread of gold, tiled. */
function coffers(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#cdbd9e';
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#efe5d2';
  g.fillRect(6, 6, 52, 52);
  g.strokeStyle = '#c9a24a';
  g.lineWidth = 1.5;
  g.strokeRect(11, 11, 42, 42);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

/** NH's museum door from inside (the first person's): two wooden leaves, their panels, brass handles. */
function doorTex(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#6b4630';
  g.fillRect(0, 0, 96, 128);
  g.fillStyle = '#5a3a27';
  for (const x of [8, 54]) for (const y of [10, 70]) g.fillRect(x, y, 34, 48);
  g.fillStyle = '#3b261a';
  g.fillRect(47, 0, 2, 128);
  g.fillStyle = '#d5ad55';
  for (const x of [40, 52]) g.fillRect(x, 64, 4, 10);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** NH's grass under the garden's glass, a little mottled (one canvas, tiled). */
function grass(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#7fbf58';
  g.fillRect(0, 0, 128, 128);
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 260; i++) {
    g.fillStyle = rnd() < 0.5 ? 'rgba(96,160,70,0.5)' : 'rgba(160,214,110,0.45)';
    g.beginPath();
    g.ellipse(rnd() * 128, rnd() * 128, 2 + rnd() * 5, 1 + rnd() * 3, rnd() * 3, 0, Math.PI * 2);
    g.fill();
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

/** The museum's models as loaded, kept across visits (world3d/modelCache.ts: each visit fetched, decoded and converted
 *  them all again), the MUSEUM_KEEP last used: by `i:` + its URL an island model (the catches among them: drawn from
 *  their KTX2s, as on the island, ktx2.ts), `m:` + its URL the museum's own (their WebPs). NH's soft look, the
 *  island's: Lambert, a little lit by its own colour (no metal, no specular). */
const MUSEUM_KEEP = 64;
/** An exhibit's own light by its pack (look.ts LIFT: the fossils, the paintings, the statues stand out of the room). */
const liftOf = (key: string) => (/\/fossil/.test(key) ? LIFT.fossil : /\/art-paintings/.test(key) ? LIFT.painting : /\/art-statues/.test(key) ? LIFT.statue : 0);
const museumModels = modelCache(MUSEUM_KEEP, (key) => glbLoader({ ktx2: key.startsWith('i:'), plain: true }).loadAsync(key.slice(2)).then((g) => {
  const lift = key.startsWith('m:') ? liftOf(key) : 0;
  g.scene.traverse((n) => {
    const m = n as Mesh;
    if (!m.isMesh) return;
    const s = m.material as MeshStandardMaterial, l = nhLambert(s, { lift, lamp: { color: 0xffe2a8, at: 0.6 }, see: true });
    l.depthWrite = !s.transparent;
    s.dispose();
    m.material = l;
  });
  return g;
}), 'museum: model');

export function createMuseum(canvas: HTMLCanvasElement, o: { base: string; world: string }): Museum {
  const { renderer, noDraw, dpr: dprFull } = makeRenderer(canvas);
  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 4, 3000);
  const screen = roomScreen(camera, canvas), { client, project, inView } = screen;
  let insets: Insets = { top: 0, bottom: 0 };
  let disposed = false;
  /** The first-person view (rooms/firstPerson.ts), at the followed villager's eyes. */
  const fp = createFirstPerson();

  // the light (look.ts): the room one is in its own look (only it is drawn), under Neutral tone mapping, set before
  // anything compiles (each program takes its define)
  const hemi = new HemisphereLight(), key = new DirectionalLight(), amb = new AmbientLight();
  scene.add(hemi, key, amb);
  /** The room drawn (only it: its shell, its exhibits, who's in it), and its look's tuning (the dev hook's). */
  let cur: RoomId = 'hall', nightN = 0;
  const tuned: Partial<Record<Wing, Partial<Light>>> = {};
  const lookNow = () => lookAt(wingOfRoom(cur), nightN, tuned[wingOfRoom(cur)]);
  const relight = () => applyLook({ hemi, key, amb }, renderer, scene, lookNow());
  relight();

  // ---- what the rooms are made of ----
  const texLoader = new TextureLoader();
  const texCache = new Map<string, Texture>();
  const disposables: { dispose(): void }[] = [];
  function tex(name: string, repeat: [number, number] = [1, 1]): Texture {
    const k = `${name}|${repeat}`;
    let t = texCache.get(k);
    if (!t) {
      t = texLoader.load(`${o.base}tex/${name}.webp`, () => invalidate(), undefined, () => swallowed('museum.tex'));
      t.colorSpace = SRGBColorSpace;
      t.wrapS = t.wrapT = RepeatWrapping;
      t.repeat.set(repeat[0], repeat[1]);
      t.anisotropy = 4;
      texCache.set(k, t);
      disposables.push(t);
    }
    return t;
  }
  const lambert = (p: { color?: number; map?: Texture | null; transparent?: boolean; opacity?: number; layer?: number }) => {
    const m = new MeshLambertMaterial({ color: p.color ?? 0xffffff, map: p.map ?? null, ...(p.transparent ? { transparent: true, opacity: p.opacity ?? 1, depthWrite: false } : {}) });
    if (p.layer) decal(m, p.layer);
    disposables.push(m);
    return m;
  };
  // (kept across visits: museumModels; what this visit asked for let go of on its renderer on dispose)
  const models = museumModels.user();
  let pending = 0;
  const load = (key: string): Promise<GLTF | null> => {
    if (disposed) return Promise.resolve(null);
    pending++;
    return models.load(key).finally(() => {
      pending--;
      if (!pending) warmSoon();
      invalidate();
    });
  };
  const MODELS = M.models as Record<string, { min: number[]; max: number[]; v: string; pack?: string }>;
  /** A pack's members, each its node as a model of its own (kept per pack, so a member's props share it). */
  const members = new WeakMap<GLTF, Map<string, GLTF | null>>();
  const memberOf = (g: GLTF, name: string): GLTF | null => {
    const by = members.get(g) ?? members.set(g, new Map()).get(g)!;
    if (!by.has(name)) {
      const node = g.scene.children.find((n) => n.name === name) ?? null;
      by.set(name, node && ({ ...g, scene: node } as GLTF));
    }
    return by.get(name)!;
  };
  const model = (name: string): Promise<GLTF | null> => {
    const b = MODELS[name];
    if (!b) return Promise.resolve(null);
    if (!b.pack) return load(`m:${o.base}${name}.glb?v=${b.v}`);
    return load(`m:${o.base}${b.pack}.glb?v=${b.v}`).then((g) => g && memberOf(g, name));
  };
  function prop(name: string, x: number, z: number, p: { yaw?: number; s?: number; y?: number; parent?: Object3D; origin?: boolean } = {}): Group {
    const holder = new Group();
    holder.position.set(x, p.y ?? 0, z);
    holder.rotation.y = p.yaw ?? 0;
    const s = p.s ?? 1;
    holder.scale.setScalar(s);
    (p.parent ?? scene).add(holder);
    const b = MODELS[name];
    void model(name).then((g) => {
      if (!g || disposed || !b) return;
      const body = g.scene.clone(true);
      // its middle over the spot, its foot on the floor (NH's room props stand where they stood in its room)
      if (p.origin) body.position.set(0, 0, 0);
      else body.position.set(-(b.min[0] + b.max[0]) / 2, -b.min[1], -(b.min[2] + b.max[2]) / 2);
      holder.add(body);
      invalidate();
    });
    return holder;
  }
  const kit: Kit = {
    tex, model, prop, lambert, invalidate: () => invalidate(), noDraw,
    critter: (kind, id) => kit.island(`critters/${kind}/${id}`),
    island: (name) => {
      const b = modelBounds(name);
      return b ? load(`i:${o.world}${name}.glb?v=${b.v}`) : Promise.resolve(null);
    },
    islandBounds: (name) => modelBounds(name)
  };

  // ---- the rooms: only the one my villager is in is drawn (its shell, its exhibits, who's in it); what each piece of
  //      the shell belongs to (a wall, a doorway's: both its rooms), shown by showRoom ----
  const shell = new Map<Object3D, readonly RoomId[]>();
  const inRooms = <T extends Object3D>(o: T, rs: readonly RoomId[]): T => (shell.set(o, rs), o);

  // ---- the floors (each room's, a warm apron past its front edge: under the cut front wall, never the void) ----
  const APRON = 60;
  const floor = (r: Rect, mat: Material, ws: readonly RoomId[], y = 0) => {
    const m = new Mesh(new PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set((r.x0 + r.x1) / 2, y, (r.z0 + r.z1) / 2);
    m.userData.floor = true;
    scene.add(inRooms(m, ws));
    return m;
  };
  const tw = (r: Rect, u: number): [number, number] => [(r.x1 - r.x0) / u, (r.z1 - r.z0) / u];
  const grassTex = grass();
  grassTex.repeat.set(...tw(BUG_WING, 50));
  disposables.push(grassTex);
  const grassMat = lambert({ map: grassTex });
  /** Each wing's floor texture and its tile (model units); the garden's is its grass. */
  const FLOOR: Record<Exclude<Wing, 'bug'>, [string, number]> = { hall: ['hall-floor', 40], fish: ['fish-floor', 40], sea: ['fish-floor', 40], fossil: ['fossil-floor', 50], art: ['art-floor', 30] };
  /** Each room's floor (a wing's passage and room each a rect, tiled from the world's origin so they meet unseen),
   *  `dim` times its tint (the apron's). */
  const floorOf = (wing: Wing, r: Rect, dim = 1): MeshLambertMaterial => {
    if (wing === 'bug' && dim === 1) return grassMat;
    const [name, u] = wing === 'bug' ? [] : FLOOR[wing];
    const t = name && u ? tex(name, tw(r, u)).clone() : grassTex;
    if (name && u) {
      t.offset.set(r.x0 / u, -r.z1 / u);
      t.needsUpdate = true;
      disposables.push(t);
    }
    // (lifted past white: look.ts GAIN)
    const m = lambert({ map: t });
    m.color.set(TINT[wing].floor).multiplyScalar(dim * GAIN[wing].floor);
    return m;
  };
  for (const { id, wing, r } of ROOMS) {
    floor(r, floorOf(wing, r), [id]);
    // (below the floors: under a neighbour's, hidden with it)
    const apron = { x0: r.x0, x1: r.x1, z0: r.z1, z1: r.z1 + APRON };
    floor(apron, floorOf(wing, apron, 0.62), [id], -1);
  }
  // the openings' thresholds (through the walls: the floor of the room each is counted to; both rooms')
  for (const o of OPENINGS) {
    const r = o.axis === 'x' ? { x0: o.at - 2, x1: o.at + 2, z0: o.from, z1: o.to } : { x0: o.from, x1: o.to, z0: o.at - 2, z1: o.at + 2 };
    // (its room's floor run on through the wall, tiled from the origin as it is: no seam)
    floor(r, decal(floorOf(o.wing === 'bug' ? 'hall' : o.wing, r), 1), [o.room, o.next], 0.01);
  }
  // the carpets (plan.ts CARPETS; carpet.ts: each room's strips one seamless carpet, its border round them all): the
  // hall's runner from the door to the desk and its spurs to the arches, the fossils' and the gallery's ways in; the
  // T. rex's island its own green rug
  const carpets: { room: RoomId; rects: readonly Rect[]; pile?: 'green' }[] = [...CARPETS, { room: 'F2', rects: [ISLAND_RUG], pile: 'green' }];
  for (const { room, rects: strips, pile } of carpets) {
    const ct = carpetTexture(strips, pile), g = carpetGeometry(strips, ct);
    const t = new DataTexture(ct.data, ct.w, ct.h);
    t.colorSpace = SRGBColorSpace;
    t.magFilter = LinearFilter;
    t.minFilter = LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = 4;
    t.needsUpdate = true;
    disposables.push(t);
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(g.position, 3));
    geo.setAttribute('normal', new Float32BufferAttribute(new Float32Array(g.position.length).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
    geo.setAttribute('uv', new Float32BufferAttribute(g.uv, 2));
    geo.setIndex(g.index);
    const m = new Mesh(geo, lambert({ map: t, layer: 2 }));
    m.position.y = 0.05;
    m.userData.floor = true;
    scene.add(inRooms(m, [room]));
  }
  // the owl's medallion where the runner meets the side arches' spurs (3.8 tiles across: a mark, not a pit)
  const medTex = medallion();
  disposables.push(medTex);
  const med = new Mesh(new CircleGeometry(19, 48), lambert({ map: medTex, layer: 3 }));
  med.rotation.x = -Math.PI / 2;
  med.position.set(0, 0.08, 10);
  med.userData.floor = true;
  scene.add(med);
  // the doormat inside the front door (a tap on it goes back out)
  const mat = new Mesh(new PlaneGeometry(DOORMAT.x1 - DOORMAT.x0, DOORMAT.z1 - DOORMAT.z0 - 1), lambert({ color: 0x6b4a33, layer: 4 }));
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(0, 0.1, (DOORMAT.z0 + DOORMAT.z1) / 2);
  mat.userData.door = true;
  scene.add(mat);

  // ---- the walls: each a slab, each side the look of the room it faces (the outside's dark), its top a cap ----
  //      (each wall its own copies of its materials: it fades out and in on its own, the cutaway)
  const wallMat: Record<Wing, MeshLambertMaterial> = {
    hall: lambert({ map: tex('hall-wall', [4, 2]) }),
    fish: lambert({ map: tex('fish-wall', [6, 1.5]), color: TINT.fish.wall }),
    sea: lambert({ map: tex('fish-wall', [3, 1.5]), color: TINT.sea.wall }),
    bug: lambert({ map: tex('bug-outside', [1, 1]) }),
    fossil: lambert({ map: tex('fossil-wall', [5, 1]), color: TINT.fossil.wall }),
    art: lambert({ map: tex('hall-red', [8, 1.6]) })
  };
  for (const [w, m] of Object.entries(wallMat) as [Wing, MeshLambertMaterial][]) m.color.set(TINT[w].wall).multiplyScalar(GAIN[w].wall);
  /** The walls' outside faces: the room's background (look.ts), so a cut wall's back never shows near-black. */
  const outMat = lambert({ color: LOOK.hall.bg });
  const capMat = lambert({ color: 0xe9dcc2 });
  const trim = lambert({ color: 0xc9a24a });
  /** A wall: its slab and its cornice, their own materials, its box (the cutaway's test: its middle, its yaw's cos and
   *  sin, its half length, height and thickness), whether it's cut away and how far faded in (1: all there). */
  interface WallMesh {
    w: Wall;
    /** The rooms either side (drawn while one's in either), and whether that's now. */
    rooms: RoomId[];
    /** The room on its +z face and on its −z (its local frame), or the outside. */
    sides: [RoomId | null, RoomId | null];
    here: boolean;
    mesh: Mesh;
    trim: Mesh | null;
    /** Its foot (KICK high, solid), standing while the wall's cut away: NH's cut wall, the room's edge still drawn. */
    kick: Mesh;
    mats: MeshLambertMaterial[];
    box: { x: number; z: number; c: number; s: number; l: number; h: number; t: number };
    cut: boolean;
    fade: number;
  }
  const walls: WallMesh[] = [];
  const own = (mats: Map<Material, MeshLambertMaterial>, m: MeshLambertMaterial) => {
    let c = mats.get(m);
    if (!c) {
      c = m.clone();
      c.userData.of = m;
      mats.set(m, c);
      disposables.push(c);
    }
    return c;
  };
  const T = 3, KICK = 5;
  /** A slab along a wall from a to b, its ends run on or held back at the joints (plan.ts wallEnds: no two slabs
   *  overlap, so no faces share a plane), its middle and its yaw. */
  const span = (i: number, run: number, free: number) => {
    const wl = WALLS[i], [e0, e1] = wallEnds(WALLS, i);
    const dx = wl.b[0] - wl.a[0], dz = wl.b[1] - wl.a[1], len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len;
    const s0 = e0 ? e0 * run : free, s1 = e1 ? e1 * run : free;
    return { len: len + s0 + s1, x: (wl.a[0] + wl.b[0]) / 2 + (ux * (s1 - s0)) / 2, z: (wl.a[1] + wl.b[1]) / 2 + (uz * (s1 - s0)) / 2, yaw: Math.atan2(-dz, dx) };
  };
  WALLS.forEach((wl, i) => {
    const s = span(i, T / 2, 0);
    // its two sides: +z of the slab (its local frame) and −z, each facing a room or the outside
    const len = Math.hypot(wl.b[0] - wl.a[0], wl.b[1] - wl.a[1]), nx = -(wl.b[1] - wl.a[1]) / len, nz = (wl.b[0] - wl.a[0]) / len;
    const mx = (wl.a[0] + wl.b[0]) / 2, mz = (wl.a[1] + wl.b[1]) / 2;
    const side = (k: number) => roomIdAt(mx + nx * k * 4, mz + nz * k * 4);
    // BoxGeometry's faces: +x, −x, +y, −y, +z, −z; turned by the yaw below, its local +z is the wall's normal (nx, nz)
    // (the bug wing's backdrop: one picture across each wall, its sky and palms, not tiled)
    const geo = new BoxGeometry(s.len, wl.h, T);
    const mats = new Map<Material, MeshLambertMaterial>();
    const matFor = (r: RoomId | null) => own(mats, r ? wallMat[wingOfRoom(r)] : outMat), cap = own(mats, capMat);
    const mesh = new Mesh(geo, [cap, cap, cap, cap, matFor(side(1)), matFor(side(-1))]);
    mesh.position.set(s.x, wl.h / 2, s.z);
    mesh.rotation.y = s.yaw;
    scene.add(mesh);
    // its foot: the face toward the room drawn its wall (the bottom of its texture, not squashed), the cap's stone
    // elsewhere (the outside, or the next room's side: kickFaces), a little proud of the slab (seen only while the slab
    // is cut or fading)
    const kg = new BoxGeometry(s.len, KICK, T + 0.3), uv = kg.attributes.uv;
    for (let k = 16; k < 24; k++) uv.setY(k, uv.getY(k) * (KICK / wl.h));
    const kick = new Mesh(kg, [capMat, capMat, capMat, capMat, capMat, capMat]);
    kick.position.set(s.x, KICK / 2, s.z);
    kick.rotation.y = s.yaw;
    kick.visible = false;
    scene.add(kick);
    // a cornice round the hall's top, gold (NH's lobby trim: a little proud of the wall, its corners one piece's)
    let trimMesh: Mesh | null = null;
    if (wl.h === HALL_H) {
      const t = span(i, 2.5, 1);
      trimMesh = new Mesh(new BoxGeometry(t.len, 2.5, 5), own(mats, trim));
      trimMesh.position.set(t.x, wl.h + 1.2, t.z);
      trimMesh.rotation.y = t.yaw;
      scene.add(trimMesh);
    }
    const rooms = [...new Set([side(1), side(-1)].filter((r): r is RoomId => !!r))];
    walls.push({
      w: wl, rooms, sides: [side(1), side(-1)], here: rooms.includes(cur), mesh, trim: trimMesh, kick, mats: [...mats.values()], cut: false, fade: 1,
      box: { x: s.x, z: s.z, c: Math.cos(s.yaw), s: Math.sin(s.yaw), l: s.len / 2, h: wl.h + 2.5, t: T / 2 }
    });
  });

  // ---- the first person's (fpvOnly: shown only then): the ceilings, facing down (from above, their backs: culled, so the
  //      glide down past them shows nothing), the front doorway's lintel and its closed door ----
  const fpvOnly: Mesh[] = [];
  const fpvMesh = (m: Mesh, rs: readonly RoomId[]) => {
    m.visible = false;
    m.userData.fpv = true;
    fpvOnly.push(m);
    scene.add(inRooms(m, rs));
    return m;
  };
  const CORNICE = HALL_H + 2.45;
  const ceil = (r: Rect, y: number, m: Material, room: RoomId) => {
    const c = fpvMesh(new Mesh(new PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0), m), [room]);
    c.rotation.x = Math.PI / 2;
    c.position.set((r.x0 + r.x1) / 2, y, (r.z0 + r.z1) / 2);
    c.userData.ceiling = true;
  };
  // (unlit: the lights all shine down, so a lit ceiling was a muddy brown; each its own colour)
  const cofferTex = coffers(), roofTex = glassRoof();
  cofferTex.repeat.set(...tw(HALL, 20));
  roofTex.repeat.set(...tw(BUG_WING, 40));
  // (the hall's coffers, the aquarium's and the sea creatures' dark blue, the garden's glass, the fossils' dim vault, the
  // gallery's coffers warmer)
  const CEIL_DAY = [0xe6dccb, TINT.fish.ceil!, 0xffffff, TINT.fossil.ceil!, 0xf0dcc0];
  const galleryTex = cofferTex.clone();
  galleryTex.repeat.set(...tw(G1, 24));
  const ceilMats = [new MeshBasicMaterial({ map: cofferTex }), new MeshBasicMaterial(), new MeshBasicMaterial({ map: roofTex }), new MeshBasicMaterial(), new MeshBasicMaterial({ map: galleryTex })];
  ceilMats.forEach((m, i) => m.color.set(CEIL_DAY[i]));
  disposables.push(cofferTex, roofTex, galleryTex, ...ceilMats);
  ceil(HALL, CORNICE, ceilMats[0], 'hall');
  // (the rooms' from the far face of the hall's walls: the hall's lintels' undersides lie at WING_H too, over the wall)
  const CEIL_OF: Record<Exclude<Wing, 'hall'>, MeshBasicMaterial> = { fish: ceilMats[1], sea: ceilMats[1], bug: ceilMats[2], fossil: ceilMats[3], art: ceilMats[4] };
  for (const { id, wing, r } of ROOMS) {
    if (wing === 'hall') continue;
    const c = { ...r };
    if (c.x0 === HALL.x1) c.x0 += T / 2;
    if (c.x1 === HALL.x0) c.x1 -= T / 2;
    if (c.z1 === HALL.z0) c.z1 -= T / 2;
    ceil(c, WING_H, CEIL_OF[wing], id);
  }
  const DOOR_H = 32;
  const frontLintel = fpvMesh(new Mesh(new BoxGeometry(DOOR_HALF * 2, CORNICE - DOOR_H, T), lambert({ map: tex('hall-wall', [(DOOR_HALF * 2) / 30, (CORNICE - DOOR_H) / 32]) })), ['hall']);
  frontLintel.position.set(0, (CORNICE + DOOR_H) / 2, HALL.z1);
  const doorT = doorTex();
  disposables.push(doorT);
  const frontDoor = fpvMesh(new Mesh(new PlaneGeometry(DOOR_HALF * 2, DOOR_H), lambert({ map: doorT })), ['hall']);
  frontDoor.position.set(0, DOOR_H / 2, HALL.z1 + 0.5);
  frontDoor.rotation.y = Math.PI;

  // ---- each doorway: a lintel over it (its wall's stone, from the doorway's top up to the wall's), a plaque on it naming
  //      the room beyond (spaced kana, toward the room it's read from; in a side wall standing out from it, turned most
  //      of the way toward the camera, so the room view reads it too), and a card in the opening: the room beyond isn't drawn, so
  //      its opening shows that room's mood (look.ts PORTAL), a glow brighter at the floor; one card a side, each seen
  //      from its own room; a tap on it goes through. Each stands with its doorway's wall: once that's cut away (a front
  //      wall in the room view) the lintel goes, the card drops to the wall's foot and the plaque stands just over it ----
  const glow = portalGlow();
  disposables.push(glow);
  const portals: Mesh[] = [];
  /** A doorway: its lintel, plaque and cards, its jambs (the walls it's in), where the plaque hangs (x, y, z, yaw) with
   *  the wall standing and with it cut away, its top, and whether it's cut now. */
  interface Doorway { o: Opening; jambs: WallMesh[]; lintel: Mesh; plaque: Group | null; up: number[]; down: number[]; cards: Mesh[]; top: number; cut: boolean }
  const doorways: Doorway[] = [];
  const plaqueGeo = new PlaneGeometry(PLAQUE_W, PLAQUE_H);
  disposables.push(plaqueGeo);
  for (const o of OPENINGS) {
    const mid = (o.from + o.to) / 2, len = o.to - o.from, top = doorTop(o);
    const along = (w: Wall) => (o.axis === 'x' ? w.a[0] === o.at && w.b[0] === o.at : w.a[1] === o.at && w.b[1] === o.at);
    const onEdge = (p: Pt) => (o.axis === 'x' ? p[1] === o.from || p[1] === o.to : p[0] === o.from || p[0] === o.to);
    const jambs = walls.filter((w) => along(w.w) && (onEdge(w.w.a) || onEdge(w.w.b)));
    const h = Math.max(WING_H, ...jambs.map((w) => w.w.h)), wallTop = h === HALL_H ? CORNICE : h;
    const wing = wingOfRoom(o.room), stone = wing === 'hall' || wing === 'bug';
    const lm = lambert({ map: stone ? tex('hall-wall', [len / 30, (wallTop - top) / 32]) : wallMat[wing].map });
    if (!stone) lm.color.copy(wallMat[wing].color);
    const lintel = new Mesh(o.axis === 'x' ? new BoxGeometry(T, wallTop - top, len) : new BoxGeometry(len, wallTop - top, T), lm);
    lintel.position.set(o.axis === 'x' ? o.at : mid, (wallTop + top) / 2, o.axis === 'x' ? mid : o.at);
    scene.add(inRooms(lintel, [o.room, o.next]));
    // its plaque, read from its room (two faces back to back: a turned one is seen from either side)
    const k = (o.axis === 'x' ? roomIdAt(o.at + 5, mid) : roomIdAt(mid, o.at + 5)) === o.room ? 1 : -1;
    const py = (top + wallTop) / 2;
    const up = o.axis === 'z' ? [mid, py, o.at + k * (T / 2 + 0.2), k > 0 ? 0 : Math.PI] : [o.at + k * (T / 2 + 0.3 + (PLAQUE_W / 2) * Math.cos(BLADE)), py, mid, k * BLADE];
    const down = o.axis === 'z' ? [mid, KICK + 3 + PLAQUE_H / 2, o.at, 0] : up;
    let board: Group | null = null;
    if (o.next !== 'hall') {
      const pm = new MeshBasicMaterial({ map: plaque(PLAQUE[o.next], () => invalidate()), transparent: true });
      disposables.push(pm.map!, pm);
      board = new Group();
      const front = new Mesh(plaqueGeo, pm), back = new Mesh(plaqueGeo, pm);
      back.rotation.y = Math.PI;
      front.position.z = 0.05;
      back.position.z = -0.05;
      board.add(front, back);
      board.position.set(up[0], up[1], up[2]);
      board.rotation.y = up[3];
      scene.add(inRooms(board, [o.room]));
    }
    const cards: Mesh[] = [];
    for (const kk of [1, -1]) {
      const near = o.axis === 'x' ? roomIdAt(o.at + kk * 5, mid) : roomIdAt(mid, o.at + kk * 5), far = near === o.room ? o.next : o.room;
      if (!near) continue;
      const card = new Mesh(new PlaneGeometry(len, top), new MeshBasicMaterial({ map: glow, color: PORTAL[wingOfRoom(far)] }));
      disposables.push(card.material);
      card.position.set(o.axis === 'x' ? o.at : mid, top / 2, o.axis === 'x' ? mid : o.at);
      card.rotation.y = o.axis === 'x' ? (kk * Math.PI) / 2 : kk > 0 ? 0 : Math.PI;
      card.userData.portal = { o, into: far };
      scene.add(inRooms(card, [near]));
      portals.push(card);
      cards.push(card);
    }
    doorways.push({ o, jambs, lintel, plaque: board, up, down, cards, top, cut: false });
  }
  /** A doorway's dressing with its wall: standing, or cut away (the lintel gone, the card at the wall's foot, the plaque
   *  just over it). */
  function doorwayShown(d: Doorway) {
    const cut = d.jambs.some((w) => w.fade < 0.5);
    d.lintel.visible = (d.o.room === cur || d.o.next === cur) && !cut;
    if (cut === d.cut) return;
    d.cut = cut;
    for (const c of d.cards) {
      c.scale.y = cut ? KICK / d.top : 1;
      c.position.y = (cut ? KICK : d.top) / 2;
    }
    const at = cut ? d.down : d.up;
    d.plaque?.position.set(at[0], at[1], at[2]);
    d.plaque?.rotation.set(0, at[3], 0);
  }
  /** What a tap's ray stops at, at the eyes: the walls, their cornices, the lintels, the door, the ceilings, the doorways' cards. */
  const occluders: Object3D[] = [...walls.flatMap((w) => (w.trim ? [w.mesh, w.trim] : [w.mesh])), ...doorways.map((d) => d.lintel), ...fpvOnly, ...portals];

  // ---- the hall's furnishing: banners, Blathers' desk at the back in the middle, the plants ----
  const wood0 = lambert({ color: 0x7a5234 });
  const redTex = tex('hall-red', [1, 2]);
  for (const x of [-26, 26]) {
    const b = new Mesh(new PlaneGeometry(7, 36), lambert({ map: redTex }));
    b.position.set(x, 30, HALL.z0 + 2);
    scene.add(b);
  }
  // Blathers' desk, NH's: wood, a green top; Blathers behind it (curator.ts, an exhibit)
  const desk = new Group();
  const top = new Mesh(new BoxGeometry(DESK.x1 - DESK.x0, 1.6, DESK.z1 - DESK.z0), lambert({ color: 0x3f6b4a }));
  top.position.y = DESK.h - 0.8;
  const body = new Mesh(new BoxGeometry(DESK.x1 - DESK.x0 - 2, DESK.h - 1.6, DESK.z1 - DESK.z0 - 2), wood0);
  body.position.y = (DESK.h - 1.6) / 2;
  desk.add(top, body);
  desk.position.set((DESK.x0 + DESK.x1) / 2, 0, (DESK.z0 + DESK.z1) / 2);
  scene.add(desk);
  const BLOCKS: Rect[] = [{ x0: DESK.x0 - 1, x1: DESK.x1 + 1, z0: DESK.z0, z1: DESK.z1 }, { x0: DESK.x0 - 2, x1: DESK.x1 + 2, z0: HALL.z0, z1: DESK.z0 }];
  for (const [name, x, z, sc] of HALL_PLANTS) {
    prop(name, x, z, { s: sc });
    BLOCKS.push({ x0: x - 4, x1: x + 4, z0: z - 4, z1: z + 4 });
  }
  // (the rest of the shell, the furnishing: the room each stands in)
  for (const n of scene.children) if (!shell.has(n) && !(n as { isLight?: boolean }).isLight && !walls.some((w) => w.mesh === n || w.trim === n || w.kick === n)) shell.set(n, [roomIdAt(n.position.x, n.position.z) ?? 'hall']);
  showRoom();

  // ---- the exhibits (each drawn only in its room) ----
  const exhibits: Exhibit[] = [];
  const roomOfExhibit = (e: Exhibit): RoomId => e.room ?? (e.wing === 'sea' ? 'fish' : e.wing === 'fossil' ? 'F1' : e.wing === 'art' ? 'G1' : e.wing);
  let nav = navOf(BLOCKS);
  /** What stands on the floors (the walk keeps off it; the first person's eye too). */
  let solids: Rect[] = BLOCKS;
  /** The same less the seats (a seated villager's eye is over its own), and the seats to tap (their boxes). */
  let solidsSeated: Rect[] = BLOCKS;
  let seatBoxes: { id: string; box: Box3; room: RoomId }[] = [];
  function blocksChanged() {
    solidsSeated = [...BLOCKS, ...exhibits.flatMap((x) => x.blocks)];
    const seats = exhibits.flatMap((x) => (x.seats ?? []).map((r) => ({ ...r, room: roomOfExhibit(x) })));
    nav = navOf((solids = [...solidsSeated, ...seats]));
    seatBoxes = seats.map((r) => ({ id: r.id, room: r.room, box: new Box3(new Vector3(r.x0, 0, r.z0), new Vector3(r.x1, r.h, r.z1)) }));
  }
  function exhibit(e: Exhibit) {
    // (one built after the room was left: the exhibits' chunk landing late)
    if (disposed) return e.dispose();
    exhibits.push(e);
    scene.add(e.group);
    blocksChanged();
    e.night(nightN);
    invalidate();
    // (a rebuilt wing's models are cached: no load to wait for, so its materials are warmed from here)
    warmSoon();
  }
  /** Exhibits taken down but not yet disposed: their materials hold their programs (three frees a program with its last
   *  material) until the warm-up has compiled their successor's, which then finds them made: a wing rebuilt with a new
   *  find while one is inside compiled every program afresh in a frame. */
  const retired: Exhibit[] = [];
  function drop(e: Exhibit) {
    const i = exhibits.indexOf(e);
    if (i < 0) return;
    exhibits.splice(i, 1);
    e.group.removeFromParent();
    if (noDraw) e.dispose();
    else retired.push(e);
    blocksChanged();
    invalidate();
    warmSoon();
  }

  // ---- the villagers ----
  interface Walker {
    look: Look;
    v3: Villager3D | null;
    /** Its render standing on the floor, facing the camera (a villager with no model), or null. */
    card: Mesh<PlaneGeometry, MeshBasicMaterial> | null;
    shadow: Mesh;
    pos: [number, number];
    was: [number, number];
    yaw: number;
    path: Walk | null;
    hop: number;
    posing: boolean;
    /** Its seat (villager3d sitAt: the model sits itself there; `pos` is its step in front), or null standing. */
    seat: Anchor | null;
  }
  const V3_SCALE = VILLAGER_H / 80;
  const villagers = new Map<Who, Walker>();
  const disc = softDisc('40,24,14', 4, false);
  disposables.push(disc);
  const shadowGeo = new CircleGeometry(4.6, 20);
  const shadowMat = decal(new MeshBasicMaterial({ map: disc, transparent: true, depthWrite: false }), 5);
  disposables.push(shadowGeo, shadowMat);
  let followed: Who = 'A', v3Pending = 0;
  const cardGeo = new PlaneGeometry(1, 1).translate(0, 0.5, 0), cardTex = new TextureLoader();
  disposables.push(cardGeo);
  /** Its card (a villager with no model: `look.card`, its render) put up, or the one it had taken down. */
  function card3(who: Who, w: Walker, on = true) {
    if (w.card) (scene.remove(w.card), w.card.material.map?.dispose(), w.card.material.dispose(), (w.card = null));
    const c = w.look.card;
    if (!on || !c || w.look.has3d) return;
    const mat = new MeshBasicMaterial({ alphaTest: 0.5, side: DoubleSide, visible: false });
    const m = new Mesh(cardGeo, mat);
    m.scale.set(VILLAGER_H * c.aspect, VILLAGER_H, 1);
    m.userData.who = who;
    w.card = m;
    scene.add(m);
    const look = w.look;
    cardTex.loadAsync(c.url).then((t) => {
      if (disposed || w.card !== m || w.look !== look) return t.dispose();
      t.colorSpace = SRGBColorSpace;
      mat.map = t;
      mat.visible = true;
      mat.needsUpdate = true;
      place(w);
      invalidate();
    }, () => {});
  }
  /** Its 3D model up (`look`), placed where the walker is, once loaded; over the one it had (another look: swapped in
   *  place, the walk and the seat going on with the new model). */
  function model3(who: Who, w: Walker, look: Look) {
    const p = look.create(who.charCodeAt(0) * 0.7);
    if (p) v3Pending++;
    if (p) void p.finally(() => v3Pending--).then((v) => {
      if (disposed || villagers.get(who) !== w || w.look !== look) return v.dispose();
      w.v3?.dispose();
      w.v3 = v;
      v.group.scale.setScalar(V3_SCALE);
      v.lift(0.32);
      v.group.traverse((n) => (n.userData.who = who));
      // (where it stands first: one already seated sits down from its step, not from the middle of the floor)
      v.group.position.set(w.pos[0], 0, w.pos[1]);
      v.group.rotation.set(0, w.yaw, 0);
      scene.add(v.group);
      w.posing = true;
      place(w);
      invalidate();
    }, () => {});
  }
  function villager(who: Who, look: Look | null) {
    const was = villagers.get(who);
    if (was && look && was.look.key !== look.key) {
      // another look (theirs or mine changed): the model swapped where it is
      was.look = look;
      // (to a villager with no model: its card in the model's place)
      if (!look.has3d && was.v3) (scene.remove(was.v3.group), was.v3.dispose(), (was.v3 = null));
      card3(who, was);
      return model3(who, was, look);
    }
    if (was && !look) {
      scene.remove(was.shadow);
      if (was.v3) (scene.remove(was.v3.group), was.v3.dispose());
      card3(who, was, false);
      villagers.delete(who);
      invalidate();
    }
    if (!look || villagers.has(who)) return;
    const shadow = new Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.renderOrder = 2;
    const w: Walker = { look, v3: null, card: null, shadow, pos: [0, 50], was: [0, 50], yaw: Math.PI, path: null, hop: 0, posing: true, seat: null };
    villagers.set(who, w);
    scene.add(shadow);
    card3(who, w);
    model3(who, w, look);
    place(w);
    invalidate();
  }
  /** Where a villager is on the floor: seated, its seat's middle (its body there), else where it stands. */
  const spotOf = (w: Walker): [number, number] => {
    const a = w.seat;
    if (!a) return w.pos;
    const out = a.depth * 0.45;
    return [a.x + Math.sin(a.yaw) * out, a.z + Math.cos(a.yaw) * out];
  };
  function place(w: Walker) {
    const [sx, sz] = spotOf(w);
    w.shadow.position.set(sx, 0.15, sz);
    if (w.card) {
      // standing where it is (seated: on its seat's middle, a little sunk), turned to the camera about its upright
      const lift = w.hop ? Math.max(0, Math.sin(Math.min(1, (now() - w.hop) / 420) * Math.PI)) * 4 : 0;
      w.card.position.set(sx, w.seat ? Math.max(0, w.seat.y - VILLAGER_H * 0.3) : lift, sz);
      w.card.rotation.set(0, Math.atan2(camera.position.x - sx, camera.position.z - sz), 0);
    }
    if (!w.v3) return;
    // on its seat: the model sits down there itself (the group is its own till it gets up)
    if (w.seat) return w.v3.sitAt(w.seat);
    if (w.v3.seat()) w.v3.sitAt(null);
    const lift = w.hop ? Math.max(0, Math.sin(Math.min(1, (now() - w.hop) / 420) * Math.PI)) * 4 : 0;
    w.v3.group.position.set(w.pos[0], lift, w.pos[1]);
    w.v3.group.rotation.set(0, w.yaw, 0);
  }
  /** A villager drawn or not (another's, in another room). */
  function shownIn(w: Walker, on: boolean) {
    w.shadow.visible = on;
    if (w.v3) w.v3.group.visible = on;
    if (w.card) w.card.visible = on;
  }
  function walk(who: Who, pts: readonly Pt[], p: { from?: Pt; ago?: number; ms?: number } = {}): number {
    const w = villagers.get(who);
    if (!w || !pts.length) return 0;
    const from: Pt = p.from ?? [w.pos[0], w.pos[1]];
    const { lens, total } = walkLens(from, pts);
    const ms = p.ms ?? (total / PACE) * 1000;
    w.seat = null;
    w.path = { from, pts: [...pts], t0: now() - (p.ago ?? 0), ms: Math.max(1, ms), lens, total };
    invalidate();
    return ms;
  }
  const headV = new Vector3();
  function headPoint(who: Who): [number, number, number] | null {
    const w = villagers.get(who);
    if (!w) return null;
    const hb = w.v3?.head();
    if (hb) {
      w.v3!.group.updateMatrixWorld(true);
      const p = hb.getWorldPosition(headV);
      return [p.x, p.y + VILLAGER_H * 0.5, p.z];
    }
    return [w.pos[0], VILLAGER_H, w.pos[1]];
  }
  let lastV = 0;
  function stepVillager(w: Walker, t: number, camMoved: boolean): boolean {
    const dt = lastV ? Math.min(100, t - lastV) : 16;
    let busy = false;
    if (w.path) {
      const a = along(w.path!, t);
      w.pos = a.p;
      if (Math.hypot(a.d[0], a.d[1]) > 0.01) w.yaw += wrapAngle(Math.atan2(a.d[0], a.d[1]) - w.yaw) * Math.min(1, (14 * dt) / 1000);
      if (a.done) w.path = null;
      busy = true;
    } else if (!w.seat && fp.on && w === villagers.get(followed) && Math.abs(wrapAngle(fp.yaw - w.yaw)) > 0.01) {
      // at its eyes, standing: its (hidden) body turns to where it looks (seated, only its head: the seat holds the body);
      // never the other way round (the head is the finger's alone: rooms/firstPerson.ts)
      w.yaw += wrapAngle(fp.yaw - w.yaw) * Math.min(1, (6 * dt) / 1000);
      busy = true;
    }
    const moved = Math.hypot(w.pos[0] - w.was[0], w.pos[1] - w.was[1]);
    w.was = [w.pos[0], w.pos[1]];
    if (w.hop && t - w.hop < 1400) busy = true;
    else w.hop = 0;
    place(w);
    const v = w.v3;
    if (!v) return busy;
    const state = w.seat ? (w.seat.lie ? 'lie' : 'sit') : w.path ? 'walk' : 'idle';
    if (v.state() !== state) w.posing = true;
    v.set(state);
    if (busy || w.posing || camMoved) {
      const going = v.step(t, moved / V3_SCALE, w.path ? (moved / V3_SCALE / Math.max(1, dt)) * 1000 : 0);
      w.posing = busy || going;
      return w.posing;
    }
    return v.blink(t) && false;
  }

  // ---- the camera: NH's room view, each room framed for the phone (camera.ts: its view's width, the target's range in
  //      it, a dead zone either side), following my villager ----
  const DEF = { az: 0, pitch: (PITCH * Math.PI) / 180, k: 1 };
  const PITCH_MIN = (28 * Math.PI) / 180, PITCH_MAX = (78 * Math.PI) / 180;
  const K_MIN = 0.45, K_MAX = 1.8;
  const view = { ...DEF };
  const target = new Vector3(0, 8, 50);
  /** Where the camera means to look (camera.ts follow: still while my villager is within the dead zone), the target
   *  eased toward it. */
  let goal: Pt = [0, 50];
  let baseD = 400, shiftY = 0;
  let easing: { from: typeof DEF; t0: number } | null = null;
  let gesturing = false;
  /** A finger's last on the room (a drag, a pinch, a tap, the first person's look): the exhibits' rest after REST_MS. */
  let lastInput = now();
  const touched = () => void (lastInput = now());
  /** The camera's tuning (the dev hook's): a view width a room, a pitch for all. */
  const camTune: { viewW: Partial<Record<RoomId, number>>; pitch?: number } = { viewW: {} };
  /** The room drawn's framing on this screen. */
  let framed: Framing = framingOf('hall');
  function frameRoom() {
    const W = canvas.clientWidth || 1, H = canvas.clientHeight || 1;
    framed = framingOf(cur, { W, H, top: insets.top, bottom: insets.bottom }, { viewW: camTune.viewW[cur], pitch: camTune.pitch });
    baseD = Math.min(900, Math.max(180, framed.d));
  }
  function fit() {
    const W = canvas.clientWidth || 1, H = canvas.clientHeight || 1;
    // (only a new size: setting the canvas's width clears it even to the same value, and the ResizeObserver's first
    // look, the same size, came before the first frame drew: museum.spec's "never blank", 2 in 10)
    const pr = renderer.getPixelRatio();
    if (canvas.width !== Math.floor(W * pr) || canvas.height !== Math.floor(H * pr)) renderer.setSize(W, H, false);
    camera.aspect = W / H;
    const bandH = Math.max(0.3 * H, H - insets.top - insets.bottom);
    frameRoom();
    shiftY = H / 2 - (insets.top + bandH / 2);
    camera.setViewOffset(W, H, 0, shiftY, W, H);
    camera.updateProjectionMatrix();
    aim();
    // (setSize cleared the canvas: drawn again now, not at the next due frame; see draw)
    if (frames) draw();
    invalidate();
  }
  /** Where the room's camera is (before the first person's glide moves it): the cutaway's, so the walls it cut stay
   *  cut all the way down to the eyes. */
  const orbitPos = new Vector3();
  function aim() {
    const d = baseD * view.k;
    camera.position.set(
      target.x + Math.sin(view.az) * Math.cos(view.pitch) * d,
      target.y + Math.sin(view.pitch) * d,
      target.z + Math.cos(view.az) * Math.cos(view.pitch) * d
    );
    camera.lookAt(target);
    // the depth range only as deep as the museum: the near plane just over its tallest top (everything lies below the
    // camera, at least ~its drop away in depth), the far one past its farthest corner; at the default view ~40× the
    // depth buffer's precision of a fixed near of 4, so floors and what lies on them never fight. At the eyes (the
    // first person's glide toward them) the near plane comes in to a unit, the far one still past every corner
    camera.far = d + 700;
    orbitPos.copy(camera.position);
    fp.apply(camera, FOV, Math.max(4, 0.8 * (camera.position.y - TOP)), target);
    cutaway();
  }
  /** The camera on my villager at (x, z) at once (a room entered, a put): as near as the room's framing lets. */
  function snapCamera(x: number, z: number) {
    frameRoom();
    goal = enter(framed, [x, z]);
    target.set(goal[0], 8, goal[1]);
    aim();
  }
  /** The cutaway: which walls go. Two rules, each stable as one walks (a wall changes only when the camera turns past
   *  it or one passes it, never back and forth on the way):
   *  - a wall on the far side of its line from where the camera looks (its line between the camera and the target)
   *    and turned toward the camera (not edge on: |its normal · the view| ≥ 0.25, the rooms' rule) goes: the front
   *    walls, as NH cuts them, and whichever face the camera once it turns;
   *  - a wall that would hide my villager (its box on a line from the camera to my villager's feet or head, a body's
   *    width either side, the box grown by the walk of a fade) goes: a jamb as one walks through an opening. It comes
   *    back only once clear by a wider margin.
   *  A wall going or coming fades (wallFade), not pops. */
  const cutWas = new Float64Array(9).fill(NaN);
  function cutaway() {
    for (const m of fpvOnly) m.visible = fp.mix > 0 && shell.get(m)!.includes(cur);
    for (const d of doorways) doorwayShown(d);
    // (at the eyes, inside: every wall stands)
    if (fp.inside()) {
      for (const wm of walls) wm.cut = false;
      cutWas[0] = NaN;
      return;
    }
    const cx = orbitPos.x, cy = orbitPos.y, cz = orbitPos.z;
    const me = villagers.get(followed), mp = me && spotOf(me);
    const mx = mp ? mp[0] : 0, mz = mp ? mp[1] : 0, has = mp ? 1 : 0;
    // (the same camera, target and villager as last time: the same walls; a second pass changes nothing, as a cut
    // wall's wider margin only keeps it cut)
    const w = cutWas;
    if (w[0] === cx && w[1] === cy && w[2] === cz && w[3] === target.x && w[4] === target.z && w[5] === view.az && w[6] === mx && w[7] === mz && w[8] === has) return;
    w[0] = cx, w[1] = cy, w[2] = cz, w[3] = target.x, w[4] = target.z, w[5] = view.az, w[6] = mx, w[7] = mz, w[8] = has;
    const vx = Math.sin(view.az), vz = Math.cos(view.az), sx = vz, sz = -vx;
    for (const wm of walls) {
      const { a, b } = wm.w, dx = b[0] - a[0], dz = b[1] - a[1], dl = Math.hypot(dx, dz);
      const nx = -dz / dl, nz = dx / dl;
      const camSide = (cx - a[0]) * nx + (cz - a[1]) * nz, targetSide = (target.x - a[0]) * nx + (target.z - a[1]) * nz;
      let cut = camSide * targetSide < 0 && Math.abs(nx * vx + nz * vz) >= 0.25;
      if (!cut && mp) {
        // (ahead by its fade's walk, WALL_FADE at PACE (~10): gone by the time one's behind it; kept a little longer;
        // a body's width either side, its feet and its head)
        const m = wm.cut ? 18 : 12, o = wm.box;
        cut = hides(o, m, cx, cy, cz, mx - sx * 4, 2, mz - sz * 4) || hides(o, m, cx, cy, cz, mx - sx * 4, VILLAGER_H, mz - sz * 4) ||
          hides(o, m, cx, cy, cz, mx + sx * 4, 2, mz + sz * 4) || hides(o, m, cx, cy, cz, mx + sx * 4, VILLAGER_H, mz + sz * 4);
      }
      wm.cut = cut;
    }
  }
  /** Whether a wall's box (grown by m) crosses the segment from (ax, ay, az) to (bx, by, bz): the slab test in its frame
   *  (into it: a turn by −yaw about its middle). Nothing allocated: it runs for each wall on every frame the view moves. */
  function hides(o: WallMesh['box'], m: number, ax: number, ay: number, az: number, bx: number, by: number, bz: number): boolean {
    const ux = ax - o.x, uz = az - o.z, wx = bx - o.x, wz = bz - o.z;
    slabT0 = 0;
    slabT1 = 1;
    return slab(ux * o.c - uz * o.s, wx * o.c - wz * o.s, -o.l - m, o.l + m) && slab(ay, by, 0, o.h + m) &&
      slab(ux * o.s + uz * o.c, wx * o.s + wz * o.c, -o.t - m, o.t + m);
  }
  let slabT0 = 0, slabT1 = 1;
  /** One axis of the slab test: the segment p0 → p1 within lo … hi narrows [slabT0, slabT1]; false once it's empty. */
  function slab(p0: number, p1: number, lo: number, hi: number): boolean {
    const d = p1 - p0;
    if (Math.abs(d) < 1e-9) return p0 >= lo && p0 <= hi;
    const u = (lo - p0) / d, v = (hi - p0) / d;
    slabT0 = Math.max(slabT0, Math.min(u, v));
    slabT1 = Math.min(slabT1, Math.max(u, v));
    return slabT0 <= slabT1;
  }
  /** The walls faded toward what the cutaway wants (WALL_FADE ms either way: dithered, alphaHash, so they stay opaque
   *  and unsorted; hidden once out, solid once in). Whether one is still fading (the frame goes on). */
  function wallFade(dt: number, snap: boolean): boolean {
    let busy = false;
    for (const wm of walls) {
      const to = wm.cut ? 0 : 1;
      if (wm.fade === to) continue;
      wm.fade = snap ? to : to ? Math.min(1, wm.fade + dt / WALL_FADE) : Math.max(0, wm.fade - dt / WALL_FADE);
      const mid = wm.fade > 0 && wm.fade < 1;
      for (const m of wm.mats) {
        if (m.alphaHash !== mid) {
          m.alphaHash = mid;
          m.needsUpdate = true;
        }
        m.opacity = wm.fade;
      }
      wallShown(wm);
      if (mid) busy = true;
    }
    return busy;
  }
  /** A wall drawn while it's of the room one's in: its slab while not all faded out, its foot while not all in. */
  function wallShown(wm: WallMesh) {
    wm.mesh.visible = wm.here && wm.fade > 0;
    if (wm.trim) wm.trim.visible = wm.mesh.visible;
    wm.kick.visible = wm.here && wm.fade < 1;
    for (const d of doorways) if (d.jambs.includes(wm)) doorwayShown(d);
  }

  // ---- the room drawn: the one my villager is in (held a band past a doorway, a while between changes), changed
  //      inside a dip of the screen to its colour (the screen's: onDip), never on a put (at once: the e2e's) ----
  const SWAP_BAND = 10, SWAP_GAP = 400, DIP_OUT = 150;
  let held: RoomId = 'hall', swapAt = -Infinity, dipT: ReturnType<typeof setTimeout> | undefined, dipping = false;
  let onDip: ((color: string | null) => void) | null = null;
  /** Only the room one is in shown: its shell, its walls, its exhibits (frame), its look. */
  function showRoom() {
    for (const [o, ws] of shell) o.visible = ws.includes(cur) && (!o.userData.fpv || fp.mix > 0);
    for (const wm of walls) {
      wm.here = wm.rooms.includes(cur);
      // (a cut wall's foot: the room's own face inside, stone toward the next room as toward the outside)
      const ms = wm.kick.material as Material[];
      wm.sides.forEach((r, k) => (ms[4 + k] = r === cur ? wallMat[wingOfRoom(r)] : capMat));
      wallShown(wm);
    }
    for (const d of doorways) doorwayShown(d);
    outMat.color.setHex(lookNow().bg);
    for (const wm of walls) for (const m of wm.mats) if (m.userData.of === outMat) m.color.copy(outMat.color);
  }
  /** Into room `w` now: its look, its shell, the camera on my villager there at once (`gap`: the next change only a
   *  while after). */
  function toRoom(w: RoomId, gap = true) {
    clearTimeout(dipT);
    if (dipping) onDip?.(null);
    dipping = false;
    if (w === cur) return;
    cur = w;
    if (gap) swapAt = now();
    relight();
    showRoom();
    const me = villagers.get(followed);
    if (me) snapCamera(...spotOf(me));
    else frameRoom();
    snapWalls = true;
    invalidate();
  }
  /** Through a doorway: the screen dips to the room's colour, the room changes inside the dip, then it lifts. */
  function dip() {
    dipping = true;
    onDip?.(`#${new Color(LOOK[wingOfRoom(held)].bg).lerp(new Color(PORTAL[wingOfRoom(held)]), 0.45).getHexString()}`);
    dipT = setTimeout(() => {
      if (disposed) return;
      dipping = false;
      if (held !== cur) toRoom(held);
      onDip?.(null);
    }, DIP_OUT);
  }

  // ---- night (the garden's glass goes dark, the lamps warmer) ----
  function night(n: number) {
    nightN = Math.max(0, Math.min(1, n));
    // (the lamps take over: look.ts lookAt)
    relight();
    // the garden's glass: its sky and palms dusk-blue, its grass with them
    wallMat.bug.color.set(0xffffff).lerp(NIGHT_GLASS, nightN * 0.75);
    for (const wm of walls) for (const m of wm.mats) if (m.userData.of === wallMat.bug) m.color.copy(wallMat.bug.color);
    grassMat.color.set(0xffffff).lerp(NIGHT_GLASS, nightN * 0.35);
    // (the glass roof dusk-blue as its walls)
    ceilMats[2].color.set(CEIL_DAY[2]).lerp(NIGHT_GLASS, nightN * 0.75);
    for (const e of exhibits) e.night(nightN);
    invalidate();
  }
  const NIGHT_GLASS = new Color(0x2c3358);

  // ---- taps ----
  const ray = new Raycaster();
  const toNdc = (cx: number, cy: number) => screen.aim(ray, cx, cy);
  const floorPlane = new Plane(new Vector3(0, 1, 0), 0);
  const hitV = new Vector3();
  function hit(cx: number, cy: number): Hit | null {
    toNdc(cx, cy);
    // at the eyes: what's tapped is nearer than the first wall (a cornice, a lintel, the door, a ceiling) on the ray;
    // not my own villager (the camera is in its head)
    const eyes = fp.inside();
    // (only what's drawn: the room one is in; a doorway's card in either view)
    const wall = (eyes ? ray.intersectObjects(occluders, false) : ray.intersectObjects(portals, false)).find((i) => i.object.visible) ?? null, wallD = wall?.distance ?? Infinity;
    const nearer = (x: number, y: number, z: number) => !eyes || camera.position.distanceTo(hitV.set(x, y, z)) < wallD;
    // a villager (its body on screen: a box round its feet to its head)
    for (const [who, w] of villagers) {
      const [px, pz] = spotOf(w);
      if (!w.shadow.visible || (eyes && (who === followed || !inView(px, VILLAGER_H / 2, pz) || !nearer(px, VILLAGER_H / 2, pz)))) continue;
      const [fx, fy] = client(px, 0, pz), [, hy] = client(px, VILLAGER_H, pz);
      const half = Math.max(10, (fy - hy) * 0.32);
      if (cx >= fx - half && cx <= fx + half && cy >= hy - 4 && cy <= fy + 4) return { kind: 'villager', who };
    }
    // a seat (the nearest box on the ray, nearer than the first wall)
    let seat: string | null = null, seatD = Infinity;
    // (at the eyes, not the bench I'm sitting on: the ray from my head to the floor in front of it may cross its seat,
    // more so the further back the eyes sit (a human player's): a tap there is a step off it)
    const me = eyes ? villagers.get(followed) : undefined, on = me?.seat ? spotOf(me) : null;
    for (const s of seatBoxes) {
      if (s.room !== cur) continue;
      if (on && on[0] >= s.box.min.x && on[0] <= s.box.max.x && on[1] >= s.box.min.z && on[1] <= s.box.max.z) continue;
      const p = ray.ray.intersectBox(s.box, hitV), d = p ? camera.position.distanceTo(p) : Infinity;
      if (d < seatD && nearer(hitV.x, hitV.y, hitV.z)) (seat = s.id), (seatD = d);
    }
    // a creature (the nearest drawn within a finger's reach; not one behind the seat the ray meets)
    let best: { id: string; d: number } | null = null;
    for (const e of exhibits) {
      if (roomOfExhibit(e) !== cur) continue;
      const p = e.pick(project, cx, cy), at = p && e.where(p.id);
      if (p && (!best || p.d < best.d) && (!at || (nearer(at[0], at[1], at[2]) && camera.position.distanceTo(hitV.set(at[0], at[1], at[2])) < seatD))) best = p;
    }
    if (best) return { kind: 'creature', id: best.id };
    if (seat) return { kind: 'seat', id: seat };
    if (wall?.object === frontDoor) return { kind: 'door' };
    if (wall?.object.userData.portal) return through(wall.object.userData.portal.into);
    if (!ray.ray.intersectPlane(floorPlane, hitV) || camera.position.distanceTo(hitV) > wallD) {
      // a wall's foot: walk up to it (a little short, on this side); a ceiling, the sky: nowhere
      if (!wall || wall.object.userData.ceiling) return null;
      const dx = ray.ray.direction.x, dz = ray.ray.direction.z, l = Math.hypot(dx, dz) || 1;
      hitV.set(wall.point.x - (dx / l) * 4, 0, wall.point.z - (dz / l) * 4);
    }
    if (inRect(DORMAT_PAD, hitV.x, hitV.z)) return { kind: 'door' };
    if (!roomIdAt(hitV.x, hitV.z) && !walkable(nav, hitV.x, hitV.z)) return null;
    // (a room not drawn: through its doorway from here, if it has one, a step and a half in)
    const there = roomOf(hitV.x, hitV.z) ?? cur;
    if (there !== cur) return through(there);
    return { kind: 'floor', x: hitV.x, z: hitV.z };
  }
  /** A tap toward a room not drawn: a walk through the doorway between it and the room one's in, THROUGH past its line
   *  (null: none between them). */
  const THROUGH = 15;
  function through(r: RoomId): Hit | null {
    const o = OPENINGS.find((o) => (o.room === cur && o.next === r) || (o.room === r && o.next === cur));
    if (!o) return null;
    const mid = (o.from + o.to) / 2, k = (o.axis === 'x' ? roomIdAt(o.at + 5, mid) : roomIdAt(mid, o.at + 5)) === r ? 1 : -1;
    return o.axis === 'x' ? { kind: 'floor', x: o.at + k * THROUGH, z: mid } : { kind: 'floor', x: mid, z: o.at + k * THROUGH };
  }
  const DORMAT_PAD: Rect = { x0: DOORMAT.x0 - 2, x1: DOORMAT.x1 + 2, z0: DOORMAT.z0, z1: DOORMAT.z1 + 4 };

  // ---- the first person's eye: my villager's (its model's eyes), kept off the walls and what stands on the floors ----
  const eyeT = new Vector3(), eyeXZ: [number, number] = [0, 0];
  /** The floors the eye may be over: the rooms and their doorways. */
  const FLOORS: Rect[] = [
    ...ROOMS.map(({ r }) => r),
    ...OPENINGS.map((o) => (o.axis === 'x' ? { x0: o.at - 10, x1: o.at + 10, z0: o.from, z1: o.to } : { x0: o.from, x1: o.to, z0: o.at - 10, z1: o.at + 10 }))
  ];
  function headOf(w: Walker): Vector3 {
    if (w.v3) {
      w.v3.group.updateMatrixWorld(true);
      if (w.v3.eyes(eyeT)) return eyeT;
    }
    return eyeT.set(w.pos[0], VILLAGER_H * 0.7, w.pos[1]);
  }
  /** The eye's anchor (rooms/firstPerson.ts headAnchor): held once my villager is still (its idle never moves the camera). */
  const anchor = headAnchor();
  function eyeOf(w: Walker, t: number): Vector3 {
    const S = w.seat;
    eyeT.copy(anchor(t, w.path ? null : [w.pos[0], w.pos[1], w.yaw, w.posing ? 1 : 0, S ? S.yaw : -1e9], () => headOf(w)));
    clampEye(eyeT.x, eyeT.z, FLOORS, w.seat ? solidsSeated : solids, EYE_MARGIN, eyeXZ);
    eyeT.x = eyeXZ[0];
    eyeT.z = eyeXZ[1];
    return eyeT;
  }
  function firstPerson(on: boolean, snap = false) {
    if (on === fp.on) return;
    const w = villagers.get(followed);
    // (back out of its eyes, it faces where it looked)
    if (!on && w) (w.yaw = fp.yaw), (w.posing = true);
    fp.set(on, now(), w?.yaw ?? Math.PI, snap);
    invalidate();
  }

  // ---- what isn't on screen yet made ready once everything is in: its textures up a few at a time and its programs
  //      compiled, so a wing's first sight is no hitch (its hundred-odd critters' textures at once: ~100 ms) ----
  const warmed = new WeakSet<Texture>();
  let warmT: ReturnType<typeof setTimeout> | undefined, compileT: ReturnType<typeof setTimeout> | undefined;
  /** A warm-up is due or under way (the e2e's: the programs settled once it's done). */
  let warming = false;
  function warmSoon() {
    clearTimeout(warmT);
    // (a little after the last model: its exhibit's meshes made from it)
    if (!noDraw && !disposed) (warmT = setTimeout(warm, 250)), (warming = true);
  }
  /** Hidden mid-way: taken up again when shown (onVis; the tent's way), not a timer every 32 ms the whole time. */
  let warmHeld = false;
  function warm() {
    if (disposed || pending) return void (warming = !!pending);
    if (document.hidden) return void (warmHeld = true);
    const todo: Texture[] = [];
    scene.traverse((n) => {
      const ms = (n as Mesh).material;
      if (!ms) return;
      for (const m of Array.isArray(ms) ? ms : [ms]) for (const t of [(m as MeshLambertMaterial).map, (m as MeshLambertMaterial).emissiveMap]) {
        if (t && !warmed.has(t)) (warmed.add(t), todo.push(t));
      }
    });
    const step = () => {
      if (disposed) return;
      if (document.hidden) {
        // (the rest when shown: warm() again finds them)
        for (const t of todo) warmed.delete(t);
        return void (warmHeld = true);
      }
      for (const t of todo.splice(0, 8)) renderer.initTexture(t);
      if (todo.length) warmT = setTimeout(step, 32);
      else {
        // (the walls' and the fish's fading programs too: dithered, alphaHash, compiled with the rest; solid again after)
        const hashed = (on: boolean) => {
          for (const wm of walls) if (wm.fade === 0 || wm.fade === 1) for (const m of wm.mats) (m.alphaHash = on), (m.needsUpdate = true);
          for (const e of exhibits) e.dither?.(on);
        };
        // (three's compileAsync, its poll ours: three's throws in a timer once a material it waits on is disposed, the
        // room left or a fish's hour over, and never settles)
        clearTimeout(compileT);
        // (those taken down by now go once this compile is done: their programs were there for it)
        const going = retired.slice();
        // (three compiles only what's visible: every room built shown for it, so walking into one compiles nothing,
        // solid and dithered; hidden again at once, before any frame)
        const shown: Object3D[] = [];
        scene.traverse((n) => void (!n.visible && (shown.push(n), (n.visible = true))));
        const compiling = renderer.compile(scene, camera);
        hashed(true);
        for (const m of renderer.compile(scene, camera)) compiling.add(m);
        for (const n of shown) n.visible = false;
        const poll = () => {
          if (disposed) return;
          for (const m of compiling) {
            const p = (renderer.properties.get(m) as { currentProgram?: { isReady(): boolean } }).currentProgram;
            if (!p || p.isReady()) compiling.delete(m);
          }
          if (compiling.size) compileT = setTimeout(poll, 10);
          else {
            hashed(false);
            warming = false;
            for (const e of going) {
              const i = retired.indexOf(e);
              if (i >= 0) (retired.splice(i, 1), e.dispose());
            }
          }
        };
        poll();
      }
    };
    step();
  }

  // (shown again: a frame for what changed meanwhile, the warm-up taken up)
  const onVis = () => {
    if (document.hidden || disposed) return;
    invalidate();
    if (warmHeld) (warmHeld = false), warmSoon();
  };
  document.addEventListener('visibilitychange', onVis);

  // ---- the frame loop ----
  const frustum = new Frustum(), projScreen = new Matrix4();
  let frames = 0, lastT = 0;
  const cost: number[] = [];
  let ambientOn = 0;
  /** The first frame waits for the villagers' models asked for by then (up to ENTRY_HOLD_MS): their programs (skinned,
   *  ~6) compile with the hall's in that one frame, before anything shows; drawn in a frame of their own after the
   *  hall's first, they froze the room just shown (the iOS Simulator, cold: 768 ms). */
  const born = now(), holding = () => !frames && v3Pending > 0 && now() - born < ENTRY_HOLD_MS;
  const holdT = setTimeout(() => invalidate(), ENTRY_HOLD_MS + 20);
  let readyRes: () => void;
  const ready = new Promise<void>((r) => (readyRes = r));
  /** The last frame's view, rounded (frame: whether the camera moved): its angles and zoom to 4 places, its target 2. */
  const camRev = new Float64Array(5).fill(NaN);
  let snapWalls = true;
  // (the frames: a change's at the next display frame, the exhibits' alone at the ambient rate: world3d/pace.ts)
  const pace = pacer(frame);
  function invalidate() {
    if (!disposed) pace.kick();
  }
  const seen = (sp: Sphere) => frustum.intersectsSphere(sp);
  /** The scene drawn (`draws`: each time, the e2e's). Every resize of the canvas's buffer (setSize, setPixelRatio)
   *  clears it, and WebKit shows the cleared canvas (the museum's dark) until the next draw: so the buffer is resized
   *  only just before a draw, in the same task (a gesture's lighter pixel ratio, a resize). Resized after a frame's
   *  draw, the screen flashed black at each drag's start and end, and stayed so till something next drew. */
  let draws = 0;
  function draw() {
    draws++;
    if (!noDraw) renderer.render(scene, camera);
  }
  let drawn: (() => void) | null = null;
  function frame(vsync = now()) {
    // (the frame rate's pacing, せってい's, a gesture's too; the ambience's own time)
    if (disposed || holding() || !pace.due(vsync, FPS)) return;
    const t = now(), dt = lastT ? Math.min(100, t - lastT) : 16;
    let full = false;
    // the camera: eased back to NH's view, following my villager
    if (easing) {
      const k = Math.min(1, (t - easing.t0) / 400), e = cubicOut(k);
      view.az = easing.from.az + wrapAngle(DEF.az - easing.from.az) * e;
      view.pitch = easing.from.pitch + (DEF.pitch - easing.from.pitch) * e;
      view.k = easing.from.k + (DEF.k - easing.from.k) * e;
      if (k >= 1) easing = null;
      full = true;
    }
    const me = villagers.get(followed);
    // the first person: the glide, the head, the eye following my villager's (its body hidden once the camera's near)
    let fpMoved = false;
    if (me && (fp.on || fp.mix > 0)) {
      fpMoved = fp.step(t, dt, eyeOf(me, t));
      me.v3?.show(!(fp.mix > 0.5));
      if (me.card) me.card.visible = !(fp.mix > 0.5);
      if (fpMoved) full = true;
    }
    if (me) {
      // the room drawn: mine, once a band through a doorway (and a while after the last change); where my villager
      // will be at the dip's darkest, so the change lands as it gets there (at the eyes, as they cross the doorway's
      // line: its card never fills the view)
      const [hx, hz] = me.path && !me.seat ? along(me.path, t + DIP_OUT).p : spotOf(me);
      held = fp.on ? (roomIdAt(hx, hz) ?? held) : roomHeld(held, hx, hz, SWAP_BAND);
      if (held !== cur && !dipping && t - swapAt >= SWAP_GAP) dip();
    }
    if (me) {
      // (the room's framing: kept still within the dead zone, never past the room's range)
      goal = follow(framed, goal, spotOf(me));
      const f = Math.min(1, (6 * dt) / 1000);
      const dx = goal[0] - target.x, dz = goal[1] - target.z;
      if (Math.hypot(dx, dz) > 0.05) {
        target.x += dx * f;
        target.z += dz * f;
        full = true;
      }
    }
    aim();
    const r = camRev, a4 = Math.round(view.az * 1e4), p4 = Math.round(view.pitch * 1e4), k4 = Math.round(view.k * 1e4);
    const x2 = Math.round(target.x * 100), z2 = Math.round(target.z * 100);
    const camMoved = r[0] !== a4 || r[1] !== p4 || r[2] !== k4 || r[3] !== x2 || r[4] !== z2 || fpMoved;
    r[0] = a4, r[1] = p4, r[2] = k4, r[3] = x2, r[4] = z2;
    // (at once on the way in and after a jump: only a wall going as one moves fades)
    if (wallFade(dt, frames === 0 || snapWalls)) full = true;
    snapWalls = false;
    for (const [who, w] of villagers) {
      if (stepVillager(w, t, camMoved)) full = true;
      // (the others only while in the room I'm in)
      if (who !== followed) shownIn(w, (roomOf(...spotOf(w)) ?? 'hall') === cur);
    }
    lastV = t;
    if (gesturing) full = true;
    // the exhibits on screen move (at the ambient rate when nothing else does); off screen they rest (a tank, a bug:
    // the hall's view of the wings' far ends is still)
    projScreen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreen);
    let ambient = false;
    ambientOn = 0;
    // (only the room one is in: the others' exhibits hidden and resting)
    for (const e of exhibits) {
      e.group.visible = roomOfExhibit(e) === cur;
      if (!e.group.visible || !e.frame(t, dt, seen)) continue;
      ambient = true;
      ambientOn++;
    }
    // (only when it changes: three's setPixelRatio sets the canvas's size, which reallocates its buffers, every frame;
    // and before the draw, never after it: see draw)
    const dpr = gesturing ? Math.min(dprFull, DPR_MOVING) : dprFull;
    if (dpr !== renderer.getPixelRatio()) renderer.setPixelRatio(dpr);
    const c0 = now();
    draw();
    cost.push(now() - c0);
    drawn?.();
    if (cost.length > 240) cost.shift();
    frames++;
    lastT = t;
    if (frames === 1) readyRes();
    if (full) invalidate();
    // (one ambient timer at a time, and a frame for anything else in between — a tap, a load — brings it forward: two
    // chains side by side ran on together at 60 a second)
    else if (ambient) pace.later(Math.min(t - lastInput > REST_MS ? REST_FPS : AMBIENT, FPS));
  }

  fit();
  // (the next display frame: the room's caller asks for its villagers first, which the first frame waits for)
  invalidate();
  // (the first frame as soon as the floor's textures land too)
  setTimeout(() => invalidate(), 300);

  return {
    resize(i?: Insets) {
      if (i) insets = i;
      fit();
    },
    still: () => !easing && !gesturing && !pace.asked() && !fp.busy(),
    villager,
    model: (who) => (villagers.get(who)?.v3 ? villagers.get(who)!.look.key : null),
    card: (who) => !!villagers.get(who)?.card?.material.map,
    at: (who) => (villagers.get(who) ? [villagers.get(who)!.pos[0], villagers.get(who)!.pos[1]] : null),
    put(who, p, yaw) {
      const w = villagers.get(who);
      if (!w) return;
      // (put mid-walk: its way gone with it)
      w.path = null;
      w.seat = null;
      w.pos = [p[0], p[1]];
      w.was = [p[0], p[1]];
      if (yaw !== undefined) w.yaw = yaw;
      if (who === followed) {
        // (in that room at once, no dip)
        toRoom((held = roomOf(p[0], p[1]) ?? 'hall'), false);
        snapCamera(p[0], p[1]);
        snapWalls = true;
      }
      place(w);
      invalidate();
    },
    walk,
    walking: (who) => !!villagers.get(who)?.path,
    hop(who) {
      const w = villagers.get(who);
      if (!w) return;
      w.hop = now();
      w.v3?.act('hop');
      invalidate();
    },
    face(who, toward) {
      const w = villagers.get(who);
      if (!w || w.path || w.seat) return;
      w.yaw = Math.atan2(toward[0] - w.pos[0], toward[1] - w.pos[1]);
      w.posing = true;
      invalidate();
    },
    sit(who, a) {
      const w = villagers.get(who);
      if (!w || w.seat === a) return;
      w.seat = a;
      if (a) {
        w.path = null;
        w.pos = [a.from[0], a.from[1]];
        w.was = [a.from[0], a.from[1]];
        w.yaw = a.yaw;
      }
      w.posing = true;
      place(w);
      invalidate();
    },
    seated: (who) => villagers.get(who)?.seat ?? null,
    headPoint,
    follow(who) {
      followed = who;
      invalidate();
    },
    firstPerson(on, snap) {
      touched();
      firstPerson(on, snap);
    },
    look(dx, dy) {
      touched();
      fp.look(dx, dy, canvas.clientWidth);
      invalidate();
    },
    fpv: () => ({ on: fp.on, inside: fp.inside(), busy: fp.busy(), yaw: fp.yaw, pitch: fp.pitch, eye: [fp.eye.x, fp.eye.y, fp.eye.z] }),
    inView,
    orbit(dAz, dPitch) {
      touched();
      easing = null;
      view.az = wrapAngle(view.az + dAz);
      view.pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, view.pitch + dPitch));
      invalidate();
    },
    zoom(f) {
      touched();
      easing = null;
      view.k = Math.max(K_MIN, Math.min(K_MAX, view.k / f));
      invalidate();
    },
    resetView() {
      touched();
      easing = { from: { ...view }, t0: now() };
      invalidate();
    },
    isDefault: () => Math.abs(wrapAngle(view.az - DEF.az)) < 0.01 && Math.abs(view.pitch - DEF.pitch) < 0.01 && Math.abs(view.k - DEF.k) < 0.01,
    onDrawn(fn) {
      drawn = fn;
    },
    moving(on) {
      touched();
      gesturing = on;
      invalidate();
    },
    night,
    exhibit,
    drop,
    exhibits: () => exhibits,
    hit: (cx, cy) => (touched(), hit(cx, cy)),
    client,
    nav: () => nav,
    walls: () => walls.map((w) => (w.cut ? 1 : 0)).join(''),
    room: () => cur,
    onDip(fn) {
      onDip = fn;
    },
    tune({ viewW, pitch, ...over }) {
      const w = wingOfRoom(cur);
      tuned[w] = { ...tuned[w], ...over };
      // (the wings share a width: one tuned, all)
      if (viewW) for (const r of cur === 'hall' ? ['hall' as const] : ROOMS.map((q) => q.id).filter((q) => q !== 'hall')) camTune.viewW[r] = viewW;
      if (pitch) {
        camTune.pitch = pitch;
        DEF.pitch = view.pitch = (pitch * Math.PI) / 180;
      }
      relight();
      showRoom();
      const me = villagers.get(followed);
      if (me) snapCamera(...spotOf(me));
      invalidate();
    },
    kit,
    stats: () => ({ frames, draws, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, dpr: renderer.getPixelRatio(), cost: [...cost], queued: pace.asked(), ambient: ambientOn, loading: pending, warming,
      mem: [renderer.info.memory.geometries, renderer.info.memory.textures, renderer.info.programs?.length ?? 0] }),
    ready,
    dispose() {
      // (once: a second call ended an ended renderer, and the room's failure path may follow its own)
      if (disposed) return;
      disposed = true;
      pace.stop();
      document.removeEventListener('visibilitychange', onVis);
      clearTimeout(warmT);
      clearTimeout(compileT);
      clearTimeout(holdT);
      clearTimeout(dipT);
      for (const e of [...exhibits, ...retired]) e.dispose();
      for (const w of villagers.values()) w.v3?.dispose();
      for (const d of disposables) d.dispose();
      scene.traverse((n) => {
        const m = n as Mesh;
        if (m.isMesh) m.geometry.dispose();
      });
      models.release();
      endRenderer(renderer);
    }
  };
}
