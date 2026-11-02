// The rolling log in 3D (the /world3d POC, /tmp/world3d/design.md): NH's island bends away from the camera like a log
// under it. Every material's vertex shader wraps the world onto a cylinder of radius R round the camera's pivot (the
// ground point the camera looks at), after the model and instance matrices: θ = (pivot − z)/R along the island,
// z' = pivot − (R + y)·sin θ, y' = (R + y)·cos θ − R (three's z runs out of the screen: world z into the island is
// three's −z). Exact (not the parabola), so a tall thing leans back with the ground, as NH's do. One shared uniform
// pair: a frame updates it once. bendPoint() is the same on the CPU (taps, hit tests, overlays).
import type { Material, WebGLProgramParametersWithUniforms } from 'three';

export const bendU = { uBendZ: { value: 0 }, uBendR: { value: 900 } };

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
  };
  const key = m.customProgramCacheKey.bind(m);
  m.customProgramCacheKey = () => `bend|${key()}`;
  return m;
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
