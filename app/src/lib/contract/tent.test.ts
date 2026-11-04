import { describe, expect, it } from 'vitest';
import { TENT_FLOOR, TENT_MAX, TENT_ROOM, TENT_WALL, mergeTent, tentAccept, tentLayout, tentOpOf, type TentEntry } from './tent.ts';
import { decorOpOf } from './decor.ts';

const T0 = 1_790_000_000_000;
const set = (id: string, at: number, o: Partial<{ item: string; x: number; z: number; f: number; p: number }> = {}) =>
  ({ sc: 't', id, at, item: 'f4041', x: 1, z: 2, f: 0, p: at, ...o }) as Record<string, unknown>;

describe('a tent op', () => {
  it('a piece at a tile, the wallpaper and the floor, a removal; nothing else', () => {
    expect(tentOpOf(set('dabc123', T0))).toEqual({ sc: 't', id: 'dabc123', at: T0, item: 'f4041', x: 1, z: 2, f: 0, p: T0 });
    expect(tentOpOf({ sc: 't', id: 'dabc123', at: T0, rm: true })).toEqual({ sc: 't', id: 'dabc123', at: T0, rm: true });
    expect(tentOpOf(set(TENT_WALL, T0, { item: 'w4840', x: 0, z: 0 }))).not.toBeNull();
    expect(tentOpOf(set(TENT_FLOOR, T0, { item: 'g5018', x: 0, z: 0 }))).not.toBeNull();
    for (const bad of [
      set('dabc123', T0, { x: 8 }), set('dabc123', T0, { z: -1 }), set('dabc123', T0, { f: 4 }), set('dabc123', T0, { item: 'w4840' }),
      set('dabc123', T0, { item: 'stone-lantern' }), set('dabc123', T0, { p: T0 + 1 }), { ...set('dabc123', T0), extra: 1 },
      set(TENT_WALL, T0, { item: 'g5018', x: 0, z: 0 }), set(TENT_WALL, T0, { item: 'w4840', x: 1, z: 0 }),
      { sc: 't', id: TENT_FLOOR, at: T0, rm: true }, { ...set('dabc123', T0), sc: 'i' }, set('x1', T0)
    ]) expect(tentOpOf(bad), JSON.stringify(bad)).toBeNull();
  });

  it('a small thing on a surface names its piece (its slot there in x and z); never the wallpaper, never itself', () => {
    expect(tentOpOf(set('dlamp001', T0, { item: 'f1432', x: 1, z: 0 }) as never)).not.toBeNull();
    expect(tentOpOf({ ...set('dlamp001', T0, { item: 'f1432', x: 1, z: 0 }), on: 'dtable01' })).toMatchObject({ on: 'dtable01', x: 1, z: 0 });
    expect(tentOpOf({ ...set('dlamp001', T0), on: 'dlamp001' })).toBeNull();
    expect(tentOpOf({ ...set('dlamp001', T0), on: 'x' })).toBeNull();
    expect(tentOpOf({ ...set(TENT_WALL, T0, { item: 'w4840', x: 0, z: 0 }), on: 'dtable01' })).toBeNull();
  });

  it('a light’s switch rides on its piece’s op; the room’s light switch is an op of its own', () => {
    expect(tentOpOf({ ...set('dlamp001', T0, { item: 'f1432' }), l: 0 })).toMatchObject({ l: 0 });
    expect(tentOpOf({ ...set('dlamp001', T0), l: 2 })).toBeNull();
    expect(tentOpOf(set(TENT_ROOM, T0, { item: 'r0', x: 0, z: 0 }))).toMatchObject({ item: 'r0' });
    expect(tentOpOf(set(TENT_ROOM, T0, { item: 'r7', x: 0, z: 0 }))).toBeNull();
    const e = (o: object) => ({ ...tentOpOf(set(TENT_ROOM, T0, { item: 'r0', x: 0, z: 0, ...o }))!, who: 'A' as const });
    expect(tentLayout([e({})]).lights).toBe(false);
    expect(tentLayout([]).lights).toBe(true);
  });

  it('is never an island op, nor an island op a tent one (the scope keeps them apart on old phones too)', () => {
    expect(decorOpOf(set('dabc123', T0))).toBeNull();
    expect(tentOpOf({ id: 'dabc123', at: T0, item: 'stone-lantern', x: 100, z: 200, f: 0, p: T0 })).toBeNull();
  });
});

describe('the room’s layout', () => {
  const e = (id: string, at: number, who: 'A' | 'B', o = {}) => ({ ...tentOpOf(set(id, at, o))!, who }) as TentEntry;

  it('last writer wins, B over A at the same time, a removal over everything', () => {
    const m = new Map<string, TentEntry>();
    mergeTent(m, e('dabc123', T0 + 5, 'A', { x: 3 }));
    expect(mergeTent(m, e('dabc123', T0 + 4, 'B', { x: 4 }))).toBe(false);
    expect(mergeTent(m, e('dabc123', T0 + 5, 'B', { x: 5 }))).toBe(true);
    expect(tentLayout(m.values()).pieces[0].x).toBe(5);
    mergeTent(m, { sc: 't', id: 'dabc123', at: T0, rm: true, who: 'A' });
    expect(tentLayout(m.values()).pieces).toEqual([]);
  });

  it('the wallpaper and the floor apart from the pieces; the oldest TENT_MAX pieces', () => {
    const es = [e(TENT_WALL, T0, 'A', { item: 'w4795', x: 0, z: 0 }), ...Array.from({ length: TENT_MAX + 2 }, (_, i) => e(`dp${String(i).padStart(5, '0')}`, T0 + i, 'A'))];
    const l = tentLayout(es);
    expect(l.wall).toBe('w4795');
    expect(l.floor).toBeNull();
    expect(l.pieces).toHaveLength(TENT_MAX);
    expect(l.pieces[0].id).toBe('dp00000');
  });

  it('the sheet: stale when beaten, full past the cap (the surfaces never count), else append', () => {
    const held = Array.from({ length: TENT_MAX }, (_, i) => e(`dp${String(i).padStart(5, '0')}`, T0 + i, 'A'));
    expect(tentAccept(held, e('dnew0001', T0 + 99, 'B'))).toBe('full');
    expect(tentAccept(held, e(TENT_FLOOR, T0 + 99, 'B', { item: 'g5018', x: 0, z: 0 }))).toBe('append');
    expect(tentAccept(held, e('dp00001', T0, 'B'))).toBe('stale');
    expect(tentAccept(held, e('dp00001', T0 + 100, 'B', { x: 6 }))).toBe('append');
  });

  it('60 pieces a room, each room its own: the 61st refused, a removed one frees its place', () => {
    expect(TENT_MAX).toBe(60);
    const held: TentEntry[] = [];
    const got: string[] = [];
    for (let i = 0; i < 61; i++) {
      const n = e(`dp${String(i).padStart(5, '0')}`, T0 + i, i % 2 ? 'B' : 'A');
      const v = tentAccept(held, n);
      got.push(v);
      if (v === 'append') held.push(n);
    }
    const other = { ...e('dother01', T0 + 99, 'B'), sc: 'u' as const };
    const freed = [...held, { sc: 't' as const, id: 'dp00000', at: T0 + 200, rm: true as const, who: 'A' as const }];
    expect([got.filter((v) => v === 'append').length, got[60], tentAccept(held, other), tentAccept(freed, e('dlate0001', T0 + 201, 'A')), tentLayout(held).pieces.length])
      .toEqual([60, 'full', 'append', 'append', 60]);
  });
});
