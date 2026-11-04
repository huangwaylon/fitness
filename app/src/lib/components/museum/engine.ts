// The museum in 3D (docs/design.md "The museum"): three.js, loaded only when the museum opens (its own chunk). NH's
// museum on one floor (plan.ts): the entrance hall (its stone floor, NH's lobby brick, a red carpet to each wing, the
// owl's medallion, pillars at the openings, Blathers at his desk), the bug wing to the left (a garden under glass:
// garden.ts) and the aquarium to the right (its tanks: aquarium.ts). NH's floors and walls (scripts/world3d-models.ts
// --museum: static/room/museum/tex/), lit warm. The camera is the rooms' (tent/engine.ts): NH's steep view, a drag turns
// it, a pinch zooms; here it follows my villager through the rooms, and a wall between it and my villager is cut away.
// The villagers are NH's own 3D models (villager3d/), walking as in the rooms. Drawn on demand: the full rate while
// something moves (a walk, the camera), the exhibits' ambient rate (30 a second) while only they do, and nothing while
// nothing on screen does. Plain TS; the screen (MuseumRoom.svelte) drives it.
import {
  AmbientLight, BoxGeometry, CanvasTexture, CircleGeometry, Color, CylinderGeometry, DirectionalLight, Frustum, Group, HemisphereLight,
  Matrix4, Mesh, Sphere, MeshBasicMaterial, MeshLambertMaterial, PerspectiveCamera, Plane, PlaneGeometry, Raycaster, RepeatWrapping,
  Scene, SRGBColorSpace, TextureLoader, Vector2, Vector3, WebGLRenderer, type Material, type Object3D, type Texture
} from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { createVillager, type Villager3D } from '../villager3d/villager3d.ts';
import { drawOff } from '../../ui-state/testMode.ts';
import M from './models.json' with { type: 'json' };
import { modelBounds } from '../world3d/models3d.ts';
import {
  BUG_WING, DOORMAT, FISH_WING, HALL, HALL_H, OPENING, WALLS, inRect, navOf, roomAt, walkable,
  type Nav, type Pt, type Rect, type Wall, type Wing
} from './plan.ts';

/** A villager's height (model units: the rooms', tent/engine.ts VILLAGER_H). */
const VILLAGER_H = 16;
/** Walking pace (model units a second: the rooms'). */
export const PACE = 30;
/** The rooms' camera: degrees down from level, the lens. */
const PITCH = 47;
const FOV = 32;
/** How much of the floor the default view shows across (model units): about fifteen tiles. */
const VIEW_W = 92;
const DPR_MAX = 2, DPR_MOVING = 1.5;
/** The exhibits' rate (a second) while only they move. */
const AMBIENT = 30;

export type Who = 'A' | 'B' | 'G';
export interface Look { model: string | null; id: string }
export interface Insets { top: number; bottom: number }
export type Hit = { kind: 'villager'; who: Who } | { kind: 'creature'; id: string } | { kind: 'door' } | { kind: 'floor'; x: number; z: number };

/** One wing's exhibits (aquarium.ts, garden.ts): its group, what stands on the floor (the walk keeps off it), its frame
 *  (t ms; `seen`: whether a sphere is in the camera's view: what isn't rests), whether something on screen moved (the
 *  ambient rate), the creature nearest client px (its id, its distance in px). */
export interface Exhibit {
  group: Group;
  blocks: readonly Rect[];
  frame(t: number, dt: number, seen: (s: Sphere) => boolean): boolean;
  pick(project: (x: number, y: number, z: number) => [number, number] | null, cx: number, cy: number): { id: string; d: number } | null;
  /** A creature's world point (the card and the e2e), or null. */
  where(id: string): [number, number, number] | null;
  /** The species on show (ids). */
  shown(): string[];
  night(n: number): void;
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
  lambert(o: { color?: number; map?: Texture | null; transparent?: boolean; opacity?: number }): MeshLambertMaterial;
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
  headPoint(who: Who): [number, number, number] | null;
  /** Whose villager the camera follows (mine). */
  follow(who: Who): void;
  orbit(dAz: number, dPitch: number): void;
  zoom(f: number): void;
  resetView(): void;
  isDefault(): boolean;
  moving(on: boolean): void;
  night(n: number): void;
  /** The wings' exhibits (each built once its data is in: MuseumRoom), and one taken down (rebuilt with new finds). */
  exhibit(e: Exhibit): void;
  drop(e: Exhibit): void;
  exhibits(): readonly Exhibit[];
  hit(cx: number, cy: number): Hit | null;
  client(x: number, y: number, z: number): [number, number];
  /** The walk grid (the floors less what stands on them). */
  nav(): Nav;
  kit: Kit;
  stats(): { frames: number; calls: number; tris: number; dpr: number; cost: number[]; queued: boolean; ambient: number; loading: number; mem: [number, number, number] };
  ready: Promise<void>;
  dispose(): void;
}

const now = () => performance.now();
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

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
  let insets: Insets = { top: 0, bottom: 0 };
  let disposed = false;

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
  const lambert = (p: { color?: number; map?: Texture | null; transparent?: boolean; opacity?: number }) => {
    const m = new MeshLambertMaterial({ color: p.color ?? 0xffffff, map: p.map ?? null, ...(p.transparent ? { transparent: true, opacity: p.opacity ?? 1, depthWrite: false } : {}) });
    disposables.push(m);
    return m;
  };
  const loader = new GLTFLoader();
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
  for (const x of [HALL.x0, HALL.x1]) floor({ x0: x - 2, x1: x + 2, z0: OPENING.z0, z1: OPENING.z1 }, lambert({ map: tex('hall-floor', [0.1, 0.75]) }), 0.01);
  // the red carpets: the door to the medallion, and on to each opening
  const carpetTex = carpet();
  disposables.push(carpetTex);
  const runner = (x: number, z: number, len: number, yaw: number) => {
    const t = carpetTex.clone();
    t.repeat.set(1, len / 16);
    t.needsUpdate = true;
    disposables.push(t);
    const m = new Mesh(new PlaneGeometry(16, len), lambert({ map: t }));
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
  const med = new Mesh(new CircleGeometry(22, 48), lambert({ map: medTex }));
  med.rotation.x = -Math.PI / 2;
  med.position.set(0, 0.08, 10);
  med.userData.floor = true;
  scene.add(med);
  // the doormat inside the front door (a tap on it goes back out)
  const mat = new Mesh(new PlaneGeometry(DOORMAT.x1 - DOORMAT.x0, DOORMAT.z1 - DOORMAT.z0 - 1), lambert({ color: 0x6b4a33 }));
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(0, 0.1, (DOORMAT.z0 + DOORMAT.z1) / 2);
  mat.userData.door = true;
  scene.add(mat);

  // ---- the walls: each a slab, each side the look of the room it faces (the outside's dark), its top a cap ----
  const wallMat: Record<Wing, Material> = {
    hall: lambert({ map: tex('hall-wall', [4, 2]) }),
    fish: lambert({ map: tex('fish-wall', [6, 1.5]), color: 0xcdd6e8 }),
    bug: lambert({ map: tex('bug-outside', [1, 1]) })
  };
  const outMat = lambert({ color: 0x2a211a });
  const capMat = lambert({ color: 0xe9dcc2 });
  interface WallMesh { w: Wall; mesh: Mesh; fade: number }
  const walls: WallMesh[] = [];
  const T = 3;
  for (const wl of WALLS) {
    const dx = wl.b[0] - wl.a[0], dz = wl.b[1] - wl.a[1], len = Math.hypot(dx, dz);
    const yaw = Math.atan2(-dz, dx);
    // its two sides: +z of the slab (its local frame) and −z, each facing a room or the outside
    const nx = -dz / len, nz = dx / len;
    const mx = (wl.a[0] + wl.b[0]) / 2, mz = (wl.a[1] + wl.b[1]) / 2;
    const side = (s: number) => roomAt(mx + nx * s * 4, mz + nz * s * 4);
    // BoxGeometry's faces: +x, −x, +y, −y, +z, −z; turned by the yaw below, its local +z is the wall's normal (nx, nz)
    // (the bug wing's backdrop: one picture across each wall, its sky and palms, not tiled)
    const geo = new BoxGeometry(len + T, wl.h, T);
    const matFor = (r: Wing | null) => (r ? wallMat[r] : outMat);
    const mesh = new Mesh(geo, [capMat, capMat, capMat, capMat, matFor(side(1)), matFor(side(-1))]);
    mesh.position.set(mx, wl.h / 2, mz);
    mesh.rotation.y = yaw;
    mesh.userData.wall = true;
    scene.add(mesh);
    walls.push({ w: wl, mesh, fade: 1 });
  }
  // a cornice round the hall's top, gold (NH's lobby trim)
  const trim = lambert({ color: 0xc9a24a });
  /** Each trim and its wall (cut away with it: the camera's cutaway, each frame). */
  const trims: [Mesh, WallMesh][] = [];
  for (const wl of WALLS.slice(0, 7)) {
    const dx = wl.b[0] - wl.a[0], dz = wl.b[1] - wl.a[1], len = Math.hypot(dx, dz);
    const m = new Mesh(new BoxGeometry(len + 4, 2.5, 5), trim);
    m.position.set((wl.a[0] + wl.b[0]) / 2, wl.h + 1.2, (wl.a[1] + wl.b[1]) / 2);
    m.rotation.y = Math.atan2(-dz, dx);
    const wm = walls.find((x) => x.w === wl);
    if (wm) trims.push([m, wm]);
    scene.add(m);
  }

  // ---- the hall's furnishing: pillars at the door and the openings, banners, the plaques, Blathers' desk ----
  const pillarMat = lambert({ color: 0xece2cd });
  const pillarGeo = new CylinderGeometry(3.4, 3.8, HALL_H - 4, 16);
  disposables.push(pillarGeo);
  for (const [x, z] of [[-56, OPENING.z0 - 4], [-56, OPENING.z1 + 4], [56, OPENING.z0 - 4], [56, OPENING.z1 + 4]] as const) {
    const p = new Mesh(pillarGeo, pillarMat);
    p.position.set(x, (HALL_H - 4) / 2, z);
    scene.add(p);
  }
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
  // Blathers' desk at the back of the hall, NH's: wood, a green top; Blathers behind it
  const desk = new Group();
  const wood = wood0;
  const top = new Mesh(new BoxGeometry(44, 1.6, 12), lambert({ color: 0x3f6b4a }));
  top.position.y = 7.8;
  const body = new Mesh(new BoxGeometry(42, 7, 10), wood);
  body.position.y = 3.5;
  desk.add(top, body);
  desk.position.set(0, 0, -30);
  scene.add(desk);
  prop('blathers', 0, -38, { s: 1.5 });
  const BLOCKS: Rect[] = [{ x0: -23, x1: 23, z0: -36, z1: -24 }, { x0: -24, x1: 24, z0: -50, z1: -36 }];
  for (const [x, z] of [[-50, -40], [50, -40], [-50, 58], [50, 58]] as const) {
    prop(x < 0 ? 'heliconia' : 'anthurium', x, z, { s: x < 0 ? 1.6 : 2.4 });
    BLOCKS.push({ x0: x - 4, x1: x + 4, z0: z - 4, z1: z + 4 });
  }

  // ---- the exhibits ----
  const exhibits: Exhibit[] = [];
  let nav = navOf(BLOCKS);
  function exhibit(e: Exhibit) {
    exhibits.push(e);
    scene.add(e.group);
    nav = navOf([...BLOCKS, ...exhibits.flatMap((x) => x.blocks)]);
    e.night(nightN);
    invalidate();
  }
  function drop(e: Exhibit) {
    const i = exhibits.indexOf(e);
    if (i < 0) return;
    exhibits.splice(i, 1);
    e.dispose();
    nav = navOf([...BLOCKS, ...exhibits.flatMap((x) => x.blocks)]);
    invalidate();
  }

  // ---- the villagers ----
  interface Walker {
    look: Look;
    v3: Villager3D | null;
    shadow: Mesh;
    pos: [number, number];
    was: [number, number];
    yaw: number;
    path: { from: Pt; pts: Pt[]; t0: number; ms: number; lens: number[]; total: number } | null;
    hop: number;
    posing: boolean;
  }
  const V3_SCALE = VILLAGER_H / 80;
  const villagers = new Map<Who, Walker>();
  const disc = softDisc();
  disposables.push(disc);
  const shadowGeo = new CircleGeometry(4.6, 20);
  const shadowMat = new MeshBasicMaterial({ map: disc, transparent: true, depthWrite: false });
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
    const w: Walker = { look, v3: null, shadow, pos: [0, 50], was: [0, 50], yaw: Math.PI, path: null, hop: 0, posing: true };
    villagers.set(who, w);
    scene.add(shadow);
    if (look.model) void createVillager(look.id, look.model, who.charCodeAt(0) * 0.7).then((v) => {
      if (disposed || villagers.get(who) !== w) return v.dispose();
      w.v3 = v;
      v.group.scale.setScalar(V3_SCALE);
      v.lift(0.32);
      v.group.traverse((n) => (n.userData.who = who));
      scene.add(v.group);
      place(w);
      invalidate();
    }, () => {});
    place(w);
    invalidate();
  }
  function place(w: Walker) {
    w.shadow.position.set(w.pos[0], 0.15, w.pos[1]);
    if (!w.v3) return;
    const lift = w.hop ? Math.max(0, Math.sin(Math.min(1, (now() - w.hop) / 420) * Math.PI)) * 4 : 0;
    w.v3.group.position.set(w.pos[0], lift, w.pos[1]);
    w.v3.group.rotation.set(0, w.yaw, 0);
  }
  function walkLens(from: Pt, pts: readonly Pt[]) {
    const lens: number[] = [];
    let a = from, total = 0;
    for (const p of pts) {
      const l = Math.hypot(p[0] - a[0], p[1] - a[1]);
      lens.push(l);
      total += l;
      a = p;
    }
    return { lens, total };
  }
  function walk(who: Who, pts: readonly Pt[], p: { from?: Pt; ago?: number; ms?: number } = {}): number {
    const w = villagers.get(who);
    if (!w || !pts.length) return 0;
    const from: Pt = p.from ?? [w.pos[0], w.pos[1]];
    const { lens, total } = walkLens(from, pts);
    const ms = p.ms ?? (total / PACE) * 1000;
    w.path = { from, pts: [...pts], t0: now() - (p.ago ?? 0), ms: Math.max(1, ms), lens, total };
    invalidate();
    return ms;
  }
  function along(w: Walker, t: number): { p: [number, number]; d: [number, number]; done: boolean } {
    const P = w.path!;
    const k = Math.max(0, Math.min(1, (t - P.t0) / P.ms));
    let d = k * P.total, a: Pt = P.from;
    for (let i = 0; i < P.pts.length; i++) {
      const b = P.pts[i];
      if (d <= P.lens[i] || i === P.pts.length - 1) {
        const f = P.lens[i] ? Math.min(1, d / P.lens[i]) : 1;
        return { p: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], d: [b[0] - a[0], b[1] - a[1]], done: k >= 1 };
      }
      d -= P.lens[i];
      a = b;
    }
    return { p: [P.from[0], P.from[1]], d: [0, 0], done: true };
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
      const a = along(w, t);
      w.pos = a.p;
      if (Math.hypot(a.d[0], a.d[1]) > 0.01) w.yaw += wrapAngle(Math.atan2(a.d[0], a.d[1]) - w.yaw) * Math.min(1, (14 * dt) / 1000);
      if (a.done) w.path = null;
      busy = true;
    }
    const moved = Math.hypot(w.pos[0] - w.was[0], w.pos[1] - w.was[1]);
    w.was = [w.pos[0], w.pos[1]];
    if (w.hop && t - w.hop < 1400) busy = true;
    else w.hop = 0;
    place(w);
    const v = w.v3;
    if (!v) return busy;
    const state = w.path ? 'walk' : 'idle';
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
    invalidate();
  }
  function aim() {
    const d = baseD * view.k;
    camera.position.set(
      target.x + Math.sin(view.az) * Math.cos(view.pitch) * d,
      target.y + Math.sin(view.pitch) * d,
      target.z + Math.cos(view.az) * Math.cos(view.pitch) * d
    );
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
    cutaway();
  }
  /** Where the camera looks for a villager at (x, z): a little ahead of it, kept over the floors (the view's lower edge
   *  never far past the front walls: the hall's is nearer than the wings'; nor past the side walls). */
  function camSpot(x: number, z: number): [number, number] {
    const inHall = Math.abs(x) < HALL.x1 + 10;
    return [Math.max(BUG_WING.x0 + 70, Math.min(FISH_WING.x1 - 70, x)), Math.max(inHall ? -30 : -60, Math.min((inHall ? HALL.z1 : FISH_WING.z1) - 84, z - 4))];
  }
  /** The walls between the camera and my villager go (and those beside the line, a little either side). */
  function cutaway() {
    const cx = camera.position.x, cz = camera.position.z;
    const sx = Math.cos(view.az), sz = -Math.sin(view.az), tx0 = Math.sin(view.az), tz0 = Math.cos(view.az);
    for (const wm of walls) {
      // a wall across the view on the camera's side of my villager (the front walls, as NH cuts them)
      const mx = (wm.w.a[0] + wm.w.b[0]) / 2 - target.x, mz = (wm.w.a[1] + wm.w.b[1]) / 2 - target.z;
      const dx = wm.w.b[0] - wm.w.a[0], dz = wm.w.b[1] - wm.w.a[1], dl = Math.hypot(dx, dz) || 1;
      let cut = mx * tx0 + mz * tz0 > 12 && Math.abs((dx * tx0 + dz * tz0) / dl) < 0.6;
      for (const off of [-24, 0, 24]) {
        const tx = target.x + sx * off, tz = target.z + sz * off;
        if (segCross(cx, cz, tx, tz, wm.w.a[0], wm.w.a[1], wm.w.b[0], wm.w.b[1])) cut = true;
      }
      wm.mesh.visible = !cut;
    }
    for (const [m, wm] of trims) m.visible = wm.mesh.visible;
  }
  function segCross(ax: number, az: number, bx: number, bz: number, cx: number, cz: number, dx: number, dz: number): boolean {
    const d = (bx - ax) * (dz - cz) - (bz - az) * (dx - cx);
    if (Math.abs(d) < 1e-9) return false;
    const t = ((cx - ax) * (dz - cz) - (cz - az) * (dx - cx)) / d, u = ((cx - ax) * (bz - az) - (cz - az) * (bx - ax)) / d;
    return t > 0 && t < 1 && u >= -0.02 && u <= 1.02;
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
    (wallMat.bug as MeshLambertMaterial).color.set(0xffffff).lerp(NIGHT_GLASS, nightN * 0.75);
    grassMat.color.set(0xffffff).lerp(NIGHT_GLASS, nightN * 0.35);
    for (const e of exhibits) e.night(nightN);
    invalidate();
  }
  const NIGHT_GLASS = new Color(0x2c3358);

  // ---- taps ----
  const ray = new Raycaster();
  const ndc = new Vector2();
  const toNdc = (cx: number, cy: number) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
  };
  const floorPlane = new Plane(new Vector3(0, 1, 0), 0);
  const hitV = new Vector3();
  function client(x: number, y: number, z: number): [number, number] {
    const r = canvas.getBoundingClientRect();
    const v = new Vector3(x, y, z).project(camera);
    return [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height];
  }
  const project = (x: number, y: number, z: number): [number, number] | null => {
    const v = new Vector3(x, y, z).project(camera);
    if (v.z > 1 || v.z < -1) return null;
    const r = canvas.getBoundingClientRect();
    return [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height];
  };
  function hit(cx: number, cy: number): Hit | null {
    // a villager (its body on screen: a box round its feet to its head)
    for (const [who, w] of villagers) {
      const [fx, fy] = client(w.pos[0], 0, w.pos[1]), [, hy] = client(w.pos[0], VILLAGER_H, w.pos[1]);
      const half = Math.max(10, (fy - hy) * 0.32);
      if (cx >= fx - half && cx <= fx + half && cy >= hy - 4 && cy <= fy + 4) return { kind: 'villager', who };
    }
    // a creature (the nearest drawn within a finger's reach)
    let best: { id: string; d: number } | null = null;
    for (const e of exhibits) {
      const p = e.pick(project, cx, cy);
      if (p && (!best || p.d < best.d)) best = p;
    }
    if (best) return { kind: 'creature', id: best.id };
    toNdc(cx, cy);
    if (!ray.ray.intersectPlane(floorPlane, hitV)) return null;
    if (inRect(DORMAT_PAD, hitV.x, hitV.z)) return { kind: 'door' };
    if (!roomAt(hitV.x, hitV.z) && !walkable(nav, hitV.x, hitV.z)) return null;
    return { kind: 'floor', x: hitV.x, z: hitV.z };
  }
  const DORMAT_PAD: Rect = { x0: DOORMAT.x0 - 2, x1: DOORMAT.x1 + 2, z0: DOORMAT.z0, z1: DOORMAT.z1 + 4 };

  // ---- what isn't on screen yet made ready once everything is in: its textures up a few at a time and its programs
  //      compiled, so a wing's first sight is no hitch (its hundred-odd critters' textures at once: ~100 ms) ----
  const warmed = new WeakSet<Texture>();
  let warmT: ReturnType<typeof setTimeout> | undefined;
  function warmSoon() {
    clearTimeout(warmT);
    // (a little after the last model: its exhibit's meshes made from it)
    if (!noDraw && !disposed) warmT = setTimeout(warm, 250);
  }
  function warm() {
    if (disposed || pending) return;
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
      else void renderer.compileAsync(scene, camera).catch(() => {});
    };
    step();
  }

  // ---- the frame loop ----
  const frustum = new Frustum(), projScreen = new Matrix4();
  let raf = 0, frames = 0, lastT = 0;
  const cost: number[] = [];
  let ambientOn = 0;
  let readyRes: () => void;
  const ready = new Promise<void>((r) => (readyRes = r));
  let camRev = '';
  function invalidate() {
    if (!raf && !disposed) raf = requestAnimationFrame(frame);
  }
  const seen = (sp: Sphere) => frustum.intersectsSphere(sp);
  function frame() {
    raf = 0;
    if (disposed) return;
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
    if (me) {
      // (kept over the floors: near the front door the camera stays back, not over the dark outside)
      const [fx, fz] = camSpot(me.pos[0], me.pos[1]);
      const f = Math.min(1, (6 * dt) / 1000);
      const dx = fx - target.x, dz = fz - target.z;
      if (Math.hypot(dx, dz) > 0.05) {
        target.x += dx * f;
        target.z += dz * f;
        full = true;
      }
    }
    aim();
    const rv = `${view.az.toFixed(4)}:${view.pitch.toFixed(4)}:${view.k.toFixed(4)}:${target.x.toFixed(2)}:${target.z.toFixed(2)}`;
    const camMoved = rv !== camRev;
    camRev = rv;
    for (const w of villagers.values()) if (stepVillager(w, t, camMoved)) full = true;
    lastV = t;
    if (gesturing) full = true;
    // the exhibits on screen move (at the ambient rate when nothing else does); off screen they rest (a tank, a bug:
    // the hall's view of the wings' far ends is still)
    projScreen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreen);
    let ambient = false;
    ambientOn = 0;
    for (const e of exhibits) {
      if (!e.frame(t, dt, seen)) continue;
      ambient = true;
      ambientOn++;
    }
    const c0 = now();
    if (!noDraw) renderer.render(scene, camera);
    cost.push(now() - c0);
    if (cost.length > 240) cost.shift();
    frames++;
    lastT = t;
    if (frames === 1) readyRes();
    // (only when it changes: three's setPixelRatio sets the canvas's size, which reallocates its buffers, every frame)
    const dpr = gesturing ? Math.min(dprFull, DPR_MOVING) : dprFull;
    if (dpr !== renderer.getPixelRatio()) renderer.setPixelRatio(dpr);
    if (full) invalidate();
    else if (ambient) setTimeout(() => invalidate(), Math.max(0, 1000 / AMBIENT - (now() - t) - 4));
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
    still: () => !easing && !gesturing && !raf,
    villager,
    at: (who) => (villagers.get(who) ? [villagers.get(who)!.pos[0], villagers.get(who)!.pos[1]] : null),
    put(who, p, yaw) {
      const w = villagers.get(who);
      if (!w) return;
      w.path = null;
      w.pos = [p[0], p[1]];
      w.was = [p[0], p[1]];
      if (yaw !== undefined) w.yaw = yaw;
      if (who === followed) target.set(...camSpot(p[0], p[1]).flatMap((v, i) => (i ? [8, v] : [v])) as [number, number, number]);
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
      if (!w || w.path) return;
      w.yaw = Math.atan2(toward[0] - w.pos[0], toward[1] - w.pos[1]);
      w.posing = true;
      invalidate();
    },
    headPoint,
    follow(who) {
      followed = who;
      invalidate();
    },
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
    kit,
    stats: () => ({ frames, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, dpr: renderer.getPixelRatio(), cost: [...cost], queued: !!raf, ambient: ambientOn, loading: pending,
      mem: [renderer.info.memory.geometries, renderer.info.memory.textures, renderer.info.programs?.length ?? 0] }),
    ready,
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(warmT);
      for (const e of exhibits) e.dispose();
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
