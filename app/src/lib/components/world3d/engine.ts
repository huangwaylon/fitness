// The 3D island (the /world3d POC, /tmp/world3d/design.md): the whole of world.ts's island in three.js, NH's way.
//   The camera: NH's fixed, high island camera with a long lens, the rolling log bending the world away (bend.ts, every
//   material); the finger pans (z along the island, x only as far as the zoom leaves land off-screen), pinches zoom
//   (clamped, the pitch easing lower as it zooms in, as NH's does); nothing else ever moves it. No rotation.
//   The ground: the island's own baked chunks on a heightfield (ground.ts); the water live (water.ts).
//   The things: NH's models (static/room/world3d, scripts/world3d-models.ts), one InstancedMesh per model and material.
//   The villagers: billboards of their official renders, alpha-tested, depth-tested, a soft blob shadow (the tent's way).
//   The frames: 60 a second while anything moves (a touch, a fling, a walk, a jiggle), 30 when only the water does, none
//   when hidden (or, with the water off, none while still). Plain TS; World3D.svelte drives it.
import {
  CanvasTexture, CircleGeometry, Color, DirectionalLight, DoubleSide, Fog, Group, HemisphereLight, InstancedMesh,
  Material, Matrix4, Mesh, MeshBasicMaterial, MeshDepthMaterial, MeshLambertMaterial, MeshStandardMaterial, Object3D,
  PerspectiveCamera, PlaneGeometry, PointLight, Quaternion, RGBADepthPacking, Scene, SRGBColorSpace, Texture,
  TextureLoader, Vector3, WebGLRenderer, BufferGeometry, Float32BufferAttribute, Uint32BufferAttribute, type Fog as FogT
} from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { bend, bendPoint, bendU, unbendRay } from './bend.ts';
import { CHUNKS, CHUNK_D, chunkGrid, feetY, groundHeight } from './ground.ts';
import { createWater, waterFog, waterU } from './water.ts';
import type { Inst, ModelName } from './layout3d.ts';
import W3D from './models.json' with { type: 'json' };
import { PLAN, LAND, CAMPSITE } from '../island/world.ts';

export type Who = 'A' | 'B';
export type Tod = 'day' | 'dusk' | 'night';
export interface Look {
  url: string;
  aspect: number;
  looksRight: boolean;
  noMirror: boolean;
}
export type Hit = { kind: 'ground'; x: number; z: number } | { kind: 'villager'; who: Who } | { kind: 'thing'; id: string; tap: NonNullable<Inst['tap']>; x: number; z: number };
export interface Options {
  dpr: number;
  water: boolean;
  shadows: boolean;
  /** Frames a second at most (30 or 60). */
  cap: 30 | 60;
}
export interface Stats {
  fps: number;
  /** CPU per frame (ms: three's work and the GL calls) and the interval between frames drawn. */
  cpu: [number, number];
  gap: [number, number];
  calls: number;
  tris: number;
  textures: number;
  geometries: number;
  heap: number | null;
  dpr: number;
  frames: number;
  loading: number;
  camZ: number;
  zoom: number;
}

/** Villagers stand 80u tall (world.ts's scale). */
const VILLAGER_H = 80;
/** The camera: vertical field of view (a long lens) and the pitch at zoom 1 / fully in / fully out. */
const FOV = 30;
const PITCH = { def: 58, near: 42, far: 64 };
const ZOOM = { min: 0.62, max: 1.7 };
/** Where the camera may look (the pivot's world z): the sea in front of まえ … the falls and the forest above the cliff. */
const CAM_Z = { min: 20, max: 1010 };
const SPEED = 200;
/** The baked ground already has its light painted in: under the models' brighter light it's dimmed back to the bake. */
const GROUND_K = 0xe2e2e2;
/** How far below the screen's middle the pivot sits (a share of the height). */
const PIVOT_DROP = 0.16;
const now = () => performance.now();
const pctl = (a: number[], p: number) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};

function softDisc(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  r.addColorStop(0, 'rgba(30,40,20,0.45)');
  r.addColorStop(1, 'rgba(30,40,20,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** The sky: a vertical gradient (the scene's background, drawn behind everything). */
function skyTexture(top: string, mid: string, low: string): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 2;
  c.height = 256;
  const g = c.getContext('2d')!;
  const r = g.createLinearGradient(0, 0, 0, 256);
  r.addColorStop(0, top);
  r.addColorStop(0.55, mid);
  r.addColorStop(1, low);
  g.fillStyle = r;
  g.fillRect(0, 0, 2, 256);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

interface TodLook {
  sky: [string, string, string];
  fog: number;
  hemi: [number, number, number];
  sun: [number, number];
  sunAt: [number, number, number];
  tint: number;
  lamps: number;
  villager: number;
  /** NH's flat, soft look: each model lit a little by its own colour, whatever way its faces turn (a canopy's
   *  undersides, a trunk's shade side). */
  lift: number;
}
const TOD: Record<Tod, TodLook> = {
  day: { sky: ['#5fb8f2', '#9fd8fb', '#e2f5ff'], fog: 0xd7f0ff, hemi: [0xffffff, 0xe6efd4, 3.0], sun: [0xfff3df, 1.5], sunAt: [-0.55, 1, 0.75], tint: 0xffffff, lamps: 0, villager: 0xffffff, lift: 0.32 },
  dusk: { sky: ['#5a5fa8', '#e2889a', '#ffc78e'], fog: 0xf2b996, hemi: [0xffd2b4, 0xb09ab0, 2.5], sun: [0xffa66a, 1.3], sunAt: [0.9, 0.45, 0.4], tint: 0xffd6c0, lamps: 0.6, villager: 0xffd9c4, lift: 0.22 },
  night: { sky: ['#0b1636', '#1b2c5c', '#33467a'], fog: 0x223463, hemi: [0x7d93d6, 0x3a4570, 1.7], sun: [0xa9bcff, 0.5], sunAt: [-0.3, 1, 0.5], tint: 0x8795c8, lamps: 1, villager: 0x9aa6d6, lift: 0.08 }
};

export interface World3D {
  resize(): void;
  /** What stands on the island (loads the models it needs). */
  place(list: readonly Inst[]): Promise<void>;
  /** The ground's baked look (static/terrain/<look>/), its chunk URLs. */
  ground(urls: readonly string[]): void;
  villager(who: Who, look: Look | null, at: readonly [number, number]): void;
  /** Walk a villager along world points at the run. */
  walk(who: Who, pts: readonly (readonly [number, number])[]): number;
  at(who: Who): [number, number] | null;
  put(who: Who, p: readonly [number, number]): void;
  hop(who: Who): void;
  jiggle(id: string): void;
  tod(t: Tod): void;
  /** The finger: pan by client px, zoom by a factor about client px, fling at px/ms on release. */
  pan(dx: number, dy: number): void;
  zoom(f: number): void;
  fling(vx: number, vy: number): void;
  touching(on: boolean): void;
  /** The camera's pivot (world z) and zoom; set them (the e2e, ?cam=). */
  view(): { camZ: number; camX: number; zoom: number };
  go(camZ: number, zoom?: number): void;
  hit(cx: number, cy: number): Hit | null;
  /** A world point's client px. */
  client(x: number, y: number, z: number): [number, number];
  options(o: Partial<Options>): void;
  stats(): Stats;
  ready: Promise<void>;
  dispose(): void;
}

export function createWorld(canvas: HTMLCanvasElement, init: Partial<Options> & { aa?: boolean; R?: number; pitch?: number } = {}): World3D {
  const opts: Options = { dpr: Math.min(2, window.devicePixelRatio || 1), water: true, shadows: false, cap: 60, ...init };
  const renderer = new WebGLRenderer({ canvas, antialias: init.aa ?? true, alpha: false, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(opts.dpr);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.autoUpdate = false;
  bendU.uBendR.value = init.R ?? 1300;

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 20, 6000);
  const fog = new Fog(0xd7f0ff, 1400, 3200);
  scene.fog = fog;

  const hemi = new HemisphereLight(0xeaf6ff, 0x9ac276, 1.55);
  const sun = new DirectionalLight(0xfff3df, 1.9);
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -320, right: 320, top: 320, bottom: -320, near: 10, far: 1600 });
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 1.5;
  scene.add(hemi, sun, sun.target);
  /** The night's lamps: a few point lights moved to the lamps nearest the camera's pivot (always in the scene, so a
   *  change of time never recompiles a shader). */
  const LIGHTS = 4;
  const lamps: PointLight[] = Array.from({ length: LIGHTS }, () => {
    const l = new PointLight(0xffc77a, 0, 150, 1.4);
    scene.add(l);
    return l;
  });
  let lampSpots: { x: number; y: number; z: number; fire: boolean }[] = [];
  let todLook = TOD.day;

  // ---- the ground: 8 chunks, each its baked texture ----
  const tex = new TextureLoader();
  const chunks: Mesh[] = [];
  for (let i = 0; i < CHUNKS; i++) {
    const g = chunkGrid(i);
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(g.pos, 3));
    geo.setAttribute('uv', new Float32BufferAttribute(g.uv, 2));
    geo.setIndex(new Uint32BufferAttribute(g.index, 1));
    geo.computeVertexNormals();
    const m = new Mesh(geo, bend(new MeshLambertMaterial({ color: GROUND_K })));
    m.frustumCulled = false;
    m.receiveShadow = true;
    m.userData.z0 = PLAN.z0 + i * CHUNK_D;
    chunks.push(m);
    scene.add(m);
  }
  let groundUrls: readonly string[] = [];
  function ground(urls: readonly string[]) {
    groundUrls = urls;
    urls.forEach((u, i) => {
      pending++;
      tex.loadAsync(u).then((t) => {
        pending--;
        if (disposed || groundUrls !== urls) return t.dispose();
        t.colorSpace = SRGBColorSpace;
        t.anisotropy = 4;
        const mm = chunks[i].material as MeshLambertMaterial;
        mm.map?.dispose();
        mm.map = t;
        mm.color.set(GROUND_K);
        mm.needsUpdate = true;
        invalidate();
      }, () => void pending--);
    });
  }

  // ---- the water ----
  const water = createWater();
  for (const m of water.all) scene.add(m);

  // ---- the models ----
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const base = new URL(`room/world3d/`, new URL(document.baseURI)).href;
  const gltfs = new Map<ModelName, Promise<GLTF | null>>();
  const model = (name: ModelName) => {
    let p = gltfs.get(name);
    if (!p) {
      pending++;
      p = loader.loadAsync(`${base}${name}.glb?v=${W3D.models[name].v}`).then((g) => (pending--, g), (e: unknown) => {
        pending--;
        console.warn('world3d: model', name, e);
        return null;
      });
      gltfs.set(name, p);
    }
    return p;
  };
  /** NH's soft look, cheaper than PBR: every model's material as a Lambert (its map, cut-out and night light kept). */
  const lit: MeshLambertMaterial[] = [], lifted: MeshLambertMaterial[] = [];
  const toLambert = (m: Material): MeshLambertMaterial => {
    const s = m as MeshStandardMaterial;
    // the lift is the albedo itself as the emissive (no extra texture); a lamp's own emissive map is its night light
    const own = !!s.emissiveMap;
    const l = new MeshLambertMaterial({
      map: s.map, color: s.color, transparent: s.transparent, opacity: s.opacity, alphaTest: s.alphaTest, side: s.side, depthWrite: s.depthWrite,
      emissive: own ? new Color(0xffe2a8) : s.map ? new Color(0xffffff) : s.color.clone(), emissiveMap: own ? s.emissiveMap : s.map,
      emissiveIntensity: own ? todLook.lamps : todLook.lift
    });
    // foliage (cut out: NH's leaf cards) is lit through: more lift
    l.userData.lift = s.alphaTest ? 1.5 : 1;
    l.emissiveIntensity *= own ? 1 : l.userData.lift;
    (own ? lit : lifted).push(l);
    return bend(l);
  };
  /** A bent depth material for a caster's shadow (its cut-out kept). */
  const depthOf = (m: MeshLambertMaterial) =>
    bend(new MeshDepthMaterial({ depthPacking: RGBADepthPacking, map: m.alphaTest ? m.map : null, alphaTest: m.alphaTest }));

  interface Group3 {
    list: Inst[];
    meshes: { im: InstancedMesh; local: Matrix4 }[];
    base: Matrix4[];
  }
  const groups = new Map<ModelName, Group3>();
  const instAt = new Map<string, { g: Group3; i: number; inst: Inst; h: number }>();
  const jiggles = new Map<string, number>();
  const tmpM = new Matrix4(), tmpQ = new Quaternion(), tmpV = new Vector3(), tmpS = new Vector3(), up = new Vector3(0, 1, 0);
  /** An instance's matrix (three's space): its spot on the ground, its yaw, its scale. */
  const matOf = (o: Inst, out: Matrix4, wobble = 0, squash = 0) => {
    tmpQ.setFromAxisAngle(up, o.yaw ?? 0);
    if (wobble) tmpQ.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), wobble));
    tmpS.set(o.scale * (1 + squash), o.scale * (1 - squash), o.scale * (1 + squash));
    const y = (o.lift ?? 0) + (o.model === 'bridge-stone' ? groundHeight(o.x, o.z - 30) - 1 : groundHeight(o.x, o.z));
    return out.compose(tmpV.set(o.x, y, -o.z), tmpQ, tmpS);
  };
  async function place(list: readonly Inst[]) {
    const by = new Map<ModelName, Inst[]>();
    for (const o of list) (by.get(o.model) ?? by.set(o.model, []).get(o.model)!).push(o);
    lampSpots = list.filter((o) => /lantern|streetlamp|campfire|tent/.test(o.model)).map((o) => ({
      x: o.x, z: o.z, fire: o.model === 'campfire',
      y: groundHeight(o.x, o.z) + (o.model === 'streetlamp' ? 42 : o.model === 'tent' ? 30 : o.model === 'campfire' ? 14 : 18)
    }));
    await Promise.all([...by].map(async ([name, insts]) => {
      const g = await model(name);
      if (!g || disposed) return;
      g.scene.updateMatrixWorld(true);
      const grp: Group3 = { list: insts, meshes: [], base: [] };
      g.scene.traverse((n) => {
        const mesh = n as Mesh;
        if (!mesh.isMesh) return;
        const mat = toLambert(mesh.material as Material);
        const im = new InstancedMesh(mesh.geometry, mat, insts.length);
        im.frustumCulled = false;
        im.castShadow = true;
        im.receiveShadow = true;
        im.customDepthMaterial = depthOf(mat);
        // a flower's petals take its colour
        const mname = (mesh.material as Material).name;
        if (insts.some((o) => o.tint !== undefined) && /Flower|Petal|Flow|Bloom/.test(mname) && !/Body|Leaf/.test(mname))
          insts.forEach((o, i) => im.setColorAt(i, new Color(o.tint ?? 0xffffff)));
        grp.meshes.push({ im, local: mesh.matrixWorld.clone() });
        scene.add(im);
      });
      const h = W3D.models[name].max[1];
      insts.forEach((o, i) => {
        grp.base.push(matOf(o, new Matrix4()));
        instAt.set(o.id, { g: grp, i, inst: o, h: h * o.scale });
      });
      writeGroup(grp);
      groups.set(name, grp);
      invalidate();
    }));
    readyFn();
  }
  function writeGroup(grp: Group3, only?: number) {
    for (const { im, local } of grp.meshes) {
      for (let i = 0; i < grp.base.length; i++) {
        if (only !== undefined && i !== only) continue;
        im.setMatrixAt(i, tmpM.multiplyMatrices(grp.base[i], local));
      }
      im.instanceMatrix.needsUpdate = true;
    }
  }
  function jiggle(id: string) {
    if (!instAt.has(id)) return;
    jiggles.set(id, now());
    invalidate();
  }

  // ---- the villagers: billboards at their feet, leaning back a little toward the camera ----
  interface Walker {
    look: Look;
    card: Mesh;
    mat: MeshBasicMaterial;
    shadow: Mesh;
    pos: [number, number];
    face: number;
    path: { pts: [number, number][]; t0: number; lens: number[]; total: number; from: [number, number] } | null;
    hop: number;
  }
  const villagers = new Map<Who, Walker>();
  const disc = softDisc();
  const cardGeo = new PlaneGeometry(1, 1).translate(0, 0.5, 0);
  const shadowGeo = new CircleGeometry(22, 20).rotateX(-Math.PI / 2);
  const shadowMat = bend(new MeshBasicMaterial({ map: disc, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
  function villager(who: Who, look: Look | null, at: readonly [number, number]) {
    const was = villagers.get(who);
    if (was) {
      scene.remove(was.card, was.shadow);
      was.mat.map?.dispose();
      was.mat.dispose();
      villagers.delete(who);
    }
    if (!look) return invalidate();
    const mat = bend(new MeshBasicMaterial({ alphaTest: 0.5, side: DoubleSide, color: todLook.villager }));
    mat.visible = false;
    const card = new Mesh(cardGeo, mat);
    card.frustumCulled = false;
    card.castShadow = true;
    card.customDepthMaterial = bend(new MeshDepthMaterial({ depthPacking: RGBADepthPacking, alphaTest: 0.5 }));
    const shadow = new Mesh(shadowGeo, shadowMat);
    shadow.frustumCulled = false;
    shadow.renderOrder = 4;
    const w: Walker = { look, card, mat, shadow, pos: [at[0], at[1]], face: who === 'A' ? 1 : -1, path: null, hop: 0 };
    villagers.set(who, w);
    scene.add(card, shadow);
    pending++;
    tex.loadAsync(look.url).then((t) => {
      pending--;
      if (disposed || villagers.get(who) !== w) return t.dispose();
      t.colorSpace = SRGBColorSpace;
      mat.map = t;
      (card.customDepthMaterial as MeshDepthMaterial).map = t;
      mat.visible = true;
      mat.needsUpdate = true;
      placeWalker(w);
      invalidate();
    }, () => void pending--);
    placeWalker(w);
  }
  function placeWalker(w: Walker, bob = 0, squash = 0) {
    const flip = !w.look.noMirror && (w.face > 0) !== w.look.looksRight;
    const y = feetY(w.pos[0], w.pos[1]);
    w.card.position.set(w.pos[0], y + bob, -w.pos[1]);
    w.card.rotation.set(-pitch * 0.42, 0, 0);
    w.card.scale.set(VILLAGER_H * w.look.aspect * (flip ? -1 : 1) * (1 + squash), VILLAGER_H * (1 - squash), 1);
    w.shadow.position.set(w.pos[0], y + 0.4, -w.pos[1]);
    const s = 1 - Math.min(0.3, bob / 40);
    w.shadow.scale.set(s, 1, s * 0.7);
  }
  function walk(who: Who, pts: readonly (readonly [number, number])[]) {
    const w = villagers.get(who);
    if (!w || !pts.length) return 0;
    const lens: number[] = [];
    let at: readonly number[] = w.pos, total = 0;
    for (const p of pts) {
      const d = Math.hypot(p[0] - at[0], p[1] - at[1]);
      lens.push(d);
      total += d;
      at = p;
    }
    w.path = { pts: pts.map((p) => [p[0], p[1]]), t0: now(), lens, total, from: [w.pos[0], w.pos[1]] };
    activity();
    return (total / SPEED) * 1000;
  }
  function along(w: Walker, t: number) {
    const P = w.path!;
    let d = ((t - P.t0) / 1000) * SPEED;
    let a = P.from;
    for (let i = 0; i < P.pts.length; i++) {
      const b = P.pts[i], L = P.lens[i];
      if (d <= L) {
        const k = L ? d / L : 1;
        return { p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k] as [number, number], dx: b[0] - a[0], done: false };
      }
      d -= L;
      a = b;
    }
    return { p: P.pts[P.pts.length - 1], dx: 0, done: true };
  }

  // ---- the camera ----
  let camZ = 110, camX = 195, zoomK = 1, pitch = (PITCH.def * Math.PI) / 180;
  let W = 1, H = 1;
  /** The camera's distance at zoom 1: the island's 390u fill the width at the pivot. */
  let D0 = 1500;
  const P0 = init.pitch ?? PITCH.def, PN = P0 + PITCH.near - PITCH.def, PF = P0 + PITCH.far - PITCH.def;
  const pitchAt = (k: number) => {
    const deg = k >= 1 ? P0 + (PN - P0) * Math.min(1, (k - 1) / (ZOOM.max - 1)) : P0 + (PF - P0) * Math.min(1, (1 - k) / (1 - ZOOM.min));
    return (deg * Math.PI) / 180;
  };
  const visW = () => 2 * (D0 / zoomK) * Math.tan(((FOV / 2) * Math.PI) / 180) * (W / H);
  function clampCam() {
    camZ = Math.max(CAM_Z.min, Math.min(CAM_Z.max, camZ));
    const half = visW() / 2, land = (LAND.x1 - LAND.x0) / 2 + 30, mid = (LAND.x0 + LAND.x1) / 2;
    const slack = Math.max(0, land - half);
    camX = Math.max(mid - slack, Math.min(mid + slack, camX));
    if (slack === 0) camX = 195 + (camX - 195) * 0.0;
  }
  function aim() {
    clampCam();
    pitch = pitchAt(zoomK);
    const D = D0 / zoomK;
    camera.position.set(camX, D * Math.sin(pitch), -camZ + D * Math.cos(pitch));
    camera.lookAt(camX, 0, -camZ);
    camera.updateMatrixWorld();
    bendU.uBendZ.value = -camZ;
    fog.near = D * 1.25;
    fog.far = D * 3.2;
    waterFog(fog as FogT);
    // the shadow's box follows the pivot
    sun.position.set(camX + todLook.sunAt[0] * 600, todLook.sunAt[1] * 600, -camZ + todLook.sunAt[2] * 600);
    sun.target.position.set(camX, 0, -camZ - 60);
    sun.target.updateMatrixWorld();
    shadowsDirty = true;
    // the ground chunks in reach (the bend drops the far ones behind the horizon)
    for (const c of chunks) {
      const z0 = c.userData.z0 as number;
      c.visible = z0 + CHUNK_D > camZ - 700 && z0 < camZ + 1400;
    }
    for (const w of villagers.values()) placeWalker(w);
    // the night's lamps nearest the pivot
    const near = [...lampSpots].sort((a, b) => Math.abs(a.z - camZ - 150) - Math.abs(b.z - camZ - 150)).slice(0, LIGHTS);
    lamps.forEach((l, i) => {
      const s = near[i];
      if (!s) return void (l.intensity = 0);
      const [x, y, z] = bendPoint(s.x, s.y, -s.z, -camZ, bendU.uBendR.value);
      l.position.set(x, y, z);
      l.userData.fire = s.fire;
      l.userData.base = todLook.lamps * (s.fire ? 2600 : 1500);
      l.intensity = l.userData.base;
    });
  }
  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    // 420u across at the pivot (the land is 470: its beaches just off the sides, as today)
    D0 = 420 / (2 * Math.tan(((FOV / 2) * Math.PI) / 180) * camera.aspect);
    // the pivot (the ground the camera looks at) a little below the middle: more island ahead, the horizon high
    camera.setViewOffset(W, H, 0, -PIVOT_DROP * H, W, H);
    camera.updateProjectionMatrix();
    aim();
    invalidate();
  }

  // gestures
  let touch = false, vel: [number, number] = [0, 0], lastT = 0;
  const unitsPerPx = () => (2 * (D0 / zoomK) * Math.tan(((FOV / 2) * Math.PI) / 180)) / H;
  function pan(dx: number, dy: number) {
    const k = unitsPerPx();
    camX -= dx * k;
    camZ += (dy * k) / Math.sin(pitch);
    aim();
    activity();
  }
  function zoom(f: number) {
    zoomK = Math.max(ZOOM.min, Math.min(ZOOM.max, zoomK * f));
    aim();
    activity();
  }
  function fling(vx: number, vy: number) {
    vel = [vx, vy];
    lastT = now();
    activity();
  }

  // ---- time of day ----
  let skyTex: CanvasTexture | null = null;
  function tod(t: Tod) {
    todLook = TOD[t];
    skyTex?.dispose();
    skyTex = skyTexture(...todLook.sky);
    scene.background = skyTex;
    fog.color.set(todLook.fog);
    hemi.color.set(todLook.hemi[0]);
    hemi.groundColor.set(todLook.hemi[1]);
    hemi.intensity = todLook.hemi[2];
    sun.color.set(todLook.sun[0]);
    sun.intensity = todLook.sun[1];
    waterU.uTint.value.set(todLook.tint);
    for (const m of lit) m.emissiveIntensity = todLook.lamps;
    for (const m of lifted) m.emissiveIntensity = todLook.lift * m.userData.lift;
    for (const w of villagers.values()) w.mat.color.set(todLook.villager);
    aim();
    invalidate();
  }

  // ---- taps ----
  const ndc = new Vector3();
  function client(x: number, y: number, z: number): [number, number] {
    const [bx, by, bz] = bendPoint(x, y, -z, -camZ, bendU.uBendR.value);
    ndc.set(bx, by, bz).project(camera);
    const r = canvas.getBoundingClientRect();
    return [r.left + ((ndc.x + 1) / 2) * r.width, r.top + ((1 - ndc.y) / 2) * r.height];
  }
  function groundAt(cx: number, cy: number): [number, number] | null {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1, 0.5).unproject(camera);
    const o = camera.position, d = ndc.sub(o).normalize();
    let h = 3, hitP: [number, number] | null = null;
    for (let i = 0; i < 3; i++) {
      const p = unbendRay([o.x, o.y, o.z], [d.x, d.y, d.z], h, -camZ, bendU.uBendR.value);
      if (!p) return hitP;
      hitP = [p[0], -p[1]];
      h = Math.max(-2, groundHeight(hitP[0], hitP[1]));
    }
    return hitP;
  }
  function hit(cx: number, cy: number): Hit | null {
    // the villagers first (in front), then the things (their screen box from foot to top), nearest the camera first
    let best: { h: Hit; depth: number } | null = null;
    const consider = (hh: Hit, x: number, z: number, h: number, wFrac: number, y0 = 0) => {
      const [fx, fy] = client(x, feetY(x, z) + y0, z), [, ty] = client(x, feetY(x, z) + y0 + h, z);
      const hpx = Math.max(24, fy - ty), wpx = Math.max(36, hpx * wFrac);
      if (cx < fx - wpx / 2 || cx > fx + wpx / 2 || cy < ty || cy > fy + 10) return;
      const depth = -z;
      if (!best || depth > best.depth) best = { h: hh, depth };
    };
    for (const [who, w] of villagers) consider({ kind: 'villager', who }, w.pos[0], w.pos[1], VILLAGER_H * 0.9, w.look.aspect * 0.8);
    for (const [id, a] of instAt) {
      const o = a.inst;
      if (!o.tap) continue;
      const frac = o.tap === 'tree' ? 0.55 : o.tap === 'tent' ? 1.4 : 1;
      consider({ kind: 'thing', id, tap: o.tap, x: o.x, z: o.z }, o.x, o.z, Math.max(18, a.h), frac, o.lift ?? 0);
    }
    if (best) return (best as { h: Hit }).h;
    const g = groundAt(cx, cy);
    return g ? { kind: 'ground', x: g[0], z: g[1] } : null;
  }

  // ---- options ----
  function options(o: Partial<Options>) {
    Object.assign(opts, o);
    if (o.dpr !== undefined) {
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
  let raf = 0, frames = 0, disposed = false, shadowsDirty = true, pending = 0, activeUntil = 0, lastFrame = 0;
  const cpu: number[] = [], gaps: number[] = [], stamps: number[] = [];
  let readyFn: () => void = () => {};
  const ready = new Promise<void>((r) => (readyFn = r));
  const activity = (ms = 400) => {
    activeUntil = Math.max(activeUntil, now() + ms);
    invalidate();
  };
  function invalidate() {
    if (!raf && !disposed) raf = requestAnimationFrame(frame);
  }
  const HOP_MS = 420, JIG_MS = 520;
  function frame() {
    raf = 0;
    if (disposed || document.hidden) return;
    const t = now();
    const active = touch || t < activeUntil;
    // 30 a second when only the water moves (or at the 30 cap): display frames in between are skipped
    const minGap = !active || opts.cap === 30 ? 1000 / 30 - 4 : 1000 / 60 - 4;
    if (lastFrame && t - lastFrame < minGap) {
      raf = requestAnimationFrame(frame);
      return;
    }
    let more = false;
    // the fling: iOS's deceleration
    if (!touch && (vel[0] || vel[1])) {
      const dt = Math.min(50, t - lastT);
      lastT = t;
      const k = unitsPerPx();
      camX -= vel[0] * dt * k;
      camZ += (vel[1] * dt * k) / Math.sin(pitch);
      const decay = Math.exp(-dt / 325);
      vel = [vel[0] * decay, vel[1] * decay];
      if (Math.hypot(vel[0], vel[1]) < 0.01) vel = [0, 0];
      aim();
      more = true;
    }
    for (const w of villagers.values()) {
      let bob = 0, squash = 0;
      if (w.path) {
        const a = along(w, t);
        w.pos = a.p;
        if (Math.abs(a.dx) > 0.5) w.face = Math.sign(a.dx);
        if (a.done) w.path = null;
        else {
          const ph = ((t - w.path.t0) / 1000) * Math.PI * 5;
          bob = Math.abs(Math.sin(ph)) * 4.5;
          squash = Math.max(0, Math.cos(ph * 2)) * 0.04;
          more = true;
        }
        shadowsDirty = true;
      }
      if (w.hop) {
        const k = (t - w.hop) / HOP_MS;
        if (k >= 1) w.hop = 0;
        else {
          bob += Math.sin(k * Math.PI) * 16;
          more = true;
        }
      }
      placeWalker(w, bob, squash);
    }
    for (const [id, t0] of jiggles) {
      const a = instAt.get(id)!;
      const k = (t - t0) / JIG_MS;
      if (k >= 1) {
        jiggles.delete(id);
        matOf(a.inst, a.g.base[a.i]);
      } else {
        matOf(a.inst, a.g.base[a.i], Math.sin(k * Math.PI * 4) * 0.06 * (1 - k), Math.sin(k * Math.PI * 3) * 0.04 * (1 - k));
        more = true;
      }
      writeGroup(a.g, a.i);
    }
    if (opts.water) waterU.uTime.value = (t / 1000) % 3600;
    // the campfire flickers
    if (todLook.lamps) for (const l of lamps) if (l.userData.fire) l.intensity = l.userData.base * (0.85 + 0.15 * Math.sin(t / 90) * Math.sin(t / 37));
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
    if (more) activity(100);
    // the water keeps the loop going (at 30 when still); without it, only what moves does
    if (more || active || opts.water || (todLook.lamps && lamps.some((l) => l.userData.fire))) invalidate();
  }
  const onVis = () => {
    lastFrame = 0;
    if (!document.hidden) invalidate();
  };
  document.addEventListener('visibilitychange', onVis);

  resize();
  tod('day');
  if (opts.shadows) options({ shadows: true });

  return {
    resize, place, ground, villager, walk, tod, pan, zoom, fling, hit, client, options, jiggle,
    at: (who) => (villagers.get(who)?.pos.slice() as [number, number] | undefined) ?? null,
    put(who, p) {
      const w = villagers.get(who);
      if (!w) return;
      w.path = null;
      w.pos = [p[0], p[1]];
      placeWalker(w);
      activity();
    },
    hop(who) {
      const w = villagers.get(who);
      if (w && !w.hop) {
        w.hop = now();
        activity();
      }
    },
    touching(on) {
      touch = on;
      if (on) vel = [0, 0];
      renderer.setPixelRatio(on ? Math.min(1.5, opts.dpr) : opts.dpr);
      activity();
    },
    view: () => ({ camZ, camX, zoom: zoomK }),
    go(z, k) {
      camZ = z;
      if (k) zoomK = k;
      vel = [0, 0];
      aim();
      activity();
    },
    stats: () => {
      const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
      return {
        fps: stamps.length, cpu: [pctl(cpu, 0.5), pctl(cpu, 0.95)], gap: [pctl(gaps, 0.5), pctl(gaps, 0.95)],
        calls: renderer.info.render.calls, tris: renderer.info.render.triangles, textures: renderer.info.memory.textures,
        geometries: renderer.info.memory.geometries, heap: mem ? mem.usedJSHeapSize / 1048576 : null, dpr: renderer.getPixelRatio(),
        frames, loading: pending, camZ, zoom: zoomK
      };
    },
    ready,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      const seen = new Set<object>();
      scene.traverse((n) => {
        const m = n as Mesh;
        if (m.geometry && !seen.has(m.geometry)) (seen.add(m.geometry), m.geometry.dispose());
        const ms = (m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : []) as Material[];
        for (const x of ms) {
          if (seen.has(x)) continue;
          seen.add(x);
          for (const v of Object.values(x)) if (v instanceof Texture && !seen.has(v)) (seen.add(v), v.dispose());
          x.dispose();
        }
        if ((n as InstancedMesh).isInstancedMesh) (n as InstancedMesh).dispose();
      });
      skyTex?.dispose();
      disc.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      villagers.clear();
      groups.clear();
      instAt.clear();
    }
  };
}

