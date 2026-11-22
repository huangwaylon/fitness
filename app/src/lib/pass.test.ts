// The pieces one walks through (#lib/pass.ts; scripts/room-pass.ts finds them from each model): an arch's way through is
// the half tiles between its posts, found from its geometry at a villager's height, turned with its facing.
import { describe, expect, it } from 'vitest';
import { cellsOf } from './pass.ts';
import { cellsOf as seen, passOf } from '../../scripts/room-pass.ts';
import ITEMS_JSON from './components/tent/items.json' with { type: 'json' };
import MORE from './components/tent/more.json' with { type: 'json' };

type V3 = [number, number, number];
type Tri = [V3, V3, V3];
/** A box's twelve triangles (model units: x across, y up, z deep). */
function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): Tri[] {
  const p = (i: number): V3 => [i & 1 ? x1 : x0, i & 2 ? y1 : y0, i & 4 ? z1 : z0];
  const quads = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];
  return quads.flatMap(([a, b, c, d]) => [[p(a), p(b), p(c)], [p(a), p(c), p(d)]] as Tri[]);
}
/** A 3 × 1 arch: two posts a tile wide at its ends (a hair over into the middle tile, as NH's balloons are), a crown over
 *  a villager's head. */
const arch = (bulge = 0.3): Tri[] => [...box(-15, -5 + bulge, 0, 22, -4, 4), ...box(5 - bulge, 15, 0, 22, -4, 4), ...box(-15, 15, 20, 26, -4, 4)];
const ROOM = { ...ITEMS_JSON.items, ...MORE.items } as unknown as Record<string, { w: number; d: number; pa?: [number, number][] }>;

describe('a way through, from the geometry (scripts/room-pass.ts)', () => {
  it('an arch: the middle tile’s half tiles, its posts’ blocked (a post a hair over its tile’s line is still its own)', () => {
    expect(passOf(seen(arch(), 3, 1))).toEqual([[2, 0], [2, 1], [3, 0], [3, 1]]);
  });
  it('none for a solid piece, a low one (a crown under a villager’s head), or one walled across by a net on a line', () => {
    expect(passOf(seen(box(-15, 15, 0, 20, -4, 4), 3, 1))).toBeNull();
    expect(passOf(seen([...arch(), ...box(-5, 5, 9, 10, -4, 4)], 3, 1))).toBeNull();
    // a net along the line between the front and back halves, across the gap
    expect(passOf(seen([...arch(), [[-5, 2, 0], [5, 2, 0], [5, 14, 0]], [[-5, 2, 0], [5, 14, 0], [-5, 14, 0]]], 3, 1))).toBeNull();
  });
  it('none for a gap narrower than a villager (one half tile), nor a piece with nothing at a villager’s height', () => {
    expect(passOf(seen([...box(-15, -2, 0, 22, -4, 4), ...box(2.5, 15, 0, 22, -4, 4)], 3, 1))).toBeNull();
    expect(passOf(seen(box(-15, 15, 20, 26, -4, 4), 3, 1))).toBeNull();
  });
  it('NH’s arches and gates, the torii, the wedding arch, our 2026 and 2027 arches: their middles walk (items.json pa)', () => {
    const passing = Object.keys(ROOM).filter((c) => ROOM[c].pa);
    // the celebratory arches, NH's other arches, the castle gate, the torii, the wedding arch, the gazebos, the pergola
    for (const c of ['f13543', 'f14590', 'f90002', 'f90003', 'f12398', 'f13581', 'f3499', 'f13765', 'f12689', 'f14018', 'f3977', 'f4083', 'f11941', 'f13631', 'f6081', 'f12402', 'f14106', 'f14108', 'f14184'])
      expect(passing, c).toContain(c);
    expect(passing).toHaveLength(19);
    expect(ROOM.f90002.pa).toEqual([[2, 0], [2, 1], [3, 0], [3, 1]]);
    for (const c of passing) for (const [i, j] of ROOM[c].pa!) expect(i < ROOM[c].w * 2 && j < ROOM[c].d * 2, c).toBe(true);
  });
});

describe('turned with its facing (#lib/pass.ts)', () => {
  const pa: [number, number][] = [[2, 0], [2, 1], [3, 0], [3, 1]];
  const way = (f: number) => cellsOf(3, 1, f, pa).filter((c) => c.pass).map((c) => [c.x, c.z]);
  it('facing us: the middle tile across; a quarter turn: the middle tile deep; every facing 12 half tiles, 4 of them the way', () => {
    expect(way(0)).toEqual([[-0.25, -0.25], [-0.25, 0.25], [0.25, -0.25], [0.25, 0.25]]);
    for (const f of [1, 3]) for (const [x, z] of way(f)) expect(Math.abs(x) === 0.25 && Math.abs(z) === 0.25).toBe(true);
    for (const f of [0, 1, 2, 3]) {
      const all = cellsOf(3, 1, f, pa);
      expect(all).toHaveLength(12);
      expect(all.filter((c) => c.pass)).toHaveLength(4);
      // the posts: a tile either side of the middle, across when facing us or away, deep when turned
      const posts = all.filter((c) => !c.pass);
      expect(posts.every((c) => (f % 2 ? Math.abs(c.z) >= 0.75 : Math.abs(c.x) >= 0.75)), String(f)).toBe(true);
    }
  });
  it('a half tile turns with it, a quarter at a time (three’s yaw, as the room turns the model)', () => {
    expect(cellsOf(1, 1, 0, [[0, 0]]).find((c) => c.pass)).toMatchObject({ x: -0.25, z: -0.25 });
    expect(cellsOf(1, 1, 1, [[0, 0]]).find((c) => c.pass)).toMatchObject({ x: -0.25, z: 0.25 });
    expect(cellsOf(1, 1, 2, [[0, 0]]).find((c) => c.pass)).toMatchObject({ x: 0.25, z: 0.25 });
  });
});
