// The 3D island's things (docs/design.md "World"): NH's models (static/room/world3d, the world3d manifest), one
// InstancedMesh per model and material, placed from a layout (a list of instances by id: the island layout's,
// objects.ts placeObjects). A new list rebuilds only the models whose instances changed.
// Each instance can be hidden, moved (a fruit falling), greyed (a fruit not yet grown) or set wobbling (a tap, a shake)
// without a rebuild. Every material is a Lambert (NH's soft look, cheaper than PBR), bent (bend.ts); a lamp's own _Emi
// map is its night light (lights.ts adds its halo and its pool).
import {
  BackSide, Color, DoubleSide, FrontSide, InstancedBufferAttribute, InstancedMesh, Matrix4, MeshDepthMaterial, MeshLambertMaterial, Quaternion,
  RGBADepthPacking, Vector3, Vector4, type Material, type Mesh, type MeshStandardMaterial, type Object3D, type Scene, type Side
} from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { bend } from './bend.ts';
import { twoPass } from './sides.ts';
import type { Inst, ModelName } from './objects.ts';
import type { LampSpot } from './lights.ts';
import { MODELS } from './models3d.ts';
import { ASSET_KEYS } from './assets.ts';
import { nightLift, nightTag } from './nightLift.ts';
import { procScene } from './proc3d.ts';
import { FLAPS, flapGlsl, wingHinge } from './wings.ts';

/** Where a lit model's light is (a share of its height), its colour and the halo's and pool's sizes (u). */
const LAMP: Partial<Record<string, { at: number; kind: LampSpot['kind']; colour: number; glow: number; pool: number; dz?: number }>> = {
  streetlamp: { at: 0.9, kind: 'lamp', colour: 0xffd38a, glow: 15, pool: 46 },
  'garden-lantern': { at: 0.62, kind: 'lamp', colour: 0xffc070, glow: 9, pool: 26 },
  'garden-lantern-white': { at: 0.62, kind: 'lamp', colour: 0xfff0c8, glow: 9, pool: 26 },
  campfire: { at: 0.32, kind: 'fire', colour: 0xff9a4a, glow: 20, pool: 60 },
  tent: { at: 0.3, kind: 'window', colour: 0xffd9a0, glow: 26, pool: 44, dz: -14 },
  'deco/campsite-winter': { at: 0.3, kind: 'window', colour: 0xffd9a0, glow: 26, pool: 44, dz: -14 },
  'deco/mushroom-lamp': { at: 0.86, kind: 'lamp', colour: 0xffd38a, glow: 11, pool: 30 },
  'deco/nut-lamp': { at: 0.62, kind: 'lamp', colour: 0xffd38a, glow: 11, pool: 30 },
  'deco/bamboo-shoot-lamp': { at: 0.5, kind: 'lamp', colour: 0xffd38a, glow: 11, pool: 30 },
  'deco/illumi-tree': { at: 0.5, kind: 'lamp', colour: 0xfff0c8, glow: 22, pool: 40 },
  'decor/stone-lantern': { at: 0.6, kind: 'lamp', colour: 0xffc070, glow: 9, pool: 26 },
  'events/spooky-lantern': { at: 0.45, kind: 'fire', colour: 0xffa040, glow: 12, pool: 30 },
  'events/countdown-board': { at: 0.6, kind: 'window', colour: 0xfff0c8, glow: 18, pool: 30 }
};

/** The models that cast no shadow (assets.json `shadow`: the flat things, a fish's shadow, a dig spot, the
 *  flourishes): no caster in the shadow map, and a move of one doesn't redraw it (a fish swimming redrew the whole
 *  island's map every frame). */
const FLAT = (() => {
  const casts = new Map<string, boolean>();
  for (const k of Object.values(ASSET_KEYS)) casts.set(k.m, (casts.get(k.m) ?? false) || k.shadow);
  return new Set([...casts].filter(([, c]) => !c).map(([m]) => m));
})();
/** The bugs' models: a bug's move redraws the shadow map at most every BUG_SHADOW_MS (and once more where it stops),
 *  not every frame (a crawling stinkbug redrew the whole island's map 25 times a second for its speck of a shadow). */
const BUGS = (() => {
  const bug = new Map<string, boolean>();
  for (const k of Object.values(ASSET_KEYS)) bug.set(k.m, (bug.get(k.m) ?? true) && k.cat === 'bug');
  return new Set([...bug].filter(([, b]) => b).map(([m]) => m));
})();
const BUG_SHADOW_MS = 66;
/** The critters' models (assets.json `cat` bug or shadow: a bug, a fish's or a dive's shadow): never popped in or out.
 *  One fades in (its opacity and a slight scale-up) where it first stands or is shown again, and fades out where it's
 *  hidden or taken away (kept, still placed by `over`, until it's gone): FADE_IN_MS, FADE_OUT_MS. Each instance's
 *  opacity is its own (an aFade per instance; a bug's shadow drawn while it's more than half there). */
const SOFT = (() => {
  const soft = new Map<string, boolean>();
  for (const k of Object.values(ASSET_KEYS)) soft.set(k.m, (soft.get(k.m) ?? true) && (k.cat === 'bug' || k.cat === 'shadow'));
  return new Set([...soft].filter(([, s]) => s).map(([m]) => m));
})();
/** The fish's and the dive's shadows (assets.json `cat` shadow): under the water, yet drawn after it (UNDER_WATER), so
 *  the water never washes them out: the fresh water is 74% opaque (terrain.ts FRESH_FRAG) and the deep sea opaque, and
 *  a shadow drawn first (renderOrder 0) showed through as a tenth of itself, nothing over the dark bed of a pond or a
 *  river. The ground still hides one (it's opaque, drawn first, depth-tested); the falls' sheet and the foam (3) go
 *  over it. */
const SHADOWS = (() => {
  const sh = new Map<string, boolean>();
  for (const k of Object.values(ASSET_KEYS)) sh.set(k.m, (sh.get(k.m) ?? true) && k.cat === 'shadow');
  return new Set([...sh].filter(([, s]) => s).map(([m]) => m));
})();
/** After the sea (1) and the fresh water and the ponds (2), under the falls and the foam (3). */
const UNDER_WATER = 2.5;
/** A flier's wings' hinge from its meshes' positions (in their own, quantized space: what the shader sees), and which
 *  of its meshes flap. */
function hingeOf(root: Object3D): { at: Vector4; flaps: Map<Mesh, boolean> } {
  const meshes: Mesh[] = [];
  root.traverse((n) => void ((n as Mesh).isMesh && meshes.push(n as Mesh)));
  const parts = meshes.map((m) => {
    const a = m.geometry.attributes.position, pos = new Float32Array(a.count * 3);
    for (let i = 0; i < a.count; i++) (pos[i * 3] = a.getX(i)), (pos[i * 3 + 1] = a.getY(i)), (pos[i * 3 + 2] = a.getZ(i));
    return { pos, wing: /wing/i.test((m.material as Material).name) };
  });
  const h = wingHinge(parts);
  return { at: new Vector4(h.x, h.y, h.root, h.ramp), flaps: new Map(meshes.map((m, i) => [m, h.flaps[i]])) };
}
const FADE_IN_MS = 600, FADE_OUT_MS = 600;
/** A frame's step of a fade at most (ms): a slow frame never jumps it (a fade is never 0 → 1 in one frame). */
const FADE_STEP_MS = 50;

/** An instance's change in place; `fade`: its opacity, the caller's own (a find washing in: Finds.svelte), drawn
 *  through the critters' per-instance fade (its model's group rebuilds to take one the first time). */
type Over = { hidden?: boolean; x?: number; z?: number; lift?: number; grey?: number; yaw?: number; pitch?: number; size?: number; face?: boolean; fade?: number };

export interface Things {
  /** The layout's things (a full list: only the models whose instances changed rebuild). */
  place(list: readonly Inst[]): Promise<void>;
  /** Add or change things beside the layout's (by id), and take them away. */
  set(list: readonly Inst[]): Promise<void>;
  remove(ids: readonly string[]): Promise<void>;
  /** Change one instance in place (hidden, moved, greyed); `cast` false: it casts no shadow worth redrawing the
   *  shadow map for (a leaf on the stream). */
  over(id: string, o: Over | null, cast?: boolean): void;
  /** A flier's wings' angle now (radians, up from flat): its attribute alone, nothing else redone (FLAPS). */
  flap(id: string, angle: number): void;
  jiggle(id: string, strength?: number): void;
  /** The lights of what stands now. */
  lamps(): LampSpot[];
  /** The time of day: the lamps' emissive level and the soft self-light ("lift"). */
  tod(lamps: number, lift: number): void;
  /** One frame (the wobbles): true while one runs. */
  frame(t: number): boolean;
  has(id: string): boolean;
  /** An instance shows another model for now (its pose: the shishi-odoshi tipped), or its own again (null). */
  swap(id: string, model: string | null): void;
  /** The camera turned: the billboards turn with it. */
  camera(q: Quaternion): void;
  /** Something of the scene's own on an instance (the board's face: docs/board.md), in its model's units, placed, turned,
   *  scaled and bent with it; null takes it off. */
  attach(id: string, obj: Object3D | null): void;
  /** Where an instance stands now (three's space), whether it's hidden, its opacity (a critter fading in or out: 1
   *  otherwise) and its scale over its own (the e2e). */
  groups(): unknown;
  where(id: string): { x: number; y: number; z: number; hidden: boolean; model: string; fade: number; scale: number; order: number } | null;
  /** An instance's solid as a few of its outermost points (three's space, unbent; null: not built): what the camera
   *  sees of it is their hull (a building's tap area: camera.svelte.ts `body`). */
  outline(id: string): readonly Vector3[] | null;
  pending(): number;
  dispose(): void;
}

/** The ways an outline looks for a model's outermost points: 64 spread over the sphere (a Fibonacci lattice). */
const SHAPE_DIRS: readonly Vector3[] = Array.from({ length: 64 }, (_, i) => {
  const y = 1 - ((i + 0.5) / 64) * 2, r = Math.sqrt(1 - y * y), a = i * Math.PI * (3 - Math.sqrt(5));
  return new Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
});

/** The models as loaded (fetched, decoded: CPU-side), by URL, kept across the island's mounts: back from a room it
 *  builds from them at once, with no fetch, meshopt or image decode again (~60 of them). Each mount's GPU copies go with
 *  its renderer (dispose: three uploads them again to the next). A failed load isn't kept. */
const loaded = new Map<string, Promise<GLTF | null>>();
let loader: GLTFLoader | null = null;
function load(url: string, name: string): Promise<GLTF | null> {
  let p = loaded.get(url);
  if (p) return p;
  if (!loader) (loader = new GLTFLoader()).setMeshoptDecoder(MeshoptDecoder);
  p = loader.loadAsync(url).catch((e: unknown) => {
    console.warn('world3d: model', name, e);
    loaded.delete(url);
    return null;
  });
  loaded.set(url, p);
  return p;
}

export function createThings(scene: Scene, height: (x: number, z: number) => number, changed: (shadows?: boolean, soon?: boolean) => void): Things {
  const base = new URL(`room/world3d/`, new URL(document.baseURI)).href;
  let pending = 0, disposed = false, bugShadowAt = -Infinity, bugTimer: ReturnType<typeof setTimeout> | 0 = 0;
  /** This mount's models (its own scene's for proc/; the shared loads' for the rest), and those in (on its GPU, once
   *  built: what its dispose lets go of). */
  const gltfs = new Map<ModelName, Promise<GLTF | null>>(), got = new Set<GLTF>();
  const model = (name: ModelName) => {
    let p = gltfs.get(name);
    if (!p && name.startsWith('proc/')) {
      // the island's own (proc3d.ts): built in code
      const scene = procScene(name), g = scene ? ({ scene } as unknown as GLTF) : null;
      if (g) got.add(g);
      p = Promise.resolve(g);
      gltfs.set(name, p);
    }
    if (!p) {
      pending++;
      p = load(`${base}${name}.glb?v=${MODELS[name]?.v ?? 0}`, name).then((g) => (pending--, g && got.add(g), g));
      gltfs.set(name, p);
    }
    return p;
  };

  // ---- materials: each model's once ----
  const lit: MeshLambertMaterial[] = [], lifted: MeshLambertMaterial[] = [];
  let lampLevel = 0, liftLevel = 0.32;
  type Mats = { m: MeshLambertMaterial; front: MeshLambertMaterial | null; depth: MeshDepthMaterial };
  const mats = new Map<Material, Mats>();
  const softMats = new Map<Material, Mats>();
  function lambert(src: Material, grey: boolean, soft = false, flap: Vector4 | null = null): Mats {
    const had = (soft ? softMats : mats).get(src);
    if (had) return had;
    // a see-through two-sided one as two (sides.ts): its back faces' material, then its front's
    const two = twoPass(src.transparent || soft, src.side);
    const m = one(src, grey, soft, flap, two ? BackSide : src.side);
    const front = two ? one(src, grey, soft, flap, FrontSide) : null;
    if (two) m.shadowSide = DoubleSide;
    // the shadow map is drawn flat (unbent): three's receivers look it up at their unbent world position, so a shadow
    // lands right however far from the pivot, and the map needn't redraw as the camera scrolls (the bend moves)
    const depth = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, map: m.alphaTest ? m.map : null, alphaTest: m.alphaTest });
    if (soft) {
      // (a fading critter's shadow: there while it's more than half there)
      depth.onBeforeCompile = (sh) => {
        sh.vertexShader = 'attribute float aFade;\nvarying float vFade;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvFade = aFade;');
        sh.fragmentShader = 'varying float vFade;\n' + sh.fragmentShader.replace('#include <alphatest_fragment>', '#include <alphatest_fragment>\nif (vFade < 0.5) discard;');
      };
      depth.customProgramCacheKey = () => 'fade';
    }
    const r = { m, front, depth };
    (soft ? softMats : mats).set(src, r);
    return r;
  }
  function one(src: Material, grey: boolean, soft: boolean, flap: Vector4 | null, side: Side): MeshLambertMaterial {
    const s = src as MeshStandardMaterial;
    const own = !!s.emissiveMap;
    const m = new MeshLambertMaterial({
      map: s.map, color: s.color, transparent: s.transparent || soft, opacity: s.opacity, alphaTest: grey ? 0 : s.alphaTest, side, depthWrite: s.depthWrite,
      emissive: own ? new Color(0xffe2a8) : s.map ? new Color(0xffffff) : s.color.clone(), emissiveMap: own ? s.emissiveMap : s.map
    });
    // foliage (cut out: NH's leaf cards) is lit through: more lift
    m.userData.lift = s.alphaTest ? 1.5 : 1;
    m.emissiveIntensity = own ? lampLevel : liftLevel * m.userData.lift;
    (own ? lit : lifted).push(m);
    if (grey) {
      // a fruit not yet grown: its colour drained toward grey by the instance's aGrey (the 2D island's filter)
      m.onBeforeCompile = (sh) => {
        sh.vertexShader = 'attribute float aGrey;\nvarying float vGrey;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvGrey = aGrey;');
        sh.fragmentShader = 'varying float vGrey;\n' + sh.fragmentShader.replace('#include <map_fragment>',
          '#include <map_fragment>\nfloat gl = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(gl * 0.9 + 0.08), vGrey);');
      };
      m.customProgramCacheKey = () => 'grey';
    }
    if (soft) {
      // a critter's: its instance's aFade is its opacity (fading in or out); a flier's aFlap its wings' angle
      const uFlap = flap && { value: flap };
      m.onBeforeCompile = (sh) => {
        if (uFlap) sh.uniforms.uFlap = uFlap;
        sh.vertexShader = `attribute float aFade;\nvarying float vFade;\n${uFlap ? 'attribute float aFlap;\nuniform vec4 uFlap;\n' : ''}` +
          sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\nvFade = aFade;\n${uFlap ? flapGlsl() : ''}`);
        sh.fragmentShader = 'varying float vFade;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.a *= vFade;');
      };
      m.customProgramCacheKey = () => (uFlap ? 'fade-flap' : 'fade');
    }
    return bend(m);
  }

  // ---- the instances ----
  interface Group {
    name: ModelName;
    sig: string;
    list: Inst[];
    meshes: { im: InstancedMesh; local: Matrix4; grey?: InstancedBufferAttribute; fade?: InstancedBufferAttribute; flap?: InstancedBufferAttribute }[];
    base: Matrix4[];
    /** Its instances fade (a critter's, or one the caller fades: Over `fade`). */
    soft: boolean;
    /** Its model's outermost points (outline), found once. */
    shape?: Vector3[];
  }
  const groups = new Map<ModelName, Group>();
  /** A model's outermost vertex each way of SHAPE_DIRS (in its own space, its meshes' transforms in): its convex hull
   *  near enough, so the hull of these on screen is its silhouette's. */
  function shapeOf(g: Group): Vector3[] {
    if (g.shape) return g.shape;
    const best: { d: number; p: Vector3 }[] = SHAPE_DIRS.map(() => ({ d: -Infinity, p: new Vector3() }));
    const v = new Vector3();
    for (const { im, local } of g.meshes) {
      const pos = im.geometry.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(local);
        SHAPE_DIRS.forEach((dir, k) => {
          const d = v.dot(dir);
          if (d > best[k].d) (best[k].d = d), best[k].p.copy(v);
        });
      }
    }
    return (g.shape = best.filter((b) => b.d > -Infinity).map((b) => b.p));
  }
  const byId = new Map<string, { g: Group; i: number; inst: Inst }>();
  const overs = new Map<string, Over>();
  /** A flier's wings' angle now (radians), by instance id (flap). */
  const flaps = new Map<string, number>();
  const wobbles = new Map<string, { t0: number; k: number }>();
  /** The critters' fades (SOFT): how much there (0 … 1), heading for `to`, as of `t` (ms); `dying`: taken away, gone
   *  once faded out. */
  const fades = new Map<string, { a: number; to: 0 | 1; t: number; dying?: boolean }>();
  const softId = (id: string) => {
    const m = byId.get(id)?.g.name ?? extra.get(id)?.model ?? still.get(id)?.model;
    return !!m && SOFT.has(m);
  };
  /** A critter to be shown (or hidden): it fades there from where its fade is (a new one from nothing). */
  function fadeTo(id: string, show: boolean) {
    const to = show ? 1 : 0, f = fades.get(id);
    if (!f) return void fades.set(id, { a: 0, to, t: performance.now() });
    if (f.to === to) return;
    f.to = to;
    f.t = performance.now();
  }
  /** An instance's opacity: a critter's fade, or the caller's own (Over `fade`), else whole. */
  const opacity = (id: string) => fades.get(id)?.a ?? overs.get(id)?.fade ?? 1;
  const tmpM = new Matrix4(), tmpQ = new Quaternion(), tmpQ2 = new Quaternion(), tmpV = new Vector3(), tmpS = new Vector3();
  const UP = new Vector3(0, 1, 0), FWD = new Vector3(0, 0, 1), RIGHT = new Vector3(1, 0, 0), ZERO = new Matrix4().makeScale(0, 0, 0);
  const sigOf = (o: Inst) => `${o.id}:${o.x}:${o.z}:${o.lift ?? 0}:${o.scale}:${o.yaw ?? 0}:${o.tint ?? ''}`;
  /** An instance's matrix (three's space): its spot on the ground, its yaw, its scale. */
  function matOf(o: Inst, out: Matrix4, wobble = 0, squash = 0): Matrix4 {
    const ov = overs.get(o.id), fd = fades.get(o.id);
    // (a critter's hidden once faded out)
    if (fd ? fd.a <= 0 : ov?.hidden) return out.copy(ZERO);
    const x = ov?.x ?? o.x, z = ov?.z ?? o.z, lift = ov?.lift ?? o.lift ?? 0;
    tmpQ.setFromAxisAngle(UP, ov?.yaw ?? o.yaw ?? 0);
    // turned to the camera (a flat flourish: a sparkle, a 「！」)
    if (ov?.face ?? o.face) tmpQ.copy(camQ);
    const pitch = ov?.pitch ?? o.pitch ?? 0;
    if (pitch) tmpQ.multiply(tmpQ2.setFromAxisAngle(RIGHT, pitch));
    if (wobble) tmpQ.multiply(tmpQ2.setFromAxisAngle(FWD, wobble));
    // (a fading critter: a slight scale-up as it comes)
    const sc = o.scale * (ov?.size ?? 1) * (fd ? 0.85 + 0.15 * fd.a : 1);
    tmpS.set(sc * (1 + squash), sc * (1 - squash), sc * (1 + squash));
    const y = lift + (o.id === 'bridge' ? height(x, z - 30) - 1 : height(x, z));
    return out.compose(tmpV.set(x, y, -z), tmpQ, tmpS);
  }
  function write(g: Group, only?: number) {
    for (const { im, local, grey, fade, flap } of g.meshes) {
      for (let i = 0; i < g.base.length; i++) {
        if (only !== undefined && i !== only) continue;
        im.setMatrixAt(i, tmpM.multiplyMatrices(g.base[i], local));
        if (grey) grey.setX(i, overs.get(g.list[i].id)?.grey ?? 0);
        if (fade) fade.setX(i, opacity(g.list[i].id));
        if (flap) flap.setX(i, flaps.get(g.list[i].id) ?? 0);
      }
      im.instanceMatrix.needsUpdate = true;
      if (grey) grey.needsUpdate = true;
      if (fade) fade.needsUpdate = true;
      if (flap) flap.needsUpdate = true;
    }
    // what rides on an instance (the board's face) goes with it
    for (let i = 0; i < g.base.length; i++) {
      if (only !== undefined && i !== only) continue;
      const obj = riders.get(g.list[i].id);
      if (obj) {
        obj.matrix.copy(g.base[i]);
        obj.matrixWorldNeedsUpdate = true;
        if (!obj.parent) scene.add(obj);
      }
    }
  }
  /** The camera's turn (the billboards': `face`), and the instances that take it. */
  const camQ = new Quaternion();
  function camera(q: Quaternion) {
    if (camQ.equals(q)) return;
    camQ.copy(q);
    for (const [id, a] of byId) {
      const o = a.inst;
      if (!(overs.get(id)?.face ?? o.face)) continue;
      matOf(o, a.g.base[a.i]);
      write(a.g, a.i);
    }
  }
  /** Objects riding on instances, by instance id (attach). */
  const riders = new Map<string, Object3D>();
  function drop(g: Group) {
    for (const { im, grey, fade, flap } of g.meshes) {
      scene.remove(im);
      if (grey || fade || flap) im.geometry.dispose();
      im.dispose();
    }
    for (const o of g.list) if (byId.get(o.id)?.g === g) byId.delete(o.id);
  }
  async function build(name: ModelName, insts: Inst[], sig: string) {
    const gl = await model(name);
    if (!gl || disposed) return;
    // a newer list for this model while it loaded: that one builds
    if (want.get(name) !== sig) return;
    const old = groups.get(name);
    if (old) drop(old);
    gl.scene.updateMatrixWorld(true);
    const grey = name.startsWith('fruit-'), soft = SOFT.has(name) || insts.some((o) => overs.get(o.id)?.fade !== undefined);
    const g: Group = { name, sig, list: insts, meshes: [], base: [], soft };
    // (a critter new here fades in: now, or once it's shown)
    if (SOFT.has(name)) for (const o of insts) if (!fades.has(o.id)) fades.set(o.id, { a: 0, to: overs.get(o.id)?.hidden ? 0 : 1, t: performance.now() });
    const flapAt = FLAPS.test(name) && soft ? hingeOf(gl.scene) : null;
    gl.scene.traverse((n) => {
      const mesh = n as Mesh;
      if (!mesh.isMesh) return;
      // (a bee's, a dragonfly's wings are their own mesh: only those flap; a butterfly is one, its body kept still)
      const flaps = !!flapAt?.flaps.get(mesh);
      const { m, front, depth } = lambert(mesh.material as Material, grey, soft, flaps ? flapAt!.at : null);
      for (const x of front ? [m, front] : [m]) if (nightTag(x, name)) x.emissiveIntensity += nightLift(x, lampLevel);
      // (a greyable model's instances carry their grey, a critter's its fade, a flier's its wings' angle: its own copy
      // of the geometry, dropped with the group)
      const ga = grey ? new InstancedBufferAttribute(new Float32Array(insts.length), 1) : undefined;
      const fa = soft ? new InstancedBufferAttribute(new Float32Array(insts.length), 1) : undefined;
      const wa = flaps ? new InstancedBufferAttribute(new Float32Array(insts.length), 1) : undefined;
      const geo = ga || fa ? mesh.geometry.clone() : mesh.geometry;
      if (ga) geo.setAttribute('aGrey', ga);
      if (fa) geo.setAttribute('aFade', fa);
      if (wa) geo.setAttribute('aFlap', wa);
      // (a two-sided see-through one: its back faces' mesh, then its front's, drawn in that order: the same z, the
      // lower id first; only the first casts, its shadow both sides)
      for (const mat of front ? [m, front] : [m]) {
        const im = new InstancedMesh(geo, mat, insts.length);
        im.frustumCulled = false;
        im.castShadow = !FLAT.has(name) && mat === m;
        im.receiveShadow = true;
        im.customDepthMaterial = depth;
        if (SHADOWS.has(name)) im.renderOrder = UNDER_WATER;
        // a flower's petals take its colour
        const mname = (mesh.material as Material).name;
        if (insts.some((o) => o.tint !== undefined) && /Flower|Petal|Flow|Bloom/.test(mname) && !/Body|Leaf/.test(mname))
          insts.forEach((o, i) => im.setColorAt(i, new Color(o.tint ?? 0xffffff)));
        g.meshes.push({ im, local: mesh.matrixWorld.clone(), grey: ga, fade: fa, flap: wa });
        scene.add(im);
      }
    });
    insts.forEach((o, i) => {
      g.base.push(matOf(o, new Matrix4()));
      byId.set(o.id, { g, i, inst: o });
    });
    write(g);
    groups.set(name, g);
    changed();
  }
  const want = new Map<ModelName, string>();
  /** What stands: the layout's (place) and what comes and goes (set / remove: a critter, a find, a decoration). */
  let still = new Map<string, Inst>();
  const extra = new Map<string, Inst>();
  async function regroup() {
    const by = new Map<ModelName, Inst[]>();
    for (const o of [...still.values(), ...extra.values()]) (by.get(o.model) ?? by.set(o.model, []).get(o.model)!).push(o);
    const jobs: Promise<void>[] = [];
    for (const [name, insts] of by) {
      const sig = insts.map(sigOf).join('|');
      if (want.get(name) === sig) continue;
      want.set(name, sig);
      jobs.push(build(name, insts, sig));
    }
    for (const [name, g] of groups) if (!by.has(name)) {
      want.delete(name);
      drop(g);
      groups.delete(name);
      changed();
    }
    await Promise.all(jobs);
  }
  async function place(list: readonly Inst[]) {
    still = new Map(list.map((o) => [o.id, o]));
    await regroup();
  }
  let queued: Promise<void> | null = null;
  /** A model's instances rebuild once for all the changes in this task. */
  const later = () => (queued ??= Promise.resolve().then(() => ((queued = null), regroup())));

  function lamps(): LampSpot[] {
    const out: LampSpot[] = [];
    for (const g of groups.values()) {
      const L = LAMP[g.name];
      if (!L) continue;
      const h = MODELS[g.name].max[1];
      for (const o of g.list) {
        if (overs.get(o.id)?.hidden) continue;
        const gy = height(o.x, o.z), z = o.z + (L.dz ?? 0) * o.scale;
        out.push({ id: o.id, x: o.x, z, y: gy + (o.lift ?? 0) + h * o.scale * L.at, gy, kind: L.kind, colour: L.colour, glow: L.glow, pool: L.pool });
      }
    }
    return out;
  }

  const JIG_MS = 560;
  function frame(t: number): boolean {
    let more = false, died = false;
    for (const [id, f] of fades) {
      if (f.a === f.to) continue;
      const dt = Math.min(FADE_STEP_MS, Math.max(0, t - f.t));
      f.t = t;
      f.a = f.to ? Math.min(1, f.a + dt / FADE_IN_MS) : Math.max(0, f.a - dt / FADE_OUT_MS);
      if (f.a === 0 && f.dying) {
        // faded out: gone now
        fades.delete(id);
        extra.delete(id);
        overs.delete(id);
        flaps.delete(id);
        died = true;
      }
      const a = byId.get(id);
      if (a) {
        matOf(a.inst, a.g.base[a.i]);
        write(a.g, a.i);
      }
      more = true;
    }
    if (died) void later();
    for (const [id, w] of wobbles) {
      const a = byId.get(id);
      if (!a) {
        wobbles.delete(id);
        continue;
      }
      const k = (t - w.t0) / JIG_MS;
      if (k >= 1) {
        wobbles.delete(id);
        matOf(a.inst, a.g.base[a.i]);
      } else {
        matOf(a.inst, a.g.base[a.i], Math.sin(k * Math.PI * 4) * 0.06 * w.k * (1 - k), Math.sin(k * Math.PI * 3) * 0.04 * w.k * (1 - k));
        more = true;
      }
      write(a.g, a.i);
    }
    return more;
  }

  return {
    place,
    set(list) {
      for (const o of list) {
        extra.set(o.id, o);
        const f = fades.get(o.id);
        if (f?.dying) f.dying = false;
      }
      return later();
    },
    remove(ids) {
      for (const id of ids) {
        // a critter still there fades out where it is first (then it's gone: frame)
        const f = fades.get(id);
        if (f && f.a > 0 && extra.has(id)) {
          f.dying = true;
          fadeTo(id, false);
          changed(false);
          continue;
        }
        fades.delete(id);
        extra.delete(id);
        overs.delete(id);
        flaps.delete(id);
      }
      return later();
    },
    over(id, o, cast = true) {
      if (o) overs.set(id, { ...overs.get(id), ...o });
      else overs.delete(id);
      // a critter shown or hidden: it fades (frame)
      if (o && o.hidden !== undefined && !fades.get(id)?.dying && softId(id)) fadeTo(id, !o.hidden);
      const a = byId.get(id);
      if (!a) return;
      // (a fade on a model that has none yet: its group rebuilds with one)
      if (o?.fade !== undefined && !a.g.soft) {
        want.delete(a.g.name);
        void later();
      }
      matOf(a.inst, a.g.base[a.i]);
      write(a.g, a.i);
      if (!cast || FLAT.has(a.g.name)) return changed(false);
      if (!BUGS.has(a.g.name)) return changed(true);
      // (a bug: the map redrawn at most every BUG_SHADOW_MS, and once after its last move)
      const t = performance.now();
      if (t - bugShadowAt >= BUG_SHADOW_MS) {
        bugShadowAt = t;
        return changed(true);
      }
      changed(false);
      if (!bugTimer) bugTimer = setTimeout(() => {
        bugTimer = 0;
        bugShadowAt = performance.now();
        // (soon: drawn by the frame already coming, a still bug's by one of its own)
        if (!disposed) changed(true, true);
      }, BUG_SHADOW_MS);
    },
    flap(id, angle) {
      flaps.set(id, angle);
      const a = byId.get(id);
      if (!a) return;
      let any = false;
      for (const { flap } of a.g.meshes) {
        if (!flap) continue;
        flap.setX(a.i, angle);
        flap.needsUpdate = any = true;
      }
      if (any) changed(false);
    },
    jiggle(id, k = 1) {
      if (!byId.has(id)) return;
      wobbles.set(id, { t0: performance.now(), k });
      changed();
    },
    lamps,
    tod(l, lift) {
      lampLevel = l;
      liftLevel = lift;
      for (const m of lit) m.emissiveIntensity = l;
      for (const m of lifted) m.emissiveIntensity = lift * m.userData.lift + nightLift(m, l);
    },
    frame,
    has: (id) => byId.has(id),
    camera,
    swap(id, model) {
      const a = byId.get(id) ?? byId.get(`${id}#own`);
      const inst = a?.inst ?? still.get(id) ?? extra.get(id);
      if (!inst) return;
      if (model) {
        overs.set(id, { ...overs.get(id), hidden: true });
        extra.set(`${id}#pose`, { ...inst, id: `${id}#pose`, model });
      } else {
        const o = overs.get(id);
        if (o) overs.set(id, { ...o, hidden: false });
        extra.delete(`${id}#pose`);
      }
      const b = byId.get(id);
      if (b) (matOf(b.inst, b.g.base[b.i]), write(b.g, b.i));
      void later();
      changed();
    },
    attach(id, obj) {
      const was = riders.get(id);
      if (was) {
        scene.remove(was);
        riders.delete(id);
      }
      if (obj) {
        obj.matrixAutoUpdate = false;
        obj.traverse((n) => {
          const m = (n as Mesh).material as Material | Material[] | undefined;
          for (const x of m ? (Array.isArray(m) ? m : [m]) : []) bend(x);
          (n as Mesh).frustumCulled = false;
        });
        riders.set(id, obj);
        const a = byId.get(id);
        if (a) write(a.g, a.i);
      }
      changed();
    },
    groups: () => [...groups.values()].map((g) => ({ name: g.name, n: g.list.length, meshes: g.meshes.map((m) => ({ count: m.im.count, vis: m.im.visible, inScene: !!m.im.parent, mat: (m.im.material as Material).visible })) })),
    where(id) {
      const a = byId.get(id);
      if (!a) return null;
      tmpV.setFromMatrixPosition(a.g.base[a.i]);
      const scale = tmpS.setFromMatrixScale(a.g.base[a.i]).y / (a.inst.scale || 1);
      return { x: tmpV.x, y: tmpV.y, z: tmpV.z, hidden: !!overs.get(id)?.hidden, model: a.g.name, fade: opacity(id), scale, order: a.g.meshes[0]?.im.renderOrder ?? 0 };
    },
    outline(id) {
      const a = byId.get(id);
      return a ? shapeOf(a.g).map((p) => p.clone().applyMatrix4(a.g.base[a.i])) : null;
    },
    pending: () => pending,
    dispose() {
      disposed = true;
      if (bugTimer) clearTimeout(bugTimer);
      for (const g of groups.values()) drop(g);
      groups.clear();
      for (const { m, front, depth } of [...mats.values(), ...softMats.values()]) {
        m.dispose();
        front?.dispose();
        depth.dispose();
      }
      // (now, not once every load is in: a model still loading was never on this renderer, and the next island may
      // already have the shared ones on its own: a late dispose would drop its copies too)
      for (const g of got) g.scene.traverse((n) => {
        const mesh = n as Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        const s = mesh.material as MeshStandardMaterial;
        s.map?.dispose();
        s.emissiveMap?.dispose();
        s.dispose();
      });
      got.clear();
    }
  };
}
