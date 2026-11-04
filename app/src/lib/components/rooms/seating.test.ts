import { describe, expect, it, test } from 'vitest';
import { createSeating, outsat } from './seating.ts';

describe('one villager a seat, the first to sit keeps it', () => {
  it('the earlier sit keeps it; the later stands up', () => {
    expect(outsat({ s: 2000, who: 'A' }, { s: 1999, who: 'B' })).toBe(true);
    expect(outsat({ s: 1999, who: 'B' }, { s: 2000, who: 'A' })).toBe(false);
  });
  it('an exact tie (as sent: whole ms) stands only one up, the same on both phones', () => {
    for (const [x, y] of [['A', 'B'], ['A', 'G'], ['B', 'G']] as const) {
      // (each phone: its own sit unrounded, the other's as sent)
      const onX = outsat({ s: 1000.4, who: x }, { s: 1000, who: y }), onY = outsat({ s: 1000.2, who: y }, { s: 1000, who: x });
      expect([onX, onY]).toEqual([false, true]);
    }
  });
});

describe('the rooms\' sitting (createSeating)', () => {
  const S = (id: string, n: number, x: number) => ({ id, n, lie: false, at: [x, 0] as const, from: [x, 5] as const });
  const bench = [S('b', 0, -4), S('b', 1, 4)];
  test('a tap walks up to the nearest free seat and sits there; a walk off stands up at its step', () => {
    const st = createSeating<ReturnType<typeof S>>('A');
    let walked: readonly [number, number] | null = null, arrive = () => {};
    const sat: string[] = [];
    expect(st.tap(bench, [10, 5], () => 1000.4, (to, then) => ((walked = to), (arrive = then)), (s) => sat.push(`${s.id}${s.n}`))).toBe('go');
    expect(walked).toEqual([4, 5]);
    expect(st.mine()).toBeNull();
    arrive();
    expect(sat).toEqual(['b1']);
    expect(st.wire()).toEqual({ seat: 'b', n: 1, s: 1000 });
    expect(st.tap(bench, [10, 5], () => 0, () => {}, () => {})).toBe('on');
    expect(st.stand()).toEqual([4, 5]);
    expect(st.mine()).toBeNull();
    expect(st.stand()).toBeNull();
  });
  test('another on a seat: the other one, both taken a boop; got there first while I walked: I don\'t sit', () => {
    const st = createSeating<ReturnType<typeof S>>('A');
    st.heard('B', { in: true, seat: 'b', n: 1, s: 500, t: 600 });
    expect(st.taken('b', 1)).toBe(true);
    let to: readonly [number, number] | null = null, arrive = () => {};
    st.tap(bench, [10, 5], () => 0, (p, then) => ((to = p), (arrive = then)), () => {});
    expect(to).toEqual([-4, 5]);
    st.heard('G', { in: true, seat: 'b', n: 0, t: 700 });
    expect(st.their('G')).toEqual({ id: 'b', n: 0, s: 700 });
    arrive();
    expect(st.mine()).toBeNull();
    expect(st.tap(bench, [0, 0], () => 0, () => {}, () => {})).toBe('full');
    // (standing up, or out of the room: the seat is free again)
    st.heard('B', { in: true, t: 800 });
    st.heard('G', { in: false, seat: 'b', n: 0, t: 900 });
    expect([st.seated('B'), st.seated('G'), st.taken('b', 0)]).toEqual([false, false, false]);
  });
  test('two on one seat at once: the earlier sit keeps it (the rule on every phone)', () => {
    const sit = (who: 'A' | 'B', s: number) => {
      const st = createSeating<ReturnType<typeof S>>(who);
      st.tap(bench, [4, 5], () => s, (_, then) => then(), () => {});
      return st;
    };
    expect(sit('A', 2000).heard('B', { in: true, seat: 'b', n: 1, s: 1999, t: 2100 }).yields).toBe(true);
    expect(sit('B', 1999).heard('A', { in: true, seat: 'b', n: 1, s: 2000, t: 2100 }).yields).toBe(false);
    // (another seat, or a tie by who)
    expect(sit('A', 2000).heard('B', { in: true, seat: 'b', n: 0, s: 1, t: 2 }).yields).toBe(false);
    expect([sit('A', 2000).heard('B', { in: true, seat: 'b', n: 1, s: 2000, t: 1 }).yields, sit('B', 2000).heard('A', { in: true, seat: 'b', n: 1, s: 2000, t: 1 }).yields]).toEqual([false, true]);
  });
});
