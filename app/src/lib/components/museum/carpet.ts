// The museum's carpets (docs/design.md "The museum"), pure: a room's runners as strips (rects on the floor, model
// units) in, one seamless carpet out: one texture over all of them (no tile repeat), its gold border round the
// outline of their union (meeting strips are one carpet: no border across a junction, mitred at the corners), its
// pile one colour (a faint weave), the geometry the strips themselves with UVs in world units (overlaps draw the
// same texel: no seam, no fight). The engine (engine.ts) makes the mesh.
import { smoothstep } from '#lib/math.ts';
import type { Rect } from './plan.ts';

/** The carpet's pixels a model unit (at most MAX px across). */
const PX = 4, MAX = 2048;
/** Distances from the outline (model units): the gold band, the thin dark line inside it. */
const GOLD: [number, number] = [1, 1.75], LINE: [number, number] = [2.25, 2.55];
/** The pile's colours: NH's red, and the green of the T. rex's island rug. */
export const PILE = { red: [0x8f, 0x24, 0x30], green: [0x3f, 0x6e, 0x45] } as const;
const GOLD_C = [0xd5, 0xad, 0x55], LINE_C = [0x74, 0x1c, 0x26];

export interface CarpetTex { data: Uint8Array<ArrayBuffer>; w: number; h: number; x0: number; z0: number; px: number }

/** The strips' bounds (a unit's margin). */
function carpetBounds(strips: readonly Rect[]): Rect {
  return {
    x0: Math.min(...strips.map((r) => r.x0)) - 1, x1: Math.max(...strips.map((r) => r.x1)) + 1,
    z0: Math.min(...strips.map((r) => r.z0)) - 1, z1: Math.max(...strips.map((r) => r.z1)) + 1
  };
}

/** The carpet's texture (RGBA, row 0 at z0: v = (z − z0) / depth): each pixel's distance in from the union's outline
 *  (a chamfer transform) picks the pile, the gold band or the dark line, their edges soft. */
export function carpetTexture(strips: readonly Rect[], pile: keyof typeof PILE = 'red'): CarpetTex {
  const b = carpetBounds(strips);
  const px = Math.min(PX, MAX / Math.max(b.x1 - b.x0, b.z1 - b.z0));
  const w = Math.ceil((b.x1 - b.x0) * px), h = Math.ceil((b.z1 - b.z0) * px);
  const d = new Float32Array(w * h);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const x = b.x0 + (i + 0.5) / px, z = b.z0 + (j + 0.5) / px;
      d[j * w + i] = strips.some((r) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) ? Infinity : 0;
    }
  // (two passes, the 8 neighbours at 1 and √2: within a few % of the true distance, plenty at a border's width)
  const at = (i: number, j: number) => (i < 0 || j < 0 || i >= w || j >= h ? 0 : d[j * w + i]);
  const D = Math.SQRT2;
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const k = j * w + i;
      if (d[k]) d[k] = Math.min(d[k], at(i - 1, j) + 1, at(i, j - 1) + 1, at(i - 1, j - 1) + D, at(i + 1, j - 1) + D);
    }
  for (let j = h - 1; j >= 0; j--)
    for (let i = w - 1; i >= 0; i--) {
      const k = j * w + i;
      if (d[k]) d[k] = Math.min(d[k], at(i + 1, j) + 1, at(i, j + 1) + 1, at(i + 1, j + 1) + D, at(i - 1, j + 1) + D);
    }
  const data = new Uint8Array(new ArrayBuffer(w * h * 4));
  const band = (u: number, [a, z]: [number, number]) => smoothstep(a - 0.12, a + 0.12, u) * (1 - smoothstep(z - 0.12, z + 0.12, u));
  for (let k = 0; k < w * h; k++) {
    const u = d[k] / px;
    const g = band(u, GOLD), l = band(u, LINE), weave = 1 + (hash(k) - 0.5) * 0.05;
    for (let c = 0; c < 3; c++) data[k * 4 + c] = Math.round(Math.min(255, (PILE[pile][c] * (1 - g - l) + GOLD_C[c] * g + LINE_C[c] * l) * weave));
    data[k * 4 + 3] = 255;
  }
  return { data, w, h, x0: b.x0, z0: b.z0, px };
}

/** The strips as one geometry's arrays (two triangles a strip, on the floor, facing up), UVs over the texture. */
export function carpetGeometry(strips: readonly Rect[], t: Pick<CarpetTex, 'w' | 'h' | 'x0' | 'z0' | 'px'>): { position: Float32Array; uv: Float32Array; index: number[] } {
  const position = new Float32Array(strips.length * 12), uv = new Float32Array(strips.length * 8), index: number[] = [];
  const W = t.w / t.px, H = t.h / t.px;
  strips.forEach((r, s) => {
    const pts: [number, number][] = [[r.x0, r.z1], [r.x1, r.z1], [r.x1, r.z0], [r.x0, r.z0]];
    pts.forEach(([x, z], k) => {
      position.set([x, 0, z], s * 12 + k * 3);
      uv.set([(x - t.x0) / W, (z - t.z0) / H], s * 8 + k * 2);
    });
    // (counter-clockwise seen from above: +y up)
    index.push(s * 4, s * 4 + 1, s * 4 + 2, s * 4, s * 4 + 2, s * 4 + 3);
  });
  return { position, uv, index };
}

const hash = (k: number) => {
  let x = (k * 2654435761) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 2246822519) >>> 0;
  x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
};
