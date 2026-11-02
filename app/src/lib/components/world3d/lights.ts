// The 3D island's night lights (docs/design.md "World: lights"): every lamp and lit thing stays lit the whole time it's
// on screen, and nothing pops.
//   - Each light is always-on emissive (its model's own _Emi map, things.ts) plus a halo: an additive, camera-facing
//     glow sprite, depth-tested (a tree in front covers it) but never writing depth, a little toward the camera so its
//     own lamp doesn't cut it.
//   - Each has a pool of light on the ground under it: a flat additive decal, always there while lamps are on.
//   - The few real point lights (POINTS) go to the lights nearest the view's centre, with hysteresis (a lit one keeps
//     its light until another is clearly nearer), each fading in and out over FADE_MS: a light never snaps on or off.
// All of it scales with the time of day's lamp level (0 by day), eased so dusk comes on softly.
import {
  Color, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, PlaneGeometry, PointLight,
  ShaderMaterial, type Scene
} from 'three';
import { BEND_GLSL, bendPoint, bendU, glow } from './bend.ts';
/** The halos' and pools' haze: the land's (engine.ts), so a far lamp still glows where the land shows. */
export const lampFog = { near: { value: 1200 }, far: { value: 3000 } };

export interface LampSpot {
  id: string;
  /** World x, z and the light's height (world y, absolute). */
  x: number;
  z: number;
  y: number;
  /** The ground's height under it (its pool). */
  gy: number;
  /** A fire flickers; a window is a softer, wider glow. */
  kind: 'lamp' | 'fire' | 'window';
  colour: number;
  /** The halo's radius and the pool's (u). */
  glow: number;
  pool: number;
}

/** The real point lights in the scene (always there, so a change of time never recompiles a shader). */
const POINTS = 6;
/** At most this many lit at once (the rest of the slots carry the ones fading out). */
const TARGET = 4;
const FADE_MS = 400;
const MAX = 96;

const HALO_VERT = /* glsl */ `
${BEND_GLSL}
attribute vec3 aAt;
attribute float aSize;
attribute vec3 aCol;
attribute float aI;
varying vec2 vUv;
varying vec3 vCol;
varying float vDepth;
void main() {
  vUv = uv;
  vCol = aCol * aI;
  vec4 mv = viewMatrix * bendW(vec4(aAt, 1.0));
  mv.xy += position.xy * aSize;
  // toward the camera a little: its own lamp's glass doesn't cut it
  mv.z += aSize * 0.6;
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const POOL_VERT = /* glsl */ `
${BEND_GLSL}
attribute vec3 aAt;
attribute float aSize;
attribute vec3 aCol;
attribute float aI;
varying vec2 vUv;
varying vec3 vCol;
varying float vDepth;
void main() {
  vUv = uv;
  vCol = aCol * aI;
  vec4 wp = vec4(aAt.x + position.x * aSize, aAt.y, aAt.z - position.y * aSize, 1.0);
  vec4 mv = viewMatrix * bendW(wp);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = (power: number) => /* glsl */ `
uniform float uFogNear;
uniform float uFogFar;
varying vec2 vUv;
varying vec3 vCol;
varying float vDepth;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float a = pow(max(0.0, 1.0 - d), ${power.toFixed(1)});
  a *= 1.0 - smoothstep(uFogNear, uFogFar * 1.1, vDepth);
  gl_FragColor = vec4(vCol * a, 1.0);
}`;

function sprites(vert: string, frag: string, order: number): { mesh: Mesh; geo: InstancedBufferGeometry; at: Float32Array; size: Float32Array; col: Float32Array; i: Float32Array } {
  const geo = new InstancedBufferGeometry();
  const quad = new PlaneGeometry(2, 2);
  geo.index = quad.index;
  geo.setAttribute('position', quad.getAttribute('position'));
  geo.setAttribute('uv', quad.getAttribute('uv'));
  const at = new Float32Array(MAX * 3), size = new Float32Array(MAX), col = new Float32Array(MAX * 3), i = new Float32Array(MAX);
  geo.setAttribute('aAt', new InstancedBufferAttribute(at, 3));
  geo.setAttribute('aSize', new InstancedBufferAttribute(size, 1));
  geo.setAttribute('aCol', new InstancedBufferAttribute(col, 3));
  geo.setAttribute('aI', new InstancedBufferAttribute(i, 1));
  geo.instanceCount = 0;
  const mat = glow(new ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, depthTest: true,
    uniforms: { ...bendU, uFogNear: lampFog.near, uFogFar: lampFog.far }
  }));
  const mesh = new Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = order;
  return { mesh, geo, at, size, col, i };
}

export interface Lights {
  /** The lights on the island now (models' and the decor's). */
  set(list: readonly LampSpot[]): void;
  /** The time of day's lamp level (0 day … 1 night), eased to. */
  level(v: number): void;
  /** One frame: true while something still fades. `cx, cz`: the view's centre on the ground (world). */
  frame(t: number, cx: number, cz: number, R: number, pivotZ: number): boolean;
  /** How many point lights are lit (any share) and the lights' count (stats). */
  stats(): { points: number; lamps: number };
  dispose(): void;
}

export function createLights(scene: Scene): Lights {
  const halo = sprites(HALO_VERT, FRAG(2.0), 6), pool = sprites(POOL_VERT, FRAG(1.6), 3);
  // the pools under every upright thing, over the ground and the water
  (pool.mesh.material as ShaderMaterial).polygonOffset = true;
  (pool.mesh.material as ShaderMaterial).polygonOffsetFactor = -2;
  scene.add(halo.mesh, pool.mesh);
  const points = Array.from({ length: POINTS }, () => {
    const l = new PointLight(0xffc77a, 0, 170, 1.3);
    l.castShadow = false;
    scene.add(l);
    return { l, lamp: null as Spot | null };
  });
  interface Spot extends LampSpot {
    /** Its share of a point light now and where it's heading (0 / 1). */
    w: number;
    want: number;
    seed: number;
  }
  let spots: Spot[] = [];
  let lvl = 0, lvlTo = 0, last = 0;
  const c = new Color();

  function set(list: readonly LampSpot[]) {
    const was = new Map(spots.map((s) => [s.id, s]));
    spots = list.slice(0, MAX).map((s, n) => {
      const o = was.get(s.id);
      return { ...s, w: o?.w ?? 0, want: o?.want ?? 0, seed: o?.seed ?? n * 1.7 + 0.3 };
    });
    for (const p of points) if (p.lamp && !spots.includes(p.lamp)) p.lamp = spots.find((s) => s.id === p.lamp!.id) ?? null;
    halo.geo.instanceCount = pool.geo.instanceCount = spots.length;
    spots.forEach((s, k) => {
      halo.at.set([s.x, s.y, -s.z], k * 3);
      pool.at.set([s.x, s.gy + 0.35, -s.z], k * 3);
      halo.size[k] = s.glow;
      pool.size[k] = s.pool;
      c.set(s.colour);
      halo.col.set([c.r, c.g, c.b], k * 3);
      pool.col.set([c.r, c.g * 0.92, c.b * 0.8], k * 3);
    });
    for (const a of ['aAt', 'aSize', 'aCol'] as const) {
      halo.geo.getAttribute(a).needsUpdate = true;
      pool.geo.getAttribute(a).needsUpdate = true;
    }
  }

  function frame(t: number, cx: number, cz: number, R: number, pivotZ: number): boolean {
    const dt = last ? Math.min(100, t - last) : 16;
    last = t;
    let moving = false;
    if (lvl !== lvlTo) {
      const step = dt / 900;
      lvl = Math.abs(lvlTo - lvl) <= step ? lvlTo : lvl + Math.sign(lvlTo - lvl) * step;
      moving = true;
    }
    // which lights get a real one: the nearest the view's centre, a lit one counted a fifth nearer (hysteresis)
    if (lvl > 0) {
      const ranked = spots.map((s) => ({ s, d: Math.hypot(s.x - cx, (s.z - cz) * 0.85) * (s.want ? 0.8 : 1) })).sort((a, b) => a.d - b.d);
      ranked.forEach((r, n) => (r.s.want = n < TARGET && r.d < 700 ? 1 : 0));
    } else for (const s of spots) s.want = 0;
    // a fading-in light needs a free point light (one fading out keeps its own until it's dark)
    for (const s of spots) {
      if (s.want && !points.some((p) => p.lamp === s)) {
        const free = points.find((p) => !p.lamp);
        if (free) free.lamp = s;
        else continue;
      }
      const to = s.want, step = dt / FADE_MS;
      if (s.w !== to) {
        s.w = Math.abs(to - s.w) <= step ? to : s.w + Math.sign(to - s.w) * step;
        moving = true;
      }
    }
    for (const p of points) {
      const s = p.lamp;
      if (!s || (s.w <= 0 && !s.want)) {
        p.lamp = null;
        p.l.intensity = 0;
        continue;
      }
      const flick = s.kind === 'fire' ? 0.82 + 0.18 * Math.sin(t / 90 + s.seed) * Math.sin(t / 37 + s.seed) : 1;
      const ease = s.w * s.w * (3 - 2 * s.w);
      p.l.intensity = (s.kind === 'fire' ? 2600 : s.kind === 'window' ? 1100 : 1500) * lvl * ease * flick;
      p.l.color.set(s.colour);
      const [x, y, z] = bendPoint(s.x, s.y, -s.z, pivotZ, R);
      p.l.position.set(x, y, z);
    }
    // the halos and the pools: always on with the lamps (a fire's breathe with it)
    let fire = false;
    spots.forEach((s, k) => {
      const flick = s.kind === 'fire' ? ((fire = true), 0.85 + 0.15 * Math.sin(t / 110 + s.seed)) : 1;
      halo.i[k] = lvl * (s.kind === 'window' ? 0.55 : 0.8) * flick;
      pool.i[k] = lvl * (s.kind === 'window' ? 0.35 : 0.5) * flick;
    });
    halo.geo.getAttribute('aI').needsUpdate = true;
    pool.geo.getAttribute('aI').needsUpdate = true;
    halo.mesh.visible = pool.mesh.visible = lvl > 0 && spots.length > 0;
    return moving || (fire && lvl > 0);
  }

  return {
    set,
    level: (v) => void (lvlTo = v),
    frame,
    stats: () => ({ points: points.filter((p) => p.l.intensity > 0).length, lamps: spots.length }),
    dispose() {
      for (const m of [halo, pool]) {
        m.geo.dispose();
        (m.mesh.material as ShaderMaterial).dispose();
      }
      for (const p of points) p.l.dispose();
    }
  };
}
