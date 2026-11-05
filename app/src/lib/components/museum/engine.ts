// The museum in 3D (docs/design.md "The museum"): three.js, loaded only when the museum opens (its own chunk). NH's
// museum on one floor (plan.ts): the entrance hall (its stone floor, NH's lobby brick, a red carpet to each wing, the
// owl's medallion, Blathers at his desk), the bug wing to the left (a garden under glass:
// garden.ts) and the aquarium to the right (its tanks: aquarium.ts). NH's floors and walls (scripts/world3d-models.ts
// --museum: static/room/museum/tex/), lit warm. The camera is the rooms' (tent/engine.ts): NH's steep view, a drag turns
// it, a pinch zooms; here it follows my villager through the rooms, and a wall between it and my villager is cut away.
// The villagers are NH's own 3D models (villager3d/), walking as in the rooms. Drawn on demand: the full rate while
// something moves (a walk, the camera), the exhibits' ambient rate (30 a second) while only they do, and nothing while
// nothing on screen does. Plain TS; the screen (MuseumRoom.svelte) drives it.
import {
  AmbientLight, Box3, BoxGeometry, CanvasTexture, CircleGeometry, Color, CylinderGeometry, DirectionalLight, Frustum, Group, HemisphereLight,
  Matrix4, Mesh, Sphere, MeshBasicMaterial, MeshLambertMaterial, PerspectiveCamera, Plane, PlaneGeometry, Raycaster, RepeatWrapping,
  Scene, SRGBColorSpace, TextureLoader, Vector3, WebGLRenderer, type Material, type Object3D, type Texture
} from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { createVillager, type Villager3D } from '../villager3d/villager3d.ts';
import type { Anchor } from '../villager3d/seats3d.ts';
import { drawOff } from '../../ui-state/testMode.ts';
import { decal } from './geometry.ts';
import { frameRate } from '#lib/store/frameRate.svelte.ts';
import { pacer } from '../world3d/pace.ts';
import { plainImages } from '../world3d/gltf.ts';
import M from './models.json' with { type: 'json' };
import { modelBounds } from '../world3d/models3d.ts';
import { along, roomScreen, walkLens, type Walk } from '../rooms/view.ts';
import { EYE_MARGIN, camAz, clampEye, firstPerson as createFirstPerson, headAnchor, wrapAngle } from '../rooms/firstPerson.ts';
import {
  BUG_WING, DESK, DOOR_HALF, DOORMAT, FISH_WING, HALL, HALL_H, OPENING, WALLS, WING_H, inRect, navOf, roomAt, walkable, wallEnds, wingAt,
  type Nav, type Pt, type Rect, type Wall, type Wing
} from './plan.ts';

/** A villager's height (model units: the rooms', tent/engine.ts VILLAGER_H). */
const VILLAGER_H = 16;
/** Walking pace (model units a second: the rooms', tent/engine.ts PACE). */
export const PACE = 45;
/** The rooms' camera: degrees down from level, the lens. */
const PITCH = 47;
const FOV = 32;
/** How much of the floor the default view shows across (model units): about fifteen tiles. */
const VIEW_W = 92;
const DPR_MAX = 2, DPR_MOVING = 1.5;
/** The exhibits' rate (a second) while only they move. */
const AMBIENT = 30;
/** How long a wall takes to fade out or in (ms), the cutaway's. */
const WALL_FADE = 220;

export type Who = 'A' | 'B' | 'G';
export interface Look { model: string | null; id: string }
export interface Insets { top: number; bottom: number }
export type Hit = { kind: 'villager'; who: Who } | { kind: 'creature'; id: string } | { kind: 'seat'; id: string } | { kind: 'door' } | { kind: 'floor'; x: number; z: number };

/** One wing's exhibits (aquarium.ts, garden.ts): its group, what stands on the floor (the walk keeps off it), its frame
 *  (t ms; `seen`: whether a sphere is in the camera's view: what isn't rests), whether something on screen moved (the
 *  ambient rate), the creature nearest client px (its id, its distance in px). */
export interface Exhibit {
  group: Group;
  /** The room it's in (the first person sees a wing only through its opening: hidden behind the walls, it rests). */
  wing: Wing;
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
  model(name: string): Promise<GLTF | null>;
  /** A prop placed by its own bounds (models.json): its middle over (x, z), its foot on the floor, turned, scaled. */
  prop(name: string, x: number, z: number, o?: { yaw?: number; s?: number; y?: number; parent?: Object3D }): Group;
  /** A catch's model (static/room/world3d/critters/<kind>/<id>.glb). */
  critter(kind: 'fish' | 'bugs', id: string): Promise<GLTF | null>;
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
  kit: Kit;
  stats(): { frames: number; draws: number; calls: number; tris: number; dpr: number; cost: number[]; queued: boolean; ambient: number; loading: number; warming: boolean; mem: [number, number, number] };
  ready: Promise<void>;
  dispose(): void;
}

const now = () => performance.now();
/** The top of the tallest thing in the museum (the hall's cornice): the near plane comes down to just over it. */
const TOP = 70;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/** A soft round shadow's texture. */
function softDisc(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(32, 32, 4, 32, 32, 31);
  r.addColorStop(0, 'rgba(40,24,14,0.42)');
  r.addColorStop(1, 'rgba(40,24,14,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

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
  g.fillStyle = '#2f2a2a';
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

/** A red carpet with a gold border (its length along v). */
function carpet(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#8f2430';
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#d5ad55';
  g.fillRect(4, 0, 3, 64);
  g.fillRect(57, 0, 3, 64);
  g.fillStyle = '#741c26';
  g.fillRect(9, 0, 1, 64);
  g.fillRect(54, 0, 1, 64);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapT = RepeatWrapping;
  return t;
}

/** A sign over an opening (NH's lobby plaques: the wing's name). */
function plaque(text: string): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#5b3f2a';
  g.beginPath();
  g.roundRect(2, 2, 252, 60, 12);
  g.fill();
  g.strokeStyle = '#d5ad55';
  g.lineWidth = 4;
  g.stroke();
  g.fillStyle = '#f6ecd2';
  g.font = '700 30px "Zen Maru Gothic", "Hiragino Maru Gothic ProN", system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 128, 34);
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

export function createMuseum(canvas: HTMLCanvasElement, o: { base: string; world: string }): Museum {
  const noDraw = drawOff();
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  const dprFull = noDraw ? 1 : Math.min(DPR_MAX, window.devicePixelRatio || 1);
  renderer.setPixelRatio(dprFull);
  renderer.outputColorSpace = SRGBColorSpace;
  const scene = new Scene();
  scene.background = new Color(0x1d1712);
  const camera = new PerspectiveCamera(FOV, 1, 4, 3000);
  const screen = roomScreen(camera, canvas), { client, project, inView } = screen;
  let insets: Insets = { top: 0, bottom: 0 };
  let disposed = false;
  /** The first-person view (rooms/firstPerson.ts), at the followed villager's eyes. */
  const fp = createFirstPerson();

  // the warm light of NH's museum: a soft sky over a warm floor bounce, a key from the upper front left
  const hemi = new HemisphereLight(0xfff1dc, 0x8a6a4c, 1.9);
  const key = new DirectionalLight(0xfff0d8, 1.6);
  key.position.set(-80, 200, 140);
  const amb = new AmbientLight(0xffe8cc, 0.35);
  scene.add(hemi, key, amb);

  // ---- what the rooms are made of ----
  const texLoader = new TextureLoader();
  const texCache = new Map<string, Texture>();
  const disposables: { dispose(): void }[] = [];
  function tex(name: string, repeat: [number, number] = [1, 1]): Texture {
    const k = `${name}|${repeat}`;
    let t = texCache.get(k);
    if (!t) {
      t = texLoader.load(`${o.base}tex/${name}.webp`, () => invalidate(), undefined, () => {});
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
  const loader = plainImages(new GLTFLoader());
  loader.setMeshoptDecoder(MeshoptDecoder);
  const glbs = new Map<string, Promise<GLTF | null>>();
  let pending = 0;
  const load = (url: string) => {
    let p = glbs.get(url);
    if (!p) {
      pending++;
      p = loader.loadAsync(url).then((g) => {
        // NH's soft look, the island's: Lambert, a little lit by its own colour (no metal, no specular)
        g.scene.traverse((n) => {
          const m = n as Mesh;
          if (!m.isMesh) return;
          const s = m.material as Material & { map?: Texture | null; color?: Color; alphaTest?: number; transparent?: boolean; opacity?: number; emissiveMap?: Texture | null };
          const l = new MeshLambertMaterial({
            name: s.name, map: s.map ?? null, color: s.color ?? new Color(0xffffff), alphaTest: s.alphaTest ?? 0, side: s.side,
            transparent: !!s.transparent, opacity: s.opacity ?? 1, depthWrite: !s.transparent, emissiveMap: s.emissiveMap ?? null,
            emissive: new Color(s.emissiveMap ? 0xffe2a8 : 0x000000), emissiveIntensity: s.emissiveMap ? 0.6 : 0
          });
          s.dispose();
          m.material = l;
        });
        return g;
      }, (e: unknown) => {
        console.warn('museum: model', url, e);
        return null;
      }).finally(() => {
        pending--;
        if (!pending) warmSoon();
        invalidate();
      });
      glbs.set(url, p);
    }
    return p;
  };
  const MODELS = M.models as Record<string, { min: number[]; max: number[]; v: string }>;
  const model = (name: string) => (MODELS[name] ? load(`${o.base}${name}.glb?v=${MODELS[name].v}`) : Promise.resolve(null));
  function prop(name: string, x: number, z: number, p: { yaw?: number; s?: number; y?: number; parent?: Object3D } = {}): Group {
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
      body.position.set(-(b.min[0] + b.max[0]) / 2, -b.min[1], -(b.min[2] + b.max[2]) / 2);
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
      return b ? load(`${o.world}${name}.glb?v=${b.v}`) : Promise.resolve(null);
    },
    islandBounds: (name) => modelBounds(name)
  };

  // ---- the floors ----
  const floor = (r: Rect, mat: Material, y = 0) => {
    const m = new Mesh(new PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set((r.x0 + r.x1) / 2, y, (r.z0 + r.z1) / 2);
    m.userData.floor = true;
    scene.add(m);
    return m;
  };
  const tw = (r: Rect, u: number): [number, number] => [(r.x1 - r.x0) / u, (r.z1 - r.z0) / u];
  floor(HALL, lambert({ map: tex('hall-floor', tw(HALL, 40)) }));
  floor(FISH_WING, lambert({ map: tex('fish-floor', tw(FISH_WING, 40)), color: 0xb9c3d6 }));
  const grassTex = grass();
  grassTex.repeat.set(...tw(BUG_WING, 50));
  disposables.push(grassTex);
  const grassMat = lambert({ map: grassTex });
  floor(BUG_WING, grassMat);
  // the openings' thresholds (through the walls)
  for (const x of [HALL.x0, HALL.x1]) floor({ x0: x - 2, x1: x + 2, z0: OPENING.z0, z1: OPENING.z1 }, lambert({ map: tex('hall-floor', [0.1, 0.75]), layer: 1 }), 0.01);
  // the red carpets: the door to the medallion, and on to each opening
  const carpetTex = carpet();
  disposables.push(carpetTex);
  const runner = (x: number, z: number, len: number, yaw: number) => {
    const t = carpetTex.clone();
    t.repeat.set(1, len / 16);
    t.needsUpdate = true;
    disposables.push(t);
    const m = new Mesh(new PlaneGeometry(16, len), lambert({ map: t, layer: 2 }));
    m.rotation.set(-Math.PI / 2, 0, yaw);
    m.position.set(x, 0.05, z);
    m.userData.floor = true;
    scene.add(m);
  };
  runner(0, 45, 50, 0);
  runner(-38, 10, 44, Math.PI / 2);
  runner(38, 10, 44, Math.PI / 2);
  // the owl's medallion in the middle
  const medTex = medallion();
  disposables.push(medTex);
  const med = new Mesh(new CircleGeometry(22, 48), lambert({ map: medTex, layer: 3 }));
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
    fish: lambert({ map: tex('fish-wall', [6, 1.5]), color: 0xcdd6e8 }),
    bug: lambert({ map: tex('bug-outside', [1, 1]) })
  };
  const outMat = lambert({ color: 0x2a211a });
  const capMat = lambert({ color: 0xe9dcc2 });
  const trim = lambert({ color: 0xc9a24a });
  /** A wall: its slab and its cornice, their own materials, its box (the cutaway's test: its middle, its yaw's cos and
   *  sin, its half length, height and thickness), whether it's cut away and how far faded in (1: all there). */
  interface WallMesh {
    w: Wall;
    mesh: Mesh;
    trim: Mesh | null;
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
  const T = 3;
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
    const side = (k: number) => roomAt(mx + nx * k * 4, mz + nz * k * 4);
    // BoxGeometry's faces: +x, −x, +y, −y, +z, −z; turned by the yaw below, its local +z is the wall's normal (nx, nz)
    // (the bug wing's backdrop: one picture across each wall, its sky and palms, not tiled)
    const geo = new BoxGeometry(s.len, wl.h, T);
    const mats = new Map<Material, MeshLambertMaterial>();
    const matFor = (r: Wing | null) => own(mats, r ? wallMat[r] : outMat), cap = own(mats, capMat);
    const mesh = new Mesh(geo, [cap, cap, cap, cap, matFor(side(1)), matFor(side(-1))]);
    mesh.position.set(s.x, wl.h / 2, s.z);
    mesh.rotation.y = s.yaw;
    scene.add(mesh);
    // a cornice round the hall's top, gold (NH's lobby trim: a little proud of the wall, its corners one piece's)
    let trimMesh: Mesh | null = null;
    if (wl.h === HALL_H) {
      const t = span(i, 2.5, 1);
      trimMesh = new Mesh(new BoxGeometry(t.len, 2.5, 5), own(mats, trim));
      trimMesh.position.set(t.x, wl.h + 1.2, t.z);
      trimMesh.rotation.y = t.yaw;
      scene.add(trimMesh);
    }
    walls.push({
      w: wl, mesh, trim: trimMesh, mats: [...mats.values()], cut: false, fade: 1,
      box: { x: s.x, z: s.z, c: Math.cos(s.yaw), s: Math.sin(s.yaw), l: s.len / 2, h: wl.h + 2.5, t: T / 2 }
    });
  });

  // ---- the first person's (fpvOnly: shown only then): the ceilings, facing down (from above, their backs: culled, so the
  //      glide down past them shows nothing), a lintel over each opening from the wings' height up to the hall's
  //      cornice, the front doorway's lintel and its closed door ----
  const fpvOnly: Mesh[] = [];
  const fpvMesh = (m: Mesh) => {
    m.visible = false;
    fpvOnly.push(m);
    scene.add(m);
    return m;
  };
  const CORNICE = HALL_H + 2.45;
  const ceil = (r: Rect, y: number, m: Material) => {
    const c = fpvMesh(new Mesh(new PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0), m));
    c.rotation.x = Math.PI / 2;
    c.position.set((r.x0 + r.x1) / 2, y, (r.z0 + r.z1) / 2);
    c.userData.ceiling = true;
  };
  // (unlit: the lights all shine down, so a lit ceiling was a muddy brown; each its own colour, dimmed at night)
  const cofferTex = coffers(), roofTex = glassRoof();
  cofferTex.repeat.set(...tw(HALL, 20));
  roofTex.repeat.set(...tw(BUG_WING, 40));
  const CEIL_DAY = [0xe6dccb, 0x1c2a42, 0xffffff];
  const ceilMats = [new MeshBasicMaterial({ map: cofferTex }), new MeshBasicMaterial(), new MeshBasicMaterial({ map: roofTex })];
  ceilMats.forEach((m, i) => m.color.set(CEIL_DAY[i]));
  disposables.push(cofferTex, roofTex, ...ceilMats);
  ceil(HALL, CORNICE, ceilMats[0]);
  // (the wings' from the far face of the hall's wall: the lintels' undersides lie at WING_H too, over the wall)
  ceil({ ...FISH_WING, x0: FISH_WING.x0 + T / 2 }, WING_H, ceilMats[1]);
  ceil({ ...BUG_WING, x1: BUG_WING.x1 - T / 2 }, WING_H, ceilMats[2]);
  const lintel = (x0: number, x1: number, y0: number, z0: number, z1: number) => {
    const b = fpvMesh(new Mesh(new BoxGeometry(x1 - x0, CORNICE - y0, z1 - z0), lambert({ map: tex('hall-wall', [Math.max(x1 - x0, z1 - z0) / 30, (CORNICE - y0) / 32]) })));
    b.position.set((x0 + x1) / 2, (CORNICE + y0) / 2, (z0 + z1) / 2);
  };
  for (const x of [HALL.x0, HALL.x1]) lintel(x - T / 2, x + T / 2, WING_H, OPENING.z0, OPENING.z1);
  const DOOR_H = 32;
  lintel(-DOOR_HALF, DOOR_HALF, DOOR_H, HALL.z1 - T / 2, HALL.z1 + T / 2);
  const doorT = doorTex();
  disposables.push(doorT);
  const frontDoor = fpvMesh(new Mesh(new PlaneGeometry(DOOR_HALF * 2, DOOR_H), lambert({ map: doorT })));
  frontDoor.position.set(0, DOOR_H / 2, HALL.z1 + 0.5);
  frontDoor.rotation.y = Math.PI;
  /** What a tap's ray stops at, at the eyes: the walls, their cornices, the lintels, the door, the ceilings. */
  const occluders: Object3D[] = [...walls.flatMap((w) => (w.trim ? [w.mesh, w.trim] : [w.mesh])), ...fpvOnly];
  /** Each wing's opening in the hall's wall (the first person sees into a wing only through it). */
  const PORTAL: Record<'bug' | 'fish', Box3> = {
    bug: new Box3(new Vector3(HALL.x0 - T / 2, 0, OPENING.z0), new Vector3(HALL.x0 + T / 2, CORNICE, OPENING.z1)),
    fish: new Box3(new Vector3(HALL.x1 - T / 2, 0, OPENING.z0), new Vector3(HALL.x1 + T / 2, CORNICE, OPENING.z1))
  };
  const wingSeen: Record<Wing, boolean> = { hall: true, bug: true, fish: true };

  // ---- the hall's furnishing: banners, the plaques, Blathers' desk ----
  const wood0 = lambert({ color: 0x7a5234 });
  const redTex = tex('hall-red', [1, 2]);
  for (const x of [-34, 34]) {
    const b = new Mesh(new PlaneGeometry(14, 36), lambert({ map: redTex }));
    b.position.set(x, 30, HALL.z0 + 2);
    scene.add(b);
  }
  // each wing's sign by its opening (NH's lobby signs: on a post, facing whoever comes in)
  const postGeo = new CylinderGeometry(0.7, 0.7, 14, 8);
  disposables.push(postGeo);
  for (const [text, x] of [['こんちゅう', HALL.x0 + 14], ['さかな', HALL.x1 - 14]] as const) {
    const t = plaque(text);
    disposables.push(t);
    const board = new Mesh(new PlaneGeometry(18, 4.5), new MeshBasicMaterial({ map: t, transparent: true }));
    board.position.set(x, 15, OPENING.z1 + 6);
    board.rotation.x = -0.35;
    const post = new Mesh(postGeo, wood0);
    post.position.set(x, 7, OPENING.z1 + 5.6);
    scene.add(board, post);
  }
  // Blathers' desk at the back of the hall, NH's: wood, a green top; Blathers behind it (curator.ts, an exhibit)
  const desk = new Group();
  const wood = wood0;
  const top = new Mesh(new BoxGeometry(DESK.x1 - DESK.x0, 1.6, DESK.z1 - DESK.z0), lambert({ color: 0x3f6b4a }));
  top.position.y = DESK.h - 0.8;
  const body = new Mesh(new BoxGeometry(DESK.x1 - DESK.x0 - 2, DESK.h - 1.6, DESK.z1 - DESK.z0 - 2), wood);
  body.position.y = (DESK.h - 1.6) / 2;
  desk.add(top, body);
  desk.position.set((DESK.x0 + DESK.x1) / 2, 0, (DESK.z0 + DESK.z1) / 2);
  scene.add(desk);
  const BLOCKS: Rect[] = [{ x0: DESK.x0 - 1, x1: DESK.x1 + 1, z0: DESK.z0, z1: DESK.z1 }, { x0: DESK.x0 - 2, x1: DESK.x1 + 2, z0: HALL.z0, z1: DESK.z0 }];
  for (const [x, z] of [[-50, -40], [50, -40], [-50, 58], [50, 58]] as const) {
    prop(x < 0 ? 'heliconia' : 'anthurium', x, z, { s: x < 0 ? 1.6 : 2.4 });
    BLOCKS.push({ x0: x - 4, x1: x + 4, z0: z - 4, z1: z + 4 });
  }

  // ---- the exhibits ----
  const exhibits: Exhibit[] = [];
  let nav = navOf(BLOCKS);
  /** What stands on the floors (the walk keeps off it; the first person's eye too). */
  let solids: Rect[] = BLOCKS;
  /** The same less the seats (a seated villager's eye is over its own), and the seats to tap (their boxes). */
  let solidsSeated: Rect[] = BLOCKS;
  let seatBoxes: { id: string; box: Box3 }[] = [];
  function blocksChanged() {
    solidsSeated = [...BLOCKS, ...exhibits.flatMap((x) => x.blocks)];
    const seats = exhibits.flatMap((x) => x.seats ?? []);
    nav = navOf((solids = [...solidsSeated, ...seats]));
    seatBoxes = seats.map((r) => ({ id: r.id, box: new Box3(new Vector3(r.x0, 0, r.z0), new Vector3(r.x1, r.h, r.z1)) }));
  }
  function exhibit(e: Exhibit) {
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
  const disc = softDisc();
  disposables.push(disc);
  const shadowGeo = new CircleGeometry(4.6, 20);
  const shadowMat = decal(new MeshBasicMaterial({ map: disc, transparent: true, depthWrite: false }), 5);
  disposables.push(shadowGeo, shadowMat);
  let followed: Who = 'A';
  function villager(who: Who, look: Look | null) {
    const was = villagers.get(who);
    if (was && (!look || was.look.id !== look.id)) {
      scene.remove(was.shadow);
      if (was.v3) (scene.remove(was.v3.group), was.v3.dispose());
      villagers.delete(who);
      invalidate();
    }
    if (!look || villagers.has(who)) return;
    const shadow = new Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.renderOrder = 2;
    const w: Walker = { look, v3: null, shadow, pos: [0, 50], was: [0, 50], yaw: Math.PI, path: null, hop: 0, posing: true, seat: null };
    villagers.set(who, w);
    scene.add(shadow);
    if (look.model) void createVillager(look.id, look.model, who.charCodeAt(0) * 0.7).then((v) => {
      if (disposed || villagers.get(who) !== w) return v.dispose();
      w.v3 = v;
      v.group.scale.setScalar(V3_SCALE);
      v.lift(0.32);
      v.group.traverse((n) => (n.userData.who = who));
      // (where it stands first: one already seated sits down from its step, not from the middle of the floor)
      v.group.position.set(w.pos[0], 0, w.pos[1]);
      v.group.rotation.set(0, w.yaw, 0);
      scene.add(v.group);
      place(w);
      invalidate();
    }, () => {});
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
    if (!w.v3) return;
    // on its seat: the model sits down there itself (the group is its own till it gets up)
    if (w.seat) return w.v3.sitAt(w.seat);
    if (w.v3.seat()) w.v3.sitAt(null);
    const lift = w.hop ? Math.max(0, Math.sin(Math.min(1, (now() - w.hop) / 420) * Math.PI)) * 4 : 0;
    w.v3.group.position.set(w.pos[0], lift, w.pos[1]);
    w.v3.group.rotation.set(0, w.yaw, 0);
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

  // ---- the camera: NH's room view, following my villager ----
  const DEF = { az: 0, pitch: (PITCH * Math.PI) / 180, k: 1 };
  const PITCH_MIN = (28 * Math.PI) / 180, PITCH_MAX = (78 * Math.PI) / 180;
  const K_MIN = 0.45, K_MAX = 1.8;
  const view = { ...DEF };
  const target = new Vector3(0, 8, 50);
  let baseD = 400, shiftY = 0;
  let easing: { from: typeof DEF; t0: number } | null = null;
  let gesturing = false;
  function fit() {
    const W = canvas.clientWidth || 1, H = canvas.clientHeight || 1;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    const bandH = Math.max(0.3 * H, H - insets.top - insets.bottom);
    // VIEW_W across the floor at the target, within the screen's width
    baseD = VIEW_W / 2 / (Math.tan(((FOV / 2) * Math.PI) / 180) * camera.aspect);
    baseD = Math.min(900, Math.max(180, baseD));
    shiftY = H / 2 - (insets.top + bandH / 2);
    camera.setViewOffset(W, H, 0, shiftY, W, H);
    camera.updateProjectionMatrix();
    aim();
    // (setSize cleared the canvas: drawn again now, not at the next due frame; see draw)
    if (frames) draw();
    invalidate();
  }
  /** The camera's heading as it is now (the view's az, or the eyes' in the first person). */
  let az = DEF.az;
  /** Where the room's camera is (before the first person's glide moves it): the cutaway's, so the walls it cut stay
   *  cut all the way down to the eyes. */
  const orbitPos = new Vector3();
  const azV = new Vector3();
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
    az = fp.mix > 0 ? camAz(camera, azV) : view.az;
    cutaway();
  }
  /** Where the camera looks for a villager at (x, z): a little ahead of it, kept over the floors (the view's lower edge
   *  never far past the front walls: the hall's is nearer than the wings'; nor past the side walls). */
  function camSpot(x: number, z: number): [number, number] {
    const inHall = Math.abs(x) < HALL.x1 + 10;
    return [Math.max(BUG_WING.x0 + 70, Math.min(FISH_WING.x1 - 70, x)), Math.max(inHall ? -30 : -60, Math.min((inHall ? HALL.z1 : FISH_WING.z1) - 84, z - 4))];
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
    for (const m of fpvOnly) m.visible = fp.mix > 0;
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
      wm.mesh.visible = wm.fade > 0;
      if (wm.trim) wm.trim.visible = wm.fade > 0;
      if (mid) busy = true;
    }
    return busy;
  }

  // ---- night (the garden's glass goes dark, the lamps warmer) ----
  let nightN = 0;
  function night(n: number) {
    nightN = Math.max(0, Math.min(1, n));
    hemi.intensity = 1.9 - 0.6 * nightN;
    hemi.color.set(0xfff1dc).lerp(new Color(0xd6c9e8), nightN * 0.5);
    key.intensity = 1.6 - 0.8 * nightN;
    key.color.set(0xfff0d8).lerp(new Color(0xffcf96), nightN);
    // the garden's glass: its sky and palms dusk-blue, its grass with them
    wallMat.bug.color.set(0xffffff).lerp(NIGHT_GLASS, nightN * 0.75);
    for (const wm of walls) for (const m of wm.mats) if (m.userData.of === wallMat.bug) m.color.copy(wallMat.bug.color);
    grassMat.color.set(0xffffff).lerp(NIGHT_GLASS, nightN * 0.35);
    // (the ceilings dimmer, the glass roof dusk-blue as its walls)
    ceilMats.forEach((m, i) => m.color.set(CEIL_DAY[i]).multiplyScalar(i === 2 ? 1 : 1 - 0.35 * nightN));
    ceilMats[2].color.lerp(NIGHT_GLASS, nightN * 0.75);
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
    const wall = eyes ? (ray.intersectObjects(occluders, false)[0] ?? null) : null, wallD = wall?.distance ?? Infinity;
    const nearer = (x: number, y: number, z: number) => !eyes || camera.position.distanceTo(hitV.set(x, y, z)) < wallD;
    // a villager (its body on screen: a box round its feet to its head)
    for (const [who, w] of villagers) {
      const [px, pz] = spotOf(w);
      if (eyes && (who === followed || !inView(px, VILLAGER_H / 2, pz) || !nearer(px, VILLAGER_H / 2, pz))) continue;
      const [fx, fy] = client(px, 0, pz), [, hy] = client(px, VILLAGER_H, pz);
      const half = Math.max(10, (fy - hy) * 0.32);
      if (cx >= fx - half && cx <= fx + half && cy >= hy - 4 && cy <= fy + 4) return { kind: 'villager', who };
    }
    // a seat (the nearest box on the ray, nearer than the first wall)
    let seat: string | null = null, seatD = Infinity;
    for (const s of seatBoxes) {
      const p = ray.ray.intersectBox(s.box, hitV), d = p ? camera.position.distanceTo(p) : Infinity;
      if (d < seatD && nearer(hitV.x, hitV.y, hitV.z)) (seat = s.id), (seatD = d);
    }
    // a creature (the nearest drawn within a finger's reach; not one behind the seat the ray meets)
    let best: { id: string; d: number } | null = null;
    for (const e of exhibits) {
      if (!wingSeen[e.wing]) continue;
      const p = e.pick(project, cx, cy), at = p && e.where(p.id);
      if (p && (!best || p.d < best.d) && (!at || (nearer(at[0], at[1], at[2]) && camera.position.distanceTo(hitV.set(at[0], at[1], at[2])) < seatD))) best = p;
    }
    if (best) return { kind: 'creature', id: best.id };
    if (seat) return { kind: 'seat', id: seat };
    if (wall?.object === frontDoor) return { kind: 'door' };
    if (!ray.ray.intersectPlane(floorPlane, hitV) || camera.position.distanceTo(hitV) > wallD) {
      // a wall's foot: walk up to it (a little short, on this side); a ceiling, the sky: nowhere
      if (!wall || wall.object.userData.ceiling) return null;
      const dx = ray.ray.direction.x, dz = ray.ray.direction.z, l = Math.hypot(dx, dz) || 1;
      hitV.set(wall.point.x - (dx / l) * 4, 0, wall.point.z - (dz / l) * 4);
    }
    if (inRect(DORMAT_PAD, hitV.x, hitV.z)) return { kind: 'door' };
    if (!roomAt(hitV.x, hitV.z) && !walkable(nav, hitV.x, hitV.z)) return null;
    return { kind: 'floor', x: hitV.x, z: hitV.z };
  }
  const DORMAT_PAD: Rect = { x0: DOORMAT.x0 - 2, x1: DOORMAT.x1 + 2, z0: DOORMAT.z0, z1: DOORMAT.z1 + 4 };

  // ---- the first person's eye: my villager's (its model's eyes), kept off the walls and what stands on the floors ----
  const eyeT = new Vector3(), eyeXZ: [number, number] = [0, 0];
  /** The floors the eye may be over: the rooms and the openings through the hall's walls. */
  const FLOORS: Rect[] = [HALL, BUG_WING, FISH_WING, ...[HALL.x0, HALL.x1].map((x) => ({ x0: x - 10, x1: x + 10, z0: OPENING.z0, z1: OPENING.z1 }))];
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
  function warm() {
    if (disposed || pending) return void (warming = !!pending);
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
      for (const t of todo.splice(0, 8)) renderer.initTexture(t);
      if (todo.length) warmT = setTimeout(step, 32);
      else {
        // (the walls' and the fish's fading programs too: dithered, alphaHash, compiled with the rest; solid again after)
        const hashed = (on: boolean) => {
          for (const wm of walls) if (wm.fade === 0 || wm.fade === 1) for (const m of wm.mats) (m.alphaHash = on), (m.needsUpdate = true);
          for (const e of exhibits) e.dither?.(on);
        };
        hashed(true);
        // (three's compileAsync, its poll ours: three's throws in a timer once a material it waits on is disposed, the
        // room left or a fish's hour over, and never settles)
        clearTimeout(compileT);
        // (those taken down by now go once this compile is done: their programs were there for it)
        const going = retired.slice();
        const compiling = renderer.compile(scene, camera);
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

  // ---- the frame loop ----
  const frustum = new Frustum(), projScreen = new Matrix4();
  let frames = 0, lastT = 0;
  const cost: number[] = [];
  let ambientOn = 0;
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
    if (disposed || !pace.due(vsync, frameRate.fps)) return;
    const t = now(), dt = lastT ? Math.min(100, t - lastT) : 16;
    let full = false;
    // the camera: eased back to NH's view, following my villager
    if (easing) {
      const k = Math.min(1, (t - easing.t0) / 400), e = ease(k);
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
      if (fpMoved) full = true;
    }
    if (me) {
      // (kept over the floors: near the front door the camera stays back, not over the dark outside)
      const [mx, mz] = spotOf(me), [fx, fz] = camSpot(mx, mz);
      const f = Math.min(1, (6 * dt) / 1000);
      const dx = fx - target.x, dz = fz - target.z;
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
    for (const w of villagers.values()) if (stepVillager(w, t, camMoved)) full = true;
    lastV = t;
    if (gesturing) full = true;
    // the exhibits on screen move (at the ambient rate when nothing else does); off screen they rest (a tank, a bug:
    // the hall's view of the wings' far ends is still)
    projScreen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreen);
    let ambient = false;
    ambientOn = 0;
    // (at the eyes a wing shows only through its opening: one behind the hall's walls is hidden and rests)
    const inside = fp.inside(), eyeWing = inside ? wingAt(fp.eye.x) : null;
    wingSeen.bug = !inside || eyeWing === 'bug' || frustum.intersectsBox(PORTAL.bug);
    wingSeen.fish = !inside || eyeWing === 'fish' || frustum.intersectsBox(PORTAL.fish);
    for (const e of exhibits) {
      e.group.visible = wingSeen[e.wing];
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
    else if (ambient) pace.later(Math.min(AMBIENT, frameRate.fps));
  }

  fit();
  frame();
  // (the first frame as soon as the floor's textures land too)
  setTimeout(() => invalidate(), 300);

  return {
    resize(i?: Insets) {
      if (i) insets = i;
      fit();
    },
    still: () => !easing && !gesturing && !pace.asked() && !fp.busy(),
    villager,
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
        target.set(...camSpot(p[0], p[1]).flatMap((v, i) => (i ? [8, v] : [v])) as [number, number, number]);
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
    firstPerson,
    look(dx, dy) {
      fp.look(dx, dy, canvas.clientWidth);
      invalidate();
    },
    fpv: () => ({ on: fp.on, inside: fp.inside(), busy: fp.busy(), yaw: fp.yaw, pitch: fp.pitch, eye: [fp.eye.x, fp.eye.y, fp.eye.z] }),
    inView,
    orbit(dAz, dPitch) {
      easing = null;
      view.az = wrapAngle(view.az + dAz);
      view.pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, view.pitch + dPitch));
      invalidate();
    },
    zoom(f) {
      easing = null;
      view.k = Math.max(K_MIN, Math.min(K_MAX, view.k / f));
      invalidate();
    },
    resetView() {
      easing = { from: { ...view }, t0: now() };
      invalidate();
    },
    isDefault: () => Math.abs(wrapAngle(view.az - DEF.az)) < 0.01 && Math.abs(view.pitch - DEF.pitch) < 0.01 && Math.abs(view.k - DEF.k) < 0.01,
    onDrawn(fn) {
      drawn = fn;
    },
    moving(on) {
      gesturing = on;
      invalidate();
    },
    night,
    exhibit,
    drop,
    exhibits: () => exhibits,
    hit,
    client,
    nav: () => nav,
    walls: () => walls.map((w) => (w.cut ? 1 : 0)).join(''),
    kit,
    stats: () => ({ frames, draws, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, dpr: renderer.getPixelRatio(), cost: [...cost], queued: pace.asked(), ambient: ambientOn, loading: pending, warming,
      mem: [renderer.info.memory.geometries, renderer.info.memory.textures, renderer.info.programs?.length ?? 0] }),
    ready,
    dispose() {
      disposed = true;
      pace.stop();
      clearTimeout(warmT);
      clearTimeout(compileT);
      for (const e of [...exhibits, ...retired]) e.dispose();
      for (const w of villagers.values()) w.v3?.dispose();
      for (const d of disposables) d.dispose();
      scene.traverse((n) => {
        const m = n as Mesh;
        if (m.isMesh) m.geometry.dispose();
      });
      renderer.dispose();
      // (the GPU's memory back now, not at the context's collection: the island's comes up next; the tent's and the
      // island's way)
      renderer.forceContextLoss();
    }
  };
}
