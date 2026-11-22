// Every seat's and gym piece's stand spot (layout/nav.ts seatsOf: where a villager gets on) is open ground once the
// piece stands there: outside its own blocking footprint (padded, on the walk's half-tile grid), so the walk up to it
// finds a way (the barbell's, the kettlebell's and the dumbbell's spots behind them were inside theirs: nobody walked).
import { beforeAll, describe, expect, it } from 'vitest';
import { KIND_LIST, kindDef } from './catalog.ts';
import { loadOutdoor } from './outdoor.ts';
import { defaultLayout, withChanges, type Obj } from './model.ts';
import { findPath, navOf, seatsOf, walkable } from './nav.ts';

beforeAll(() => loadOutdoor());

const at = (k: string, x: number, z: number, f: 0 | 1 | 2 | 3): Obj => ({ id: 'x', k, x, z, f });
/** The kinds with seats: the island's own and the outdoor catalogue's (its table in). */
const seated = () => KIND_LIST.filter((d) => d.block && seatsOf(withChanges(defaultLayout(), { set: [at(d.k, 6, 20, 0)] }), at(d.k, 6, 20, 0)).length).map((d) => d.k);

describe('the seats’ stand spots', () => {
  it('cover the gym’s held pieces and the outdoor catalogue’s seats and baths', () => {
    const ks = seated();
    for (const k of ['barbell', 'kettlebell', 'dumbbell', 'climbing-wall', 'exercise-ball', 'oil-barrel-bathtub', 'nh-f4379', 'nh-f3345', 'nh-f4008', 'nh-f1111', 'nh-f14554', 'nh-f4393', 'nh-f1234'])
      expect(ks, k).toContain(k);
  });
  it('each one open ground by its piece, at every facing and either half of a tile, and walked to', () => {
    const bad: string[] = [], g0 = navOf(defaultLayout());
    for (const k of seated())
      for (const f of [0, 1, 2, 3] as const)
        for (const [x, z] of [[6, 20], [7, 21]]) {
          const o = at(k, x, z, f), l = withChanges(defaultLayout(), { set: [o] }), g = navOf(l);
          for (const [name, p] of seatsOf(l, o)) {
            // (the ground there open without the piece: else it's the island's, not the piece's)
            if (!walkable(g0, p[0], p[1])) continue;
            // (walked to from round the piece: from any open ground there, a spot in a pocket of the island's aside)
            const r = Math.max(kindDef(k)!.w, kindDef(k)!.d) * 30 + 45;
            const froms = [[r, 0], [-r, 0], [0, r], [0, -r]].map(([dx, dz]) => [p[0] + dx, p[1] + dz] as const).filter((q) => walkable(g, q[0], q[1]));
            if (!walkable(g, p[0], p[1])) bad.push(`${k} f${f} ${x},${z} ${name}: in its footprint`);
            else if (froms.length && !froms.some((q) => findPath(g, q, p))) bad.push(`${k} f${f} ${x},${z} ${name}: no way`);
          }
        }
    expect(bad).toEqual([]);
  });
});
