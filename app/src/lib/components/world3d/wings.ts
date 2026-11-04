// The fliers' wings (docs/design.md "How the bugs move", world3d/things.ts FLAPS): where each model's wings hinge, from
// its own geometry. NH's bug models are one node, their positions quantized (KHR_mesh_quantization: the vertex shader
// sees the raw integers), the body along z (the head at +z), the wings spread along x either side of it. A butterfly or
// a moth is one mesh, body and wings (the atlas moth adds a see-through layer on its wings, `mWing`); the bee's and the
// dragonflies' wings are their own mesh (`mWing`) beside a body that doesn't flap.

/** The fliers whose wings flap (the museum's fish named butterfly aren't). */
export const FLAPS = /^critters\/bugs\/.*(butterfly|moth|birdwing|bluebottle|honeybee|dragonfly)/;

/** One mesh of a model: its positions (x, y, z flat, the mesh's own space) and whether its material is a wing's. */
export interface WingPart { pos: ArrayLike<number>; wing: boolean }

/** A model's hinge (the shader's uFlap): the body's middle (x), the wings' height at it (y), how far out the wing turns
 *  from (the body's edge, or the wing mesh's root), the ramp past that over which the turn comes in (so the root bends,
 *  never tears); and which parts flap. */
export interface Hinge { x: number; y: number; root: number; ramp: number; flaps: boolean[] }

const median = (v: number[]) => (v.sort((a, b) => a - b), v[v.length >> 1]);
const quantile = (v: number[], q: number) => (v.sort((a, b) => a - b), v[Math.min(v.length - 1, Math.floor(q * v.length))]);

export function wingHinge(parts: WingPart[]): Hinge {
  let lo = Infinity, hi = -Infinity;
  for (const p of parts) for (let i = 0; i < p.pos.length; i += 3) (lo = Math.min(lo, p.pos[i])), (hi = Math.max(hi, p.pos[i]));
  const x = (lo + hi) / 2, half = (hi - lo) / 2;
  // a wing mesh beside a narrow body (the bee, the dragonflies): only it flaps; one that spans the whole model is the
  // wings themselves (a butterfly, a moth, the atlas moth's two layers): everything flaps, the body kept still by `root`
  const span = (p: WingPart) => {
    let m = 0;
    for (let i = 0; i < p.pos.length; i += 3) m = Math.max(m, Math.abs(p.pos[i] - x));
    return m;
  };
  const own = parts.some((p) => p.wing) && parts.filter((p) => !p.wing).every((p) => span(p) < half * 0.6);
  const flaps = parts.map((p) => !own || p.wing);
  const ys: number[] = [], dx: number[] = [];
  parts.forEach((p, k) => {
    if (!flaps[k]) return;
    for (let i = 0; i < p.pos.length; i += 3) {
      const d = Math.abs(p.pos[i] - x);
      dx.push(d);
      // the wings' plane: their points well out from the body
      if (d > half * 0.25) ys.push(p.pos[i + 1]);
    }
  });
  // the root: a wing mesh's innermost points; a whole model's body edge (most of its points are the body's, packed in
  // the middle), within reason
  const root = own ? Math.min(...dx) : Math.min(half * 0.15, Math.max(half * 0.04, quantile(dx.filter((d) => d < half * 0.25), 0.85)));
  return { x, y: median(ys), root, ramp: half * 0.1, flaps };
}

/** A point turned as the vertex shader turns it (FLAP_GLSL), by `angle` (radians, up from flat): for the tests. */
export function flapPoint(h: Hinge, px: number, py: number, angle: number): [number, number] {
  const fd = px - h.x, s = Math.sign(fd), u = Math.abs(fd) - h.root, fh = py - h.y;
  const t = Math.min(1, Math.max(0, u / h.ramp)), th = angle * t * t * (3 - 2 * t);
  const c = Math.cos(th), n = Math.sin(th);
  return [h.x + s * (h.root + u * c - fh * n), h.y + u * n + fh * c];
}
