// The rain and the snow in 3D (docs/design.md "Weather"): subtle drops, splashes and flakes in the world, not a
// texture on the screen. NH's:
//   rain     thin, faint streaks falling at a slight slant through the world, near ones and far ones (parallax as the
//            camera moves), denser and quicker in a downpour; small soft rings where drops land on flat ground and on
//            the water, sparse;
//   snow     soft round flakes drifting down slowly, swaying, of mixed sizes, the big ones blurrier (a depth blur); they
//            settle nowhere (the ground is snowy already in winter).
// Battery first: ONE draw call an effect (the streaks, the rings, the flakes: each one instanced mesh, set up once), the
// motion all in the vertex shader from a time uniform: nothing per particle on the CPU, nothing made a frame. Each
// particle has a fixed seed: its place in a box (and its speed, size, sway); the box follows the camera's view and
// the particles wrap inside it, anchored in the world (a particle is the seed's lattice point nearest the box: moving
// the box moves none of them, only which copy is shown at its edges, faded there), so they hold still in the world as
// the island scrolls under them: the near ones and the far ones slide past at their own depths. The island's bend
// (bend.ts bendW) on each, so they follow its curve. The counts are set once (the most a kind draws); a lighter rain
// is a share of them (`density`: a seed's share over it is dropped in the vertex shader, outside the clip: no
// fragments). Zooming in, two smaller boxes' particles fade in round the view (their own fixed lattices, so nothing
// swims as a pinch goes), so the screen keeps a rain's worth while the near ones grow; ones too near the camera
// fade out. The rings land on the surface's height from a small data texture of the ground and the water (built once
// a layout: flat cells only, so none hangs off a slope or a cliff's edge).
// The fade: a change of sky on screen eases what falls in and out over a minute (FADE_MS, as Weather.svelte's
// layers); from rain to snow (one grey sky to another) it changes at once; the sky the page opens to is there at
// once. The island draws at its ambient rate meanwhile (≤ 30 a second: falling rain needs its frames).
import {
  DataTexture, FloatType, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, NearestFilter, PlaneGeometry, RGBAFormat, ShaderMaterial, Vector2, Vector3,
  type Object3D, type WebGLRenderer
} from 'three';
import { mulberry32 } from '#lib/random.ts';
import { smoothstep } from '#lib/math.ts';
import { BEND_GLSL, bendU } from './bend.ts';
import { lampFog } from './lights.ts';

/** What falls: none, rain (light, or a downpour), snow. */
export type PrecipKind = 'rain' | 'snow';
type Sky = 'clear' | 'cloudy' | 'rain' | 'heavy' | 'snow';

/** A fade in or out over this (ms: Weather.svelte's FADE_MS). */
export const FADE_MS = 60_000;
/** The particles' boxes at the widest zoom (u: x across, y up from the sea's level, z along the island): the view's
 *  ground from the screen's foot to the far haze, and the air over it. Its middle sits BOX_AHEAD past the pivot. */
export const BOX: Record<PrecipKind, readonly [number, number, number]> = { rain: [640, 260, 1150], snow: [640, 200, 1150] };
const BOX_AHEAD = 20;
/** The two smaller boxes (a share of the first's size) and the zooms their particles fade in over: the middle one
 *  always (the near and middle ground's air, where the view sees the least of the big box), the smallest zoomed in. */
export const GROUPS = [
  { scale: 1, zoom: [0, 0] },
  { scale: 1 / 1.8, zoom: [0, 0] },
  { scale: 1 / 3, zoom: [2.1, 2.7] }
] as const;
/** The particles a kind has (each group's), set once. */
export const COUNTS: Record<PrecipKind, readonly [number, number, number]> = { rain: [760, 440, 300], snow: [330, 210, 140] };
/** The rings' pool (its two groups: the widest zoom's, and a smaller one fading in as a pinch goes in). */
const RING_COUNTS = [64, 36] as const;

/** One sky's look (the intensity mapping): the share of the particles drawn, their alpha, speed (u/s), length (u, a
 *  streak's) or size range (u, a flake's), slant (x per unit fallen), width (CSS px), the rings' share. */
export interface PrecipLook {
  kind: PrecipKind;
  density: number;
  alpha: number;
  speed: number;
  len: number;
  size: readonly [number, number];
  tilt: number;
  width: number;
  sway: number;
  rings: number;
}
const LOOKS: Record<'rain' | 'heavy' | 'snow', PrecipLook> = {
  rain: { kind: 'rain', density: 0.6, alpha: 0.32, speed: 640, len: 30, size: [0, 0], tilt: 0.12, width: 1.1, sway: 0, rings: 0.55 },
  heavy: { kind: 'rain', density: 1, alpha: 0.38, speed: 860, len: 44, size: [0, 0], tilt: 0.2, width: 1.3, sway: 0, rings: 1 },
  snow: { kind: 'snow', density: 1, alpha: 0.85, speed: 42, len: 0, size: [2.6, 6.8], tilt: 0.05, width: 0, sway: 9, rings: 0 }
};
/** What falls from a sky (null: nothing: fine or cloudy). */
export const lookOf = (sky: Sky): PrecipLook | null => (sky === 'rain' || sky === 'heavy' || sky === 'snow' ? LOOKS[sky] : null);
/** How many particles a look draws (of its kind's set count): the share by its density. */
export const drawnOf = (l: PrecipLook): number => Math.round(COUNTS[l.kind].reduce((a, b) => a + b, 0) * l.density);

/** Each group's share at a zoom (the widest's always whole). */
const groupShare = (g: number, zoom: number) => (g === 0 ? 1 : smoothstep(GROUPS[g].zoom[0], GROUPS[g].zoom[1], zoom));
export const groupAlpha = (zoom: number): [number, number, number] => [groupShare(0, zoom), groupShare(1, zoom), groupShare(2, zoom)];

/** GLSL's mod: a value wrapped into [lo, lo + size) (the shader's wrapIn, a component). */
export const wrapIn = (v: number, lo: number, size: number): number => lo + (v - lo - size * Math.floor((v - lo) / size));

/** Where a particle is (three's space, unbent; the shader's, before the sway): its seed's point in the box `S` of a
 *  group, fallen `fall` (u) along its slant, wrapped into the box round `centre` (x, z: three's; y from 0). */
export function particleAt(seed: readonly [number, number, number], S: readonly [number, number, number], centre: readonly [number, number], fall: number, tilt: number): [number, number, number] {
  const lo = [centre[0] - S[0] / 2, 0, centre[1] - S[2] / 2];
  const v = [seed[0] * S[0] + tilt * fall, seed[1] * S[1] - fall, seed[2] * S[2]];
  return [wrapIn(v[0], lo[0], S[0]), wrapIn(v[1], lo[1], S[1]), wrapIn(v[2], lo[2], S[2])];
}

/** The fade's level after `dt` ms toward `goal` (0 or 1), linear over FADE_MS. */
export const stepLevel = (level: number, goal: number, dt: number): number => {
  const d = dt / FADE_MS;
  return goal > level ? Math.min(goal, level + d) : Math.max(goal, level - d);
};

// ---- the shaders ----

const COMMON = /* glsl */ `
${BEND_GLSL}
uniform float uTime;
uniform vec3 uCentre;
uniform vec3 uBox0;
uniform vec3 uBox1;
uniform vec3 uBox2;
uniform vec3 uGroupA;
uniform float uDensity;
uniform float uLevel;
uniform float uAlpha;
uniform float uSpeed;
uniform float uTilt;
uniform float uNear;
attribute vec4 aSeed;
attribute float aGroup;
varying float vA;
varying vec2 vUv;
varying float vDepth;
vec3 boxOf(float g) { return g < 0.5 ? uBox0 : g < 1.5 ? uBox1 : uBox2; }
float groupA(float g) { return g < 0.5 ? uGroupA.x : g < 1.5 ? uGroupA.y : uGroupA.z; }
vec3 wrapIn(vec3 v, vec3 lo, vec3 S) { return lo + mod(v - lo, S); }
// faded at the box's sides (where a particle changes copies) and its top (where it starts its fall)
// (the smaller boxes over a wide band: no edge to their denser air)
float edges(vec3 p, vec3 lo, vec3 S, float g) {
  vec3 q = (p - lo) / S;
  float ex = min(q.x, 1.0 - q.x), ez = min(q.z, 1.0 - q.z), w = g < 0.5 ? 0.08 : 0.3;
  return smoothstep(0.0, w, ex) * smoothstep(0.0, w, ez) * smoothstep(1.0, 0.85, q.y);
}
`;

/** A streak: its quad's x along it (0 the drop's head, 1 its tail), y across (−1 … 1), laid out in the view's plane from
 *  its two ends (each bent), as wide as uWidth CSS px at any depth. */
const RAIN_VERT = /* glsl */ `
${COMMON}
uniform float uLen;
uniform float uWidth;
uniform float uHalfH;
void main() {
  float ga = groupA(aGroup);
  vA = 0.0;
  vUv = position.xy;
  vDepth = 0.0;
  if (aSeed.w > uDensity || ga <= 0.0 || uLevel <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vec3 S = boxOf(aGroup);
  float k = fract(aSeed.z * 7.13);
  float fall = uTime * uSpeed * (0.82 + 0.36 * k);
  vec3 lo = vec3(uCentre.x - 0.5 * S.x, 0.0, uCentre.z - 0.5 * S.z);
  vec3 p = wrapIn(aSeed.xyz * S + vec3(uTilt * fall, -fall, 0.0), lo, S);
  vec3 up = normalize(vec3(-uTilt, 1.0, 0.0));
  vec4 h = viewMatrix * bendW(vec4(p, 1.0));
  vec4 tl = viewMatrix * bendW(vec4(p + up * uLen * (0.7 + 0.6 * k), 1.0));
  vec4 mv = mix(h, tl, position.x);
  vec2 d = tl.xy - h.xy;
  vec2 n = dot(d, d) > 1e-8 ? normalize(vec2(-d.y, d.x)) : vec2(1.0, 0.0);
  float depth = max(1.0, -mv.z);
  mv.xy += n * position.y * 0.5 * uWidth * depth / (projectionMatrix[1][1] * uHalfH);
  gl_Position = projectionMatrix * mv;
  vA = uAlpha * uLevel * ga * smoothstep(0.5 * uNear, uNear, depth) * edges(p, lo, S, aGroup) * (0.55 + 0.45 * fract(aSeed.w * 11.3));
  vDepth = depth;
}`;

const FADE_FRAG = /* glsl */ `
uniform float uFogNear;
uniform float uFogFar;
uniform vec3 uColour;
varying float vA;
varying vec2 vUv;
varying float vDepth;
`;
const RAIN_FRAG = /* glsl */ `
${FADE_FRAG}
void main() {
  // soft across, bright at the head and thin to nothing at the tail; into the haze far off
  float a = vA * (1.0 - vUv.y * vUv.y) * mix(1.0, 0.0, vUv.x * vUv.x) * (1.0 - smoothstep(uFogNear, uFogFar, vDepth));
  if (a < 0.003) discard;
  gl_FragColor = vec4(uColour, a);
}`;

/** A flake: a quad in the view's plane round its (bent) middle, swaying as it drifts down. */
const SNOW_VERT = /* glsl */ `
${COMMON}
uniform vec2 uSize;
uniform float uSway;
varying float vSoft;
void main() {
  float ga = groupA(aGroup);
  vA = 0.0;
  vUv = position.xy;
  vDepth = 0.0;
  vSoft = 0.5;
  if (aSeed.w > uDensity || ga <= 0.0 || uLevel <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vec3 S = boxOf(aGroup);
  float k = fract(aSeed.z * 7.13), sz = fract(aSeed.w * 13.7);
  float fall = uTime * uSpeed * (0.7 + 0.6 * k);
  vec3 lo = vec3(uCentre.x - 0.5 * S.x, 0.0, uCentre.z - 0.5 * S.z);
  vec3 p = wrapIn(aSeed.xyz * S + vec3(uTilt * fall, -fall, 0.0), lo, S);
  float w = uTime * (0.5 + 0.5 * aSeed.y) + aSeed.x * 6.2832;
  vec3 at = p + vec3(sin(w), 0.0, 0.5 * cos(w * 0.8)) * uSway * (0.5 + k);
  float size = mix(uSize.x, uSize.y, sz * sz);
  vec4 mv = viewMatrix * bendW(vec4(at, 1.0));
  mv.xy += position.xy * size;
  gl_Position = projectionMatrix * mv;
  float depth = max(1.0, -mv.z);
  // the big ones blurrier and a little fainter (a near flake out of focus)
  vSoft = mix(0.3, 0.9, sz * sz);
  vA = uAlpha * uLevel * ga * smoothstep(0.5 * uNear, uNear, depth) * edges(p, lo, S, aGroup) * mix(1.0, 0.7, sz);
  vDepth = depth;
}`;
const SNOW_FRAG = /* glsl */ `
${FADE_FRAG}
varying float vSoft;
void main() {
  float r = length(vUv);
  float a = vA * (1.0 - smoothstep(1.0 - vSoft, 1.0, r)) * (1.0 - smoothstep(uFogNear, uFogFar, vDepth));
  if (a < 0.003) discard;
  gl_FragColor = vec4(uColour, a);
}`;

/** A ring: each one cycles (appears, widens, fades) every uPeriod at a new spot (hashed from its index and its cycle),
 *  wrapped into its box round the view, flat on the surface there (uHeights: the height, flat, water), on flat cells
 *  only; a wider double one on the water, a small faint one on the ground. */
const RING_VERT = /* glsl */ `
${BEND_GLSL}
uniform float uTime;
uniform vec3 uCentre;
uniform vec3 uBox0;
uniform vec3 uBox1;
uniform vec2 uGroupA;
uniform float uDensity;
uniform float uLevel;
uniform float uAlpha;
uniform float uPeriod;
uniform float uRadius;
uniform float uNear;
uniform sampler2D uHeights;
uniform vec4 uHBox;
attribute vec4 aSeed;
attribute float aGroup;
varying float vA;
varying vec2 vUv;
varying float vDepth;
varying float vK;
varying float vWater;
uvec2 pcg2(uvec2 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * 1664525u; v.y += v.x * 1664525u;
  v = v ^ (v >> 16u);
  v.x += v.y * 1664525u; v.y += v.x * 1664525u;
  v = v ^ (v >> 16u);
  return v;
}
void main() {
  float ga = aGroup < 0.5 ? uGroupA.x : uGroupA.y;
  vA = 0.0; vK = 0.0; vWater = 0.0; vDepth = 0.0;
  vUv = position.xy;
  gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  if (aSeed.w > uDensity || ga <= 0.0 || uLevel <= 0.0) return;
  vec3 S = aGroup < 0.5 ? uBox0 : uBox1;
  float c = uTime / (uPeriod * (0.8 + 0.4 * aSeed.y)) + aSeed.x;
  float n = floor(c);
  vK = fract(c);
  vec2 q = vec2(pcg2(uvec2(uint(gl_InstanceID), uint(n)))) / 4294967295.0;
  vec2 lo = uCentre.xz - 0.5 * S.xz;
  vec2 xz = lo + mod(q * S.xz - lo, S.xz);
  vec4 hs = texture(uHeights, clamp((xz - uHBox.xy) / (uHBox.zw - uHBox.xy), 0.0, 1.0));
  if (hs.g < 0.5) return;
  vWater = hs.b;
  float r = uRadius * mix(0.55, 1.0, hs.b) * (0.75 + 0.5 * aSeed.z);
  vec4 mv = viewMatrix * bendW(vec4(xz.x + position.x * r, hs.r + 0.35, xz.y - position.y * r, 1.0));
  gl_Position = projectionMatrix * mv;
  float depth = max(1.0, -mv.z);
  vA = uAlpha * uLevel * ga * mix(0.55, 1.0, hs.b) * smoothstep(0.5 * uNear, uNear, depth);
  vDepth = depth;
}`;
const RING_FRAG = /* glsl */ `
${FADE_FRAG}
varying float vK;
varying float vWater;
void main() {
  float d = length(vUv), k = 0.2 + 0.8 * vK;
  float ring = 1.0 - smoothstep(0.0, 0.12, abs(d - k));
  // the water's: a fainter second ring inside the first
  ring = max(ring, vWater * 0.5 * (1.0 - smoothstep(0.0, 0.1, abs(d - 0.55 * k))));
  float a = vA * ring * (1.0 - vK) * (1.0 - vK) * (1.0 - smoothstep(uFogNear, uFogFar, vDepth));
  if (a < 0.003) discard;
  gl_FragColor = vec4(uColour, a);
}`;

// ---- the meshes ----

/** One instanced quad mesh: `counts` instances a group, each a seed (x, y, z in its box, w its share and its look). */
function pool(counts: readonly number[], quad: PlaneGeometry, vert: string, frag: string, uniforms: Record<string, { value: unknown }>, seed: number): Mesh<InstancedBufferGeometry, ShaderMaterial> {
  const geo = new InstancedBufferGeometry();
  geo.index = quad.index;
  geo.setAttribute('position', quad.getAttribute('position'));
  const total = counts.reduce((a, b) => a + b, 0), seeds = new Float32Array(total * 4), groups = new Float32Array(total), r = mulberry32(seed);
  let i = 0;
  counts.forEach((c, g) => {
    for (let k = 0; k < c; k++, i++) {
      for (let j = 0; j < 4; j++) seeds[i * 4 + j] = r();
      groups[i] = g;
    }
  });
  geo.setAttribute('aSeed', new InstancedBufferAttribute(seeds, 4));
  geo.setAttribute('aGroup', new InstancedBufferAttribute(groups, 1));
  geo.instanceCount = total;
  const mat = new ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: { ...bendU, uFogNear: lampFog.near, uFogFar: lampFog.far, ...uniforms }, transparent: true, depthWrite: false, depthTest: true });
  // (its own bend in its shader: the engine's add() leaves it be)
  mat.userData.bent = true;
  const mesh = new Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.castShadow = mesh.receiveShadow = false;
  mesh.visible = false;
  return mesh;
}

/** The time of day's colours (NH's rain is a pale grey-white, bluer and dimmer at night). */
const COLOURS: Record<'day' | 'dusk' | 'night', number[]> = { day: [0.86, 0.9, 0.95], dusk: [0.9, 0.86, 0.88], night: [0.62, 0.7, 0.88] };
const NIGHT_ALPHA = { day: 1, dusk: 0.9, night: 0.75 } as const;
type Tod3 = keyof typeof COLOURS;

interface PrecipState {
  /** What's drawn now (it stays through a fade out), its look's sky, how far in (0 … 1). */
  kind: PrecipKind | null;
  sky: Sky;
  level: number;
  /** The particles drawn (its look's share of the set count), the meshes shown (one draw call each), the rings' ground. */
  drawn: number;
  meshes: string[];
  /** The rings' surface: its cells, the flat ones (rings land there) and the water's among them, the ms its build
   *  took; null: not built. */
  rings: { cells: number; flat: number; water: number; ms: number } | null;
}

export interface Precip {
  /** The sky now (weatherNow's): `opening` the page's first seconds (no fade: the sky the page opens to is there). */
  set(sky: Sky, opening: boolean): void;
  /** The time of day (its colours). */
  tod(t: Tod3): void;
  /** The surface the rings land on (the layout's): its height at (x, z) (world: z into the island), whether it's water
   *  there; the land's box (world) and its margin. Built once a layout (`key`), when the rain first needs it. */
  surface(key: object, at: (x: number, z: number) => { h: number; water: boolean }, land: { x0: number; x1: number; z0: number; z1: number }): void;
  /** Whether the rings' surface is built for `key` (the layout). */
  has(key: object): boolean;
  /** One frame: the camera's pivot (world x, z), its zoom and its distance to the pivot (u), the canvas's height (CSS
   *  px). 'ambient' while anything falls (the ambient rate), else false. */
  frame(t: number, x: number, z: number, zoom: number, dist: number, h: number): 'ambient' | false;
  /** Whether the rain needs the rings' surface now (it's raining and none is built for the layout). */
  wantsSurface(): boolean;
  /** The e2e's: the draw calls its meshes made in the last frame drawn (none drawn in it: 0), the scene's others not
   *  counted (a critter coming into view changes the frame's total, never this). */
  calls(): number;
  state(): PrecipState;
  dispose(): void;
}

/** The rings' surface grid's cell (u) and its margin of sea round the land. */
const CELL = 8, MARGIN = 48;
/** Flat: the surface within this (u) across a cell. */
const FLAT = 1.2;

export function createPrecip(add: (o: Object3D) => () => void, kick: () => void): Precip {
  const quad = new PlaneGeometry(2, 2);
  // (a streak's quad: x 0 … 1 along it, y −1 … 1 across)
  const strip = new PlaneGeometry(1, 2).translate(0.5, 0, 0);
  const box = (k: PrecipKind, g: number) => new Vector3(...BOX[k]).multiplyScalar(GROUPS[g].scale);
  const shared = { uTime: { value: 0 }, uLevel: { value: 0 }, uNear: { value: 400 } };
  const colour = { value: new Vector3(...COLOURS.day) };
  const rain = pool(COUNTS.rain, strip, RAIN_VERT, RAIN_FRAG, {
    ...shared, uColour: colour, uCentre: { value: new Vector3() }, uBox0: { value: box('rain', 0) }, uBox1: { value: box('rain', 1) }, uBox2: { value: box('rain', 2) },
    uGroupA: { value: new Vector3(1, 0, 0) }, uDensity: { value: 0 }, uAlpha: { value: 0 }, uSpeed: { value: 0 }, uTilt: { value: 0 }, uLen: { value: 0 }, uWidth: { value: 1 }, uHalfH: { value: 400 }
  }, 11);
  const snow = pool(COUNTS.snow, quad, SNOW_VERT, SNOW_FRAG, {
    ...shared, uColour: { value: new Vector3(0.96, 0.97, 1) }, uCentre: { value: new Vector3() }, uBox0: { value: box('snow', 0) }, uBox1: { value: box('snow', 1) }, uBox2: { value: box('snow', 2) },
    uGroupA: { value: new Vector3(1, 0, 0) }, uDensity: { value: 0 }, uAlpha: { value: 0 }, uSpeed: { value: 0 }, uTilt: { value: 0 }, uSize: { value: [2, 6] }, uSway: { value: 0 }
  }, 23);
  const grid = (data: Float32Array<ArrayBuffer>, w: number, h: number) => {
    const t = new DataTexture(data, w, h, RGBAFormat, FloatType);
    t.minFilter = t.magFilter = NearestFilter;
    t.needsUpdate = true;
    return t;
  };
  let heights = grid(new Float32Array(4), 1, 1);
  /** The rings' box at the widest zoom (u): the near and middle ground (a far ring is too small to see). */
  const RING_BOX = [480, 1, 760] as const;
  const rings = pool(RING_COUNTS, quad, RING_VERT, RING_FRAG, {
    ...shared, uColour: colour, uCentre: { value: new Vector3() }, uBox0: { value: new Vector3(...RING_BOX) }, uBox1: { value: new Vector3(...RING_BOX).multiplyScalar(0.4) },
    uGroupA: { value: new Vector2(1, 0) }, uDensity: { value: 0 }, uAlpha: { value: 0.4 }, uPeriod: { value: 0.9 }, uRadius: { value: 8 }, uHeights: { value: heights }, uHBox: { value: [0, 0, 1, 1] }
  }, 37);
  rain.renderOrder = rings.renderOrder = snow.renderOrder = 7;
  // the rings over the ground and the water they lie on (their quad turned face up: -y to three's z)
  rings.material.polygonOffset = true;
  rings.material.polygonOffsetFactor = -2;
  rings.material.polygonOffsetUnits = -4;
  rain.name = 'precip:rain';
  snow.name = 'precip:snow';
  rings.name = 'precip:rings';
  const offs = [rain, snow, rings].map((m) => add(m));
  // (three calls onAfterRender once a draw; the renderer's frame count tells the last frame's draws from older ones)
  let drew = { frame: -1, n: 0 }, gl: WebGLRenderer | null = null;
  for (const m of [rain, snow, rings])
    m.onAfterRender = (r) => {
      gl = r;
      if (r.info.render.frame !== drew.frame) drew = { frame: r.info.render.frame, n: 0 };
      drew.n++;
    };

  let sky: Sky = 'clear', look: PrecipLook | null = null, level = 0, goal = 0, last = 0, tod: Tod3 = 'day';
  let surfaceKey: object | null = null, surfaceN: PrecipState['rings'] = null;
  const u = (m: Mesh<InstancedBufferGeometry, ShaderMaterial>) => m.material.uniforms;
  function apply() {
    const l = look;
    rain.visible = l?.kind === 'rain' && level > 0;
    snow.visible = l?.kind === 'snow' && level > 0;
    rings.visible = rain.visible && !!surfaceKey && (l?.rings ?? 0) > 0;
    if (!l) return;
    const m = l.kind === 'rain' ? rain : snow;
    u(m).uDensity.value = l.density;
    u(m).uAlpha.value = l.alpha * NIGHT_ALPHA[tod];
    u(m).uSpeed.value = l.speed;
    u(m).uTilt.value = l.tilt;
    if (l.kind === 'rain') {
      u(m).uLen.value = l.len;
      u(m).uWidth.value = l.width;
      u(rings).uDensity.value = l.rings;
      u(rings).uAlpha.value = 0.6 * NIGHT_ALPHA[tod];
    } else {
      u(m).uSize.value = l.size;
      u(m).uSway.value = l.sway;
    }
  }

  return {
    set(s, opening) {
      if (s === sky && last) return;
      sky = s;
      const next = lookOf(s);
      if (!next) goal = 0;
      else {
        // (from nothing: in from 0; from one fall to another, or back while one fades out: from where it is)
        look = next;
        goal = 1;
      }
      if (opening) level = goal;
      if (!next && level === 0) look = null;
      apply();
      kick();
    },
    tod(t) {
      tod = t;
      colour.value.fromArray(COLOURS[t]);
      apply();
    },
    surface(key, at, land) {
      const t0 = performance.now(), x0 = land.x0 - MARGIN, z0 = land.z0 - MARGIN, nx = Math.ceil((land.x1 + MARGIN - x0) / CELL), nz = Math.ceil((land.z1 + MARGIN - z0) / CELL);
      const data = new Float32Array(nx * nz * 4);
      // the cells' corners sampled once (each shared by four cells), then each cell's middle: flat when the five agree
      const ch = new Float32Array((nx + 1) * (nz + 1)), cw = new Uint8Array((nx + 1) * (nz + 1));
      for (let j = 0; j <= nz; j++)
        for (let i = 0; i <= nx; i++) {
          const c = at(x0 + i * CELL, z0 + (nz - j) * CELL), k = j * (nx + 1) + i;
          ch[k] = c.h;
          cw[k] = c.water ? 1 : 0;
        }
      // (the texture's rows run along three's z, which is −z: row 0 the far end)
      for (let j = 0; j < nz; j++)
        for (let i = 0; i < nx; i++) {
          const c = at(x0 + (i + 0.5) * CELL, z0 + (nz - j - 0.5) * CELL);
          let lo = c.h, hi = c.h, wet = c.water;
          for (const k of [j * (nx + 1) + i, j * (nx + 1) + i + 1, (j + 1) * (nx + 1) + i, (j + 1) * (nx + 1) + i + 1]) {
            lo = Math.min(lo, ch[k]);
            hi = Math.max(hi, ch[k]);
            wet &&= cw[k] === 1;
          }
          const o = (j * nx + i) * 4;
          data[o] = c.h;
          data[o + 1] = hi - lo <= FLAT ? 1 : 0;
          data[o + 2] = wet ? 1 : 0;
          data[o + 3] = 1;
        }
      // (a new texture: a size once uploaded is fixed)
      heights.dispose();
      heights = grid(data, nx, nz);
      u(rings).uHeights.value = heights;
      u(rings).uHBox.value = [x0, -(z0 + nz * CELL), x0 + nx * CELL, -z0];
      surfaceKey = key;
      surfaceN = { cells: nx * nz, flat: 0, water: 0, ms: Math.round(performance.now() - t0) };
      for (let i = 0; i < nx * nz; i++) if (data[i * 4 + 1]) (surfaceN.flat++, (surfaceN.water += data[i * 4 + 2]));
      apply();
      kick();
    },
    has: (key) => surfaceKey === key,
    wantsSurface: () => look?.kind === 'rain' && goal > 0,
    frame(t, x, z, zoom, dist, h) {
      const dt = last ? Math.min(1000, t - last) : 0;
      last = t;
      if (!look) return false;
      if (level !== goal) {
        level = stepLevel(level, goal, dt);
        if (level === 0 && goal === 0) {
          look = null;
          apply();
          return false;
        }
        apply();
      }
      // (seconds, wrapped: the motion jumps once in ~17 minutes, invisibly in a fall of random drops; the shader's
      // floats keep their precision)
      shared.uTime.value = (t / 1000) % 1000;
      shared.uLevel.value = level;
      shared.uNear.value = dist * 0.45;
      const m = look.kind === 'rain' ? rain : snow;
      (u(m).uGroupA.value as Vector3).set(1, groupShare(1, zoom), groupShare(2, zoom));
      (u(m).uCentre.value as Vector3).set(x, 0, -(z + BOX_AHEAD / zoom));
      if (look.kind === 'rain') {
        u(rain).uHalfH.value = h / 2;
        (u(rings).uGroupA.value as Vector2).set(1, smoothstep(1.6, 2.4, zoom));
        (u(rings).uCentre.value as Vector3).set(x, 0, -(z + (0.3 * BOX_AHEAD) / zoom));
      }
      return 'ambient';
    },
    calls: () => (gl && drew.frame === gl.info.render.frame ? drew.n : 0),
    state: () => ({
      kind: look?.kind ?? null, sky, level, drawn: look ? drawnOf(look) : 0,
      meshes: [rain, snow, rings].filter((m) => m.visible).map((m) => m.name), rings: surfaceN
    }),
    dispose() {
      for (const off of offs) off();
      for (const m of [rain, snow, rings]) {
        m.geometry.dispose();
        m.material.dispose();
      }
      quad.dispose();
      strip.dispose();
      heights.dispose();
    }
  };
}
