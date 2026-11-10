// The garden's rules (layout/garden.ts): a fence joins the same fence beside it (NH's pieces turned to their neighbours),
// a fence takes its whole tile out of the walk (layout/nav.ts: the way goes round a run, never through it), a crop's
// stage follows the day it was planted.
import { describe, expect, it } from 'vitest';
import { defaultLayout, footOf, newObjId, originOf, withChanges, type Layout, type Obj } from './model.ts';
import { blockBox, findPath, navOf, walkable } from './nav.ts';
import { cropStage, fenceJoin, fenceMask, fencePiece, plantedAt, type FencePart } from './garden.ts';
import { kindDef } from './catalog.ts';
import { validate } from './validate.ts';
import { KINDS, tileX, tileZ } from './grid.ts';

const E = 1, N = 2, W = 4, S = 8;
/** A piece's arms once turned (its model's arms at no turn, a quarter turn taking east to north). */
const BASE: Record<FencePart, number[]> = { a: [], b: [2], c: [0, 2], d: [0, 1], g: [0, 2, 3], h: [0, 1, 2, 3] };
const armsOf = (p: { part: FencePart; turns: number }) => BASE[p.part].map((d) => (d + p.turns) % 4).reduce((m, d) => m | (1 << d), 0);

describe('fencePiece: NH’s piece for each neighbourhood', () => {
  it('every one of the 16 masks gets the piece whose turned arms are exactly its neighbours', () => {
    for (let mask = 0; mask < 16; mask++) expect(armsOf(fencePiece(mask)), `mask ${mask}`).toBe(mask);
  });
  it('alone: across (E–W) facing the camera or away, along (N–S) turned a quarter', () => {
    expect(fencePiece(0, 0)).toEqual({ part: 'a', turns: 0 });
    expect(fencePiece(0, 2)).toEqual({ part: 'a', turns: 0 });
    expect(fencePiece(0, 1)).toEqual({ part: 'a', turns: 1 });
    expect(fencePiece(0, 3)).toEqual({ part: 'a', turns: 1 });
  });
  it('a run’s ends, middles, corners, Ts and crosses', () => {
    expect(fencePiece(W).part).toBe('b');
    expect(fencePiece(E | W)).toEqual({ part: 'c', turns: 0 });
    expect(fencePiece(N | S)).toEqual({ part: 'c', turns: 1 });
    expect(fencePiece(E | N)).toEqual({ part: 'd', turns: 0 });
    expect(fencePiece(S | E)).toEqual({ part: 'd', turns: 3 });
    expect(fencePiece(E | W | S)).toEqual({ part: 'g', turns: 0 });
    expect(fencePiece(E | N | W | S).part).toBe('h');
  });
});

/** The default island with an open lawn made on まえ (tiles 3…14 × 10…21 all grass on the ground tier, nothing on them):
 *  a fence's test patch at its corner (4, 11) and room round it. */
function lawn(): { at: [number, number]; l: Layout } {
  const l = defaultLayout(), x0 = 3, z0 = 10, w = 12, d = 12;
  const grass = KINDS.indexOf('grass') * 4, tiles: [number, number, number][] = [];
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) tiles.push([x0 + i, z0 + j, grass]);
  const inside = [...l.objects.values()].filter((o) => {
    const [c0, r0] = originOf(l, o), [fw, fd] = footOf(l, o);
    return c0 + fw > x0 && c0 < x0 + w && r0 + fd > z0 && r0 < z0 + d;
  });
  return { at: [x0 + 1, z0 + 1], l: withChanges(l, { tiles, remove: inside.map((o) => o.id) }) };
}
const fence = (id: string, x: number, z: number, k = 'fence-country', f: Obj['f'] = 0): Obj => ({ id, k, x, z, f });

describe('fenceJoin on a layout', () => {
  const { at: [x, z], l: l0 } = lawn();
  it('a run joins: its ends, its straights, a corner, a T; another kind beside it doesn’t', () => {
    // ─┬─ along row z (x … x+3), a leg up from x+2, an iron fence touching its west end
    const l = withChanges(l0, { set: [fence('f0', x + 1, z), fence('f1', x + 2, z), fence('f2', x + 3, z), fence('f3', x + 2, z + 1), fence('f4', x + 2, z + 2), fence('iron', x, z, 'fence-iron')] });
    const at = (id: string) => fenceJoin(l, l.objects.get(id)!);
    expect(at('f0')).toEqual({ part: 'b', turns: 2 });
    expect(at('f1')).toEqual({ part: 'g', turns: 2 });
    expect(at('f2').part).toBe('b');
    expect(at('f3')).toEqual({ part: 'c', turns: 1 });
    expect(at('f4')).toEqual({ part: 'b', turns: 1 });
    expect(fenceMask(l, l.objects.get('iron')!)).toBe(0);
    expect(at('iron')).toEqual({ part: 'a', turns: 0 });
  });
  it('no join across a cliff (a tier between them) nor at a corner', () => {
    const raised = withChanges(l0, { tiles: [[x + 1, z, l0.code(x + 1, z) + 1]], set: [fence('p', x, z), fence('q', x + 1, z), fence('r', x + 2, z + 1)] });
    expect(raised.tier(x + 1, z)).toBe(l0.tier(x, z) + 1);
    expect(fenceMask(raised, raised.objects.get('p')!)).toBe(0);
    expect(fenceMask(raised, raised.objects.get('r')!)).toBe(0);
  });
});

describe('fences in the walk (nav.ts)', () => {
  const { at: [x, z], l: l0 } = lawn();
  it('a fence blocks its whole tile and nothing beside it', () => {
    expect(kindDef('fence-stone')?.block).toBe(true);
    const l = withChanges(l0, { set: [fence('f', x + 3, z + 3, 'fence-stone')] });
    const b = blockBox(l, l.objects.get('f')!)!;
    expect([b.x0, b.x1, b.y0, b.y1]).toEqual([tileX(x + 3), tileX(x + 4), tileZ(z + 3), tileZ(z + 4)]);
    const g = navOf(l), [cx, cz] = [tileX(x + 3) + 15, tileZ(z + 3) + 15];
    for (const [dx, dz] of [[-7, -7], [7, -7], [-7, 7], [7, 7]]) expect(walkable(g, cx + dx, cz + dz)).toBe(false);
    for (const [dx, dz] of [[-23, 0], [23, 0], [0, -23], [0, 23]]) expect(walkable(g, cx + dx, cz + dz)).toBe(true);
  });
  it('the way across a run of fence goes round its end, through no fence tile', () => {
    // a wall along x = x+3, rows z … z+4: from its west side to its east side
    const run = [0, 1, 2, 3, 4].map((j) => fence(`w${j}`, x + 3, z + j));
    const l = withChanges(l0, { set: run });
    expect(validate(l).filter((i) => i.level === 'error' && run.some((r) => i.ids.includes(r.id)))).toEqual([]);
    const from: [number, number] = [tileX(x + 1) + 15, tileZ(z + 2) + 15], to: [number, number] = [tileX(x + 5) + 15, tileZ(z + 2) + 15];
    const g = navOf(l), path = findPath(g, from, to)!;
    expect(path).not.toBeNull();
    // the way, sampled every 2u, never on a fence's tile
    let at: readonly [number, number] = from, len = 0;
    for (const p of path) {
      const n = Math.ceil(Math.hypot(p[0] - at[0], p[1] - at[1]) / 2);
      for (let s = 1; s <= n; s++) {
        const px = at[0] + ((p[0] - at[0]) * s) / n, pz = at[1] + ((p[1] - at[1]) * s) / n;
        expect(px > tileX(x + 3) && px < tileX(x + 4) && pz > tileZ(z) && pz < tileZ(z + 5), `${px},${pz}`).toBe(false);
      }
      len += Math.hypot(p[0] - at[0], p[1] - at[1]);
      at = p;
    }
    // round the end: longer than straight across (120u), at least out past the wall's end
    expect(len).toBeGreaterThan(150);
    expect(findPath(navOf(l0), from, to)).toEqual([to]);
  });
});

describe('a crop’s stage', () => {
  const t = Date.UTC(2026, 10, 10, 3); // 12:00 in Tokyo, 2026-11-10
  const id = newObjId(t);
  it('reads its planting from its id', () => {
    expect(plantedAt(id)).toBe(t);
    expect(plantedAt('fl:52:180')).toBeNull();
    expect(plantedAt('kk-slider')).toBeNull();
  });
  it('a sprout the day it’s planted, a stage a day, ripe on the third, fullest from the fifth', () => {
    expect(['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15', '2026-12-01'].map((d) => cropStage(id, d))).toEqual([0, 1, 2, 3, 4, 5, 5]);
    // (planted before the day it's drawn on: as planted that day)
    expect(cropStage(id, '2026-11-01')).toBe(0);
    // Tokyo's day: planted at 23:30 there is a stage on the next morning; at 00:30, a sprout that day
    expect(cropStage(newObjId(Date.UTC(2026, 10, 10, 14, 30)), '2026-11-11')).toBe(1);
    expect(cropStage(newObjId(Date.UTC(2026, 10, 10, 15, 30)), '2026-11-11')).toBe(0);
  });
  it('one not planted in the editor, or with no day, is grown', () => {
    expect(cropStage('crop-default', '2026-11-10')).toBe(5);
    expect(cropStage(id)).toBe(5);
  });
});
