// Out of a building's door (layout/nav.ts exitOf; docs/design.md "Buildings"): just in front of its door, facing out, on
// walkable ground in the island's main region, each of us to one side: on the default island and on the user's (the
// record's, with the shop at x7 z49 and the museum at x9 z18 as they placed them), and for a door turned any way.
import { describe, expect, test } from 'vitest';
import RECORD from './record-2026-11-03.json' with { type: 'json' };
import { layoutOpOf, mergeLayout, type LayoutEntry } from '#lib/contract/layout.ts';
import { defaultLayout, facingVec, layoutOf, type Layout } from './model.ts';
import { exitOf, findPath, navOf, reachable, type LayoutNav } from './nav.ts';

const AT = 1.8e12;
const layoutWith = (base: Record<string, unknown>[], extra: Record<string, unknown>[]): Layout => {
  const m = new Map<string, LayoutEntry>();
  for (const { who, ...r } of [...base, ...extra]) {
    const op = layoutOpOf(r);
    if (op) mergeLayout(m, { ...op, who } as LayoutEntry);
  }
  return layoutOf(m);
};
/** The user's island: the record, then the shop and the museum where they put them. */
const userLayout = () => layoutWith(RECORD as Record<string, unknown>[], [
  { who: 'A', sc: 'o', id: 'shop', at: AT, k: 'shop', x: 7, z: 49, f: 0 },
  { who: 'A', sc: 'o', id: 'museum', at: AT + 1, k: 'museum', x: 9, z: 18, f: 0 }
]);

const DOORS = ['home-A', 'home-B', 'home-G', 'museum', 'shop'] as const;
const WHO = ['A', 'B', 'G'] as const;

/** Every door's exits: reachable from home, a few steps in front of the door, facing out, A and B apart. */
function checkExits(g: LayoutNav, ids: readonly string[] = DOORS) {
  const home = g.named.homeA;
  for (const id of ids) {
    const d = g.doors[id], o = g.layout.objects.get(id);
    expect(d && o, id).toBeTruthy();
    const [fx, fz] = facingVec(o!.f);
    const spots = WHO.map((w) => exitOf(g, id, w)!);
    for (const [i, e] of spots.entries()) {
      const why = `${id} ${WHO[i]} at ${e.at}`;
      expect(e.at.every(Number.isInteger), why).toBe(true);
      expect(reachable(g, e.at[0], e.at[1]), why).toBe(true);
      expect(findPath(g, home, e.at), why).not.toBeNull();
      expect(Math.hypot(e.at[0] - d.at[0], e.at[1] - d.at[1]), why).toBeLessThan(80);
      // in front of the door (never behind its line), facing out of it
      expect((e.at[0] - d.at[0]) * fx + (e.at[1] - d.at[1]) * fz, why).toBeGreaterThan(0);
      expect(e.face, why).toBe(fx > 0 ? 'r' : fx < 0 ? 'l' : 'home');
    }
    expect(spots[0].at, id).not.toEqual(spots[1].at);
  }
}

describe('out of a door', () => {
  test('the default island: every building’s exit in front of its door, reachable, A and B side by side', () => {
    const g = navOf(defaultLayout());
    checkExits(g);
    // a door facing us: A on the left, B on the right, 30u out from the door node; the guest a step further, between
    const d = g.doors['home-B'].at;
    expect(exitOf(g, 'home-B', 'A')!.at).toEqual([Math.round(d[0] - 12), Math.round(d[1] - 30)]);
    expect(exitOf(g, 'home-B', 'B')!.at).toEqual([Math.round(d[0] + 12), Math.round(d[1] - 30)]);
    const gst = exitOf(g, 'home-B', 'G')!.at;
    expect(Math.hypot(gst[0] - d[0], gst[1] - (d[1] - 46))).toBeLessThan(5);
  });

  test('the user’s island (the shop at x7 z49, the museum at x9 z18): the same (the museum’s own door node isn’t walkable there)', () => {
    const g = navOf(userLayout());
    checkExits(g);
    expect(reachable(g, g.doors.museum.at[0], g.doors.museum.at[1])).toBe(false);
    expect(exitOf(g, 'shop', 'A')!.at[1]).toBeLessThan(g.doors.shop.at[1]);
  });

  test('a door turned toward +x, away and toward −x: out that way, facing that way', () => {
    // the default island's guest's house and うめ's, each turned in its place
    for (const id of ['home-G', 'home-B'])
      for (const f of [1, 2, 3]) {
        const o = defaultLayout().objects.get(id)!;
        const g = navOf(layoutWith([], [{ who: 'A', sc: 'o', id, at: AT, k: o.k, x: o.x, z: o.z, f }]));
        checkExits(g, [id]);
      }
  });

  test('nothing standable near: the door node; no door: null', () => {
    const g = navOf(defaultLayout()), d = g.doors['home-B'];
    const shut: LayoutNav = { ...g, open: new Uint8Array(g.open.length) };
    expect(exitOf(shut, 'home-B', 'A')!.at).toEqual([Math.round(d.at[0]), Math.round(d.at[1])]);
    expect(exitOf(g, 'no-such-building', 'A')).toBeNull();
  });
});
