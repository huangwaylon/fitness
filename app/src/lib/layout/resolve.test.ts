// Two phones' edits settled by one of them (layout/resolve.ts): a piece put by K.K.'s stool while the other phone turns
// the stool to face it (each fine alone, the merge commutative) blocks his front; only the later op's phone moves its
// piece, the guest's never, and the island it leaves has no error the edits made: nothing more moves after.
import { describe, expect, it } from 'vitest';
import { mergeLayout, type LayoutEntry } from '#lib/contract/layout.ts';
import { defaultLayout, layoutOf, type Layout } from './model.ts';
import { resolveMoves } from './resolve.ts';
import { validate } from './validate.ts';

const T = 1_790_000_000_000;
const doors = (l: Layout) => validate(l).filter((i) => i.level === 'error' && i.code === 'door').map((i) => i.ids.join());

/** The default island with A's palm moved beside the stool (east of it) and B's stool turned to face east, at `ta`, `tb`. */
function clash(ta: number, tb: number) {
  const l0 = defaultLayout();
  const palm = [...l0.objects.values()].find((o) => o.k === 'palm')!;
  const kk = l0.objects.get('kk-slider')!;
  const map = new Map<string, LayoutEntry>();
  mergeLayout(map, { sc: 'o', id: palm.id, at: ta, k: palm.k, x: kk.x + 1, z: kk.z, f: palm.f, who: 'A' });
  mergeLayout(map, { sc: 'o', id: kk.id, at: tb, k: kk.k, x: kk.x, z: kk.z, f: 1, who: 'B' });
  return { map, palm: palm.id, kk: kk.id, l0 };
}
/** Each phone's moves on the island as merged, the partner's piece the one that landed. */
const moves = (map: Map<string, LayoutEntry>, a: string, b: string) => {
  const l = layoutOf(map);
  return { A: resolveMoves(l, map, [b], 'A'), B: resolveMoves(l, map, [a], 'B'), G: resolveMoves(l, map, [a, b], 'G') };
};

describe('a door blocked between two phones’ edits', () => {
  it('each edit fine alone, together K.K.’s front blocked: the later op’s phone moves its piece, once, and it settles', () => {
    for (const [ta, tb, mover] of [[T, T + 50, 'B'], [T + 50, T, 'A']] as const) {
      const { map, palm, kk, l0 } = clash(ta, tb);
      expect(doors(l0)).toEqual([]);
      expect(doors(layoutOf(new Map([...map].filter(([k]) => k === `o|${palm}`))))).toEqual([]);
      expect(doors(layoutOf(new Map([...map].filter(([k]) => k === `o|${kk}`))))).toEqual([]);
      expect(doors(layoutOf(map))).toEqual([kk]);
      const m = moves(map, palm, kk);
      // only the later op's owner (the guest, owning neither piece, moves nothing)
      expect(m.G).toEqual([]);
      const other = mover === 'A' ? 'B' : 'A';
      expect(m[other]).toEqual([]);
      expect(m[mover]).toHaveLength(1);
      expect(m[mover][0].id).toBe(mover === 'A' ? palm : kk);
      // its move lands on both phones: no door error left, and nobody moves anything again
      const { id, to } = m[mover][0];
      const was = layoutOf(map).objects.get(id)!;
      mergeLayout(map, { sc: 'o', id, at: T + 100, k: was.k, x: to[0], z: to[1], f: was.f, who: mover });
      expect(doors(layoutOf(map))).toEqual([]);
      const after = moves(map, palm, kk);
      expect([after.A, after.B, after.G]).toEqual([[], [], []]);
      const l = layoutOf(map);
      expect(resolveMoves(l, map, [id], other)).toEqual([]);
    }
  });

  it('a landed piece far from every door settles nothing; a door the island had already is nobody’s', () => {
    const { map, palm, kk } = clash(T, T + 50);
    const l = layoutOf(map);
    expect(resolveMoves(l, map, [palm], 'B').map((x) => x.id)).toEqual([kk]);
    // a landed piece far from the door blocks none (B's stool, its op later, is no pair with it)
    const far = [...l.objects.values()].find((o) => ['palm', 'oak', 'cedar'].includes(o.k) && Math.abs(o.x - 6) + Math.abs(o.z - 22) > 15)!;
    mergeLayout(map, { sc: 'o', id: far.id, at: T + 60, k: far.k, x: far.x, z: far.z, f: far.f, who: 'A' });
    expect(resolveMoves(layoutOf(map), map, [far.id], 'B')).toEqual([]);
    // the island had a door blocked already (A's own palm on K.K.'s front, alone): a piece of B's landing elsewhere
    // makes A move nothing
    const own = new Map<string, LayoutEntry>();
    const p = [...l.objects.values()].find((o) => o.k === 'palm')!;
    mergeLayout(own, { sc: 'o', id: p.id, at: T, k: p.k, x: 6, z: 21, f: p.f, who: 'A' });
    mergeLayout(own, { sc: 'o', id: far.id, at: T + 60, k: far.k, x: far.x, z: far.z, f: far.f, who: 'B' });
    expect(doors(layoutOf(own))).toEqual([kk]);
    expect(resolveMoves(layoutOf(own), own, [far.id], 'A')).toEqual([]);
  });
});
