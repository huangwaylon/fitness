// The aquarium wing's exhibits (docs/design.md "The museum"): its tanks (tanks.ts) with NH's own props in them (the sea's
// kelp and coral, the deep's dark rocks, the river's stones and logs: scripts/world3d-models.ts --museum), and every fish
// found swimming in its own (species.ts tankOf), NH's catch models (static/room/world3d/critters/fish/). Cheap:
//   - a species is one fish (NH's museum: one of each found), one InstancedMesh, its tail swaying in the vertex shader (one program for
//     every fish: the sway grows toward its tail, its phase the instance's own);
//   - each tank's water is one shader (its glow, NH's blue to its depth, caustics shimmering over its back and floor,
//     light from above), its bubbles one Points (risen in the shader), its glass a faint pane and a metal frame;
//   - the swimmers step by boids.ts (the bottom walkers walk its sand: a crab sideways), their matrices written in place; nothing allocated in a frame; a tank off screen
//     rests, its fish culled by its water's bounds (and the wing draws nothing while none is on screen).
import {
  BoxGeometry, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Group, InstancedBufferAttribute, InstancedMesh, Matrix4,
  Mesh, MeshBasicMaterial, MeshLambertMaterial, PlaneGeometry, Points, Quaternion, ShaderMaterial, Sphere, Vector3, AdditiveBlending,
  type Material, type Texture
} from 'three';
import type { Exhibit, Kit } from './engine.ts';
import { WALKERS, type Specimen } from './species.ts';
import { TANKS, fishScale, waterOf, type Box, type Tank } from './tanks.ts';
import { spawn, stepSchool, stepWalker, type Swimmer } from './boids.ts';
import type { Rect } from './plan.ts';
import { batcher, decal, openBox, plainGeometry } from './geometry.ts';

/** Each look's water: its deep colour, its light colour, how bright its caustics. */
const WATER: Record<Tank['look'], { deep: number; top: number; caustic: number; glow: number }> = {
  sea: { deep: 0x0b3f6e, top: 0x3aa6cf, caustic: 0.22, glow: 0x7fd0f0 },
  deep: { deep: 0x02060f, top: 0x0f2d52, caustic: 0.04, glow: 0x2a5a90 },
  river: { deep: 0x1a4a40, top: 0x5fae95, caustic: 0.25, glow: 0x9fe0c4 },
  small: { deep: 0x175274, top: 0x66c2da, caustic: 0.28, glow: 0x9fe4f4 }
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

/** The props in each look's tanks: [model, where across (0…1), where back (0…1), scale]. */
const PROPS: Record<string, [string, number, number, number][]> = {
  sea: [['kelp-rocks', 0.12, 0.25, 0.75], ['coral', 0.42, 0.3, 0.9], ['kelp-rock', 0.68, 0.22, 0.7], ['coral-2', 0.88, 0.35, 1], ['diver', 0.55, 0.6, 0.6]],
  deep: [['deep-rocks', 0.5, 0.15, 1.2], ['deep-rocks', 0.5, 0.75, 0.9]],
  river: [['mossy-log', 0.2, 0.5, 0.7], ['river-rock', 0.5, 0.4, 1], ['water-plants', 0.78, 0.45, 0.55], ['driftwood-rock', 0.95, 0.5, 0.45]],
  // the small tanks', a group's four by turns (species.ts SMALL: the pond's, the stream's, the tropical, the reef's)
  pond: [['lily-plants', 0.5, 0.5, 0.18]], stream: [['river-rock-2', 0.5, 0.5, 0.4]], 'stream-2': [['river-rock', 0.5, 0.5, 0.36]],
  // (the walkers' tank: its sand clear, its plants at the back)
  'small-8': [['water-plants', 0.5, 0.1, 0.14]],
  tropical: [['water-plants', 0.5, 0.5, 0.18]], reef: [['coral-2', 0.5, 0.5, 0.2]], 'reef-2': [['kelp-small', 0.5, 0.4, 0.16]]
};
const SMALL_PROPS = ['pond', 'stream', 'tropical', 'reef'] as const;
/** A tank's props: its own, else its small group's (every other one the group's second, when it has one). */
function propsOf(t: Tank): [string, number, number, number][] {
  if (PROPS[t.id]) return PROPS[t.id];
  const n = Number(t.id.slice(6)) - 1, g = SMALL_PROPS[n >> 2];
  return (n % 2 && PROPS[`${g}-2`]) || PROPS[g] || [];
}

interface School {
  sp: Specimen;
  tank: Tank;
  water: Box;
  mesh: InstancedMesh | null;
  fish: Swimmer[];
  /** Its model's centre (model units, before the scale) and its scale. */
  off: Vector3;
  s: number;
  /** A bottom walker's way (species.ts WALKERS: a crab sideways), else it swims. */
  walk?: 'side' | 'ahead';
}

/** A tank's bounds as a sphere (the camera's test: its fish culled by it, its water stepped only on screen). */
function sphereOf(b: Box): Sphere {
  const c = new Vector3((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2);
  return new Sphere(c, Math.hypot(b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0) / 2);
}

export function buildAquarium(kit: Kit, list: readonly Specimen[]): Exhibit {
  const group = new Group();
  const mats: Material[] = [];
  const geos: BufferGeometry[] = [];
  const uTime = { value: 0 };
  const uNight = { value: 0 };
  let disposed = false;
  const glassOf = new Map<Tank['look'], MeshBasicMaterial>();
  const glass = (look: Tank['look']) => {
    let g = glassOf.get(look);
    if (!g) {
      // the water's own colour over what swims in it (a deep tank darker), the glass's sheen with it
      g = new MeshBasicMaterial({ color: WATER[look].glow, transparent: true, opacity: look === 'deep' ? 0.32 : 0.16, depthWrite: false, side: DoubleSide });
      glassOf.set(look, g);
      mats.push(g);
    }
    return g;
  };
  const frame = kit.lambert({ color: 0x3a4a5a });
  const stand = kit.lambert({ color: 0x5b4535 });
  const sand = kit.lambert({ map: kit.tex('fish-sand', [3, 1]) });
  const dark = kit.lambert({ color: 0x0a1424 });
  // the tanks' stands, bases, water, glass and frames: static, a mesh a material (batcher), not one a piece
  const batch = batcher(), at = new Matrix4();
  const box = (b: Box, m: Material) =>
    batch.add(new BoxGeometry(b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0), m, at.makeTranslation((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2));
  const waterOfLook = new Map<string, ShaderMaterial>();
  const waterMat = (look: Tank['look'], floor: boolean) => {
    const k = `${look}|${floor}`, was = waterOfLook.get(k);
    if (was) return was;
    const w = WATER[look];
    const m = new ShaderMaterial({
      vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, side: DoubleSide,
      uniforms: { uTime, uNight, uDeep: { value: new Color(w.deep) }, uTop: { value: new Color(w.top) }, uCaustic: { value: w.caustic }, uFloor: { value: floor ? 1 : 0 } },
      ...(floor ? { transparent: true, depthWrite: false, blending: AdditiveBlending } : {})
    });
    // (the floor's caustics lie on the sand)
    if (floor) decal(m, 1);
    m.userData.floor = floor;
    waterOfLook.set(k, m);
    mats.push(m);
    return m;
  };
  const bubbleMat = new ShaderMaterial({ vertexShader: BUBBLE_VERT, fragmentShader: BUBBLE_FRAG, uniforms: { uTime, uPx: { value: 260 * Math.min(2, window.devicePixelRatio || 1) } }, transparent: true, depthWrite: false });
  mats.push(bubbleMat);

  // ---- the tanks ----
  const spheres = new Map<string, Sphere>(TANKS.map((t) => [t.id, sphereOf(t.box)]));
  for (const t of TANKS) {
    const b = t.box, w = waterOf(t), look = t.look;
    const along = b.x1 - b.x0 >= b.z1 - b.z0;
    // its stand (a small tank's), its base
    if (b.y0 > 0) box({ x0: b.x0 + 1, x1: b.x1 - 1, y0: 0, y1: b.y0, z0: b.z0 + 1, z1: b.z1 - 1 }, stand);
    box({ x0: b.x0 - 0.5, x1: b.x1 + 0.5, y0: b.y0, y1: w.y0, z0: b.z0 - 0.5, z1: b.z1 + 0.5 }, look === 'deep' ? dark : sand);
    // its water's back (the side toward the wall: the back for the sea's, the far wall for the deep's; a free-standing
    // tank's all round is glass, its back the far long side) and its floor's caustics
    const back = new PlaneGeometry(along ? w.x1 - w.x0 : w.z1 - w.z0, w.y1 - w.y0);
    if (along) batch.add(back, waterMat(look, false), at.makeTranslation((w.x0 + w.x1) / 2, (w.y0 + w.y1) / 2, w.z0));
    else batch.add(back, waterMat(look, false), at.makeRotationY(-Math.PI / 2).setPosition(w.x1, (w.y0 + w.y1) / 2, (w.z0 + w.z1) / 2));
    batch.add(new PlaneGeometry(w.x1 - w.x0, w.z1 - w.z0), waterMat(look, true), at.makeRotationX(-Math.PI / 2).setPosition((w.x0 + w.x1) / 2, w.y0 + 0.08, (w.z0 + w.z1) / 2));
    // its props, at their spots on the sand
    for (const [name, u, v, s] of propsOf(t)) {
      const x = along ? w.x0 + (w.x1 - w.x0) * u : w.x1 - (w.x1 - w.x0) * v;
      const z = along ? w.z0 + (w.z1 - w.z0) * v : w.z0 + (w.z1 - w.z0) * u;
      kit.prop(name, x, z, { s, y: w.y0, yaw: along ? 0 : -Math.PI / 2, parent: group });
    }
    // its bubbles (rising in the shader), a few to a small tank
    const n = look === 'small' ? 10 : look === 'deep' ? 24 : 40;
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
    bg.boundingSphere = spheres.get(t.id)!;
    const pts = new Points(bg, bubbleMat);
    pts.renderOrder = 3;
    group.add(pts);
    // its glass (one pane each side, faint) and its frame's edges
    // (open below: its floor is the sand's top)
    batch.add(openBox(b.x1 - b.x0, b.y1 - w.y0, b.z1 - b.z0, ['-y']), glass(look), at.makeTranslation((b.x0 + b.x1) / 2, (w.y0 + b.y1) / 2, (b.z0 + b.z1) / 2));
    const e = 0.9;
    for (const [x, z] of [[b.x0, b.z0], [b.x1, b.z0], [b.x0, b.z1], [b.x1, b.z1]] as const) box({ x0: x - e, x1: x + e, y0: b.y0, y1: b.y1, z0: z - e, z1: z + e }, frame);
    box({ x0: b.x0 - e, x1: b.x1 + e, y0: b.y1 - e, y1: b.y1 + e, z0: b.z0 - e, z1: b.z0 + e }, frame);
    box({ x0: b.x0 - e, x1: b.x1 + e, y0: b.y1 - e, y1: b.y1 + e, z0: b.z1 - e, z1: b.z1 + e }, frame);
    box({ x0: b.x0 - e, x1: b.x0 + e, y0: b.y1 - e, y1: b.y1 + e, z0: b.z0 - e, z1: b.z1 + e }, frame);
    box({ x0: b.x1 - e, x1: b.x1 + e, y0: b.y1 - e, y1: b.y1 + e, z0: b.z0 - e, z1: b.z1 + e }, frame);
  }
  // (the glass over all else, the caustics over the sand; a look's panes one colour, so their order in a mesh is no
  // matter)
  const glasses = new Set<Material>(glassOf.values());
  geos.push(...batch.done(group, (m) => (glasses.has(m) ? 4 : m.userData.floor ? 1 : 0)));

  // ---- the fish: one of each species, an InstancedMesh, its tail swaying in the shader ----
  const schools: School[] = [];
  const fishMat = (map: Texture | null, head: number, tail: number, amp: number) => {
    const m = new MeshLambertMaterial({ map, emissive: new Color(0xffffff), emissiveMap: map, emissiveIntensity: 0.25 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uTime;
      sh.uniforms.uHead = { value: head };
      sh.uniforms.uTail = { value: tail };
      sh.uniforms.uAmp = { value: amp };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uHead; uniform float uTail; uniform float uAmp; attribute float aPhase;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float tw = clamp((uHead - position.z) / max(0.001, uHead - uTail), 0.0, 1.0);
          transformed.x += sin(uTime * 5.0 + aPhase - position.z * 0.35) * uAmp * tw * tw;`);
    };
    m.customProgramCacheKey = () => 'museum-fish';
    mats.push(m);
    return m;
  };
  /** Each tank's swimmers, all its schools' together (they keep off one another), as they load. */
  const swimmers = new Map<string, Swimmer[]>(TANKS.map((t) => [t.id, []]));
  /** And its bottom walkers (they keep off one another's way). */
  const walkers = new Map<string, Swimmer[]>(TANKS.map((t) => [t.id, []]));
  for (const sp of list) {
    if (sp.kind !== 'fish') continue;
    const tank = TANKS.find((t) => t.id === sp.tank);
    if (!tank) continue;
    const water = waterOf(tank);
    const school: School = { sp, tank, water, mesh: null, fish: [], off: new Vector3(), s: 1, walk: WALKERS[sp.id] };
    schools.push(school);
    void kit.critter('fish', sp.id).then((g) => {
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
      // (its length, head to tail; a crab's spread across it may be the longer)
      const len = bb.max.z - bb.min.z, big = Math.max(len, bb.max.x - bb.min.x);
      school.s = fishScale(tank, big);
      school.off.set(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -(bb.min.z + bb.max.z) / 2);
      geo.translate(school.off.x, school.off.y, school.off.z);
      const head = bb.max.z + school.off.z, tail = bb.min.z + school.off.z;
      geo.setAttribute('aPhase', new InstancedBufferAttribute(new Float32Array([sp.id.length]), 1));
      geos.push(geo);
      const map = (m.material as { map?: Texture | null }).map ?? null;
      // (a walker's body stays still: no tail to sway)
      const mesh = new InstancedMesh(geo, fishMat(map, head, tail, school.walk ? 0 : len * 0.06), 1);
      // (culled by its tank's bounds: its fish swim nowhere else)
      mesh.boundingSphere = spheres.get(tank.id)!;
      mesh.userData.specimen = sp.id;
      // a big fish slow, a little one quick (u/s, at its drawn size)
      const r = ((school.walk ? big : len) * school.s) / 2;
      const speed = Math.max(4, Math.min(12, 3 + r * 0.9));
      const f = spawn(water, r, school.walk ? speed * 0.5 : speed, hash(sp.id));
      school.fish.push(f);
      // a walker on the sand (its own height off it), else among the tank's swimmers
      if (school.walk) f.p[1] = water.y0 + ((bb.max.y - bb.min.y) / 2) * school.s;
      (school.walk ? walkers : swimmers).get(tank.id)!.push(f);
      school.mesh = mesh;
      group.add(mesh);
      write(school);
      kit.invalidate();
    });
  }
  const M4 = new Matrix4(), Q = new Quaternion(), P = new Vector3(), S = new Vector3(), E = new Vector3(0, 1, 0), Qp = new Quaternion(), X = new Vector3(1, 0, 0);
  function write(sc: School) {
    if (!sc.mesh) return;
    for (let i = 0; i < sc.fish.length; i++) {
      const f = sc.fish[i];
      const yaw = f.face ?? Math.atan2(f.v[0], f.v[2]), sp = Math.hypot(f.v[0], f.v[2]);
      const pitch = f.face === undefined ? -Math.atan2(f.v[1], Math.max(0.01, sp)) * 0.6 : 0;
      Q.setFromAxisAngle(E, yaw);
      Qp.setFromAxisAngle(X, pitch);
      Q.multiply(Qp);
      P.set(f.p[0], f.p[1], f.p[2]);
      S.setScalar(sc.s);
      M4.compose(P, Q, S);
      sc.mesh.setMatrixAt(i, M4);
    }
    sc.mesh.instanceMatrix.needsUpdate = true;
  }
  // the tanks' schools grouped (each steps with its own tank's others)
  const byTank = new Map<string, School[]>();
  for (const s of schools) byTank.set(s.tank.id, [...(byTank.get(s.tank.id) ?? []), s]);
  const waters = new Map<string, Box>(TANKS.map((t) => [t.id, waterOf(t)]));
  const blocks: Rect[] = TANKS.map((t) => ({ x0: t.box.x0, x1: t.box.x1, z0: t.box.z0, z1: t.box.z1 }));

  return {
    group,
    blocks,
    frame(t, dt, seen) {
      // (the water's shimmer and the bubbles with any tank on screen; a school only with its own)
      let any = false;
      for (const tk of TANKS) if (seen(spheres.get(tk.id)!)) any = true;
      if (!any) return false;
      uTime.value = t / 1000;
      for (const [id, ss] of byTank) {
        if (!seen(spheres.get(id)!)) continue;
        stepSchool(swimmers.get(id)!, waters.get(id)!, dt / 1000, t / 1000);
        for (const s of ss) {
          if (s.walk) for (const f of s.fish) stepWalker(f, s.water, dt / 1000, t / 1000, s.walk === 'side', walkers.get(id)!);
          write(s);
        }
      }
      return true;
    },
    pick(project, cx, cy) {
      let best: { id: string; d: number } | null = null;
      for (const s of schools) {
        if (!s.mesh) continue;
        for (const f of s.fish) {
          const p = project(f.p[0], f.p[1], f.p[2]);
          if (!p) continue;
          const d = Math.hypot(p[0] - cx, p[1] - cy), reach = 26 + f.r * 1.5;
          if (d < reach && (!best || d < best.d)) best = { id: s.sp.id, d };
        }
      }
      return best;
    },
    where(id) {
      const s = schools.find((x) => x.sp.id === id);
      return s?.fish[0] ? [s.fish[0].p[0], s.fish[0].p[1], s.fish[0].p[2]] : null;
    },
    shown: () => schools.filter((s) => s.mesh).map((s) => s.sp.id),
    night(n) {
      uNight.value = n;
    },
    dispose() {
      disposed = true;
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
