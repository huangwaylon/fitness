import { describe, expect, it } from 'vitest';
import { assign, eased, fade, FADE_MS, spread, type Slot } from './lampLights.ts';

const slots = (n: number): Slot[] => Array.from({ length: n }, () => ({ id: null, k: 0, to: 0 }));
const ids = (ss: Slot[]) => ss.map((s) => (s.to ? s.id : null));

describe('lamp lights', () => {
  it('gives the lights to the wanted lamps, nearest first, as many as there are', () => {
    const ss = slots(3);
    assign(ss, ['a', 'b', 'c', 'd']);
    expect(ids(ss)).toEqual(['a', 'b', 'c']);
  });

  it('keeps a light on its lamp while wanted, whatever the order', () => {
    const ss = slots(3);
    assign(ss, ['a', 'b', 'c']);
    for (const s of ss) s.k = 1;
    assign(ss, ['c', 'a', 'b']);
    expect(ids(ss)).toEqual(['a', 'b', 'c']);
  });

  it('never moves a lit light to another lamp: it fades out first, then the waiting lamp takes it', () => {
    const ss = slots(2);
    assign(ss, ['a', 'b', 'c']);
    for (const s of ss) s.k = 1;
    // b switched off: c waits while b's light fades
    assign(ss, ['a', 'c']);
    expect(ss[1]).toMatchObject({ id: 'b', to: 0, k: 1 });
    ss[1].k = fade(ss[1].k, 0, FADE_MS);
    expect(ss[1].k).toBe(0);
    assign(ss, ['a', 'c']);
    expect(ss[1]).toMatchObject({ id: 'c', to: 1, k: 0 });
  });

  it('a lamp switched back on mid-fade takes its own light back up from where it is', () => {
    const ss = slots(1);
    assign(ss, ['a']);
    ss[0].k = 1;
    assign(ss, []);
    ss[0].k = fade(1, 0, FADE_MS / 2);
    assign(ss, ['a']);
    expect(ss[0]).toMatchObject({ id: 'a', to: 1, k: 0.5 });
  });

  it('none in the light: all fade out', () => {
    const ss = slots(2);
    assign(ss, ['a', 'b']);
    assign(ss, []);
    expect(ss.map((s) => s.to)).toEqual([0, 0]);
  });

  it('fades over FADE_MS, eased at both ends', () => {
    expect(fade(0, 1, FADE_MS / 4)).toBeCloseTo(0.25);
    expect(fade(0.9, 1, FADE_MS)).toBe(1);
    expect(fade(0.1, 0, FADE_MS)).toBe(0);
    expect([eased(0), eased(0.5), eased(1)]).toEqual([0, 0.5, 1]);
    expect(eased(0.1)).toBeLessThan(0.1);
  });

  it('lights all the lamps when they’re few, nearest the middle first; else spreads the lights over the room', () => {
    const at = (p: readonly [number, number]) => p, key = (p: readonly [number, number]) => `${p}`;
    expect(spread([[30, 0], [0, 5], [-10, 0]] as const, at, [0, 0], 8, key)).toEqual([[0, 5], [-10, 0], [30, 0]]);
    // the long room: ten lamps round its middle and two at its far end, eight lights: the far end gets one
    const mid = Array.from({ length: 10 }, (_, i) => [i * 3 - 15, -40] as const), far = [[0, -110], [10, -112]] as const;
    const got = spread([...mid, ...far], at, [0, -40], 8, key);
    expect(got).toHaveLength(8);
    expect(got[0]).toEqual([0, -40]);
    expect(got.some((p) => p[1] < -100)).toBe(true);
    // the same lamps, the same lights (every phone)
    expect(spread([...far, ...mid].reverse(), at, [0, -40], 8, key)).toEqual(got);
    // (two lamps at one spot: one light)
    expect(spread([[0, 0], [0, 0], [50, 0]] as const, at, [0, 0], 2, key)).toEqual([[0, 0], [50, 0]]);
  });
});
