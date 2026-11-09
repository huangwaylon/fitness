// The 3D island's effects (docs/design.md "World: in 3D"): NH's little flourishes as small meshes in world space, depth
// tested with everything (a tree in front hides a sparkle): a tap's dust and ring, a splash, a bush's falling leaves, a
// campfire's sparks, a watering's drops, sparkles, a rearing bug's 「！」 (the bite's: biteMark.ts), K.K.'s notes, a sleeper's zzz, hearts, confetti,
// the net's and the shovel's swing, a dive spot's bubbles; and the ambient ones that keep coming (`tag`): the season's
// falling leaves, petals or snow, a summer night's fireflies. Each a few particles of the fx/* models
// (static/room/world3d/fx: the flat ones turned to the camera) or of the island's own (a ring, a glyph drawn on a
// canvas, a bubble), unlit (they're light), fading. The DOM island spawns them where it spawned its own
// (island/fx3d.ts), whose art then goes invisible.
import {
  NormalBlending, Scene, BufferGeometry, CanvasTexture, Color, DoubleSide, Float32BufferAttribute, Group, Matrix4, Mesh, MeshBasicMaterial, PlaneGeometry, Quaternion,
  RingGeometry, SphereGeometry, SRGBColorSpace, type Camera, type MeshStandardMaterial, type Side, type Texture
} from 'three';
import { bend, glow as addLight } from './bend.ts';
import { WHITE, withMaps } from './blank.ts';
import { splitSides } from './sides.ts';
import { MODELS } from './models3d.ts';
import { pace } from './pace.ts';
import { HOP_MS, POP_IN_MS, POP_OUT_MS, popIn } from './biteMark.ts';
import { glbLoader } from './gltf.ts';

export type FxKind =
  | 'dust' | 'sand' | 'snow' | 'splash' | 'ripple' | 'sparkle' | 'sparks' | 'bang' | 'leaves' | 'drops' | 'hearts'
  | 'ring' | 'notes' | 'zzz' | 'confetti' | 'swing' | 'bubbles' | 'fall' | 'firefly' | 'flame' | 'mark' | 'zap';
export interface FxOpts {
  /** A season's leaf for `leaves` / `fall` (maple-leaf, petal, snowflake), the tool for `swing` (net, shovel), a
   *  villager's `mark` (sparkle, heart, note, zzz, bang, sweat), or a tint (#rrggbb). */
  v?: string;
  /** How long a held one (the 「！」) or an ambient one stays (ms). */
  ms?: number;
  /** Bigger or smaller than NH's (1). */
  size?: number;
  /** An ambient one's kind (count() counts them). */
  tag?: string;
  /** Which way (a swing's side: −1 left). */
  dir?: number;
  /** A held one stays while this says so (a rearing bug's 「！」: till it's down), `ms` at most, then pops out. */
  held?: () => boolean;
  /** Where it is each frame (world x, z, lift), not where it was spawned: the high five's star flying between two
   *  villagers that may still be moving. */
  follow?: () => readonly [number, number, number?];
}

interface Part {
  /** Its source (a model's name: bang, ripple, splash…). */
  name: string;
  obj: Group;
  mats: MeshBasicMaterial[];
  t0: number;
  life: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  /** Fall (u/s²), spin (rad/s), its scale over its life, and whether it faces the camera. */
  g: number;
  spin: number;
  s0: number;
  s1: number;
  face: boolean;
  /** Flat on the ground (a ripple, a ring). */
  flat: boolean;
  sway: number;
  /** A swing about its feet (radians over its life), a firefly's blink, an ambient tag. */
  arc: number;
  blink: boolean;
  tag?: string;
  /** Fades out over its last 40 % (else holds, then a quick end). */
  fade: boolean;
  /** NH's pop (a quick overshoot in, a little hop now and then) and, once `held` says no more, a quick pop out from
   *  `end` (its age, ms). */
  pop?: boolean;
  held?: () => boolean;
  end?: number;
  follow?: FxOpts['follow'];
}

export interface Effects {
  spawn(kind: FxKind, x: number, z: number, lift?: number, o?: FxOpts): void;
  /** One frame: true while a flourish plays (not an ambient one). */
  frame(t: number, camera: Camera): boolean | 'ambient';
  /** How many parts of a flourish (not the ambient ones) have come on so far (the e2e's: one came, though a short one
   *  may be over already). */
  shown(): number;
  /** How many play (with this tag). */
  count(tag?: string): number;
  /** Load every flourish's model now and put its textures and shaders on the GPU (the island's start, once idle): the
   *  first high five's sparkles draw whole in their first frame, not late or as blank quads. `prepare`: the engine's
   *  compile and upload of a scene of them, a few a frame (warmup.ts). Resolves once they're handed over. */
  warm(prepare: (warmScene: Scene) => void): Promise<void>;
  /** Every source loaded and its textures uploaded (the test hook's). */
  warmed(): boolean;
  dispose(): void;
}

const MODEL: Record<string, string> = {
  dust: 'fx/dust', splash: 'fx/splash', ripple: 'fx/ripple', sparkle: 'fx/sparkle', bang: 'fx/bang',
  'maple-leaf': 'fx/maple-leaf', petal: 'fx/petal', snowflake: 'fx/snowflake', shovel: 'finds/shovel',
  note: 'fx/note', heart: 'fx/heart', zzz: 'fx/zzz', confetti: 'fx/confetti', net: 'tools/net', flame: 'fx/flame', sweat: 'fx/sweat'
};
/** World units a model unit (assets.json's `s` for each; the island's own at theirs). */
const SCALE: Record<string, number> = {
  dust: 7.3, splash: 11.25, ripple: 9, sparkle: 6, bang: 13.5, 'maple-leaf': 2.3, petal: 3.1, snowflake: 2.3, shovel: 2.45,
  ring: 17, note: 2.9, zzz: 5.8, heart: 3, confetti: 4, bubble: 1.6, glow: 5, net: 5.4, flame: 7.7, sweat: 6, star: 6
};
/** The high five's star flying between the two, u across at its full size (the DOM zap's, IslandScene's .zap). */
const ZAP_U = 26;
/** A villager's mark over its head (NH's float: about a third of its head across), world units across. */
const MARK_U: Record<string, number> = { sparkle: 16, heart: 15, note: 14, zzz: 15, bang: 14, sweat: 11 };
/** A 「！」's hop's height (u: a bug's rear; the bite's is biteMark.ts's, its pop the same). */
const HOP_U = 1.6;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const CONFETTI = ['#ff6f91', '#ffd84a', '#6fd3ff', '#8be07a', '#c89cff', '#ff9d3c'];

/** A source's meshes: their geometry (quantized by the converter: placed by its matrix, never baked), map and colour. */
type Src = { geo: BufferGeometry; map: Texture | null; color: Color; add?: boolean; m?: Matrix4; vc?: boolean }[];

/** NH's star sparkle as the DOM's flourishes draw it (Fx.svelte's STAR path: four long curved points, gold, a white
 *  heart) with a warm rim round it, so it reads on cream, sand and a pale villager alike; geometry in code, no texture: as sharp as
 *  the canvas is at any size (a sparkle, the high five's flying star, a villager's ✦ mark). Radius 1, facing +z, in
 *  its vertex colours, back to front in one draw (the rim, the fill, the heart: they never write depth). */
export function starGeometry(): BufferGeometry {
  // the path's quarter (M12 0 C13 8 16 11 24 12 in its 24 box): the top point to the right one, the rest by symmetry
  const N = 14, rim: [number, number][] = [];
  const P = [[0, 1], [1 / 12, 1 / 3], [1 / 3, 1 / 12], [1, 0]];
  for (let q = 0; q < 4; q++) {
    const c = Math.cos((-q * Math.PI) / 2), s = Math.sin((-q * Math.PI) / 2);
    for (let i = 0; i < N; i++) {
      const t = i / N, u = 1 - t, b = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
      const x = b.reduce((a, w, k) => a + w * P[k][0], 0), y = b.reduce((a, w, k) => a + w * P[k][1], 0);
      rim.push([x * c - y * s, x * s + y * c]);
    }
  }
  const pos: number[] = [], col: number[] = [];
  const tri = (a: [number, number], b: [number, number], c: [number, number], z: number, k: Color) => {
    pos.push(a[0], a[1], z, b[0], b[1], z, c[0], c[1], z);
    for (let i = 0; i < 3; i++) col.push(k.r, k.g, k.b);
  };
  const n = rim.length, W = 0.1;
  // the rim: the outline pushed out along its normal (the rim runs clockwise: outward is the tangent turned a quarter
  // anticlockwise), a little more at the points
  const out = rim.map(([x, y], i) => {
    const [ax, ay] = rim[(i + n - 1) % n], [bx, by] = rim[(i + 1) % n];
    let nx = -(by - ay), ny = bx - ax;
    const l = Math.hypot(nx, ny) || 1;
    nx /= l, ny /= l;
    const w = i % N === 0 ? W * 1.6 : W;
    return [x + nx * w, y + ny * w] as [number, number];
  });
  const rimC = new Color('#f2a93b'), fill = new Color('#ffe27a'), heart = new Color('#ffffff');
  for (let i = 0; i < n; i++) tri([0, 0], out[i], out[(i + 1) % n], 0, rimC);
  for (let i = 0; i < n; i++) tri([0, 0], rim[i], rim[(i + 1) % n], 0.001, fill);
  for (let i = 0, m = 20; i < m; i++) {
    const a = (i / m) * Math.PI * 2, b = ((i + 1) / m) * Math.PI * 2, r = 0.25;
    tri([0, 0], [r * Math.cos(a), r * Math.sin(a)], [r * Math.cos(b), r * Math.sin(b)], 0.002, heart);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new Float32BufferAttribute(col, 3));
  return g;
}

/** A soft round glow (a firefly). */
function glow(): Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(32, 32, 1, 32, 32, 31);
  r.addColorStop(0, 'rgba(255,255,200,1)');
  r.addColorStop(0.25, 'rgba(230,255,120,0.75)');
  r.addColorStop(1, 'rgba(180,255,80,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** `onLoad`: a part's model is in (a frame to show it). */
export function createEffects(scene: Scene, ground: (x: number, z: number) => number, onLoad?: () => void): Effects {
  const loader = glbLoader({ ktx2: true });
  const base = new URL(`room/world3d/`, new URL(document.baseURI)).href;
  const got = new Map<string, Promise<Src | null>>();
  const white = new Color(0xffffff);
  const quad = new PlaneGeometry(2, 2);
  /** A source's meshes: NH's model's, or the island's own. */
  const load = (name: string): Promise<Src | null> => {
    let p = got.get(name);
    if (p) return p;
    if (name === 'ring') p = Promise.resolve([{ geo: new RingGeometry(0.72, 1, 36).rotateX(-Math.PI / 2), map: null, color: new Color('#fff7de') }]);
    else if (name === 'bubble') p = Promise.resolve([{ geo: new SphereGeometry(1, 10, 8), map: null, color: new Color('#e9f8ff') }]);
    else if (name === 'glow') p = Promise.resolve([{ geo: quad, map: glow(), color: white, add: true }]);
    else if (name === 'star') p = Promise.resolve([{ geo: starGeometry(), map: null, color: white, vc: true }]);
    else {
      const m = MODEL[name];
      p = loader.loadAsync(`${base}${m}.glb?v=${MODELS[m]?.v ?? 0}`).then((g) => {
        const out: Src = [];
        g.scene.updateMatrixWorld(true);
        g.scene.traverse((n) => {
          const mesh = n as Mesh;
          if (!mesh.isMesh) return;
          const s = mesh.material as MeshStandardMaterial;
          out.push({ geo: mesh.geometry, map: s.map, color: s.color.clone(), m: mesh.matrixWorld.clone(), vc: !!mesh.geometry.attributes.color });
        });
        return out;
      }, () => null);
    }
    got.set(name, p);
    return p;
  };
  /** A source's material as a particle has it (one shader for all of them: the warm-up compiles it): scripts/world3d-fx.ts'
   *  own in their vertex colours (the 「！」's red mark on its cream disc, the zzz's blue; they drew all white), unless
   *  tinted (the tint is its colour then). */
  const matFor = (s: Src[number], tint?: string, side: Side = DoubleSide) => {
    const mat = bend(withMaps(new MeshBasicMaterial({
      map: s.map, color: tint ? new Color(tint) : s.color, vertexColors: !!s.vc && !tint, transparent: true, depthWrite: false, side, alphaTest: s.add ? 0 : 0.02,
      blending: NormalBlending
    })));
    if (s.add) addLight(mat, true);
    return mat;
  };
  let warmed = false, warmMats: MeshBasicMaterial[] = [];
  async function warm(prepare: (warmScene: Scene) => void) {
    const names = [...new Set([...Object.keys(MODEL), 'ring', 'bubble', 'glow', 'star'])];
    const srcs = (await Promise.all(names.map(load))).filter((x): x is Src => !!x);
    if (disposed) return;
    // each source once, compiled in a scene of its own (the island's fog: the same shaders) and its texture uploaded:
    // never drawn, never in the island's scene
    const warmScene = new Scene();
    warmScene.fog = scene.fog;
    const mats: MeshBasicMaterial[] = [];
    for (const src of srcs) for (const s of src) {
      // (in its colours, and tinted: the two shaders)
      for (const m of s.vc ? [matFor(s), matFor(s, '#ffffff')] : [matFor(s)]) {
        mats.push(m);
        const mesh = new Mesh(s.geo, m);
        if (s.m) {
          mesh.matrixAutoUpdate = false;
          mesh.matrix.copy(s.m);
        }
        mesh.frustumCulled = false;
        warmScene.add(mesh);
      }
    }
    // (with the island's lights: a program's key has the lights and their shadows, so one compiled without them
    // was another program, and each burst's, each leaf's own material compiled the real one afresh: 28 builds in 90 s
    // idle on the iOS Simulator, a 28-31 ms frame each)
    prepare(warmScene);
    // (kept: disposing them would free the very programs just compiled, mid their parallel compile's status check)
    warmMats = mats;
    warmed = true;
  }
  const parts: Part[] = [];
  /** Spawned but not yet loaded (an ambient count includes them). */
  const coming = new Map<string, number>();
  let disposed = false;
  const q = new Quaternion();

  /** One particle of a source: from (x, y, z) with a velocity, living `life` ms, scaled s0 → s1. */
  function part(name: string, x: number, y: number, z: number, p: Partial<Part> & { tint?: string; life: number }) {
    // (a spawn's tag on each of its parts: an ambient one's all ambient)
    if (!p.tag && spawnTag) p = { ...p, tag: spawnTag };
    if (p.tag) coming.set(p.tag, (coming.get(p.tag) ?? 0) + 1);
    void load(name).then((src) => {
      if (p.tag) coming.set(p.tag, (coming.get(p.tag) ?? 1) - 1);
      if (!src || disposed) return;
      const obj = new Group(), mats: MeshBasicMaterial[] = [];
      for (const s of src) {
        const mat = matFor(s, p.tint);
        const mesh = new Mesh(s.geo, mat);
        if (s.m) {
          mesh.matrixAutoUpdate = false;
          mesh.matrix.copy(s.m);
        }
        mesh.frustumCulled = false;
        mesh.renderOrder = 7;
        obj.add(mesh);
        mats.push(mat);
        // (its back faces, then its front: sides.ts)
        const front = splitSides(mesh, (side) => matFor(s, p.tint, side));
        if (front) mats.push(front);
      }
      scene.add(obj);
      const k = SCALE[name] ?? 5;
      parts.push({
        name: p.name ?? name, obj, mats, t0: performance.now(), life: p.life, x, y, z, vx: p.vx ?? 0, vy: p.vy ?? 0, vz: p.vz ?? 0, g: p.g ?? 0, spin: p.spin ?? 0,
        s0: (p.s0 ?? 1) * k, s1: (p.s1 ?? 1) * k, face: p.face ?? true, flat: p.flat ?? false, sway: p.sway ?? 0, arc: p.arc ?? 0,
        blink: p.blink ?? false, tag: p.tag, fade: p.fade ?? true, pop: p.pop, held: p.held, follow: p.follow
      });
      if (!p.tag) shown++;
      onLoad?.();
    });
  }

  let spawnTag: string | undefined, shown = 0;
  // the e2e's (dev builds and ?demo): the parts of a source drawn now, where (world x, y, z) and how big, and each
  // spawn's kind and time (performance.now()): the fishing's rings come before its 「！」
  const log: { kind: FxKind; t: number; size?: number }[] | null =
    import.meta.env.DEV || new URLSearchParams(location.search).has('demo') ? [] : null;
  const hook = {
    live: (name: string) => parts.filter((p) => p.name === name && p.obj.scale.x > 0).map((p) => ({ x: p.obj.position.x, y: p.obj.position.y, z: -p.obj.position.z, s: p.obj.scale.x })),
    /** Each drawn part's textures' sizes (px; null: none or the white stand-in, blank.ts: drawn as geometry in its colours, sharp at any size). */
    maps: (name: string) => parts.filter((p) => p.name === name).map((p) => p.mats.map((m) => (m.map && m.map !== WHITE ? [(m.map.image as { width: number }).width, (m.map.image as { height: number }).height] : null))),
    log: () => log
  };
  if (log) window.__fx3 = hook;
  function spawn(kind: FxKind, x: number, z: number, lift = 0, o: FxOpts = {}) {
    spawnTag = o.tag;
    if (log && log.push({ kind, t: performance.now(), size: o.size }) > 200) log.shift();
    try {
      spawnOf(kind, x, z, lift, o);
    } finally {
      spawnTag = undefined;
    }
  }
  function spawnOf(kind: FxKind, x: number, z: number, lift: number, o: FxOpts) {
    const y = ground(x, z) + lift, k = o.size ?? 1;
    switch (kind) {
      case 'dust': case 'sand': case 'snow': {
        const tint = kind === 'sand' ? '#efe0b8' : kind === 'snow' ? '#ffffff' : o.v;
        for (let i = 0; i < 3; i++) {
          const a = (i - 1) * 1.1 + rnd(-0.2, 0.2);
          part('dust', x + Math.sin(a) * 4 * k, y + 1, z - Math.cos(a) * 2 * k, { life: 520, vx: Math.sin(a) * 16 * k, vy: 9, vz: -Math.cos(a) * 5, s0: 0.35 * k, s1: 0.85 * k, tint, face: false });
        }
        return;
      }
      case 'splash': {
        part('splash', x, y + 0.5, z, { life: 460, s0: 0.4 * k, s1: 1 * k, vy: 6, face: false });
        part('ripple', x, y + 0.3, z, { life: 800, s0: 0.3 * k, s1: 1.4 * k, face: false, flat: true });
        return;
      }
      case 'ripple':
        part('ripple', x, y + 0.3, z, { life: 800, s0: 0.3 * k, s1: 1.4 * k, face: false, flat: true });
        return;
      case 'ring':
        // the tap ring: NH has none; ours shrinks out where a tap sent a villager
        part('ring', x, y + 0.4, z, { life: 400, s0: 1 * k, s1: 0.35 * k, face: false, flat: true, tint: o.v });
        return;
      case 'sparkle': {
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2 + rnd(0, 1);
          part('star', x + Math.cos(a) * 5 * k, y + 6 * k, z, { life: 640, vx: Math.cos(a) * 14 * k, vy: 18 + Math.sin(a) * 6, s0: 0.25 * k, s1: 0.9 * k, spin: rnd(-3, 3), tint: o.v });
        }
        return;
      }
      case 'hearts': {
        for (let i = 0; i < 3; i++)
          part('heart', x + (i - 1) * 7 * k, y + 4, z, { life: 900, vx: (i - 1) * 4, vy: 22 + i * 3, s0: 0.4 * k, s1: 1 * k, sway: 3 });
        return;
      }
      case 'notes': {
        for (let i = 0; i < 3; i++)
          part('note', x + rnd(-6, 6), y + rnd(0, 6), z, { life: 1500, vx: rnd(-6, 6), vy: 20, s0: 0.6 * k, s1: 1 * k, sway: 4, spin: rnd(-0.6, 0.6) });
        return;
      }
      case 'zzz':
        part('zzz', x + 4, y, z, { life: 1800, vx: 6, vy: 12, s0: 0.5 * k, s1: 1.1 * k, sway: 2 });
        return;
      case 'sparks': {
        for (let i = 0; i < 5; i++)
          part('sparkle', x + rnd(-5, 5), y + rnd(2, 8), z, { life: rnd(500, 800), vx: rnd(-8, 8), vy: rnd(22, 38), s0: 0.3, s1: 0.1, tint: '#ffb04a', spin: rnd(-4, 4) });
        return;
      }
      case 'bang':
        // a 「！」 over a bug as it rears (the bite's is biteMark.ts's, on the angler's head): pops up (NH's overshoot),
        // hops a little while it's held, pops out as it's let go
        part('bang', x, y + 8, z, { life: (o.ms ?? 900) + POP_OUT_MS, s0: 0.75 * k, s1: 0.75 * k, face: true, fade: false, pop: true, held: o.held });
        return;
      case 'leaves': {
        const leaf = o.v && MODEL[o.v] ? o.v : 'maple-leaf';
        const tint = o.v && MODEL[o.v] ? undefined : '#6cbf4a';
        for (let i = 0; i < 3; i++)
          part(leaf, x + (i - 1) * 9 + rnd(-2, 2), y, z + rnd(-3, 3), { life: rnd(900, 1300), vx: rnd(-6, 6), vy: rnd(-4, 4), g: -26, spin: rnd(-3, 3), sway: rnd(6, 10), tint, face: true });
        return;
      }
      case 'drops': {
        for (let i = 0; i < 5; i++)
          part('splash', x + rnd(-6, 6), y + rnd(14, 20), z + rnd(-3, 3), { life: 520, vy: -10, g: -60, s0: 0.18, s1: 0.12, face: false, tint: '#9fd8ff' });
        return;
      }
      case 'confetti': {
        for (let i = 0; i < 14; i++)
          part('confetti', x + rnd(-10, 10), y + rnd(20, 34), z + rnd(-4, 4), {
            life: rnd(1200, 1800), vx: rnd(-22, 22), vy: rnd(10, 30), g: -45, spin: rnd(-8, 8), sway: rnd(2, 5), tint: CONFETTI[i % CONFETTI.length]
          });
        return;
      }
      case 'swing': {
        // the net's or the shovel's swing, from behind the shoulder down in front (NH's), about its handle's end
        const tool = o.v === 'shovel' ? 'shovel' : 'net', d = o.dir ?? 1;
        part(tool, x + 6 * d, y + 18, z - 2, { life: 340, s0: k, s1: k, face: false, arc: -1.6 * d, spin: 0.9 * d, fade: false });
        return;
      }
      case 'bubbles': {
        for (let i = 0; i < 3; i++)
          part('bubble', x + rnd(-4, 4), y - 1, z + rnd(-3, 3), { life: rnd(600, 900), vy: 6, s0: rnd(0.5, 1) * k, s1: rnd(1, 1.4) * k, face: false });
        return;
      }
      case 'fall': {
        // an ambient leaf, petal or snowflake: from high over the island down to the ground, swaying and turning
        const leaf = o.v && MODEL[o.v] ? o.v : 'petal', ms = o.ms ?? rnd(9000, 14000), drop = lift;
        part(leaf, x, y, z, { life: ms, vy: -drop / (ms / 1000), vx: rnd(-6, 6), sway: rnd(8, 18), spin: rnd(-1.5, 1.5), s0: k * 1.6, s1: k * 1.6, tag: o.tag });
        return;
      }
      case 'flame':
        // a tongue of the campfire's flame (NH's crossed flame cards) licking up, and a warm glow round it
        part('flame', x + rnd(-3, 3) * k, y, z + rnd(-2, 2), { life: rnd(380, 560), vy: rnd(4, 9), s0: rnd(0.7, 1) * k, s1: 0.2 * k, spin: rnd(-1, 1), face: false });
        part('glow', x, y + 4, z, { life: 500, vy: 10, s0: 1.2 * k, s1: 0.3 * k, tint: '#ffa04a', face: true });
        return;
      case 'mark': {
        // a villager's floating mark: pops in over its head, bobs a little, fades (Emote.svelte's float)
        const m = o.v && MODEL[o.v] ? o.v : 'sparkle', src = m === 'sparkle' ? 'star' : m, s = (MARK_U[m] ?? 14) / ((SCALE[src] ?? 5) * 2) * k;
        part(src, x, y, z, { life: o.ms ?? 2200, s0: s * 0.4, s1: s, vy: 2, sway: 0.6, face: true });
        return;
      }
      case 'zap': {
        // the high five's star, flying from one villager's hands to the other's (IslandScene's arc: `follow`), turning
        // half a turn as it goes, swelling then easing (as the DOM zap's keyframes)
        const s = (ZAP_U / ((SCALE.star ?? 6) * 2)) * k;
        part('star', x, y, z, { name: 'zap', life: o.ms ?? 520, s0: s * 0.5, s1: s * 1.1, spin: Math.PI / ((o.ms ?? 520) / 1000), follow: o.follow });
        return;
      }
      case 'firefly':
        part('glow', x, y, z, { life: o.ms ?? rnd(5000, 8000), vx: rnd(-4, 4), vy: rnd(-1, 1), vz: rnd(-3, 3), sway: rnd(3, 6), s0: k, s1: k, blink: true, tag: o.tag });
        return;
    }
  }

  function frame(t: number, camera: Camera): boolean | 'ambient' {
    camera.getWorldQuaternion(q);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i], age = t - p.t0, k = age / p.life;
      if (k >= 1 || age < 0) {
        if (k >= 1) {
          scene.remove(p.obj);
          for (const m of p.mats) m.dispose();
          parts.splice(i, 1);
        }
        continue;
      }
      // a held one let go (the reel, the miss): its pop out from now
      if (p.held && p.end === undefined && !p.held()) {
        p.end = age;
        p.life = Math.min(p.life, age + POP_OUT_MS);
      }
      const s = age / 1000;
      if (p.follow) {
        // (where its mover says it is now)
        const [fx, fz, fl = 0] = p.follow();
        p.obj.position.set(fx, ground(fx, fz) + fl, -fz);
      } else {
        const px = p.x + p.vx * s + (p.sway ? Math.sin(age / 180) * p.sway : 0), py = p.y + p.vy * s + 0.5 * p.g * s * s, pz = p.z + p.vz * s;
        p.obj.position.set(px, py, -pz);
      }
      if (p.pop) {
        // in with an overshoot, a little hop now and then (its feet on its spot), out by shrinking
        const out = p.end === undefined ? 1 : Math.max(0, 1 - (age - p.end) / POP_OUT_MS);
        p.obj.scale.setScalar(p.s1 * popIn(age / POP_IN_MS) * out);
        if (age > POP_IN_MS) p.obj.position.y += HOP_U * Math.max(0, Math.sin(((age - POP_IN_MS) / HOP_MS) * Math.PI * 2)) ** 2;
      } else p.obj.scale.setScalar(p.s0 + (p.s1 - p.s0) * Math.sin(Math.min(1, k * 1.4) * Math.PI * 0.5));
      if (p.face) {
        p.obj.quaternion.copy(q);
        if (p.spin) p.obj.rotateZ(p.spin * s);
      } else if (p.arc) p.obj.rotation.set(0, p.spin, p.arc * k, 'YXZ');
      else if (p.spin) p.obj.rotation.set(0, p.spin * s, 0);
      // in quickly, out at the end (a held one ends at once); a firefly blinks
      const a = p.pop ? Math.min(1, age / 80) : Math.min(1, k * 6) * (p.fade ? (k > 0.6 ? (1 - k) / 0.4 : 1) : k > 0.95 ? (1 - k) / 0.05 : 1);
      const blink = p.blink ? 0.35 + 0.65 * Math.max(0, Math.sin(age / 420 + p.x)) : 1;
      for (const m of p.mats) m.opacity = a * blink;
    }
    // (the ambient ones, the season's fall and the fireflies, are no motion to keep the island at full rate: the
    // water's 30 a second carries them)
    // (and the critters' moves drawn from their live spots: pace.ts, Critters.svelte)
    return parts.some((p) => !p.tag) || pace.full > 0 ? true : parts.length || pace.ambient > 0 ? 'ambient' : false;
  }

  return {
    spawn, frame, warm, warmed: () => warmed, shown: () => shown,
    count: (tag) => (tag ? parts.filter((p) => p.tag === tag).length + (coming.get(tag) ?? 0) : parts.length),
    dispose() {
      disposed = true;
      for (const p of parts) {
        scene.remove(p.obj);
        for (const m of p.mats) m.dispose();
      }
      parts.length = 0;
      for (const m of warmMats) m.dispose();
      void Promise.all(got.values()).then((ms) => ms?.forEach((m) => m?.forEach((s) => s.geo !== quad && s.geo.dispose())));
      quad.dispose();
      // (the hook holds this island's renderer: gone with it)
      if (log && window.__fx3 === hook) delete window.__fx3;
    }
  };
}
