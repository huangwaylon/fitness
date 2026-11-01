import { describe, expect, it } from 'vitest';
import { DECOR_MAX, beats, decorAccept, decorLayout, decorOpOf, mergeDecor, type DecorEntry } from './decor.ts';

const T = 1_793_000_000_000;
const set = (id: string, at: number, who: 'A' | 'B' = 'A', more: Partial<DecorEntry> = {}): DecorEntry =>
  ({ id, at, who, item: 'tanuki', x: 120, z: 480, f: 0, p: T, ...more }) as DecorEntry;
const rm = (id: string, at: number, who: 'A' | 'B' = 'A'): DecorEntry => ({ id, at, who, rm: true });

describe('decor ops (contract/decor.ts)', () => {
  it('reads a set or a removal, known keys only', () => {
    expect(decorOpOf({ id: 'd000001', at: T, item: 'birdbath', x: 12, z: -30, f: 3, p: T })).toEqual({ id: 'd000001', at: T, item: 'birdbath', x: 12, z: -30, f: 3, p: T });
    expect(decorOpOf({ id: 'd000001', at: T, rm: true })).toEqual({ id: 'd000001', at: T, rm: true });
    for (const bad of [
      { id: 'd000001', at: T, item: 'sofa', x: 0, z: 0, f: 0, p: T }, { id: 'D1', at: T, rm: true }, { id: 'd000001', at: 5, rm: true },
      { id: 'd000001', at: T, item: 'tanuki', x: 0, z: 2000, f: 0, p: T }, { id: 'd000001', at: T, item: 'tanuki', x: 0, z: 0, f: 0, p: T + 1 },
      { id: 'd000001', at: T, rm: false }, { id: 'd000001', at: T, rm: true, item: 'tanuki' }
    ]) expect(decorOpOf(bad), JSON.stringify(bad)).toBeNull();
  });

  it('merges commutatively: a removal beats everything, else the latest, then B over A', () => {
    const ops = [set('d1', T), set('d1', T + 5, 'A', { x: 144 }), set('d1', T + 5, 'B', { x: 96 }), set('d2', T + 1), rm('d2', T), set('d3', T + 2)];
    const orders = [ops, [...ops].reverse(), [ops[3], ops[1], ops[5], ops[0], ops[4], ops[2]]];
    const layouts = orders.map((o) => {
      const m = new Map<string, DecorEntry>();
      for (const e of o) mergeDecor(m, e);
      return decorLayout(m.values());
    });
    expect(layouts[1]).toEqual(layouts[0]);
    expect(layouts[2]).toEqual(layouts[0]);
    expect(layouts[0].map((p) => [p.id, p.x])).toEqual([['d1', 96], ['d3', 120]]);
    expect(beats(rm('d1', T), set('d1', T + 99))).toBe(true);
  });

  it('a repeat changes nothing', () => {
    const m = new Map<string, DecorEntry>();
    expect(mergeDecor(m, set('d1', T))).toBe(true);
    expect(mergeDecor(m, set('d1', T))).toBe(false);
    expect(mergeDecor(m, set('d1', T - 1, 'B'))).toBe(false);
  });

  it('caps the layout at DECOR_MAX, keeping the first placed', () => {
    const all = Array.from({ length: DECOR_MAX + 3 }, (_, k) => set(`d${String(k).padStart(6, '0')}`, T + 100 - k, 'A', { p: T - 1000 + k }));
    const l = decorLayout(all);
    expect(l).toHaveLength(DECOR_MAX);
    expect(l.at(-1)!.id).toBe(`d${String(DECOR_MAX - 1).padStart(6, '0')}`);
  });

  it('the sheet appends what beats its rows, acknowledges what does not, refuses a new item past the cap', () => {
    expect(decorAccept([set('d1', T)], set('d1', T + 1))).toBe('append');
    expect(decorAccept([set('d1', T + 2)], set('d1', T + 1))).toBe('stale');
    expect(decorAccept([set('d1', T)], set('d1', T))).toBe('stale');
    expect(decorAccept([rm('d1', T)], set('d1', T + 9))).toBe('stale');
    const full = Array.from({ length: DECOR_MAX }, (_, k) => set(`d${k}x00000`, T));
    expect(decorAccept(full, set('dnew0000', T + 1))).toBe('full');
    expect(decorAccept(full, set('d3x00000', T + 1))).toBe('append');
    expect(decorAccept([...full, rm('d3x00000', T + 1)], set('dnew0000', T + 2))).toBe('append');
  });
});
