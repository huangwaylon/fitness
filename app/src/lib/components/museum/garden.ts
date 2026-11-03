// The bug wing's exhibits (docs/design.md "The museum"): NH's garden under glass (its stone paths, a pond, NH's oaks and
// a palm, flower beds, bushes, a fallen log, ferns, cacti, the museum's own garden props: scripts/world3d-models.ts
// --museum; NH's flowers from the island) and glass display cases along its back, and every bug found living there as
// it lives (species.ts habitatOf), NH's catch models (static/room/world3d/critters/bugs/):
//   fly       on a slow path round a flower bed, its wings flapping (the vertex shader)
//   dart      over the pond: hovering, then darting to another spot
//   drift     over the pond, slowly, glowing (a firefly: brighter at night)
//   flower    sat on a bloom, turning now and then
//   hop       in the grass: a hop to a spot nearby now and then
//   trunk     on an oak's trunk, head up, creeping a little; palm the palm's
//   leaf      on a bush's leaves, creeping
//   ground    crawling the soil by the log and the ferns
//   water     on the pond: gliding strokes
//   terrarium walking the soil of its glass case
//   dangle    hanging from an oak's branch on its thread, bobbing
// A species is one InstancedMesh (one specimen, NH's museum's), placed each frame in place; the wing off screen rests.
import {
  BufferGeometry, CircleGeometry, Color, DoubleSide, Float32BufferAttribute, Group, InstancedBufferAttribute, InstancedMesh, LineBasicMaterial,
  LineSegments, Matrix4, Mesh, MeshBasicMaterial, MeshLambertMaterial, PlaneGeometry, Quaternion, Sprite, SpriteMaterial, CanvasTexture,
  Vector3, AdditiveBlending, BoxGeometry, type Material, type Texture
} from 'three';
import type { Exhibit, Kit } from './engine.ts';
import type { Habitat, Specimen } from './species.ts';
import { BUG_WING, type Pt, type Rect } from './plan.ts';
import { plainGeometry } from './geometry.ts';

/** A bug is drawn this much bigger than NH's own (the island's way: a butterfly a hand across). */
const BUG_S = 1.9;

/** The garden's ground: its paths, the pond, the soil patches, its trees and beds (the bug wing's model units). */
const PATHS: Rect[] = [{ x0: -292, x1: -60, z0: 2, z1: 18 }, { x0: -176, x1: -162, z0: -62, z1: 96 }];
const POND: Rect = { x0: -268, x1: -206, z0: 40, z1: 82 };
const OAKS: Pt[] = [[-250, -36], [-118, -42]];
const PALM: Pt = [-84, 78];
const OAK_S = 1.4, PALM_S = 1.3;
/** The display cases along the back wall (their middles; each 26 × 14, on a stand). */
const CASES: Pt[] = [[-278, -84], [-244, -84], [-210, -84], [-132, -84], [-98, -84]];
const CASE = { w: 26, d: 14, stand: 9, h: 15 };
/** The flower clumps (NH's own, the island's: a tile each) the flower bugs sit on and the flyers circle. */
const FLOWERS: [string, number, number][] = [
  ['flowers/red-tulips', -150, 28], ['flowers/yellow-pansies', -138, 30], ['flowers/pink-cosmos', -126, 27], ['flowers/white-lilies', -114, 30],
  ['flowers/purple-hyacinths', -102, 27], ['flowers/orange-cosmos', -90, 30], ['flowers/pink-tulips', -244, -8], ['flowers/blue-pansies', -232, -10],
  ['flowers/orange-lilies', -220, -8], ['flowers/pink-roses', -208, -10], ['flowers/purple-pansies', -196, -8], ['flowers/orange-roses', -150, 40]
];
/** The garden's props: [model, x, z, scale, yaw]. */
const PROPS: [string, number, number, number, number][] = [
  ['flower-bed', -120, 62, 1, 0], ['pink-flowers', -214, -36, 1, 0.4], ['bushes', -86, -30, 0.5, 0], ['hydrangeas', -140, 88, 0.8, 0],
  ['autumn-log', -284, -24, 0.9, 0.6], ['logs-ferns', -196, 86, 1, 0], ['cacti', -98, 40, 0.8, 0], ['mangroves', -280, 58, 0.75, Math.PI / 2],
  ['heliconia-rock', -150, -50, 0.6, 0], ['agave', -190, -50, 1.2, 0], ['anthurium', -64 - 10, 92, 1.6, 0], ['coleus', -186, 28, 1.6, 0]
];
/** Where the leaf-crawlers keep (the bushes' and hydrangeas' tops) and the ground-crawlers (the soil by the log, the
 *  ferns). */
const LEAVES: [number, number, number][] = [[-86, -30, 10], [-140, 88, 11], [-96, -24, 10]];
const SOIL: Pt[] = [[-272, -8], [-222, 92], [-284, -40]];
/** The grass spots a hopper keeps to. */
const GRASS: Pt[] = [[-230, 26], [-130, -12], [-200, 52], [-100, -60], [-150, 70], [-262, -60], [-80, 10]];

const FLY_FLAP: Record<string, number> = { fly: 0.55, dart: 0.12, drift: 0.25 };
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 100003, 7);

interface Bug {
  sp: Specimen;
  mesh: InstancedMesh | null;
  /** Its state: where (x, y, z) and its turn (a full orientation), its own seed and its spot's index. */
  p: Vector3;
  q: Quaternion;
  seed: number;
  slot: number;
  /** A hop's or a dart's leg: from, to, when it began (s), how long. */
  leg: { from: Vector3; to: Vector3; t0: number; ms: number } | null;
  next: number;
  /** Its body's lift above its spot (half its height), its drawn size across. */
  lift: number;
  size: number;
}

function glowTex(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,250,170,1)');
  r.addColorStop(0.35, 'rgba(220,255,120,0.55)');
  r.addColorStop(1, 'rgba(200,255,120,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

export function buildGarden(kit: Kit, list: readonly Specimen[]): Exhibit {
  const group = new Group();
  const mats: Material[] = [];
  const geos: BufferGeometry[] = [];
  const texs: Texture[] = [];
  const uTime = { value: 0 };
  const uNight = { value: 0 };
  let disposed = false;
  const UP = new Vector3(0, 1, 0), O = new Vector3(), X = new Vector3(), Y = new Vector3(), Z = new Vector3(), M4 = new Matrix4(), S = new Vector3(), T = new Vector3();

  // ---- the ground: the stone paths, the pond, the soil ----
  const flat = (r: Rect, m: Material, y: number) => {
    const g = new PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0);
    geos.push(g);
    const mesh = new Mesh(g, m);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set((r.x0 + r.x1) / 2, y, (r.z0 + r.z1) / 2);
    group.add(mesh);
    return mesh;
  };
  for (const p of PATHS) flat(p, kit.lambert({ map: kit.tex('bug-path', [(p.x1 - p.x0) / 20, (p.z1 - p.z0) / 20]) }), 0.06);
  // the pond: its stone bank, its water (a soft blue, a little see-through over its dark bed)
  flat({ x0: POND.x0 - 3, x1: POND.x1 + 3, z0: POND.z0 - 3, z1: POND.z1 + 3 }, kit.lambert({ map: kit.tex('bug-path', [3, 2]), color: 0xd8d2c4 }), 0.07);
  flat(POND, kit.lambert({ color: 0x24493f }), 0.09);
  const water = new MeshLambertMaterial({ color: 0x5cb6c8, transparent: true, opacity: 0.72, depthWrite: false, emissive: new Color(0x1b5560), emissiveIntensity: 0.35 });
  mats.push(water);
  const pondW = flat(POND, water, 0.6);
  pondW.renderOrder = 2;
  for (const s of SOIL) {
    const g = new CircleGeometry(s[1] > 80 ? 8 : 12, 20);
    geos.push(g);
    const m = new Mesh(g, kit.lambert({ map: kit.tex('bug-soil', [1, 1]) }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(s[0], 0.08, s[1]);
    group.add(m);
  }

  // ---- the trees (NH's oaks and a palm, the island's), the props, the flowers ----
  interface Trunk { x: number; z: number; r: number; y0: number; y1: number }
  const trunks: Trunk[] = [];
  const tree = (name: string, at: Pt, s: number, yaw: number) => {
    const holder = new Group();
    holder.position.set(at[0], 0, at[1]);
    holder.rotation.y = yaw;
    holder.scale.setScalar(s);
    group.add(holder);
    const b = kit.islandBounds(name);
    // its trunk for the perchers (NH's trunk at the model's origin: a fifth of its height to two fifths)
    const h = b ? b.max[1] * s : 40;
    trunks.push({ x: at[0], z: at[1], r: name === 'palm' ? 1.6 * s : 2.4 * s, y0: h * 0.12, y1: h * (name === 'palm' ? 0.3 : 0.42) });
    void kit.island(name).then((g) => {
      if (!g || disposed) return;
      holder.add(g.scene.clone(true));
      kit.invalidate();
    });
  };
  OAKS.forEach((o, i) => tree('oak-summer', o, OAK_S, i * 1.7));
  tree('palm', PALM, PALM_S, 0.8);
  for (const [name, x, z, s, yaw] of PROPS) kit.prop(name, x, z, { s, yaw, parent: group });
  for (const [name, x, z] of FLOWERS) {
    const holder = new Group();
    holder.position.set(x, 0, z);
    group.add(holder);
    void kit.island(name).then((g) => {
      if (!g || disposed) return;
      holder.add(g.scene.clone(true));
      kit.invalidate();
    });
  }

  // ---- the display cases: a wooden stand, its soil, its glass, a twig and a stone in each ----
  const wood = kit.lambert({ color: 0x7a5636 });
  const soil = kit.lambert({ map: kit.tex('bug-soil', [1.5, 1]) });
  const frame = kit.lambert({ color: 0x4a3a2a });
  const glass = new MeshBasicMaterial({ color: 0xe8fff4, transparent: true, opacity: 0.14, depthWrite: false, side: DoubleSide });
  mats.push(glass);
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, m: Material) => {
    const g = new BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    geos.push(g);
    const mesh = new Mesh(g, m);
    mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    group.add(mesh);
    return mesh;
  };
  for (const [cx, cz] of CASES) {
    const x0 = cx - CASE.w / 2, x1 = cx + CASE.w / 2, z0 = cz - CASE.d / 2, z1 = cz + CASE.d / 2, y = CASE.stand;
    box(x0 + 1, x1 - 1, 0, y, z0 + 1, z1 - 1, wood);
    box(x0, x1, y, y + 2, z0, z1, soil);
    const g = box(x0, x1, y + 2, y + CASE.h, z0, z1, glass);
    g.renderOrder = 4;
    const e = 0.6;
    for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]] as const) box(x - e, x + e, y, y + CASE.h, z - e, z + e, frame);
    // its lid's frame (its glass top open to the camera)
    box(x0 - e, x1 + e, y + CASE.h - e, y + CASE.h + e, z0 - e, z0 + e, frame);
    box(x0 - e, x1 + e, y + CASE.h - e, y + CASE.h + e, z1 - e, z1 + e, frame);
    box(x0 - e, x0 + e, y + CASE.h - e, y + CASE.h + e, z0 - e, z1 + e, frame);
    box(x1 - e, x1 + e, y + CASE.h - e, y + CASE.h + e, z0 - e, z1 + e, frame);
  }
  for (const [x, z] of CASES) kit.prop('agave', x - 7, z - 2, { s: 0.45, y: CASE.stand + 2, parent: group });

  // ---- the bugs ----
  const glow = glowTex();
  texs.push(glow);
  const bugMat = (map: Texture | null, flap: number, freq: number, glowy: boolean) => {
    const m = new MeshLambertMaterial({ map, emissive: new Color(glowy ? 0xd8ff7a : 0xffffff), emissiveMap: glowy ? null : map, emissiveIntensity: glowy ? 0.4 : 0.25 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uTime;
      sh.uniforms.uFlap = { value: flap };
      sh.uniforms.uFreq = { value: freq };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uFlap; uniform float uFreq; attribute float aPhase;')
        // its wings (out along its x) beating about its body's line
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float wa = sin(uTime * uFreq + aPhase) * uFlap;
          float ax = abs(position.x);
          transformed.y += ax * sin(wa);
          transformed.x = sign(position.x) * ax * cos(wa);`);
    };
    m.customProgramCacheKey = () => 'museum-bug';
    mats.push(m);
    return m;
  };
  const bugs: Bug[] = [];
  const byHabitat = new Map<Habitat, number>();
  for (const sp of list) {
    if (sp.kind !== 'bug') continue;
    const hab = sp.tank as Habitat;
    const slot = byHabitat.get(hab) ?? 0;
    byHabitat.set(hab, slot + 1);
    const b: Bug = { sp, mesh: null, p: new Vector3(), q: new Quaternion(), seed: hash(sp.id), slot, leg: null, next: 0, lift: 0.5, size: 4 };
    bugs.push(b);
    place(b, 0);
    void kit.critter('bugs', sp.id).then((g) => {
      if (!g || disposed) return;
      let src: Mesh | null = null;
      g.scene.traverse((o) => {
        if (!src && (o as Mesh).isMesh) src = o as Mesh;
      });
      const m = src as Mesh | null;
      if (!m) return;
      const geo = plainGeometry(g.scene, m);
      geo.computeBoundingBox();
      const bb = geo.boundingBox!;
      geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
      geo.setAttribute('aPhase', new InstancedBufferAttribute(new Float32Array([b.seed % 7]), 1));
      geos.push(geo);
      b.size = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) * BUG_S;
      const flap = FLY_FLAP[hab] ?? 0;
      const mesh = new InstancedMesh(geo, bugMat((m.material as { map?: Texture | null }).map ?? null, flap, hab === 'dart' ? 60 : hab === 'fly' ? 11 : 6, hab === 'drift'), 1);
      mesh.frustumCulled = false;
      b.mesh = mesh;
      group.add(mesh);
      if (hab === 'drift') {
        const sm = new SpriteMaterial({ map: glow, transparent: true, depthWrite: false, blending: AdditiveBlending, color: 0xfff4a0 });
        mats.push(sm);
        const sprite = new Sprite(sm);
        sprite.scale.setScalar(9);
        sprite.userData.glowOf = sp.id;
        mesh.userData.glow = sprite;
        group.add(sprite);
      }
      write(b);
      kit.invalidate();
    });
  }
  // threads of the danglers (a line from the branch above each)
  const threadGeo = new BufferGeometry();
  const danglers = bugs.filter((b) => b.sp.tank === 'dangle');
  threadGeo.setAttribute('position', new Float32BufferAttribute(new Float32Array(Math.max(1, danglers.length) * 6), 3));
  geos.push(threadGeo);
  const threads = new LineSegments(threadGeo, new LineBasicMaterial({ color: 0xf2efe6, transparent: true, opacity: 0.7 }));
  mats.push(threads.material as Material);
  threads.frustumCulled = false;
  group.add(threads);

  // ---- where each lives, each frame ----
  /** Turn it: its head along `fwd`, its back toward `up` (both world). */
  function orient(q: Quaternion, fwd: Vector3, up: Vector3) {
    Z.copy(fwd).normalize();
    X.crossVectors(up, Z).normalize();
    Y.crossVectors(Z, X);
    M4.makeBasis(X, Y, Z);
    q.setFromRotationMatrix(M4);
  }
  function rnd(b: Bug, k: number) {
    return Math.abs(Math.sin(b.seed * 12.9898 + k * 78.233) * 43758.5453) % 1;
  }
  function place(b: Bug, t: number) {
    const s = b.seed, i = b.slot;
    switch (b.sp.tank as Habitat) {
      case 'fly': {
        // round a bed of flowers, its own ellipse, bobbing
        const beds: [number, number, number][] = [[-120, 58, 20], [-212, -24, 16], [-120, 30, 22], [-140, 86, 14], [-220, -8, 18]];
        const [cx, cz, r] = beds[i % beds.length];
        const w = 0.35 + (s % 5) * 0.04, a = t * w * (s % 2 ? 1 : -1) + s, rr = r + (i >> 2) * 6;
        b.p.set(cx + Math.cos(a) * rr, 13 + (i % 3) * 4 + Math.sin(t * 1.7 + s) * 2.5, cz + Math.sin(a * 1.3) * rr * 0.6);
        T.set(-Math.sin(a) * rr, Math.cos(t * 1.7 + s) * 0.8, Math.cos(a * 1.3) * rr * 0.78).multiplyScalar(s % 2 ? 1 : -1);
        orient(b.q, T, UP);
        break;
      }
      case 'dart': case 'drift': {
        // over the pond: a hover, then off to another spot (a dragonfly darts; a firefly drifts there slowly)
        const slow = b.sp.tank === 'drift';
        if (!b.leg || t >= b.next) {
          const from = b.leg ? b.leg.to.clone() : new Vector3((POND.x0 + POND.x1) / 2, 12, (POND.z0 + POND.z1) / 2);
          const k = Math.floor(t * 10) + i * 13;
          const to = new Vector3(POND.x0 + 6 + (POND.x1 - POND.x0 - 12) * rnd(b, k), (slow ? 6 : 9) + rnd(b, k + 1) * (slow ? 14 : 8), POND.z0 + 6 + (POND.z1 - POND.z0 - 12) * rnd(b, k + 2));
          const ms = slow ? 3500 + rnd(b, k + 3) * 2500 : 420;
          b.leg = { from, to, t0: t, ms };
          b.next = t + ms / 1000 + (slow ? 0.2 : 1.2 + rnd(b, k + 4) * 1.8);
        }
        const L = b.leg, k = Math.min(1, ((t - L.t0) * 1000) / L.ms), e = k * k * (3 - 2 * k);
        b.p.lerpVectors(L.from, L.to, e);
        b.p.y += Math.sin(t * (slow ? 1.4 : 6) + s) * (slow ? 1.5 : 0.4);
        T.subVectors(L.to, L.from).setY(0);
        if (T.lengthSq() > 0.01) orient(b.q, T, UP);
        break;
      }
      case 'flower': {
        const [, fx, fz] = FLOWERS[(i * 5 + 1) % FLOWERS.length];
        b.p.set(fx + Math.sin(s) * 1.5, 6.4, fz + Math.cos(s) * 1.5);
        const a = s + Math.floor(t / 4 + (s % 3)) * 1.2;
        orient(b.q, T.set(Math.sin(a), 0, Math.cos(a)), UP);
        break;
      }
      case 'hop': {
        const home = GRASS[i % GRASS.length];
        if (!b.leg || t >= b.next) {
          const from = b.leg ? b.leg.to.clone() : new Vector3(home[0], 0, home[1]);
          const k = Math.floor(t * 3) + i;
          const to = new Vector3(home[0] + (rnd(b, k) - 0.5) * 30, 0, home[1] + (rnd(b, k + 1) - 0.5) * 20);
          b.leg = { from, to, t0: t, ms: 480 };
          b.next = t + 0.48 + 1.5 + rnd(b, k + 2) * 3;
        }
        const L = b.leg, k = Math.min(1, ((t - L.t0) * 1000) / L.ms);
        b.p.lerpVectors(L.from, L.to, k);
        b.p.y = Math.sin(k * Math.PI) * 6;
        T.subVectors(L.to, L.from).setY(0);
        if (T.lengthSq() > 0.01) orient(b.q, T, UP);
        break;
      }
      case 'trunk': case 'palm': {
        // on a trunk, its back out from it, its head up, creeping up and down a little
        const tr = b.sp.tank === 'palm' ? trunks[2] : trunks[i % 2];
        if (!tr) break;
        const a = (i * 2.399 + s) % (Math.PI * 2), y = tr.y0 + ((i * 0.37 + s * 0.01) % 1) * (tr.y1 - tr.y0) + Math.sin(t * 0.3 + s) * 1.2;
        O.set(Math.sin(a), 0, Math.cos(a));
        b.p.set(tr.x + O.x * tr.r, y, tr.z + O.z * tr.r);
        orient(b.q, T.copy(UP), O);
        break;
      }
      case 'leaf': {
        const [lx, lz, ly] = LEAVES[i % LEAVES.length];
        const a = t * 0.08 + s;
        b.p.set(lx + Math.cos(a) * 5, ly, lz + Math.sin(a) * 4);
        orient(b.q, T.set(-Math.sin(a), 0, Math.cos(a)), UP);
        break;
      }
      case 'ground': {
        const [gx, gz] = SOIL[i % SOIL.length];
        const a = t * 0.18 * (s % 2 ? 1 : -1) + s;
        b.p.set(gx + Math.cos(a) * 7, 0.1, gz + Math.sin(a * 1.4) * 6);
        orient(b.q, T.set(-Math.sin(a), 0, Math.cos(a * 1.4) * 1.4).multiplyScalar(s % 2 ? 1 : -1), UP);
        break;
      }
      case 'water': {
        // gliding strokes over the pond
        const a = Math.floor(t / 2.2 + i) * 2.1 + s, k = (t / 2.2 + i) % 1, glide = 1 - Math.pow(1 - Math.min(1, k * 1.6), 3);
        const cx = (POND.x0 + POND.x1) / 2 + Math.cos(s + i) * 14, cz = (POND.z0 + POND.z1) / 2 + Math.sin(s + i) * 9;
        b.p.set(cx + Math.cos(a) * 8 * glide, 0.7, cz + Math.sin(a) * 6 * glide);
        orient(b.q, T.set(Math.cos(a), 0, Math.sin(a)), UP);
        break;
      }
      case 'terrarium': {
        const [cx, cz] = CASES[i % CASES.length], n = Math.floor(i / CASES.length);
        const a = t * 0.22 * (s % 2 ? 1 : -1) + s + n * 2;
        b.p.set(cx + Math.cos(a) * (CASE.w / 2 - 6), CASE.stand + 2, cz + Math.sin(a * 1.3) * (CASE.d / 2 - 4));
        orient(b.q, T.set(-Math.sin(a), 0, Math.cos(a * 1.3) * 1.3).multiplyScalar(s % 2 ? 1 : -1), UP);
        break;
      }
      case 'dangle': {
        const o = OAKS[i % 2];
        b.p.set(o[0] + 10 + (i >> 1) * 6, 24 + Math.sin(t * 0.9 + s) * 3, o[1] + 6);
        orient(b.q, T.set(Math.sin(t * 0.4 + s), 0, Math.cos(t * 0.4 + s)), UP);
        break;
      }
    }
  }
  function write(b: Bug) {
    if (!b.mesh) return;
    S.setScalar(BUG_S);
    M4.compose(b.p, b.q, S);
    b.mesh.setMatrixAt(0, M4);
    b.mesh.instanceMatrix.needsUpdate = true;
    const g = b.mesh.userData.glow as Sprite | undefined;
    if (g) {
      g.position.copy(b.p);
      (g.material as SpriteMaterial).opacity = (0.35 + 0.65 * uNight.value) * (0.55 + 0.45 * Math.sin(uTime.value * 2.6 + b.seed));
    }
  }
  const threadPos = threadGeo.getAttribute('position') as Float32BufferAttribute;

  const blocks: Rect[] = [
    ...CASES.map(([x, z]) => ({ x0: x - CASE.w / 2, x1: x + CASE.w / 2, z0: z - CASE.d / 2, z1: z + CASE.d / 2 })),
    POND,
    ...OAKS.map(([x, z]) => ({ x0: x - 5, x1: x + 5, z0: z - 5, z1: z + 5 })),
    { x0: PALM[0] - 4, x1: PALM[0] + 4, z0: PALM[1] - 4, z1: PALM[1] + 4 },
    { x0: -140, x1: -100, z0: 48, z1: 76 }, { x0: -228, x1: -200, z0: -50, z1: -22 }, { x0: -104, x1: -68, z0: -48, z1: -12 },
    { x0: -154, x1: -126, z0: 76, z1: 100 }, { x0: -300, x1: -268, z0: -40, z1: -8 }, { x0: -300, x1: -256, z0: 44, z1: 74 }
  ];

  return {
    group,
    blocks,
    area: BUG_WING,
    frame(t, _dt, shown) {
      if (!shown) return false;
      const s = t / 1000;
      uTime.value = s;
      for (const b of bugs) {
        place(b, s);
        write(b);
      }
      danglers.forEach((b, k) => {
        threadPos.setXYZ(k * 2, b.p.x, b.p.y + b.size * 0.4, b.p.z);
        threadPos.setXYZ(k * 2 + 1, b.p.x, 40, b.p.z);
      });
      threadPos.needsUpdate = true;
      return true;
    },
    pick(project, cx, cy) {
      let best: { id: string; d: number } | null = null;
      for (const b of bugs) {
        if (!b.mesh) continue;
        const p = project(b.p.x, b.p.y + 1, b.p.z);
        if (!p) continue;
        const d = Math.hypot(p[0] - cx, p[1] - cy);
        if (d < 30 + b.size && (!best || d < best.d)) best = { id: b.sp.id, d };
      }
      return best;
    },
    where(id) {
      const b = bugs.find((x) => x.sp.id === id);
      return b ? [b.p.x, b.p.y + 1, b.p.z] : null;
    },
    shown: () => bugs.filter((b) => b.mesh).map((b) => b.sp.id),
    night(n) {
      uNight.value = n;
      // the pond darker, its glow kept
      water.color.set(0x5cb6c8).lerp(new Color(0x1d3550), n * 0.6);
    },
    dispose() {
      disposed = true;
      group.removeFromParent();
      for (const g of geos) g.dispose();
      for (const m of mats) m.dispose();
      for (const x of texs) x.dispose();
    }
  };
}
