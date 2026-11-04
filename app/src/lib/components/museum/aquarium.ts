// The aquarium wing's exhibits (docs/design.md "The museum"): its three tanks (tanks.ts) with NH's own props in them
// (the sea's kelp and coral, the deep's dark rocks, the river's stones and logs: scripts/world3d-models.ts --museum),
// the aisle's benches and the corners' plants, and in each tank the hour's pick of the fish found for it (species.ts
// onDisplay: five at most, a new pick each hour, fading out and in where it's on screen), NH's catch models
// (static/room/world3d/critters/fish/), each all inside its glass, the props along its back and the fish in
// front of them, never touching (tanks.ts bodyIn, openOf, propsOf). Cheap:
//   - a species is one fish, one InstancedMesh, its tail swaying in the vertex shader (one program for every fish: the
//     sway grows toward its tail, its beat and width its swimmer's: boids.ts, quicker and wider the faster it goes);
//   - each tank's water is one shader (its glow, NH's blue to its depth, caustics shimmering over its back and floor,
//     light from above), its bubbles one Points (risen in the shader), its glass a faint pane and a metal frame;
//   - the swimmers step by boids.ts (the bottom walkers walk the river's sand: a crab sideways), their matrices written
//     in place; nothing allocated in a frame; a tank off screen rests, its fish culled by its water's bounds (and the
//     wing draws nothing while none is on screen).
import {
  BoxGeometry, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Group, InstancedBufferAttribute, InstancedMesh, Matrix4,
  Mesh, MeshBasicMaterial, MeshLambertMaterial, PlaneGeometry, Points, Quaternion, ShaderMaterial, Sphere, Vector3, AdditiveBlending,
  type Material, type Texture
} from 'three';
import type { Exhibit, Kit } from './engine.ts';
import { WALKERS, hourOf, onDisplay, type Specimen, type TankId } from './species.ts';
import { TANKS, alongX, bodyIn, openOf, piecesOf, propsOf, waterOf, type Body, type Box, type Tank } from './tanks.ts';
import { bandOf, cruiseOf, poseOf, spawn, stepSchool, stepWalker, type Swimmer } from './boids.ts';
import { FEEDERS, FEEDER_R, PREDATORS, feedersIn, feedingOf, stepFeeding, type Feeding } from './feeding.ts';
import type { Rect } from './plan.ts';
import { BENCHES, BENCH_MODEL, BENCH_S } from './seats.ts';
import { batcher, decal, openBox, plainGeometry } from './geometry.ts';

/** Each tank's water: its deep colour, its light colour, how bright its caustics, its glass's tint. */
const WATER: Record<TankId, { deep: number; top: number; caustic: number; glow: number }> = {
  sea: { deep: 0x0b3f6e, top: 0x3aa6cf, caustic: 0.22, glow: 0x7fd0f0 },
  deep: { deep: 0x02060f, top: 0x0f2d52, caustic: 0.04, glow: 0x2a5a90 },
  river: { deep: 0x1a4a40, top: 0x5fae95, caustic: 0.25, glow: 0x9fe0c4 }
};

const WATER_VERT = /* glsl */ `
varying vec2 vUv; varying vec3 vPos;
void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vPos = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
// the water's back and floor: its colour by depth (deep below, light above), caustics (three sines folded: NH's
// shimmering net of light) and soft rays from the surface; uFloor 1 on the floor (caustics over the sand, no rays)
const WATER_FRAG = /* glsl */ `
uniform float uTime; uniform vec3 uDeep; uniform vec3 uTop; uniform float uCaustic; uniform float uFloor; uniform float uNight;
varying vec2 vUv; varying vec3 vPos;
float caustic(vec2 p, float t) {
  float c = sin(p.x * 0.35 + t * 0.9) + sin(p.y * 0.41 - t * 1.1) + sin((p.x + p.y) * 0.23 + t * 0.6) + sin(length(p * 0.3 + vec2(sin(t * 0.3), cos(t * 0.27)) * 3.0));
  return pow(1.0 - abs(sin(c * 1.3)), 10.0);
}
void main() {
  float h = uFloor > 0.5 ? 0.15 : vUv.y;
  vec3 col = mix(uDeep, uTop, smoothstep(0.0, 1.0, h));
  vec2 p = uFloor > 0.5 ? vPos.xz : vec2(vPos.x + vPos.z, vPos.y * 1.6);
  float c = caustic(p, uTime) * uCaustic;
  float rays = uFloor > 0.5 ? 0.0 : pow(max(0.0, sin(vPos.x * 0.08 + vPos.z * 0.08 + sin(uTime * 0.2) * 0.6)), 8.0) * smoothstep(0.2, 1.0, vUv.y) * 0.35 * uCaustic;
  col += vec3(0.75, 0.95, 1.0) * (c * (0.55 + 0.45 * h) + rays);
  gl_FragColor = vec4(col * (1.0 - uNight * 0.25), uFloor > 0.5 ? c * 0.45 : 1.0);
  #include <colorspace_fragment>
}`;
const BUBBLE_VERT = /* glsl */ `
uniform float uTime; uniform float uPx;
attribute vec4 aBase; attribute float aPhase;
varying float vA;
void main() {
  float k = fract(aPhase + uTime * (0.08 + fract(aPhase * 7.3) * 0.06));
  vec3 p = vec3(aBase.x + sin(uTime * 2.0 + aPhase * 30.0) * 0.6, aBase.y + k * aBase.w, aBase.z);
  vA = smoothstep(0.0, 0.1, k) * (1.0 - smoothstep(0.85, 1.0, k));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uPx * (0.6 + fract(aPhase * 3.1)) / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const BUBBLE_FRAG = /* glsl */ `
varying float vA;
void main() { vec2 d = gl_PointCoord - 0.5; float r = length(d); if (r > 0.5) discard; float ring = smoothstep(0.5, 0.35, r) * (0.35 + smoothstep(0.25, 0.45, r)); gl_FragColor = vec4(0.85, 0.97, 1.0, ring * vA * 0.75); }`;

// a bite's puff: a few bubbles out from where it was and up, gone in a second (uT: s since; past that, none)
const PUFF_VERT = /* glsl */ `
uniform float uT; uniform vec3 uAt; uniform float uPx;
attribute vec3 aDir;
varying float vA;
void main() {
  float k = clamp(uT / 1.1, 0.0, 1.0);
  vec3 p = uAt + aDir * (1.0 - (1.0 - k) * (1.0 - k)) * 4.0 + vec3(0.0, k * 5.0, 0.0);
  vA = uT < 1.1 ? (1.0 - k) : 0.0;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = vA > 0.0 ? uPx * (0.5 + fract(aDir.x * 7.0) * 0.6) / -mv.z : 0.0;
  gl_Position = projectionMatrix * mv;
}`;
/** A feeder (feeding.ts): a little low-poly fish, its nose +z, 2 FEEDER_R long (flat-shaded: a body of eight faces, a
 *  forked tail both sides). */
function feederGeometry(): BufferGeometry {
  const L = FEEDER_R, n = [0, 0, L], t = [0, 0, -L * 0.45], up = [0, L * 0.38, L * 0.1], dn = [0, -L * 0.32, L * 0.1], l = [-L * 0.2, 0, L * 0.1], r = [L * 0.2, 0, L * 0.1];
  const f0 = [0, 0, -L * 0.4], f1 = [0, L * 0.4, -L], f2 = [0, -L * 0.4, -L];
  const tris = [n, up, r, n, r, dn, n, dn, l, n, l, up, t, r, up, t, dn, r, t, l, dn, t, up, l, f0, f1, f2, f0, f2, f1];
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(tris.flat(), 3));
  g.computeVertexNormals();
  return g;
}
/** A tank's feeding as drawn: its state, its feeders' mesh and material, its bite's puff, and its predators on show. */
interface Feed { fd: Feeding; mesh: InstancedMesh; mat: MeshLambertMaterial; puff: ShaderMaterial; pts: Points; predators: Swimmer[] }

interface School {
  sp: Specimen;
  tank: Tank;
  water: Box;
  mesh: InstancedMesh | null;
  mat: MeshLambertMaterial | null;
  geo: BufferGeometry | null;
  fish: Swimmer | null;
  /** How it's drawn (tanks.ts bodyIn), once its model's in. */
  body: Body | null;
  /** A bottom walker's way (species.ts WALKERS: a crab sideways), else it swims. */
  walk?: 'side' | 'ahead';
  /** How much of it shows (0…1) and which way that's going: in (+1), out (−1: gone at 0), or neither. */
  fade: number;
  dir: -1 | 0 | 1;
}

/** A tank's bounds as a sphere (the camera's test: its fish culled by it, its water stepped only on screen). */
function sphereOf(b: Box): Sphere {
  const c = new Vector3((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2);
  return new Sphere(c, Math.hypot(b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0) / 2);
}

/** How long a fish takes to fade out or in as the hour's pick changes (s). */
const FADE = 1.6;
/** The corners' plants ([model, x, z, scale]); the aisle's benches are seats.ts's. */
const PLANTS: readonly [string, number, number, number][] = [['heliconia', 70, 90, 1.8], ['anthurium', 290, 90, 2.6], ['heliconia', 278, -72, 2]];

export function buildAquarium(kit: Kit, list: readonly Specimen[], clock: () => number = Date.now): Exhibit {
  const group = new Group();
  const mats: Material[] = [];
  const geos: BufferGeometry[] = [];
  const uTime = { value: 0 };
  const uNight = { value: 0 };
  let disposed = false;
  const frame = kit.lambert({ color: 0x3a4a5a });
  const sand = kit.lambert({ map: kit.tex('fish-sand', [3, 1]) });
  const dark = kit.lambert({ color: 0x0a1424 });
  // the tanks' bases, water, glass and frames: static, a mesh a material (batcher), not one a piece
  const batch = batcher(), at = new Matrix4();
  const box = (b: Box, m: Material) =>
    batch.add(new BoxGeometry(b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0), m, at.makeTranslation((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2));
  const waterMat = (id: TankId, floor: boolean) => {
    const w = WATER[id];
    const m = new ShaderMaterial({
      vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, side: DoubleSide,
      uniforms: { uTime, uNight, uDeep: { value: new Color(w.deep) }, uTop: { value: new Color(w.top) }, uCaustic: { value: w.caustic }, uFloor: { value: floor ? 1 : 0 } },
      ...(floor ? { transparent: true, depthWrite: false, blending: AdditiveBlending } : {})
    });
    // (the floor's caustics lie on the sand)
    if (floor) decal(m, 1);
    m.userData.floor = floor;
    mats.push(m);
    return m;
  };
  const bubbleMat = new ShaderMaterial({ vertexShader: BUBBLE_VERT, fragmentShader: BUBBLE_FRAG, uniforms: { uTime, uPx: { value: 260 * Math.min(2, window.devicePixelRatio || 1) } }, transparent: true, depthWrite: false });
  mats.push(bubbleMat);
  const glasses = new Set<Material>();

  // ---- the tanks ----
  const spheres = new Map<TankId, Sphere>(TANKS.map((t) => [t.id, sphereOf(t.box)]));
  for (const t of TANKS) {
    const b = t.box, w = waterOf(t), id = t.id;
    const along = alongX(b);
    const pc = piecesOf(t);
    // its base
    box(pc.base, id === 'deep' ? dark : sand);
    // its water's back (the side toward the wall: the back for the sea's, the far wall for the deep's; the river's, all
    // round glass, its back the far long side) and its floor's caustics
    const back = new PlaneGeometry(along ? w.x1 - w.x0 : w.z1 - w.z0, w.y1 - w.y0);
    if (along) batch.add(back, waterMat(id, false), at.makeTranslation((w.x0 + w.x1) / 2, (w.y0 + w.y1) / 2, w.z0));
    else batch.add(back, waterMat(id, false), at.makeRotationY(-Math.PI / 2).setPosition(w.x1, (w.y0 + w.y1) / 2, (w.z0 + w.z1) / 2));
    batch.add(new PlaneGeometry(w.x1 - w.x0, w.z1 - w.z0), waterMat(id, true), at.makeRotationX(-Math.PI / 2).setPosition((w.x0 + w.x1) / 2, w.y0 + 0.08, (w.z0 + w.z1) / 2));
    // its props on the sand, each inside its glass (tanks.ts propsOf)
    for (const p of propsOf(t)) kit.prop(p.name, p.x, p.z, { s: p.s, y: p.y, yaw: p.yaw, parent: group });
    // its bubbles (rising in the shader)
    const n = id === 'deep' ? 24 : 40;
    const base = new Float32Array(n * 4), phase = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const r1 = Math.abs(Math.sin(i * 12.9898 + b.x0) * 43758.5453) % 1, r2 = Math.abs(Math.sin(i * 78.233 + b.z0) * 12345.678) % 1;
      base.set([w.x0 + 2 + (w.x1 - w.x0 - 4) * r1, w.y0, w.z0 + 2 + (w.z1 - w.z0 - 4) * r2, w.y1 - w.y0], i * 4);
      phase[i] = (i * 0.618) % 1;
    }
    const bg = new BufferGeometry();
    bg.setAttribute('position', new Float32BufferAttribute(new Float32Array(n * 3), 3));
    bg.setAttribute('aBase', new Float32BufferAttribute(base, 4));
    bg.setAttribute('aPhase', new Float32BufferAttribute(phase, 1));
    geos.push(bg);
    // (risen in the shader: its bounds the tank's)
    bg.boundingSphere = spheres.get(id)!;
    const pts = new Points(bg, bubbleMat);
    pts.renderOrder = 3;
    group.add(pts);
    // its glass (one pane each side, faint: the water's own colour over what swims in it, a deep tank darker) and its
    // frame's edges (open below: its floor is the sand's top)
    const g = new MeshBasicMaterial({ color: WATER[id].glow, transparent: true, opacity: id === 'deep' ? 0.32 : 0.16, depthWrite: false, side: DoubleSide });
    mats.push(g);
    glasses.add(g);
    const gb = pc.glass;
    batch.add(openBox(gb.x1 - gb.x0, gb.y1 - gb.y0, gb.z1 - gb.z0, ['-y']), g, at.makeTranslation((gb.x0 + gb.x1) / 2, (gb.y0 + gb.y1) / 2, (gb.z0 + gb.z1) / 2));
    for (const f of pc.frame) box(f, frame);
  }
  // (the glass over all else, the caustics over the sand)
  geos.push(...batch.done(group, (m) => (glasses.has(m) ? 4 : m.userData.floor ? 1 : 0)));

  // ---- the hall's benches and plants ----
  const blocks: Rect[] = TANKS.map((t) => ({ x0: t.box.x0, x1: t.box.x1, z0: t.box.z0, z1: t.box.z1 }));
  const bench = kit.islandBounds(BENCH_MODEL);
  const seats: (Rect & { id: string; h: number })[] = [];
  for (const { id, x, z, yaw } of BENCHES) {
    const holder = new Group();
    holder.position.set(x, 0, z);
    holder.rotation.y = yaw;
    holder.scale.setScalar(BENCH_S);
    group.add(holder);
    void kit.island(BENCH_MODEL).then((g) => {
      if (!g || disposed) return;
      holder.add(g.scene.clone(true));
      kit.invalidate();
    });
    const hw = ((bench ? bench.max[0] - bench.min[0] : 18) * BENCH_S) / 2, hd = ((bench ? bench.max[2] - bench.min[2] : 10) * BENCH_S) / 2;
    seats.push({ id, x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd, h: (bench ? bench.max[1] : 10) * BENCH_S });
  }
  for (const [name, x, z, s] of PLANTS) {
    kit.prop(name, x, z, { s, parent: group });
    blocks.push({ x0: x - 5, x1: x + 5, z0: z - 5, z1: z + 5 });
  }

  // ---- the fish: the hour's pick (species.ts onDisplay), a species an InstancedMesh, its tail swaying in the shader ----
  const fishMat = (map: Texture | null, head: number, tail: number, amp: number) => {
    const m = new MeshLambertMaterial({ map, emissive: new Color(0xffffff), emissiveMap: map, emissiveIntensity: 0.25 });
    // (its tail's beat and width: its swimmer's, written each frame)
    const beat = { value: 0 }, kick = { value: 1 };
    m.userData.beat = beat;
    m.userData.kick = kick;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uBeat = beat;
      sh.uniforms.uKick = kick;
      sh.uniforms.uHead = { value: head };
      sh.uniforms.uTail = { value: tail };
      sh.uniforms.uAmp = { value: amp };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uBeat; uniform float uKick; uniform float uHead; uniform float uTail; uniform float uAmp; attribute float aPhase;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float tw = clamp((uHead - position.z) / max(0.001, uHead - uTail), 0.0, 1.0);
          transformed.x += sin(uBeat + aPhase - position.z * 0.35) * uAmp * uKick * tw * tw;`);
    };
    m.customProgramCacheKey = () => 'museum-fish';
    return m;
  };
  // (the matrices' scratch: nothing allocated in a frame)
  const M4 = new Matrix4(), Q = new Quaternion(), P = new Vector3(), S = new Vector3(), E = new Vector3(0, 1, 0), Qp = new Quaternion(), X = new Vector3(1, 0, 0), Z = new Vector3(0, 0, 1);
  // ---- the feeders (feeding.ts): where a predator's on show, a few little generic fish (no ずかん species), one
  // InstancedMesh a tank (FEEDERS at most, the gone ones scaled to nothing), and a bite's bubbles ----
  const feederGeo = feederGeometry();
  feederGeo.setAttribute('aPhase', new InstancedBufferAttribute(Float32Array.from({ length: FEEDERS }, (_, i) => i * 1.7), 1));
  geos.push(feederGeo);
  const feeds = new Map<TankId, Feed>();
  for (const t of TANKS) {
    const mat = fishMat(null, FEEDER_R, -FEEDER_R, FEEDER_R * 0.18);
    mat.color.set(0xc4d8e2);
    mat.emissive.set(0x24323c);
    mats.push(mat);
    const mesh = new InstancedMesh(feederGeo, mat, FEEDERS);
    mesh.boundingSphere = spheres.get(t.id)!;
    mesh.userData.feeders = true;
    group.add(mesh);
    const pg = new BufferGeometry(), dirs = new Float32Array(30);
    for (let i = 0; i < 10; i++) {
      const a = i * 2.4, e = ((i * 0.37) % 1) - 0.3;
      dirs.set([Math.cos(a), e, Math.sin(a)], i * 3);
    }
    pg.setAttribute('position', new Float32BufferAttribute(new Float32Array(30), 3));
    pg.setAttribute('aDir', new Float32BufferAttribute(dirs, 3));
    pg.boundingSphere = spheres.get(t.id)!;
    geos.push(pg);
    const puff = new ShaderMaterial({ vertexShader: PUFF_VERT, fragmentShader: BUBBLE_FRAG, uniforms: { uT: { value: 99 }, uAt: { value: new Vector3() }, uPx: bubbleMat.uniforms.uPx }, transparent: true, depthWrite: false });
    mats.push(puff);
    const pts = new Points(pg, puff);
    pts.renderOrder = 3;
    group.add(pts);
    const fd: Feed = { fd: feedingOf(hash(t.id) + 1), mesh, mat, puff, pts, predators: [] };
    feeds.set(t.id, fd);
    writeFeeders(fd);
  }
  function writeFeeders(f: Feed) {
    const fs = f.fd.feeders;
    for (let i = 0; i < fs.length; i++) {
      const x = fs[i];
      Q.setFromAxisAngle(E, x.yaw);
      Q.multiply(Qp.setFromAxisAngle(X, Math.max(-0.4, Math.min(0.4, -Math.atan2(x.v[1], Math.max(0.5, Math.hypot(x.v[0], x.v[2]))) * 0.6))));
      P.set(x.p[0], x.p[1], x.p[2]);
      S.setScalar(x.alive ? Math.max(0.001, x.fade) : 0);
      M4.compose(P, Q, S);
      f.mesh.setMatrixAt(i, M4);
    }
    f.mesh.instanceMatrix.needsUpdate = true;
    // (none in: nothing drawn)
    f.mesh.visible = feedersIn(f.fd) > 0;
    f.pts.visible = f.fd.puffT < 1.1;
    f.mat.userData.beat.value = f.fd.clock * 9;
    f.puff.uniforms.uT.value = f.fd.puffT;
    (f.puff.uniforms.uAt.value as Vector3).set(f.fd.puff[0], f.fd.puff[1], f.fd.puff[2]);
  }
  const schools = new Map<string, School>();
  /** Each tank's swimmers, all its schools' together (they keep off one another), and its bottom walkers. */
  const swimmers = new Map<TankId, Swimmer[]>(TANKS.map((t) => [t.id, []]));
  const walkers = new Map<TankId, Swimmer[]>(TANKS.map((t) => [t.id, []]));
  const tankOfId = new Map<TankId, Tank>(TANKS.map((t) => [t.id, t]));
  /** Each tank's open water, in front of its props (tanks.ts openOf): its fish swim and walk only there. */
  const waters = new Map<TankId, Box>(TANKS.map((t) => [t.id, openOf(t)]));
  /** A fish's fading: dithered (alphaHash: still opaque and unsorted) only while it fades, solid again after. */
  const fadeTo = (s: School, k: number) => {
    s.fade = k;
    if (!s.mat) return;
    const mid = k < 1;
    if (s.mat.alphaHash !== mid) {
      s.mat.alphaHash = mid;
      s.mat.needsUpdate = true;
    }
    s.mat.opacity = k;
  };
  function add(sp: Specimen, fadeIn: boolean) {
    const tank = tankOfId.get(sp.tank as TankId);
    if (!tank) return;
    const s: School = { sp, tank, water: waters.get(tank.id)!, mesh: null, mat: null, geo: null, fish: null, body: null, walk: WALKERS[sp.id], fade: fadeIn ? 0 : 1, dir: fadeIn ? 1 : 0 };
    schools.set(sp.id, s);
    void kit.critter('fish', sp.id).then((g) => {
      if (!g || disposed || schools.get(sp.id) !== s) return;
      let src: Mesh | null = null;
      g.scene.traverse((o) => {
        if (!src && (o as Mesh).isMesh) src = o as Mesh;
      });
      const m = src as Mesh | null;
      if (!m) return;
      const geo = plainGeometry(g.scene, m);
      geo.computeBoundingBox();
      const bb = geo.boundingBox!;
      const body = bodyIn(tank, bb.min.toArray(), bb.max.toArray(), !!s.walk);
      // (its middle at its box's: its reach is from there)
      geo.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -(bb.min.z + bb.max.z) / 2);
      geo.setAttribute('aPhase', new InstancedBufferAttribute(new Float32Array([sp.id.length]), 1));
      const map = (m.material as { map?: Texture | null }).map ?? null;
      // (a walker's body stays still: no tail to sway)
      const mat = fishMat(map, body.half[2], -body.half[2], body.sway);
      const mesh = new InstancedMesh(geo, mat, 1);
      // (culled by its tank's bounds: its fish swim nowhere else)
      mesh.boundingSphere = spheres.get(tank.id)!;
      mesh.userData.specimen = sp.id;
      // a big fish slow for its length, a little one quicker (u/s, at its drawn size: boids.ts cruiseOf), at its depth
      const speed = cruiseOf(body.r);
      const f = spawn(s.water, body.r, body.reach, s.walk ? speed * 0.6 : speed, hash(sp.id), bandOf(sp.id));
      // a walker on the sand (its own height off it), else among the tank's swimmers
      if (s.walk) f.p[1] = s.water.y0 + body.half[1] * body.s;
      (s.walk ? walkers : swimmers).get(tank.id)!.push(f);
      // (a hunter: the feeders come to its tank)
      if (!s.walk && PREDATORS.has(sp.id)) feeds.get(tank.id)!.predators.push(f);
      Object.assign(s, { geo, mat, mesh, fish: f, body });
      fadeTo(s, s.fade);
      group.add(mesh);
      write(s);
      kit.invalidate();
    });
  }
  function drop(s: School) {
    schools.delete(s.sp.id);
    s.mesh?.removeFromParent();
    s.geo?.dispose();
    s.mat?.dispose();
    for (const a of [swimmers.get(s.tank.id)!, walkers.get(s.tank.id)!, feeds.get(s.tank.id)!.predators]) {
      const i = s.fish ? a.indexOf(s.fish) : -1;
      if (i >= 0) a.splice(i, 1);
    }
  }
  /** The hour's pick in: the fish it drops fade out and the new ones in where a tank is on screen, at once where not. */
  let hour = hourOf(clock()), checked = -Infinity;
  function pick(seen: ((s: Sphere) => boolean) | null) {
    const want = new Set([...onDisplay(list, hour).values()].flat().map((s) => s.id));
    const shows = (s: School) => !!seen && seen(spheres.get(s.tank.id)!);
    for (const s of [...schools.values()]) {
      if (want.has(s.sp.id)) {
        if (s.dir < 0) s.dir = 1;
      } else if (s.mesh && shows(s)) s.dir = -1;
      else drop(s);
    }
    for (const sp of list) {
      if (!want.has(sp.id) || schools.has(sp.id)) continue;
      const tank = tankOfId.get(sp.tank as TankId);
      add(sp, !!seen && !!tank && seen(spheres.get(tank.id)!));
    }
  }
  pick(null);

  function write(sc: School) {
    if (!sc.mesh || !sc.fish || !sc.body) return;
    const f = sc.fish, pose = poseOf(f);
    // (its heading, then its pitch, then its bank about its length)
    Q.setFromAxisAngle(E, pose[0]);
    Q.multiply(Qp.setFromAxisAngle(X, pose[1]));
    Q.multiply(Qp.setFromAxisAngle(Z, pose[2]));
    if (sc.mat) {
      sc.mat.userData.beat.value = f.beat;
      sc.mat.userData.kick.value = f.kick;
    }
    P.set(f.p[0], f.p[1], f.p[2]);
    S.setScalar(sc.body.s);
    M4.compose(P, Q, S);
    sc.mesh.setMatrixAt(0, M4);
    sc.mesh.instanceMatrix.needsUpdate = true;
  }

  return {
    group,
    wing: 'fish',
    blocks,
    seats,
    frame(t, dt, seen) {
      // (a new hour: a new pick; the clock read once a second)
      if (!(t - checked < 1000)) {
        checked = t;
        const h = hourOf(clock());
        if (h !== hour) {
          hour = h;
          pick(seen);
        }
      }
      // (the water's shimmer and the bubbles with any tank on screen; a school only with its own)
      let any = false;
      for (const tk of TANKS) if (seen(spheres.get(tk.id)!)) any = true;
      uTime.value = t / 1000;
      // (deleting the one at hand while going through a Map is safe: nothing allocated)
      for (const s of schools.values()) {
        if (!s.dir) continue;
        // (a fade off screen is over at once)
        const k = seen(spheres.get(s.tank.id)!) ? s.fade + (s.dir * dt) / 1000 / FADE : s.dir > 0 ? 1 : 0;
        fadeTo(s, Math.max(0, Math.min(1, k)));
        if (s.fade >= 1 && s.dir > 0) s.dir = 0;
        else if (s.fade <= 0 && s.dir < 0 && s.mesh) drop(s);
      }
      if (!any) return false;
      for (const tk of TANKS) {
        const id = tk.id;
        if (!seen(spheres.get(id)!)) continue;
        const w = waters.get(id)!;
        stepSchool(swimmers.get(id)!, w, dt / 1000, t / 1000);
        const fe = feeds.get(id)!;
        stepFeeding(fe.fd, fe.predators, w, dt / 1000);
        writeFeeders(fe);
      }
      for (const s of schools.values()) {
        if (!seen(spheres.get(s.tank.id)!)) continue;
        if (s.walk && s.fish) stepWalker(s.fish, s.water, dt / 1000, t / 1000, s.walk === 'side', walkers.get(s.tank.id)!);
        write(s);
      }
      return true;
    },
    pick(project, cx, cy) {
      let best: { id: string; d: number } | null = null;
      for (const s of schools.values()) {
        const f = s.fish;
        if (!s.mesh || !f || s.dir < 0) continue;
        const p = project(f.p[0], f.p[1], f.p[2]);
        if (!p) continue;
        const d = Math.hypot(p[0] - cx, p[1] - cy), reach = 26 + f.r * 1.5;
        if (d < reach && (!best || d < best.d)) best = { id: s.sp.id, d };
      }
      return best;
    },
    where(id) {
      // (a feeder: 'feeder:<tank>:<i>', while it's in)
      if (id.startsWith('feeder:')) {
        const [, tank, i] = id.split(':'), x = feeds.get(tank as TankId)?.fd.feeders[Number(i)];
        return x?.alive ? [x.p[0], x.p[1], x.p[2]] : null;
      }
      const f = schools.get(id)?.fish;
      return f ? [f.p[0], f.p[1], f.p[2]] : null;
    },
    shown: () => [...schools.values()].filter((s) => s.mesh && s.dir >= 0).map((s) => s.sp.id),
    night(n) {
      uNight.value = n;
    },
    dispose() {
      disposed = true;
      for (const s of [...schools.values()]) drop(s);
      group.removeFromParent();
      for (const g of geos) g.dispose();
      for (const m of mats) m.dispose();
    }
  };
}

function hash(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100003;
  return h;
}
