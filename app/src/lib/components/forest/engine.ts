// くまのもり in 3D (docs/design.md "Kuma no mori"): its own renderer and scene on its own screen (/expedition: the
// island is unloaded while you're here). NH's art where there is some (world3d's trees, bushes, mushrooms, fragments,
// lanterns, the campfire, a present for a dropped pile, the wasp nest and swarm, NH's villagers for the players and
// Beardo, darkened and doubled, for each bear with red eyes glowing), the ground, river, cliffs, ladders, bridge and
// dock built here. Metres; one renderer, no shadow map (blob shadows), fog hides the far trees and the far plane drops
// them; the trees are instanced in 20 m chunks so the camera's frustum skips the ones behind it.
import {
  AdditiveBlending, BoxGeometry, CanvasTexture, Color, CylinderGeometry, DirectionalLight, DoubleSide, Fog, Group, HemisphereLight, InstancedMesh, Material,
  Matrix4, Mesh, MeshBasicMaterial, MeshLambertMaterial, Object3D, PerspectiveCamera, PlaneGeometry, Quaternion, RepeatWrapping, RingGeometry, Scene,
  Sprite, SpriteMaterial, SRGBColorSpace, Texture, TextureLoader, Vector3, WebGLRenderer, BufferGeometry, Float32BufferAttribute, type MeshStandardMaterial
} from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { createVillager, type Villager3D } from '../villager3d/villager3d.ts';
import type { Pose } from '../villager3d/poses.ts';
import { MODELS } from '../world3d/models3d.ts';
import { CLIFF_H, HALF, type ForestMap, type Item } from './map.ts';
import type { BNet, PState } from './protocol.ts';
import { TUNE } from './sim.ts';
import type { Who } from '#lib/sync/live-protocol.ts';

/** Metres per villager-model world unit (villager3d: an NH villager stands 80 u): about 1.3 m. */
const VU = 1 / 60;
/** A bear's size over a villager's. */
export const BEAR_K = 1.8;
const TREE_K = 0.085, BUSH_K = 0.11, FIND_K = 0.06;
const CHUNK = 20;

export interface PView {
  who: Who;
  x: number;
  y: number;
  z: number;
  f: number;
  v: number;
  st: PState;
  run: boolean;
  bush?: number;
}
export interface ForestView {
  me: Who;
  yaw: number;
  pitch: number;
  players: PView[];
  bears: BNet[];
  items: Item[];
  taken: Set<number>;
  traps: { id: number; x: number; z: number; live: boolean }[];
  /** When each leaner fell (s, the round's clock). */
  fallen: Map<number, number>;
  nests: Map<number, { t: number; x: number; z: number }>;
  t: number;
}

export interface Forest {
  frame(v: ForestView, ms: number): void;
  /** Where a world point lands on the screen (CSS px), or null behind the camera. */
  project(x: number, y: number, z: number): { x: number; y: number } | null;
  resize(): void;
  stats(): { calls: number; tris: number; textures: number; geometries: number };
  dispose(): void;
}

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

/** A glowing round dot (the bears' eyes, the finds' sparkle). */
function glowTexture(): Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.25, 'rgba(255,255,255,0.85)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}
/** NH's grass: a green ground scattered with lighter and darker triangles (drawn: NH's own grass-mix is a blend mask,
 *  not a colour). */
function grassTexture(base: string, light: string, dark: string): Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = base;
  g.fillRect(0, 0, 256, 256);
  let seed = 7;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 110; i++) {
    const x = r() * 256, y = r() * 256, s = 6 + r() * 9, a = r() * Math.PI * 2;
    g.fillStyle = r() < 0.7 ? light : dark;
    g.globalAlpha = 0.55 + r() * 0.35;
    // (drawn at each wrap too: the tile repeats seamlessly)
    for (const [ox, oy] of [[0, 0], [256, 0], [-256, 0], [0, 256], [0, -256]]) {
      g.beginPath();
      for (let k = 0; k < 3; k++) g.lineTo(x + ox + Math.cos(a + (k * Math.PI * 2) / 3) * s, y + oy + Math.sin(a + (k * Math.PI * 2) / 3) * s);
      g.fill();
    }
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}
function starTexture(): Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffe14d';
  g.strokeStyle = '#a8761a';
  g.lineWidth = 3;
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2, r = i % 2 ? 12 : 28;
    g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
  g.stroke();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

// the bears' held poses (villager3d poses.ts's conventions: arms lowered from NH's T about z)
const ROAR: Pose = {
  j: { Spine_1: [-0.32, 0, 0], Spine_2: [-0.12, 0, 0], Head: [-0.35, 0, 0], Arm_1_L: [0, 0, -0.15], Arm_1_R: [0, 0, 0.15], Arm_2_L: [0, -0.9, 0], Arm_2_R: [0, 0.9, 0] },
  y: 0.5, sq: 1.06, pitch: 0
};
const CROUCH: Pose = {
  j: { Spine_1: [0.45, 0, 0], Head: [-0.4, 0, 0], Arm_1_L: [0.6, 0, -0.6], Arm_1_R: [0.6, 0, 0.6], Leg_1_L: [-0.5, 0, 0], Leg_1_R: [-0.5, 0, 0], Leg_2_L: [0.9, 0, 0], Leg_2_R: [0.9, 0, 0] },
  y: -0.6, sq: 0.9, pitch: 0.1
};
const LUNGE: Pose = {
  j: { Spine_1: [0.5, 0, 0], Head: [-0.5, 0, 0], Arm_1_L: [-0.9, 0, -0.5], Arm_1_R: [-0.9, 0, 0.5], Leg_1_L: [0.6, 0, 0], Leg_1_R: [-0.7, 0, 0] },
  y: 0.4, sq: 1.04, pitch: 0.45
};

export async function createForest(
  canvas: HTMLCanvasElement, map: ForestMap, o: { base: string; villagers: Partial<Record<Who, string>>; bear: string; bears: number }
): Promise<Forest> {
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = SRGBColorSpace;
  const scene = new Scene();
  const DUSK = new Color(0xe7a87c), NIGHT = new Color(0x1d2540);
  scene.background = DUSK.clone();
  scene.fog = new Fog(DUSK.clone(), 9, 36);
  const camera = new PerspectiveCamera(55, 1, 0.2, 42);
  const hemi = new HemisphereLight(0xffd7b0, 0x2e4a2e, 1.4);
  const sun = new DirectionalLight(0xffb27a, 1.6);
  sun.position.set(-30, 25, 10);
  scene.add(hemi, sun);

  const owned: { dispose(): void }[] = [];
  const own = <T extends { dispose(): void }>(x: T) => (owned.push(x), x);
  const tex = new TextureLoader();
  const terrain = (name: string, rep: number) => {
    const t = own(tex.load(`${o.base}terrain/nh/${name}.webp`));
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(rep, rep);
    t.colorSpace = SRGBColorSpace;
    return t;
  };

  // ---- the ground, the sea, the river, the bridge ----
  const grassTex = own(grassTexture('#7fb85a', '#98cc6e', '#6aa64c'));
  grassTex.repeat.set(16, 16);
  const grass = own(new MeshLambertMaterial({ map: grassTex }));
  const ground = new Mesh(own(new PlaneGeometry(HALF * 2, HALF * 2)).rotateX(-Math.PI / 2), grass);
  const sea = new Mesh(own(new PlaneGeometry(400, 400)).rotateX(-Math.PI / 2), own(new MeshLambertMaterial({ color: 0x3f8fb0, emissive: 0x16404f })));
  sea.position.y = -0.4;
  const sand = new Mesh(own(new PlaneGeometry(HALF * 2 + 6, HALF * 2 + 6)).rotateX(-Math.PI / 2), own(new MeshLambertMaterial({ map: terrain('sand', 20), color: 0xf0e0b8 })));
  sand.position.y = -0.15;
  scene.add(sea, sand, ground);
  {
    // the river: a strip along its line, a little over the grass (its banks a wider strip of sand under it)
    const strip = (half: number, y: number) => {
      const segs = 80, pos: number[] = [], idx: number[] = [];
      for (let i = 0; i <= segs; i++) {
        const x = -HALF + (i / segs) * HALF * 2, z = map.riverZ(x);
        pos.push(x, y, z - half, x, y, z + half);
        if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
      }
      const g = own(new BufferGeometry());
      g.setIndex(idx);
      g.setAttribute('position', new Float32BufferAttribute(pos, 3));
      g.computeVertexNormals();
      return g;
    };
    const river = new Mesh(strip(map.riverHalf, 0.04), own(new MeshLambertMaterial({ color: 0x4fb3d9, emissive: 0x1d5a70, transparent: true, opacity: 0.92, side: DoubleSide })));
    const banks = new Mesh(strip(map.riverHalf + 0.7, 0.02), own(new MeshLambertMaterial({ color: 0xd9c79a, side: DoubleSide })));
    river.renderOrder = 1;
    scene.add(banks, river);
    // the bridge: planks across, rails each side; the ford: stepping stones (NH's flat rock) across, in a model below
    const plank = own(new MeshLambertMaterial({ map: terrain('plank', 2), color: 0xd9b48a }));
    for (const b of map.crossings.filter((c) => c.kind === 'bridge')) {
      const deck = new Mesh(own(new BoxGeometry(b.x1 - b.x0, 0.2, b.z1 - b.z0)), plank);
      deck.position.set((b.x0 + b.x1) / 2, 0.15, (b.z0 + b.z1) / 2);
      const railG = own(new BoxGeometry(0.15, 0.6, b.z1 - b.z0));
      for (const x of [b.x0, b.x1]) {
        const r = new Mesh(railG, plank);
        r.position.set(x, 0.55, (b.z0 + b.z1) / 2);
        scene.add(r);
      }
      scene.add(deck);
    }
  }

  // ---- the cliffs and their ladders ----
  const cliffSide = own(new MeshLambertMaterial({ map: terrain('cliff', 3) }));
  const topTex = own(grassTexture('#7fb85a', '#98cc6e', '#6aa64c'));
  topTex.repeat.set(2, 2);
  const cliffTop = own(new MeshLambertMaterial({ map: topTex }));
  const wood = own(new MeshLambertMaterial({ color: 0x9a6a3c }));
  for (const p of map.plateaus) {
    const w = p.x1 - p.x0 + 1, d = p.z1 - p.z0 + 1;
    const box = own(new BoxGeometry(w, CLIFF_H, d));
    const m = new Mesh(box, [cliffSide, cliffSide, cliffTop, cliffSide, cliffSide, cliffSide]);
    m.position.set((p.x0 + p.x1) / 2, CLIFF_H / 2, (p.z0 + p.z1) / 2);
    scene.add(m);
    // a ladder from each foot up the face
    for (const l of p.ladders) {
      const lad = new Group(), dx = l.head[0] - l.foot[0], dz = l.head[1] - l.foot[1];
      const rail = own(new BoxGeometry(0.08, CLIFF_H + 0.6, 0.08)), rung = own(new BoxGeometry(0.7, 0.06, 0.06));
      for (const s2 of [-0.35, 0.35]) {
        const r = new Mesh(rail, wood);
        r.position.set(s2, (CLIFF_H + 0.6) / 2, 0);
        lad.add(r);
      }
      for (let y = 0.35; y < CLIFF_H + 0.3; y += 0.4) {
        const r = new Mesh(rung, wood);
        r.position.set(0, y, 0);
        lad.add(r);
      }
      const len = Math.hypot(dx, dz);
      lad.position.set(l.foot[0] + (dx / len) * 1.1, 0, l.foot[1] + (dz / len) * 1.1);
      lad.rotation.y = Math.atan2(dx, dz);
      lad.rotation.x = -0.12;
      scene.add(lad);
    }
  }

  // ---- the dock (the seaplane's: safe), the camp (safe), their lantern-lit rings ----
  {
    const plank = own(new MeshLambertMaterial({ map: terrain('plank', 3), color: 0xd9b48a }));
    const deck = new Mesh(own(new BoxGeometry(6, 0.25, 12)), plank);
    deck.position.set(map.dock.x, 0.1, HALF + 2);
    scene.add(deck);
    const ringG = own(new RingGeometry(0.92, 1, 48).rotateX(-Math.PI / 2));
    const ringM = own(new MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.45, depthWrite: false }));
    for (const s of [map.dock, map.camp]) {
      const r = new Mesh(ringG, ringM);
      r.scale.setScalar(s.r);
      r.position.set(s.x, 0.05, s.z);
      scene.add(r);
    }
  }

  // ---- NH's models ----
  const gltfs = new Map<string, Promise<GLTF | null>>();
  const model = (name: string) => {
    let p = gltfs.get(name);
    if (!p) {
      p = loader.loadAsync(`${o.base}room/world3d/${name}.glb?v=${MODELS[name]?.v ?? 0}`).catch((e: unknown) => (console.warn('forest: model', name, e), null));
      gltfs.set(name, p);
    }
    return p;
  };
  const lambertOf = new Map<Material, MeshLambertMaterial>();
  const lamps: MeshLambertMaterial[] = [];
  const lambert = (src: Material) => {
    let m = lambertOf.get(src);
    if (m) return m;
    const s = src as MeshStandardMaterial;
    m = own(new MeshLambertMaterial({
      map: s.map, color: s.color, transparent: s.transparent, alphaTest: s.alphaTest, side: s.side,
      emissive: s.emissiveMap ? new Color(0xffd890) : new Color(0xffffff), emissiveMap: s.emissiveMap ?? s.map, emissiveIntensity: s.emissiveMap ? 0 : 0.28
    }));
    if (s.emissiveMap) lamps.push(m);
    lambertOf.set(src, m);
    return m;
  };
  /** A model's meshes, each with its transform from the model's root. */
  const partsOf = (g: GLTF) => {
    g.scene.updateMatrixWorld(true);
    const out: { geo: BufferGeometry; mat: MeshLambertMaterial; m: Matrix4 }[] = [];
    g.scene.traverse((n) => {
      const me = n as Mesh;
      if (me.isMesh) out.push({ geo: me.geometry, mat: lambert(me.material as Material), m: me.matrixWorld.clone() });
    });
    return out;
  };
  const placed = (x: number, y: number, z: number, yaw: number, s: number) =>
    new Matrix4().compose(new Vector3(x, y, z), new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw), new Vector3(s, s, s));
  /** Many of one model, instanced per 20 m chunk (each chunk's bounds: the frustum skips those out of view). */
  async function forest(name: string, at: Matrix4[]) {
    const g = await model(name);
    if (!g || disposed) return;
    const parts = partsOf(g), chunks = new Map<string, Matrix4[]>();
    const p = new Vector3();
    for (const m of at) {
      p.setFromMatrixPosition(m);
      const k = `${Math.floor(p.x / CHUNK)},${Math.floor(p.z / CHUNK)}`;
      (chunks.get(k) ?? chunks.set(k, []).get(k)!).push(m);
    }
    for (const list of chunks.values())
      for (const part of parts) {
        const im = new InstancedMesh(part.geo, part.mat, list.length);
        list.forEach((m, i) => im.setMatrixAt(i, new Matrix4().multiplyMatrices(m, part.m)));
        im.computeBoundingSphere();
        scene.add(im);
      }
  }
  /** One of a model (a copy of its scene, its materials the soft ones). */
  async function one(name: string, s: number): Promise<Object3D | null> {
    const g = await model(name);
    if (!g || disposed) return null;
    const c = g.scene.clone(true);
    c.traverse((n) => {
      const me = n as Mesh;
      if (me.isMesh) me.material = lambert(me.material as Material);
    });
    const w = new Group();
    c.scale.setScalar(s);
    w.add(c);
    return w;
  }

  let disposed = false;
  const rnd = (i: number) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
  const cedars = map.trees.filter((t) => t.kind === 'cedar').map((t, i) => placed(t.x, 0, t.z, rnd(i) * 6.28, TREE_K * t.s * 1.15));
  const oaks = map.trees.filter((t) => t.kind === 'oak').map((t, i) => placed(t.x, 0, t.z, rnd(i + 99) * 6.28, TREE_K * t.s));
  const BUSHES = ['bush-holly', 'bush-orange-tea-olive', 'bush-pink-azalea', 'bush-red-hibiscus', 'bush-white-azalea'];
  const loads: Promise<unknown>[] = [forest('cedar', cedars), forest('oak-summer', oaks)];
  BUSHES.forEach((b, k) => loads.push(forest(b, map.bushes.filter((x) => x.kind === k).map((x) => placed(x.x, 0, x.z, rnd(x.id) * 6.28, BUSH_K)))));
  // a few flowers and rocks about, for the floor's sake
  const deco: Matrix4[] = [], rocks: Matrix4[] = [];
  for (let i = 0; i < 70; i++) {
    const x = (rnd(i * 3 + 1) * 2 - 1) * (HALF - 2), z = (rnd(i * 3 + 2) * 2 - 1) * (HALF - 2);
    if (Math.abs(z - map.riverZ(x)) < map.riverHalf + 1 || map.plateaus.some((p) => x > p.x0 - 1 && x < p.x1 + 1 && z > p.z0 - 1 && z < p.z1 + 1)) continue;
    (i % 5 ? deco : rocks).push(placed(x, 0, z, rnd(i) * 6, i % 5 ? 0.05 : 0.07));
  }
  loads.push(forest('rock', rocks));
  // the campfire and the dock's lanterns, the sign
  const lantern = async (x: number, z: number) => {
    const l = await one('garden-lantern', 0.06);
    if (l) {
      l.position.set(x, 0.2, z);
      scene.add(l);
    }
  };
  loads.push(
    one('campfire', 0.07).then((c) => c && (c.position.set(map.camp.x, 0, map.camp.z), scene.add(c))),
    one('campsite-sign', 0.06).then((c) => c && (c.position.set(map.dock.x + 4, 0, map.dock.z - 3), c.rotation.set(0, Math.PI, 0), scene.add(c))),
    lantern(map.dock.x - 3.2, HALF - 1), lantern(map.dock.x + 3.2, HALF - 1), lantern(map.dock.x - 3.2, HALF + 6), lantern(map.dock.x + 3.2, HALF + 6)
  );

  // the ford's stepping stones, the landmarks
  for (const f of map.crossings.filter((c) => c.kind === 'ford')) {
    const stones: Matrix4[] = [];
    for (let z = f.z0 + 0.6, i = 0; z < f.z1; z += 1.3, i++) stones.push(placed((f.x0 + f.x1) / 2 + (i % 2 ? 0.6 : -0.6), 0.02, z, i, 0.075));
    loads.push(forest('flat-rock', stones));
  }
  for (const lm of map.landmarks)
    loads.push(one(lm.model, 0.06).then((c) => {
      if (!c) return;
      c.position.set(lm.x, 0, lm.z);
      c.rotation.y = lm.a ?? 0;
      scene.add(c);
    }));

  // ---- the leaners (dead trees that fall when pushed) and the wasp nests ----
  const leaners = new Map<number, Object3D>();
  const UP = new Vector3(0, 1, 0);
  const leanQ = (a: number, k: number) => {
    const dir = new Vector3(Math.cos(a), 0, Math.sin(a));
    const lean = new Vector3().copy(UP).lerp(dir, k).normalize();
    return new Quaternion().setFromUnitVectors(UP, lean);
  };
  for (const l of map.leaners)
    loads.push(one('cedar', TREE_K * 1.05).then((c) => {
      if (!c) return;
      c.traverse((n) => {
        const me = n as Mesh;
        if (me.isMesh) {
          // dead: greyed
          const m = (me.material as MeshLambertMaterial).clone();
          m.color.multiplyScalar(0.55).lerp(new Color(0x8a7a5a), 0.5);
          own(m);
          me.material = m;
        }
      });
      c.position.set(l.x, 0, l.z);
      c.quaternion.copy(leanQ(l.a, 0.25));
      leaners.set(l.id, c);
      scene.add(c);
    }));
  const nests = new Map<number, Object3D>();
  map.nests.forEach((n, i) =>
    loads.push(one('finds/wasp-nest', 0.06).then((c) => {
      if (!c) return;
      const t = map.trees[n.tree];
      c.position.set(t.x + 0.6, 1.9, t.z);
      nests.set(i, c);
      scene.add(c);
    })));
  const swarmP = one('critters/bugs/wasp-swarm', 0.35);

  // ---- the finds ----
  const glow = own(glowTexture()), star = own(starTexture());
  const FIND_MODEL: Record<string, string> = {
    round: 'finds/round-mushroom', flat: 'finds/flat-mushroom', skinny: 'finds/skinny-mushroom', elegant: 'finds/elegant-mushroom', rare: 'finds/rare-mushroom',
    piece: 'finds/star-fragment', pile: 'finds/present'
  };
  const finds = new Map<number, Object3D>();
  const seedMat = own(new MeshLambertMaterial({ color: 0x8a5a2b, emissive: 0x3a2410 }));
  const seedGeo = own(new CylinderGeometry(0.09, 0.12, 0.22, 8));
  async function findObj(it: Item): Promise<Object3D | null> {
    let o3: Object3D | null;
    if (it.kind === 'seed') {
      o3 = new Group();
      o3.add(new Mesh(seedGeo, seedMat));
    } else o3 = await one(FIND_MODEL[it.kind], it.kind === 'piece' ? 0.09 : it.kind === 'pile' ? 0.08 : FIND_K);
    if (!o3) return null;
    const sp = new Sprite(own(new SpriteMaterial({ map: glow, color: it.kind === 'piece' ? 0xbfe6ff : it.kind === 'seed' ? 0xffd27a : 0xfff2b0, blending: AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.7 })));
    sp.scale.setScalar(0.7);
    sp.position.y = 0.3;
    o3.add(sp);
    o3.position.set(it.x, it.top ? CLIFF_H : 0, it.z);
    return o3;
  }
  const traps = new Map<number, Object3D>();

  // ---- the players and the bears ----
  const people = new Map<Who, Villager3D>();
  for (const [who, url] of Object.entries(o.villagers) as [Who, string][])
    loads.push(createVillager(who, url, who.charCodeAt(0)).then((v) => {
      if (disposed) return v.dispose();
      v.group.scale.setScalar(VU);
      people.set(who, v);
      scene.add(v.group);
    }).catch((e: unknown) => console.warn('forest: villager', who, e)));
  const bears: { v: Villager3D; eyes: Sprite[]; st: string; arc: Mesh; stars: Sprite[]; hold: Pose | null }[] = [];
  const arcG = own(new RingGeometry(0.3, TUNE.lungeMax + 0.6, 24, 1, -TUNE.lungeCone, TUNE.lungeCone * 2).rotateX(-Math.PI / 2));
  const arcM = own(new MeshBasicMaterial({ color: 0xff7a2a, transparent: true, opacity: 0.45, depthWrite: false, side: DoubleSide }));
  const eyeMat = own(new SpriteMaterial({ map: glow, color: 0xff2a1a, blending: AdditiveBlending, depthWrite: false, depthTest: true, transparent: true, fog: false }));
  const starMat = own(new SpriteMaterial({ map: star, depthWrite: false, transparent: true, fog: false }));
  const starsFor = (parent: Object3D) =>
    Array.from({ length: 3 }, () => {
      const s = new Sprite(starMat);
      s.scale.setScalar(0.28);
      s.visible = false;
      parent.add(s);
      return s;
    });
  for (let i = 0; i < o.bears; i++)
    loads.push(createVillager(`bear${i}`, o.bear, 7 + i).then((v) => {
      if (disposed) return v.dispose();
      v.group.scale.setScalar(VU * BEAR_K);
      // darker, rougher than a villager: its colours dimmed, little self-light
      v.group.traverse((n) => {
        const me = n as Mesh;
        if (me.isMesh && (me.material as MeshLambertMaterial).color && me.name !== 'sting-lump') (me.material as MeshLambertMaterial).color.multiplyScalar(0.62);
      });
      v.lift(0.1);
      v.face('cross');
      const eyes = [0, 1].map(() => {
        const s = new Sprite(eyeMat);
        s.scale.setScalar(0.32);
        s.renderOrder = 5;
        scene.add(s);
        return s;
      });
      const arc = new Mesh(arcG, arcM);
      arc.visible = false;
      scene.add(arc);
      const stars = starsFor(scene);
      bears.push({ v, eyes, st: '', arc, stars, hold: null });
      scene.add(v.group);
    }));
  const downStars = new Map<Who, Sprite[]>();
  await Promise.all(loads);
  const swarm = await swarmP;
  if (swarm) {
    swarm.visible = false;
    scene.add(swarm);
  }

  // ---- each frame ----
  const camPos = new Vector3(map.spawn[0][0], 6, map.spawn[0][1] + 8), look = new Vector3();
  let lastMs = 0, camD = 7.5;
  const eyeAt = new Vector3(), tmp = new Vector3();
  const prev = new Map<string, { x: number; z: number }>();
  const moved = (key: string, x: number, z: number) => {
    const p = prev.get(key);
    prev.set(key, { x, z });
    return p ? Math.hypot(x - p.x, z - p.z) : 0;
  };
  const findLoading = new Set<number>();

  function frame(view: ForestView, ms: number) {
    const dt = lastMs ? Math.min(0.1, (ms - lastMs) / 1000) : 0;
    lastMs = ms;
    // dusk to night (the last flight: the dock's lanterns burn)
    const k = Math.max(0, Math.min(1, (view.t - TUNE.nightAt + 20) / 40));
    (scene.background as Color).copy(DUSK).lerp(NIGHT, k);
    const fog = scene.fog as Fog;
    fog.color.copy(scene.background as Color);
    fog.near = 9 - 3 * k;
    fog.far = 36 - 9 * k;
    hemi.intensity = 1.4 - 0.85 * k;
    sun.intensity = 1.6 - 1.4 * k;
    hemi.color.setHex(0xffd7b0).lerp(new Color(0x8fa2ff), k);
    for (const m of lamps) m.emissiveIntensity = 0.4 + 1.2 * k;

    // the players
    for (const p of view.players) {
      const v = people.get(p.who);
      if (!v) continue;
      const gone = p.st === 'home' || p.st === 'out' || p.st === 'hide';
      v.group.visible = !gone;
      v.group.position.set(p.x, p.y, p.z);
      v.group.rotation.y = p.f;
      const want = p.st === 'down' ? 'prone' : p.v > 0.2 ? 'walk' : 'idle';
      if (v.state() !== want) v.set(want);
      v.face(p.st === 'down' ? 'sleepy' : view.bears.some((b) => b.tg === p.who && (b.st === 'chase' || b.st === 'tele' || b.st === 'lunge')) ? 'surprised' : null);
      v.step(ms, moved(p.who, p.x, p.z) / VU, (p.v / VU) * 0.62);
      // the dazed one's stars
      let st = downStars.get(p.who);
      if (p.st === 'down' && !st) downStars.set(p.who, (st = starsFor(scene)));
      if (st) st.forEach((s, i) => {
        s.visible = p.st === 'down';
        const a = ms / 400 + (i * Math.PI * 2) / 3;
        s.position.set(p.x + Math.cos(a) * 0.45, p.y + 0.55, p.z + Math.sin(a) * 0.45);
      });
    }
    // the bears
    view.bears.forEach((b, i) => {
      const B = bears[i];
      if (!B) return;
      const v = B.v;
      v.group.position.set(b.x, b.st === 'trap' ? -0.7 : 0, b.z);
      v.group.rotation.y = b.f;
      if (B.st !== b.st) {
        const was = B.st;
        B.st = b.st;
        B.hold = b.st === 'alert' ? ROAR : b.st === 'tele' ? CROUCH : b.st === 'lunge' ? LUNGE : null;
        v.hold(B.hold);
        const want = b.st === 'sleep' ? 'nap' : b.st === 'stun' || b.st === 'trap' || b.st === 'recover' || b.st === 'eat' ? 'idle' : 'walk';
        if (v.state() !== want) v.set(want);
        if (b.st === 'stun' || b.st === 'trap' || b.st === 'recover') v.act('sting');
        v.face(b.st === 'sleep' ? null : b.st === 'stun' || b.st === 'trap' ? 'sting' : b.st === 'eat' ? 'happy' : b.st === 'relief' ? 'sleepy' : 'cross');
        void was;
      }
      const sp = b.st === 'chase' ? (b.trip ? TUNE.tripV : 4.4) : b.v;
      v.step(ms, moved(`b${i}`, b.x, b.z) / (VU * BEAR_K), (sp / (VU * BEAR_K)) * 0.45);
      // its red eyes: on its face, glowing hotter on the hunt; shut asleep, dim dazed
      const e = v.eyes(eyeAt.set(0, 0, 0));
      const hot = b.st === 'chase' || b.st === 'alert' || b.st === 'tele' || b.st === 'lunge' ? 1 : b.st === 'sleep' ? 0 : b.st === 'stun' || b.st === 'trap' ? 0.15 : 0.55;
      const rx = Math.cos(b.f), rz = -Math.sin(b.f), fx = Math.sin(b.f), fz = Math.cos(b.f);
      B.eyes.forEach((s, j) => {
        s.visible = !!e && hot > 0;
        if (!e) return;
        const side = (j ? 1 : -1) * 0.13;
        s.position.set(e.x + rx * side + fx * 0.08, e.y + 0.02, e.z + rz * side + fz * 0.08);
        const pulse = 1 + 0.12 * Math.sin(ms / 90 + j);
        s.scale.setScalar((0.2 + 0.22 * hot) * pulse);
        (s.material as SpriteMaterial).opacity = 1;
      });
      eyeMat.opacity = 1;
      // the lunge's telegraph on the ground
      B.arc.visible = b.st === 'tele';
      if (B.arc.visible) {
        B.arc.position.set(b.x, 0.06, b.z);
        B.arc.rotation.y = b.f - Math.PI / 2;
        arcM.opacity = 0.3 + 0.3 * Math.abs(Math.sin(ms / 60));
      }
      B.stars.forEach((s, j) => {
        s.visible = b.st === 'stun' || b.st === 'trap';
        const a = ms / 300 + (j * Math.PI * 2) / 3;
        s.position.set(b.x + Math.cos(a) * 0.7, (b.st === 'trap' ? 1.6 : 2.9), b.z + Math.sin(a) * 0.7);
      });
    });

    // the finds: in while they're there, a little bob and spin
    for (const it of view.items) {
      const there = !view.taken.has(it.id);
      let f = finds.get(it.id);
      if (there && !f && !findLoading.has(it.id)) {
        findLoading.add(it.id);
        void findObj(it).then((x) => {
          if (!x || disposed) return;
          finds.set(it.id, x);
          scene.add(x);
        });
      }
      if (f) {
        f.visible = there;
        if (there) {
          f.rotation.y = ms / 900 + it.id;
          f.position.y = (it.top ? CLIFF_H : 0) + 0.05 + 0.05 * Math.sin(ms / 400 + it.id);
        }
      }
    }
    // the traps: a crack where one's planted; a hole once sprung
    for (const tr of view.traps) {
      if (traps.has(tr.id)) {
        const o3 = traps.get(tr.id)!;
        if (!tr.live && o3.userData.live) {
          o3.userData.live = false;
          o3.clear();
          void one('finds/hole', 0.1).then((h) => h && o3.add(h));
        }
        continue;
      }
      const g = new Group();
      g.userData.live = tr.live;
      g.position.set(tr.x, 0.02, tr.z);
      traps.set(tr.id, g);
      scene.add(g);
      void one(tr.live ? 'finds/dig-spot' : 'finds/hole', tr.live ? 0.06 : 0.1).then((h) => h && g.add(h));
    }
    // the leaners falling (half a second, a bounce)
    for (const [id, t0] of view.fallen) {
      const o3 = leaners.get(id), l = map.leaners[id];
      if (!o3) continue;
      const u = Math.min(1, (view.t - t0) / 0.5);
      const kk = u < 1 ? 0.25 + 0.75 * u * u : 1 - 0.04 * Math.max(0, Math.sin((view.t - t0 - 0.5) * 18)) * Math.max(0, 1 - (view.t - t0 - 0.5) * 3);
      o3.quaternion.copy(leanQ(l.a, Math.min(1, kk)));
      o3.position.y = 0.15;
    }
    // the nests: knocked down, the swarm flies off at whoever it's after
    let swarmOn = false;
    for (const [id, n] of view.nests) {
      const o3 = nests.get(id);
      const age = view.t - n.t;
      if (o3) o3.position.y = Math.max(0.1, 1.9 - age * age * 9);
      if (swarm && age < TUNE.stunSwarm) {
        swarmOn = true;
        swarm.position.set(n.x + Math.sin(ms / 70) * 0.3, 1.6 + Math.sin(ms / 50) * 0.15, n.z + Math.cos(ms / 80) * 0.3);
      }
    }
    if (swarm) swarm.visible = swarmOn;

    // the camera: behind me, turned only by my finger; it follows where I am (never turns by itself)
    const me = view.players.find((p) => p.who === view.me) ?? view.players.find((p) => p.st === 'ok');
    if (me) {
      // pulled in short of a tree between it and me (the canopy would fill the view), never closer than 2.2 m
      let D = 7.5;
      const ux = Math.sin(view.yaw) * Math.cos(view.pitch), uz = Math.cos(view.yaw) * Math.cos(view.pitch);
      for (const tr of map.trees) {
        const ax = tr.x - me.x, az = tr.z - me.z;
        if (Math.abs(ax) > 9 || Math.abs(az) > 9) continue;
        const along = ax * ux + az * uz;
        if (along < 0.6 || along > D) continue;
        const off = Math.hypot(ax - ux * along, az - uz * along);
        if (off < 1.5 * tr.s) D = Math.max(2.2, Math.min(D, along - 0.9));
      }
      camD += (D - camD) * (D < camD ? 1 : dt ? 1 - Math.exp(-dt * 3) : 1);
      const H = camD * Math.sin(view.pitch), R = camD * Math.cos(view.pitch);
      tmp.set(me.x + Math.sin(view.yaw) * R, me.y + H + 0.6, me.z + Math.cos(view.yaw) * R);
      camPos.lerp(tmp, dt ? 1 - Math.exp(-dt * 10) : 1);
      camera.position.copy(camPos);
      look.set(me.x, me.y + 0.9, me.z);
      camera.lookAt(look);
    }
    renderer.render(scene, camera);
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();

  return {
    frame,
    project(x, y, z) {
      const v = new Vector3(x, y, z).project(camera);
      if (v.z > 1) return null;
      return { x: ((v.x + 1) / 2) * canvas.clientWidth, y: ((1 - v.y) / 2) * canvas.clientHeight };
    },
    resize,
    stats: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, textures: renderer.info.memory.textures, geometries: renderer.info.memory.geometries }),
    dispose() {
      disposed = true;
      for (const v of people.values()) v.dispose();
      for (const b of bears) b.v.dispose();
      scene.traverse((n) => {
        const m = n as Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      for (const x of owned) x.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    }
  };
}
