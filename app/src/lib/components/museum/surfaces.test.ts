// No surfaces fighting (docs/design.md "The museum"): no two faces of a tank's or a case's pieces (its base or stand,
// glass, frame, water), nor the wing's floor and the first person's ceiling, lie in one plane over the same spot facing
// the same way (a double-sided pane faces both); only a decal (geometry.ts decal: polygonOffset) may.
import { describe, expect, test } from 'vitest';
import { TANKS, alongX, piecesOf, waterOf, type Box } from './tanks.ts';
import { CASES, casePieces } from './garden.ts';
import { BUG_WING, FISH_WING, WING_H, type Rect } from './plan.ts';

type Axis = 0 | 1 | 2;
/** A face: across `axis` at `at`, facing + (1), − (−1) or both (0: a double-sided pane), over a rect in the other two. */
interface Face { what: string; axis: Axis; at: number; dir: -1 | 0 | 1; r: [number, number, number, number] }
const lo = (b: Box, a: Axis) => [b.x0, b.y0, b.z0][a], hi = (b: Box, a: Axis) => [b.x1, b.y1, b.z1][a];
const others = (a: Axis): [Axis, Axis] => (a === 0 ? [1, 2] : a === 1 ? [0, 2] : [0, 1]);
/** A box's faces (`open`: those left out, as openBox's), double-sided or not. */
function facesOf(what: string, b: Box, double = false, open: string[] = []): Face[] {
  const out: Face[] = [];
  for (const a of [0, 1, 2] as Axis[]) {
    const [u, v] = others(a), r: Face['r'] = [lo(b, u), hi(b, u), lo(b, v), hi(b, v)];
    for (const [s, at] of [[-1, lo(b, a)], [1, hi(b, a)]] as const) {
      if (open.includes(`${s < 0 ? '-' : '+'}${'xyz'[a]}`)) continue;
      out.push({ what, axis: a, at, dir: double ? 0 : s, r });
    }
  }
  return out;
}
/** A room's floor (facing up) and its first-person ceiling (facing down), over the rect. */
const room = (r: Rect): Face[] => [
  { what: 'floor', axis: 1, at: 0, dir: 1, r: [r.x0, r.x1, r.z0, r.z1] },
  { what: 'ceiling', axis: 1, at: WING_H, dir: -1, r: [r.x0, r.x1, r.z0, r.z1] }
];
/** A depth gap the buffer tells apart everywhere it's seen (24 bits, the first person's near plane of 1: at the
 *  museum's farthest ~300 u its step is ~0.005 u). */
const GAP = 0.05;
/** Every pair fighting: in one plane (within GAP), facing a same way, over a spot of both (an area, not an edge).
 *  What faces down at the floor or under it is never seen (the camera's always over the floor). */
function fights(faces: Face[]): string[] {
  const seen = faces.filter((f) => !(f.axis === 1 && f.dir < 0 && f.at <= 0));
  const out: string[] = [];
  for (let i = 0; i < seen.length; i++)
    for (let j = i + 1; j < seen.length; j++) {
      const a = seen[i], b = seen[j];
      if (a.axis !== b.axis || Math.abs(a.at - b.at) >= GAP || (a.dir && b.dir && a.dir !== b.dir)) continue;
      const du = Math.min(a.r[1], b.r[1]) - Math.max(a.r[0], b.r[0]), dv = Math.min(a.r[3], b.r[3]) - Math.max(a.r[2], b.r[2]);
      if (du > 1e-6 && dv > 1e-6) out.push(`${a.what} × ${b.what} at ${'xyz'[a.axis]} ${a.at}`);
    }
  return out;
}

describe('no surfaces fighting', () => {
  test('a tank’s base, glass, frame and water, the floor and the ceiling', () => {
    const out: string[] = [];
    for (const t of TANKS) {
      const p = piecesOf(t), w = waterOf(t);
      // its water's back (aquarium.ts: a double-sided plane against its back glass); the floor's caustics are a decal
      const back: Face = alongX(t.box)
        ? { what: 'water', axis: 2, at: w.z0, dir: 0, r: [w.x0, w.x1, w.y0, w.y1] }
        : { what: 'water', axis: 0, at: w.x1, dir: 0, r: [w.y0, w.y1, w.z0, w.z1] };
      const faces = [
        ...room(FISH_WING),
        ...facesOf('base', p.base),
        ...facesOf('glass', p.glass, true, ['-y']),
        ...p.frame.flatMap((f, i) => facesOf(`frame ${i}`, f)),
        back
      ];
      out.push(...fights(faces).map((s) => `${t.id}: ${s}`));
    }
    expect(out).toEqual([]);
  });
  test('a display case’s stand, soil, glass and frame', () => {
    const out: string[] = [];
    for (const [x, z] of CASES) {
      const p = casePieces(x, z);
      const faces = [
        ...room(BUG_WING),
        ...facesOf('stand', p.stand),
        ...facesOf('soil', p.soil),
        ...facesOf('glass', p.glass, true, ['-y']),
        ...p.frame.flatMap((f, i) => facesOf(`frame ${i}`, f))
      ];
      out.push(...fights(faces).map((s) => `case ${x}: ${s}`));
    }
    expect(out).toEqual([]);
  });
  test('it fails on the great tank’s old top (its glass at the ceiling)', () => {
    const t = { ...TANKS[0], box: { ...TANKS[0].box, y1: WING_H } };
    expect(fights([...room(FISH_WING), ...facesOf('glass', piecesOf(t).glass, true, ['-y'])])).not.toEqual([]);
  });
});
