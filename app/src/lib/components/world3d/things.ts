// The 3D island's things (docs/design.md "World"): NH's models (static/room/world3d, the world3d manifest), one
// InstancedMesh per model and material, placed from a layout (a list of instances by id: layout3d.ts from world.ts
// today, the island layout's placement once it lands). A new list rebuilds only the models whose instances changed.
// Each instance can be hidden, moved (a fruit falling), greyed (a fruit not yet grown) or set wobbling (a tap, a shake)
// without a rebuild. Every material is a Lambert (NH's soft look, cheaper than PBR), bent (bend.ts); a lamp's own _Emi
// map is its night light (lights.ts adds its halo and its pool).
import {
  Color, InstancedBufferAttribute, InstancedMesh, Matrix4, MeshDepthMaterial, MeshLambertMaterial, Quaternion, RGBADepthPacking,
  Vector3, type Material, type Mesh, type MeshStandardMaterial, type Object3D, type Scene
} from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { bend } from './bend.ts';
import type { Inst, ModelName } from './layout3d.ts';
import type { LampSpot } from './lights.ts';
import { MODELS } from './models3d.ts';

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

type Over = { hidden?: boolean; x?: number; z?: number; lift?: number; grey?: number; yaw?: number };

export interface Things {
  /** The layout's things (a full list: only the models whose instances changed rebuild). */
  place(list: readonly Inst[]): Promise<void>;
  /** Add or change things beside the layout's (by id), and take them away. */
  set(list: readonly Inst[]): Promise<void>;
  remove(ids: readonly string[]): Promise<void>;
  /** Change one instance in place (hidden, moved, greyed). */
  over(id: string, o: Over | null): void;
  jiggle(id: string, strength?: number): void;
  /** The lights of what stands now. */
  lamps(): LampSpot[];
  /** The time of day: the lamps' emissive level and the soft self-light ("lift"). */
  tod(lamps: number, lift: number): void;
  /** One frame (the wobbles): true while one runs. */
  frame(t: number): boolean;
  has(id: string): boolean;
  /** Something of the scene's own on an instance (the board's face: docs/board.md), in its model's units, placed, turned,
   *  scaled and bent with it; null takes it off. */
  attach(id: string, obj: Object3D | null): void;
  /** Where an instance stands now (three's space) and whether it's hidden (the e2e). */
  groups(): unknown;
  where(id: string): { x: number; y: number; z: number; hidden: boolean; model: string } | null;
  pending(): number;
  dispose(): void;
}

export function createThings(scene: Scene, height: (x: number, z: number) => number, changed: () => void): Things {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const base = new URL(`room/world3d/`, new URL(document.baseURI)).href;
  let pending = 0, disposed = false;
  const gltfs = new Map<ModelName, Promise<GLTF | null>>();
  const model = (name: ModelName) => {
    let p = gltfs.get(name);
    if (!p) {
      pending++;
      p = loader.loadAsync(`${base}${name}.glb?v=${MODELS[name]?.v ?? 0}`).then((g) => (pending--, g), (e: unknown) => {
        pending--;
        console.warn('world3d: model', name, e);
        return null;
      });
      gltfs.set(name, p);
    }
    return p;
  };

  // ---- materials: each model's once ----
  const lit: MeshLambertMaterial[] = [], lifted: MeshLambertMaterial[] = [];
  let lampLevel = 0, liftLevel = 0.32;
  const mats = new Map<Material, { m: MeshLambertMaterial; depth: MeshDepthMaterial }>();
  function lambert(src: Material, grey: boolean) {
    const had = mats.get(src);
    if (had) return had;
    const s = src as MeshStandardMaterial;
    const own = !!s.emissiveMap;
    const m = new MeshLambertMaterial({
      map: s.map, color: s.color, transparent: s.transparent, opacity: s.opacity, alphaTest: grey ? 0 : s.alphaTest, side: s.side, depthWrite: s.depthWrite,
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
    bend(m);
    // the shadow map is drawn flat (unbent): three's receivers look it up at their unbent world position, so a shadow
    // lands right however far from the pivot, and the map needn't redraw as the camera scrolls (the bend moves)
    const depth = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, map: m.alphaTest ? m.map : null, alphaTest: m.alphaTest });
    const r = { m, depth };
    mats.set(src, r);
    return r;
  }

  // ---- the instances ----
  interface Group {
    name: ModelName;
    sig: string;
    list: Inst[];
    meshes: { im: InstancedMesh; local: Matrix4; grey?: InstancedBufferAttribute }[];
    base: Matrix4[];
  }
  const groups = new Map<ModelName, Group>();
  const byId = new Map<string, { g: Group; i: number; inst: Inst }>();
  const overs = new Map<string, Over>();
  const wobbles = new Map<string, { t0: number; k: number }>();
  const tmpM = new Matrix4(), tmpQ = new Quaternion(), tmpQ2 = new Quaternion(), tmpV = new Vector3(), tmpS = new Vector3();
  const UP = new Vector3(0, 1, 0), FWD = new Vector3(0, 0, 1), ZERO = new Matrix4().makeScale(0, 0, 0);
  const sigOf = (o: Inst) => `${o.id}:${o.x}:${o.z}:${o.lift ?? 0}:${o.scale}:${o.yaw ?? 0}:${o.tint ?? ''}`;
  /** An instance's matrix (three's space): its spot on the ground, its yaw, its scale. */
  function matOf(o: Inst, out: Matrix4, wobble = 0, squash = 0): Matrix4 {
    const ov = overs.get(o.id);
    if (ov?.hidden) return out.copy(ZERO);
    const x = ov?.x ?? o.x, z = ov?.z ?? o.z, lift = ov?.lift ?? o.lift ?? 0;
    tmpQ.setFromAxisAngle(UP, ov?.yaw ?? o.yaw ?? 0);
    if (wobble) tmpQ.multiply(tmpQ2.setFromAxisAngle(FWD, wobble));
    tmpS.set(o.scale * (1 + squash), o.scale * (1 - squash), o.scale * (1 + squash));
    const y = lift + (o.id === 'bridge' ? height(x, z - 30) - 1 : height(x, z));
    return out.compose(tmpV.set(x, y, -z), tmpQ, tmpS);
  }
  function write(g: Group, only?: number) {
    for (const { im, local, grey } of g.meshes) {
      for (let i = 0; i < g.base.length; i++) {
        if (only !== undefined && i !== only) continue;
        im.setMatrixAt(i, tmpM.multiplyMatrices(g.base[i], local));
        if (grey) grey.setX(i, overs.get(g.list[i].id)?.grey ?? 0);
      }
      im.instanceMatrix.needsUpdate = true;
      if (grey) grey.needsUpdate = true;
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
  /** Objects riding on instances, by instance id (attach). */
  const riders = new Map<string, Object3D>();
  function drop(g: Group) {
    for (const { im, grey } of g.meshes) {
      scene.remove(im);
      if (grey) im.geometry.dispose();
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
    const g: Group = { name, sig, list: insts, meshes: [], base: [] };
    const grey = name.startsWith('fruit-');
    gl.scene.traverse((n) => {
      const mesh = n as Mesh;
      if (!mesh.isMesh) return;
      const { m, depth } = lambert(mesh.material as Material, grey);
      // (a greyable model's instances carry their grey: its own copy of the geometry, dropped with the group)
      const ga = grey ? new InstancedBufferAttribute(new Float32Array(insts.length), 1) : undefined;
      const geo = ga ? mesh.geometry.clone().setAttribute('aGrey', ga) : mesh.geometry;
      const im = new InstancedMesh(geo, m, insts.length);
      im.frustumCulled = false;
      im.castShadow = true;
      im.receiveShadow = true;
      im.customDepthMaterial = depth;
      // a flower's petals take its colour
      const mname = (mesh.material as Material).name;
      if (insts.some((o) => o.tint !== undefined) && /Flower|Petal|Flow|Bloom/.test(mname) && !/Body|Leaf/.test(mname))
        insts.forEach((o, i) => im.setColorAt(i, new Color(o.tint ?? 0xffffff)));
      g.meshes.push({ im, local: mesh.matrixWorld.clone(), grey: ga });
      scene.add(im);
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
    let more = false;
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
      for (const o of list) extra.set(o.id, o);
      return later();
    },
    remove(ids) {
      for (const id of ids) {
        extra.delete(id);
        overs.delete(id);
      }
      return later();
    },
    over(id, o) {
      if (o) overs.set(id, { ...overs.get(id), ...o });
      else overs.delete(id);
      const a = byId.get(id);
      if (!a) return;
      matOf(a.inst, a.g.base[a.i]);
      write(a.g, a.i);
      changed();
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
      for (const m of lifted) m.emissiveIntensity = lift * m.userData.lift;
    },
    frame,
    has: (id) => byId.has(id),
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
      return { x: tmpV.x, y: tmpV.y, z: tmpV.z, hidden: !!overs.get(id)?.hidden, model: a.g.name };
    },
    pending: () => pending,
    dispose() {
      disposed = true;
      for (const g of groups.values()) drop(g);
      groups.clear();
      for (const { m, depth } of mats.values()) {
        m.dispose();
        depth.dispose();
      }
      void Promise.all(gltfs.values()).then((gs) => {
        for (const g of gs) g?.scene.traverse((n) => {
          const mesh = n as Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry.dispose();
          const s = mesh.material as MeshStandardMaterial;
          s.map?.dispose();
          s.emissiveMap?.dispose();
          s.dispose();
        });
      });
    }
  };
}
