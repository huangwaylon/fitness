// The rolling log in 3D (the /world3d POC, /tmp/world3d/design.md): NH's island bends away from the camera like a log
// under it. Every material's vertex shader wraps the world onto a cylinder of radius R round the camera's pivot (the
// ground point the camera looks at), after the model and instance matrices: θ = (pivot − z)/R along the island,
// z' = pivot − (R + y)·sin θ, y' = (R + y)·cos θ − R (three's z runs out of the screen: world z into the island is
// three's −z). Exact (not the parabola), so a tall thing leans back with the ground, as NH's do. One shared uniform
// pair: a frame updates it once. bendPoint() is the same on the CPU (taps, hit tests, overlays).
// The point lights' mask (pointMask, on by default since r3 L4; `?pointmask=0` off): each bent lit material's point-light loop skips a light that's
// off (lights.ts: its intensity 0, all of them by day), by a uniform: one program set, nothing compiled at dusk.
import { AddEquation, CustomBlending, OneFactor, ShaderChunk, SrcAlphaFactor, ZeroFactor, type Material, type Mesh, type Object3D, type WebGLProgramParametersWithUniforms } from 'three';

export const bendU = { uBendZ: { value: 0 }, uBendR: { value: 900 } };
/** Each point light on (1) or off (0), by its slot (lights.ts writes it: as many as the scene's point lights). */
export const pointsU = { uPointOn: { value: [] as number[] }, uPointN: { value: 0 } };
/** The mask's in the bent materials compiled from now (the island's option, set before its first frame). */
export const pointMask = { on: false };

const LOOP_START = '#pragma unroll_loop_start', LOOP_END = '#pragma unroll_loop_end', POINT_AT = 'pointLight = pointLights[ i ];';
/** A fragment shader's point-light loop skipped while no point light is lit (uPointN: up to the last lit slot), and in
 *  it each slot's work while that one's off (uPointOn), three's unrolled loop still. Three's own where point lights
 *  cast shadows. Unchanged where it has no such loop. */
export function maskedLights(frag: string): string {
  const f = frag.replace('#include <lights_fragment_begin>', ShaderChunk.lights_fragment_begin);
  const at = f.indexOf(POINT_AT), a = f.lastIndexOf(LOOP_START, at), b = at < 0 ? -1 : f.indexOf(LOOP_END, at);
  if (at < 0 || a < 0 || b < 0) return frag;
  const loop = f.slice(a, b + LOOP_END.length);
  const mine = `if ( uPointN > 0 ) {\n${loop.replace(POINT_AT, `if ( uPointOn[ i ] > 0.5 ) {\n${POINT_AT}`).replace(new RegExp(`\\}\\s*${LOOP_END}$`), `}\n}\n${LOOP_END}`)}\n}`;
  const head = '#if NUM_POINT_LIGHTS > 0\nuniform float uPointOn[ NUM_POINT_LIGHTS ];\nuniform int uPointN;\n#endif\n';
  return `${head}${f.slice(0, a)}#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0\n${loop}\n#else\n${mine}\n#endif\n${f.slice(b + LOOP_END.length)}`;
}

export const BEND_GLSL = /* glsl */ `
uniform float uBendZ;
uniform float uBendR;
vec4 bendW(vec4 wp) {
  float th = (uBendZ - wp.z) / uBendR;
  float r = uBendR + wp.y;
  wp.z = uBendZ - r * sin(th);
  wp.y = r * cos(th) - uBendR;
  return wp;
}
`;

/** three's project_vertex with the bend between the model and the view matrix. */
const PROJECT = /* glsl */ `
vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
  mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = viewMatrix * bendW( modelMatrix * mvPosition );
gl_Position = projectionMatrix * mvPosition;
`;

/** Patch a built-in material (Lambert, Basic, Depth…) to bend. Idempotent. */
export function bend<M extends Material>(m: M): M {
  if (m.userData.bent) return m;
  m.userData.bent = true;
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (s: WebGLProgramParametersWithUniforms, r) => {
    prev.call(m, s, r);
    s.uniforms.uBendZ = bendU.uBendZ;
    s.uniforms.uBendR = bendU.uBendR;
    s.vertexShader = BEND_GLSL + s.vertexShader.replace('#include <project_vertex>', PROJECT);
    if (pointMask.on) {
      Object.assign(s.uniforms, pointsU);
      s.fragmentShader = maskedLights(s.fragmentShader);
    }
  };
  const key = m.customProgramCacheKey.bind(m);
  m.customProgramCacheKey = () => `bend${pointMask.on ? '-pm' : ''}|${key()}`;
  return m;
}

/** Every material under `root` bent, its meshes never culled by three (their bounds are unbent: the bend draws them
 *  elsewhere; the island culls what it must itself). */
export function bendTree(root: Object3D): void {
  root.traverse((n) => {
    const m = (n as Mesh).material as Material | Material[] | undefined;
    if (m) for (const x of Array.isArray(m) ? m : [m]) bend(x);
    n.frustumCulled = false;
  });
}

/** The bend on the CPU, in three's space (x, y, z → its bent position). */
export function bendPoint(x: number, y: number, z: number, pivotZ: number, R: number): [number, number, number] {
  const th = (pivotZ - z) / R, r = R + y;
  return [x, r * Math.cos(th) - R, pivotZ - r * Math.sin(th)];
}

/** Where a ray (three's space) meets the bent ground at height h: the unbent (x, z) under it (three's z), or null when
 *  it misses (the sky). The bent ground is the cylinder of radius R + h round (y = −R, z = pivotZ). */
export function unbendRay(o: readonly number[], d: readonly number[], h: number, pivotZ: number, R: number): [number, number] | null {
  const oy = o[1] + R, oz = o[2] - pivotZ, r = R + h;
  const a = d[1] * d[1] + d[2] * d[2], b = 2 * (oy * d[1] + oz * d[2]), c = oy * oy + oz * oz - r * r;
  const disc = b * b - 4 * a * c;
  if (disc < 0 || a < 1e-12) return null;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  if (t <= 0) return null;
  const py = oy + t * d[1], pz = oz + t * d[2];
  // only the cylinder's top half (the ground facing the camera)
  if (py <= 0) return null;
  const th = Math.atan2(-pz, py);
  return [o[0] + t * d[0], pivotZ - R * th];
}

/** Light added over what's drawn, never touching the canvas's alpha. The island's canvas is transparent where the sky
 *  is (the DOM's sky shows through): three's additive blending writes alpha there too, so a glow over the sky (a far
 *  lamp's halo behind the trees, a firefly) came out as a black box. Colour added (by its alpha when `byAlpha`), alpha
 *  kept: over the sky it composites as light. */
export function glow<M extends Material>(m: M, byAlpha = false): M {
  m.blending = CustomBlending;
  m.blendEquation = AddEquation;
  m.blendSrc = byAlpha ? SrcAlphaFactor : OneFactor;
  m.blendDst = OneFactor;
  m.blendEquationAlpha = AddEquation;
  m.blendSrcAlpha = ZeroFactor;
  m.blendDstAlpha = OneFactor;
  return m;
}
