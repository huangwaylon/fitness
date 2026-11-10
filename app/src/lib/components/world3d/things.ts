// The 3D island's things (docs/design.md "World"): NH's models (static/room/world3d, the world3d manifest), one
// InstancedMesh per model and material, placed from a layout (a list of instances by id: the island layout's,
// objects.ts placeObjects). A new list rebuilds only the models whose instances changed.
// Each instance can be hidden, moved (a fruit falling), greyed (a fruit not yet grown) or set wobbling (a tap, a shake)
// without a rebuild. Every material is a Lambert (NH's soft look, cheaper than PBR), bent (bend.ts); a lamp's own _Emi
// map is its night light (lights.ts adds its halo and its pool).
import {
  BackSide, Color, DoubleSide, FrontSide, InstancedBufferAttribute, InstancedMesh, Matrix4, Mesh as MeshOf, MeshDepthMaterial, MeshLambertMaterial, Quaternion,
  RGBADepthPacking, Vector3, Vector4, type Material, type Mesh, type MeshStandardMaterial, type Object3D, type Scene, type Side
} from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { lean } from './release.ts';
import { ktx2Plugin } from './ktx2.ts';
import { bend, bendTree } from './bend.ts';
import { withMaps } from './blank.ts';
import { twoPass } from './sides.ts';
import type { Inst, ModelName } from './objects.ts';
import type { LampSpot } from './lights.ts';
import { MODELS } from './models3d.ts';
import { ASSET_KEYS } from './assets.ts';
import { nightLift, nightTag } from './nightLift.ts';
import { procScene } from './proc3d.ts';
import { FLAPS, flapGlsl, wingHinge } from './wings.ts';

/** Where a lit model's light is (a share of its height; or `e`, its emitter in model units, its own frame: turned and
 *  scaled with it, as the rooms' lamps' are, tent/grid.ts toRoom), its colour and the halo's and pool's sizes (u). */
export const LAMP: Partial<Record<string, { at: number; e?: readonly [number, number, number]; kind: LampSpot['kind']; colour: number; glow: number; pool: number; dz?: number }>> = {
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
  'events/countdown-board': { at: 0.6, kind: 'window', colour: 0xfff0c8, glow: 18, pool: 30 },
  // the camp pack's (scripts/world3d-assets.ts PACKS): the lantern's glass (NH's light locator, tent/items.json f1432's
  // `e`), the flames of the campfire and the fire pit (their emissive's middle), the cookware's fire under its pot (f1433's)
  'decor/lantern': { at: 0.45, e: [0, 4.4, 0], kind: 'lamp', colour: 0xfff0c8, glow: 10, pool: 30 },
  'decor/small-campfire': { at: 0.4, e: [0.15, 2, 0.06], kind: 'fire', colour: 0xff9a4a, glow: 14, pool: 46 },
  'decor/fire-pit': { at: 0.5, e: [-0.42, 3.6, 0.4], kind: 'fire', colour: 0xff9a4a, glow: 18, pool: 56 },
  'decor/campfire-cookware': { at: 0.22, e: [-0.2, 1.6, 0], kind: 'fire', colour: 0xff9a4a, glow: 10, pool: 36 },
  // the second camp file's (decor/camp2): the leaf fire, the fire under the oil-barrel bath, the smoker's firebox (each
  // its emissive map's lit middle, scripts/room-surfaces-page.js emitter on its node)
  'decor/leaf-campfire': { at: 0.22, e: [0, 1.2, -0.1], kind: 'fire', colour: 0xff9a4a, glow: 14, pool: 46 },
  'decor/oil-barrel-bathtub': { at: 0.07, e: [0, 1.1, 0.2], kind: 'fire', colour: 0xff9a4a, glow: 12, pool: 40 },
  'decor/smoker': { at: 0.18, e: [-0.1, 2.2, -1.4], kind: 'fire', colour: 0xff9a4a, glow: 8, pool: 24 }
};

/** The models that cast no shadow (assets.json `shadow`: the flat things, a fish's shadow, a dig spot, the
 *  flourishes): no caster in the shadow map, and a move of one doesn't redraw it (a fish swimming redrew the whole
 *  island's map every frame). */
const FLAT = (() => {
  const casts = new Map<string, boolean>();
  for (const k of Object.values(ASSET_KEYS)) casts.set(k.m, (casts.get(k.m) ?? false) || k.shadow);
  return new Set([...casts].filter(([, c]) => !c).map(([m]) => m));
})();
/** The bugs' models: a bug's move is a slow caster's (`changed('slow')`: the engine redraws the shadow map for it on its
 *  own cadence, once more where it stops), not every frame (a crawling stinkbug redrew the whole island's map 25 times a
 *  second for its speck of a shadow). */
const BUGS = (() => {
  const bug = new Map<string, boolean>();
  for (const k of Object.values(ASSET_KEYS)) bug.set(k.m, (bug.get(k.m) ?? true) && k.cat === 'bug');
  return new Set([...bug].filter(([, b]) => b).map(([m]) => m));
})();
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
/** Whether a group's rebuild changes the shadows: not a flat one's (none), nor a critter's (a new one comes in from
 *  nothing, one taken away is faded out: its shadow comes and goes with its fade, frame). */
const casts = (name: string) => !FLAT.has(name) && !SOFT.has(name);
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
  /** One frame (the critters' fades, the wobbles): true while one runs, 'cast' when a caster's shadow changed in it (a
   *  wobble's; a fade's as it passes half, where its shadow comes or goes: things.ts lambert). */
  frame(t: number): boolean | 'cast';
  has(id: string): boolean;
  /** An instance shows another model for now (its pose: the shishi-odoshi tipped), or its own again (null). */
  swap(id: string, model: string | null): void;
  /** The camera turned: the billboards turn with it. */
  camera(q: Quaternion): void;
  /** A part of an instance's model (its GLB's node of that name, the same material: the weight bench's `bar`) taken
   *  off it and drawn on its own where `m` has its frame (three's space: the part's middle, turned and scaled; the
   *  island's bend on it as on the rest), each frame it's held; null puts it back. It casts no shadow while it's off
   *  (the map isn't redrawn as it moves); its spot on the instance is empty meanwhile. `held`: another model drawn in
   *  its place (the gym's barbell for the bench's small bar: its own space into the part's frame by `inPart`), loaded
   *  once (its geometry and materials shared by every bench's); till it's in, the part stays on (a failed load: the
   *  part itself is drawn). */
  lift(id: string, part: string, m: Matrix4 | null, held?: { model: ModelName; inPart: Matrix4 }): void;
  /** The part's frame as it rests on the instance (three's space), into `out`; null: no such part (or not built). */
  rest(id: string, part: string, out: Matrix4): Matrix4 | null;
  /** A part of an instance (the e2e's): where it's drawn off it now (its middle, three's space; null: not lifted), the
   *  model drawn there (null: the part itself) and whether the instance still shows it; null: no such instance. */
  part(id: string, part: string): { at: [number, number, number] | null; model: string | null; racked: boolean } | null;
  /** Something of the scene's own on an instance (the board's face: docs/board.md), in its model's units, placed, turned,
   *  scaled and bent with it; null takes it off. */
  attach(id: string, obj: Object3D | null): void;
  /** Where an instance stands now (three's space), whether it's hidden, its opacity (a critter fading in or out: 1
   *  otherwise) and its scale over its own (the e2e). */
  groups(): unknown;
  where(id: string): { x: number; y: number; z: number; hidden: boolean; model: string; fade: number; scale: number; order: number } | null;
  /** An instance's solid as a few of its outermost points (three's space, unbent; null: not built): what the camera
   *  sees of it is their hull (a building's tap area: camera.svelte.ts `body`). */
  /** Its model's outermost points, each handed to `fn` in world space (one scratch vector: read it there), or false
   *  with no such model built. */
  outlineEach(id: string, fn: (p: Vector3) => void): boolean;
  pending(): number;
  dispose(): void;
}

/** outlineEach's one point (no vector a point a call: the outline runs for every shaped node each frame the camera moves). */
const scratchV = new Vector3();
/** The ways an outline looks for a model's outermost points: 64 spread over the sphere (a Fibonacci lattice). */
const SHAPE_DIRS: readonly Vector3[] = Array.from({ length: 64 }, (_, i) => {
  const y = 1 - ((i + 0.5) / 64) * 2, r = Math.sqrt(1 - y * y), a = i * Math.PI * (3 - Math.sqrt(5));
  return new Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
});

/** The models as loaded (fetched, decoded: CPU-side), by URL, kept across the island's mounts: back from a room it
 *  builds from them at once, with no fetch, meshopt or image decode again (~60 of them). Each mount's GPU copies go with
 *  its renderer (dispose: three uploads them again to the next). A failed load isn't kept. */
const loaded = new Map<string, Promise<GLTF | null>>();
/** Those of them in (as `loaded` lets go of them): what a mount's dispose frees on its renderer, whichever mount asked. */
const inNow = new Map<string, GLTF>();
/** The models that come and go with the island's life (a critter, a find, a sea creature: ~250 species over the days),
 *  as against the layout's few dozen that stand: one's GPU copies go when its last instance does (each mount's), and
 *  of their loads, not in use on any mount, the LAZY_KEEP last used stay decoded (the rest let go of: geometry and
 *  images closed). Before, every species ever seen stayed on the GPU and decoded for the page's life (~3 textures a
 *  minute idle on the demo, heading for ~15 MB of GPU and 10 MB of images). */
const LAZY = (() => {
  const cats = new Set(['bug', 'fish', 'sea', 'find']), lazy = new Map<string, boolean>();
  for (const k of Object.values(ASSET_KEYS)) lazy.set(k.m, (lazy.get(k.m) ?? true) && cats.has(k.cat));
  return new Set([...lazy].filter(([, l]) => l).map(([m]) => m));
})();
const LAZY_KEEP = 12;
/** The mounts using each loaded model (by URL), and the lazy ones no mount uses, oldest first (the LRU). */
const users = new Map<string, number>(), idle = new Set<string>();
function use(url: string) {
  users.set(url, (users.get(url) ?? 0) + 1);
  idle.delete(url);
}
function unuse(url: string, lazy: boolean) {
  const n = (users.get(url) ?? 1) - 1;
  if (n > 0) return void users.set(url, n);
  users.delete(url);
  if (!lazy) return;
  idle.add(url);
  // (the oldest past LAZY_KEEP: its decoded model let go of, its images closed; fetched and decoded again if it comes back)
  for (const old of idle) {
    if (idle.size <= LAZY_KEEP) break;
    idle.delete(old);
    const p = loaded.get(old);
    loaded.delete(old);
    inNow.delete(old);
    void p?.then((g) => g && free(g, true));
  }
}
/** A model's GPU copies let go of on every renderer (its geometries, textures and materials: three uploads them again
 *  to the next that draws them); `close`: its decoded images too (it's not to be drawn again). */
function free(g: GLTF, close = false) {
  g.scene.traverse((n) => {
    const mesh = n as Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    const s = mesh.material as MeshStandardMaterial;
    for (const t of [s.map, s.emissiveMap]) {
      if (!t) continue;
      t.dispose();
      if (close) (t.image as { close?: () => void } | null)?.close?.();
    }
    s.dispose();
  });
}
/** A pack's member (assets.json `pack`): its node, named its model's last part, as a model of its own (one wrapper a
 *  member, kept, so its builds share it); a model of its own as it is. */
const members = new WeakMap<GLTF, Map<string, GLTF | null>>();
function member(g: GLTF, name: ModelName): GLTF | null {
  if (!MODELS[name]?.pack) return g;
  let by = members.get(g);
  if (!by) members.set(g, (by = new Map()));
  if (!by.has(name)) {
    const node = g.scene.children.find((n) => n.name === name.slice(name.lastIndexOf('/') + 1)) ?? null;
    by.set(name, node && ({ ...g, scene: node } as unknown as GLTF));
  }
  return by.get(name)!;
}
let loader: GLTFLoader | null = null;
function load(url: string, name: string): Promise<GLTF | null> {
  let p = loaded.get(url);
  if (p) return p;
  if (!loader) (loader = ktx2Plugin(new GLTFLoader())).setMeshoptDecoder(MeshoptDecoder);
  p = loader.loadAsync(url).then(
    (g) => {
      lean(g);
      if (loaded.get(url) === p) inNow.set(url, g);
      return g;
    },
    (e: unknown) => {
      console.warn('world3d: model', name, e);
      loaded.delete(url);
      return null;
    }
  );
  loaded.set(url, p);
  return p;
}

/** `changed(shadows)`: draw again; `shadows` a caster's shadow changed (true), a slow caster's ('slow': a bug's), none. */
export function createThings(scene: Scene, height: (x: number, z: number) => number, changed: (shadows?: boolean | 'slow') => void): Things {
  const base = new URL(`room/world3d/`, new URL(document.baseURI)).href;
  let pending = 0, disposed = false;
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
      const url = urlOf(name);
      use(url);
      p = load(url, name).then((g) => (pending--, (g = g && member(g, name)), g && got.add(g), g));
      gltfs.set(name, p);
    }
    return p;
  };
  const urlOf = (name: ModelName) => `${base}${MODELS[name]?.pack ?? name}.glb?v=${MODELS[name]?.v ?? 0}`;
  /** A lazy model's last instance gone: its GPU copies and this mount's materials of it let go of, its load handed
   *  back (kept decoded a while: unuse). Asked for again, it's built afresh; asked for again before its load's tick
   *  (a critter gone and another of its species come in one regroup), its new build has these very materials
   *  (lambert's) and GPU copies: they stay. */
  function release(name: ModelName) {
    const p = gltfs.get(name);
    if (!p || name.startsWith('proc/')) return;
    gltfs.delete(name);
    void p.then((g) => {
      if (g && !disposed && !gltfs.has(name)) {
        got.delete(g);
        g.scene.traverse((n) => {
          const src = (n as Mesh).isMesh ? ((n as Mesh).material as Material) : null;
          for (const map of src ? [mats, softMats] : []) {
            const r = map.get(src!);
            if (!r) continue;
            map.delete(src!);
            for (const x of [r.m, r.front]) {
              if (!x) continue;
              retire(x);
              for (const arr of [lit, lifted]) if (arr.includes(x)) arr.splice(arr.indexOf(x), 1);
            }
            retire(r.depth);
          }
        });
        free(g);
      }
      // (always: a mount disposed meanwhile hands back only what's still in gltfs, and this one's left it)
      unuse(urlOf(name), true);
    });
  }

  /** One let-go material per shader variant (its kind, its program key: fade, flap, grey; its side, see-through,
   *  cut-out, maps), kept undisposed with its maps let go of (never drawn again): three deletes a program once no
   *  material has it, so each species' release cost its next one a compile (a 28-31 ms frame on the iOS Simulator:
   *  the critters' instanced programs built 12 times in 90 s idle, 3 before the lazy release). The rest are disposed. */
  const kept = new Map<string, Material>();
  function retire(x: Material) {
    const t = x as MeshLambertMaterial & { alphaTest: number };
    const k = [x.type, x.customProgramCacheKey(), x.side, x.transparent, t.alphaTest > 0, !!t.map, !!t.emissiveMap].join('|');
    if (kept.has(k)) return void x.dispose();
    kept.set(k, x);
    t.map = null;
    if ('emissiveMap' in t) t.emissiveMap = null;
  }

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
    return bend(withMaps(m));
  }

  // ---- the instances ----
  interface Group {
    name: ModelName;
    sig: string;
    list: Inst[];
    meshes: { im: InstancedMesh; local: Matrix4; grey?: InstancedBufferAttribute; fade?: InstancedBufferAttribute; flap?: InstancedBufferAttribute; part?: Part }[];
    base: Matrix4[];
    /** Its instances fade (a critter's, or one the caller fades: Over `fade`). */
    soft: boolean;
    /** Its model's outermost points (outline), found once. */
    shape?: Vector3[];
  }
  /** A mesh of a part (lift): the part's name, its frame in the model (its node's: where it rests) and the mesh in that
   *  frame. */
  interface Part { name: string; at: Matrix4; inPart: Matrix4 }
  const groups = new Map<ModelName, Group>();
  /** The parts taken off their instances (lift), by `${id}|${part}`: drawn as meshes of their own. */
  const loose = new Map<string, { g: Group; meshes: Mesh[]; at: Vector3; held: ModelName | null }>();
  /** The models drawn in a part's place (lift `held`), once in (null: failed); asked for once. */
  const heldIn = new Map<ModelName, GLTF | null>(), heldAsked = new Set<ModelName>();
  function heldModel(name: ModelName): GLTF | null | undefined {
    if (heldIn.has(name)) return heldIn.get(name);
    if (heldAsked.has(name)) return undefined;
    heldAsked.add(name);
    void model(name).then((g) => {
      if (disposed) return;
      g?.scene.updateMatrixWorld(true);
      heldIn.set(name, g);
      changed();
    });
    return undefined;
  }
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
  const tmpM = new Matrix4(), tmpM2 = new Matrix4(), tmpQ = new Quaternion(), tmpQ2 = new Quaternion(), tmpV = new Vector3(), tmpS = new Vector3();
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
  /** An instance's spot written to its group's meshes (`only`; all of them when absent). */
  function write(g: Group, only?: number) {
    const i0 = only ?? 0, i1 = only === undefined ? g.base.length : only + 1;
    for (const { im, local, grey, fade, flap, part } of g.meshes) {
      for (let i = i0; i < i1; i++) {
        // (a part taken off: its spot on the instance empty)
        if (part && loose.has(`${g.list[i].id}|${part.name}`)) im.setMatrixAt(i, ZERO);
        else im.setMatrixAt(i, tmpM.multiplyMatrices(g.base[i], local));
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
    for (let i = i0; i < i1; i++) {
      const obj = riders.get(g.list[i].id);
      if (obj) {
        obj.matrix.copy(g.base[i]);
        obj.matrixWorldNeedsUpdate = true;
        if (!obj.parent) scene.add(obj);
      }
    }
  }
  /** The camera's turn (the billboards': `face`), and the instances that take it (no tuple an instance: a pinch turns
   *  it every event). */
  const camQ = new Quaternion();
  function camera(q: Quaternion) {
    if (camQ.equals(q)) return;
    camQ.copy(q);
    for (const a of byId.values()) {
      const o = a.inst;
      if (!(overs.get(o.id)?.face ?? o.face)) continue;
      matOf(o, a.g.base[a.i]);
      write(a.g, a.i);
    }
  }
  /** Objects riding on instances, by instance id (attach). */
  const riders = new Map<string, Object3D>();
  function drop(g: Group) {
    // (a part off one of its instances goes with it: the next lift draws it anew from the new build)
    for (const [k, l] of loose) if (l.g === g) {
      for (const m of l.meshes) scene.remove(m);
      loose.delete(k);
    }
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
      // (a part of its own: under a node whose extras say where it rests, scripts/world3d-models.ts `split`)
      let pn: Object3D | null = mesh;
      while (pn && !pn.userData.rest) pn = pn.parent;
      const part: Part | undefined = pn ? { name: pn.name, at: pn.matrixWorld.clone(), inPart: pn.matrixWorld.clone().invert().multiply(mesh.matrixWorld) } : undefined;
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
        g.meshes.push({ im, local: mesh.matrixWorld.clone(), grey: ga, fade: fa, flap: wa, part });
        scene.add(im);
      }
    });
    insts.forEach((o, i) => {
      g.base.push(matOf(o, new Matrix4()));
      byId.set(o.id, { g, i, inst: o });
    });
    write(g);
    groups.set(name, g);
    changed(casts(name));
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
      if (LAZY.has(name)) release(name);
      changed(casts(name));
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
        const gy = height(o.x, o.z);
        if (!L.e) {
          out.push({ id: o.id, x: o.x, z: o.z + (L.dz ?? 0) * o.scale, y: gy + (o.lift ?? 0) + h * o.scale * L.at, gy, kind: L.kind, colour: L.colour, glow: L.glow, pool: L.pool });
          continue;
        }
        // (its emitter in its frame turned by its yaw, three's rotation.y, into the world's x and z: z the world's −z)
        const [ex, ey, ez] = L.e, c = Math.cos(o.yaw ?? 0), sn = Math.sin(o.yaw ?? 0);
        const x = o.x + (ex * c + ez * sn) * o.scale, z = o.z + (ex * sn - ez * c) * o.scale;
        out.push({ id: o.id, x, z, y: gy + (o.lift ?? 0) + ey * o.scale, gy, kind: L.kind, colour: L.colour, glow: L.glow, pool: L.pool });
      }
    }
    return out;
  }

  const JIG_MS = 560;
  function frame(t: number): boolean | 'cast' {
    let more = false, cast = false, died = false;
    for (const [id, f] of fades) {
      if (f.a === f.to) continue;
      // (one whose model is still loading waits for it: its fade starts once it's drawn, never part-way in)
      if (!byId.has(id) && !f.dying) {
        f.t = t;
        continue;
      }
      const dt = Math.min(FADE_STEP_MS, Math.max(0, t - f.t)), was = f.a;
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
        // (a fish's shadow casts none; a bug's shadow is there past half, and its scale-up done at the end)
        if (!FLAT.has(a.g.name) && ((was < 0.5) !== (f.a < 0.5) || f.a === f.to)) cast = true;
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
      if (!FLAT.has(a.g.name)) cast = true;
    }
    return cast ? 'cast' : more;
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
      const seen = opacity(id) >= 0.5, had = overs.get(id);
      if (o) had ? Object.assign(had, o) : overs.set(id, { ...o });
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
      const m = a.g.base[a.i], was = tmpM2.copy(m);
      matOf(a.inst, m);
      write(a.g, a.i);
      // its shadow: none to change (a flat one, the same spot, a grey), a move's at once, a bug's or a show or hide's
      // (a fruit's as it leaves the screen's edge in a scroll) slow
      if (!cast || FLAT.has(a.g.name) || (m.equals(was) && seen === opacity(id) >= 0.5)) return changed(false);
      changed(BUGS.has(a.g.name) || m.equals(ZERO) || was.equals(ZERO) ? 'slow' : true);
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
    lift(id, name, m, held) {
      const a = byId.get(id), k = `${id}|${name}`;
      let l = loose.get(k);
      if (!m) {
        if (!l) return;
        for (const x of l.meshes) scene.remove(x);
        loose.delete(k);
        if (a) write(a.g, a.i);
        return changed(true);
      }
      if (!a) return;
      // (a model in its place: none till it's in, the part itself if it failed)
      const hg = held ? heldModel(held.model) : null;
      if (hg === undefined && !l) return;
      const want = hg ? held!.model : null;
      if (l && (l.g !== a.g || (hg !== undefined && l.held !== want))) {
        for (const x of l.meshes) scene.remove(x);
        l = undefined;
      }
      const fresh = !l;
      if (!l) {
        // its meshes drawn on their own: the instanced ones' geometry and (bent) material, or the held model's (its
        // materials the things' own, shared with its instances'), no shadow of their own
        const meshes: Mesh[] = [];
        const one = (geo: Mesh['geometry'], mat: Material, inPart: Matrix4) => {
          const x = new MeshOf(geo, mat);
          x.matrixAutoUpdate = false;
          x.frustumCulled = false;
          x.castShadow = false;
          x.receiveShadow = true;
          x.userData.inPart = inPart;
          meshes.push(x);
          scene.add(x);
        };
        if (hg) hg.scene.traverse((n) => {
          const mesh = n as Mesh;
          if (!mesh.isMesh) return;
          const { m: mat, front } = lambert(mesh.material as Material, false);
          const inPart = held!.inPart.clone().multiply(mesh.matrixWorld);
          for (const x of front ? [mat, front] : [mat]) one(mesh.geometry, x, inPart);
        });
        else for (const e of a.g.meshes) if (e.part?.name === name) one(e.im.geometry, e.im.material as Material, e.part.inPart);
        if (!meshes.length) return;
        l = { g: a.g, meshes, at: new Vector3(), held: want };
        loose.set(k, l);
        write(a.g, a.i);
      }
      l.at.setFromMatrixPosition(m);
      for (const x of l.meshes) {
        x.matrix.multiplyMatrices(m, x.userData.inPart as Matrix4);
        x.matrixWorldNeedsUpdate = true;
      }
      // (its shadow on the rack gone once; then only a redraw)
      changed(fresh);
    },
    rest(id, name, out) {
      const a = byId.get(id), p = a?.g.meshes.find((e) => e.part?.name === name)?.part;
      return a && p ? out.multiplyMatrices(a.g.base[a.i], p.at) : null;
    },
    part(id, name) {
      const a = byId.get(id), e = a?.g.meshes.find((x) => x.part?.name === name);
      if (!a || !e) return null;
      const l = loose.get(`${id}|${name}`);
      // (racked: its slot on the instance drawn, not scaled to nothing)
      e.im.getMatrixAt(a.i, tmpM);
      return { at: l ? [l.at.x, l.at.y, l.at.z] : null, model: l?.held ?? null, racked: Math.abs(tmpM.determinant()) > 1e-9 };
    },
    attach(id, obj) {
      const was = riders.get(id);
      if (was) {
        scene.remove(was);
        riders.delete(id);
      }
      if (obj) {
        obj.matrixAutoUpdate = false;
        bendTree(obj);
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
    outlineEach(id, fn) {
      const a = byId.get(id);
      if (!a) return false;
      const m = a.g.base[a.i];
      for (const p of shapeOf(a.g)) fn(scratchV.copy(p).applyMatrix4(m));
      return true;
    },
    pending: () => pending,
    dispose() {
      disposed = true;
      for (const g of groups.values()) drop(g);
      groups.clear();
      for (const { m, front, depth } of [...mats.values(), ...softMats.values()]) {
        m.dispose();
        front?.dispose();
        depth.dispose();
      }
      for (const x of kept.values()) x.dispose();
      kept.clear();
      // (now, not once every load is in: a model still loading was never on this renderer, and the next island may
      // already have the shared ones on its own: a late dispose would drop its copies too). Every model in, not only
      // this mount's: a lazy one released while a villager still held it (heldIn, lift) was drawn here outside `got`,
      // and its texture's dispose listener held this dead renderer, its context and canvas, while in a room.
      for (const g of got) free(g);
      for (const g of inNow.values()) free(g);
      got.clear();
      // (this mount's loads handed back: the lazy ones may be let go of now, as no mount uses them)
      for (const name of gltfs.keys()) if (!name.startsWith('proc/')) unuse(urlOf(name), LAZY.has(name));
      gltfs.clear();
    }
  };
}
