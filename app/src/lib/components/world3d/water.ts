// The 3D island's live water (the /world3d POC, /tmp/world3d/design.md "Water"): three cheap shaders, each with the
// rolling log's bend, no reflections and no depth texture. The sea: one big plane over the baked shallows, translucent
// near the land and opaque far out (an analytic distance to the land), ripples, glints and NH's shore wash. The river: a
// ribbon along the stream, its flow scrolling, white where it drops over the cliff (the waterfall). The pond and the
// spring: slow ripples. A foam pool at the falls' foot. One time uniform for them all.
import {
  BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Mesh, PlaneGeometry, ShaderMaterial, CircleGeometry, type Fog
} from 'three';
import { BEND_GLSL, bendU } from './bend.ts';
import { RIVER_LINE, SEA_Y, WATER_DROP, baseHeight } from './ground.ts';
import { CLIFF, LAND, POND, SPRING } from '../island/world.ts';

export const waterU = {
  uTime: { value: 0 },
  uTint: { value: new Color(1, 1, 1) },
  uFog: { value: new Color(0xcfeaff) },
  uFogNear: { value: 1200 },
  uFogFar: { value: 3000 }
};

const VERT = /* glsl */ `
${BEND_GLSL}
attribute float aSteep;
varying vec2 vW;
varying vec2 vUv2;
varying float vSteep;
varying float vDepth;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = vec2(wp.x, -wp.z);
  vUv2 = uv;
  vSteep = aSteep;
  vec4 mv = viewMatrix * bendW(wp);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const COMMON = /* glsl */ `
uniform float uTime;
uniform vec3 uTint;
uniform vec3 uFog;
uniform float uFogNear;
uniform float uFogFar;
varying vec2 vW;
varying vec2 vUv2;
varying float vSteep;
varying float vDepth;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
vec4 finish(vec3 col, float a) {
  col *= uTint;
  col = mix(col, uFog, smoothstep(uFogNear, uFogFar, vDepth));
  return vec4(col, a);
}
`;

const SEA_FRAG = /* glsl */ `
${COMMON}
uniform vec4 uLand;
uniform float uLandR;
float landDist(vec2 p) {
  vec2 c = vec2(uLand.x + uLand.y, uLand.z + uLand.w) * 0.5;
  vec2 h = vec2(uLand.y - uLand.x, uLand.w - uLand.z) * 0.5 - uLandR;
  vec2 q = abs(p - c) - h;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uLandR;
}
void main() {
  float d = landDist(vW);
  if (d < -10.0) discard;
  float a = mix(0.18, 1.0, smoothstep(6.0, 190.0, d));
  vec3 col = mix(vec3(0.42, 0.86, 0.90), vec3(0.17, 0.50, 0.86), smoothstep(10.0, 230.0, d));
  vec2 p = vW;
  float n = noise(p * 0.045 + vec2(uTime * 0.05, uTime * 0.03)) + 0.5 * noise(p * 0.12 - vec2(uTime * 0.08, -uTime * 0.02));
  col += vec3(0.07, 0.09, 0.1) * smoothstep(0.95, 1.4, n);
  float g = noise(p * 0.32 + vec2(uTime * 0.7, uTime * 0.4));
  col += vec3(0.35) * smoothstep(0.93, 0.99, g) * smoothstep(25.0, 80.0, d) * smoothstep(0.5, 0.9, n);
  // NH's shore wash: a lacy foam band that breathes in and out with the waves
  float wave = 5.0 + 4.0 * sin(uTime * 0.85 + p.x * 0.015 + p.y * 0.01);
  float lace = noise(p * 0.22 + vec2(0.0, uTime * 0.35));
  float foam = smoothstep(wave + 2.0, wave - 2.5, d) * smoothstep(-6.0, -1.0, d);
  float line = smoothstep(1.6, 0.0, abs(d - wave)) * 0.9;
  float f = max(foam * (0.55 + 0.45 * lace), line * lace);
  col = mix(col, vec3(0.97, 1.0, 1.0), f);
  a = max(a, f * 0.9);
  gl_FragColor = finish(col, a);
}`;

const RIVER_FRAG = /* glsl */ `
${COMMON}
uniform float uLen;
void main() {
  float s = vUv2.y, x = vUv2.x;
  float flow = uTime * mix(26.0, 90.0, vSteep);
  float n = noise(vec2(x * 3.0, (s - flow) * 0.07)) * 0.6 + noise(vec2(x * 7.0, (s - flow * 1.3) * 0.16)) * 0.4;
  vec3 col = mix(vec3(0.24, 0.58, 0.88), vec3(0.55, 0.82, 0.97), smoothstep(0.55, 0.85, n));
  float sheet = noise(vec2(x * 10.0, (s - uTime * 110.0) * 0.12));
  col = mix(col, vec3(0.93, 0.97, 1.0), vSteep * (0.55 + 0.45 * sheet));
  float a = mix(0.72, 0.96, vSteep);
  // into the sea at the mouth
  a *= smoothstep(0.0, 60.0, uLen - s);
  gl_FragColor = finish(col, a);
}`;

const POND_FRAG = /* glsl */ `
${COMMON}
void main() {
  vec2 p = vW;
  float n = noise(p * 0.08 + vec2(uTime * 0.04, uTime * 0.03)) * 0.6 + noise(p * 0.2 - uTime * 0.05) * 0.4;
  vec3 col = mix(vec3(0.22, 0.55, 0.84), vec3(0.5, 0.8, 0.96), smoothstep(0.55, 0.85, n));
  float g = noise(p * 0.4 + uTime * 0.5);
  col += vec3(0.45) * smoothstep(0.88, 0.97, g);
  gl_FragColor = finish(col, 0.8);
}`;

const FOAM_FRAG = /* glsl */ `
${COMMON}
void main() {
  float r = length(vUv2 - 0.5) * 2.0;
  float n = noise(vW * 0.35 + vec2(0.0, -uTime * 1.6)) * 0.6 + noise(vW * 0.9 - uTime * 2.2) * 0.4;
  float a = smoothstep(1.0, 0.35, r) * (0.55 + 0.45 * n);
  gl_FragColor = finish(vec3(0.96, 0.99, 1.0), a);
}`;

function mat(frag: string, extra: Record<string, { value: unknown }> = {}): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: VERT, fragmentShader: frag, transparent: true, depthWrite: false, side: DoubleSide,
    uniforms: { ...bendU, ...waterU, ...extra }
  });
}

/** Three's space: world (x, y, z) at (x, y, −z). */
export interface WaterSet {
  sea: Mesh;
  river: Mesh;
  ponds: Mesh[];
  foam: Mesh;
  all: Mesh[];
}

export function createWater(): WaterSet {
  // the sea: far beyond the plan every way, rows dense enough along z for the bend to stay smooth
  const seaGeo = new PlaneGeometry(4200, 6000, 24, 150);
  seaGeo.rotateX(-Math.PI / 2);
  seaGeo.translate(195, SEA_Y, -1500);
  const sea = new Mesh(seaGeo, mat(SEA_FRAG, { ...seaFog, uLand: { value: [LAND.x0, LAND.x1, LAND.z0, LAND.z1] }, uLandR: { value: LAND.r } }));
  sea.renderOrder = 1;

  // the river: a ribbon along the smoothed centreline, a little wider than its channel (the banks clip it); its
  // height the bank's less WATER_DROP (so over the cliff it falls), never under the sea
  const pos: number[] = [], uv: number[] = [], steep: number[] = [], idx: number[] = [];
  const ACROSS = 4;
  let s = 0;
  const L = RIVER_LINE;
  const ys = L.map(([x, z]) => Math.max(SEA_Y + 0.4, baseHeight(x, z) - WATER_DROP));
  for (let i = 0; i < L.length; i++) {
    const [x, z, w] = L[i];
    const a = L[Math.max(0, i - 1)], b = L[Math.min(L.length - 1, i + 1)];
    const tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1;
    const nx = -tz / tl, nz = tx / tl;
    if (i) s += Math.hypot(x - L[i - 1][0], z - L[i - 1][1]);
    const dy = Math.abs(ys[Math.min(L.length - 1, i + 1)] - ys[Math.max(0, i - 1)]) / (Math.hypot(tx, tz) || 1);
    const st = Math.min(1, Math.max(0, (dy - 0.25) / 0.5));
    const hw = w / 2 + 5;
    for (let k = 0; k <= ACROSS; k++) {
      const t = (k / ACROSS) * 2 - 1;
      pos.push(x + nx * hw * t, ys[i], -(z + nz * hw * t));
      uv.push(t, s);
      steep.push(st);
    }
    if (i)
      for (let k = 0; k < ACROSS; k++) {
        const a0 = (i - 1) * (ACROSS + 1) + k, a1 = a0 + 1, b0 = a0 + ACROSS + 1, b1 = b0 + 1;
        idx.push(a0, b0, a1, a1, b0, b1);
      }
  }
  const rg = new BufferGeometry();
  rg.setAttribute('position', new Float32BufferAttribute(pos, 3));
  rg.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  rg.setAttribute('aSteep', new Float32BufferAttribute(steep, 1));
  rg.setIndex(idx);
  const river = new Mesh(rg, mat(RIVER_FRAG, { uLen: { value: s } }));
  river.renderOrder = 2;

  // the pond and the spring
  const flat = (geo: BufferGeometry) => {
    geo.setAttribute('aSteep', new Float32BufferAttribute(new Float32Array(geo.attributes.position.count), 1));
    return geo;
  };
  const ponds = [POND, SPRING].map((o) => {
    const g = flat(new CircleGeometry(1, 40));
    g.rotateX(-Math.PI / 2);
    g.scale(o.rx + 6, 1, o.rz + 6);
    g.translate(o.x, baseHeight(o.x, o.z) - WATER_DROP, -o.z);
    const m = new Mesh(g, mat(POND_FRAG));
    m.renderOrder = 2;
    return m;
  });

  // the foam pool at the falls' foot
  const fx = (CLIFF.fall[0] + CLIFF.fall[1]) / 2, fz = CLIFF.z0 - 4;
  const fg = flat(new PlaneGeometry(64, 40));
  fg.rotateX(-Math.PI / 2);
  fg.translate(fx, baseHeight(fx, fz - 20) - WATER_DROP + 0.6, -fz);
  const foam = new Mesh(fg, mat(FOAM_FRAG));
  foam.renderOrder = 3;

  const all = [sea, river, ...ponds, foam];
  for (const m of all) m.frustumCulled = false;
  return { sea, river, ponds, foam, all };
}

/** The open sea's haze (deeper than the land's: it meets the sky at the horizon; engine.ts sets it). */
export const seaFog = { uFogNear: { value: 1200 }, uFogFar: { value: 3000 } };

/** The water's fog follows the scene's. */
export function waterFog(f: Fog) {
  waterU.uFog.value.copy(f.color);
  waterU.uFogNear.value = f.near;
  waterU.uFogFar.value = f.far;
}
