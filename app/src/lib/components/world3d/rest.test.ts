// The island at rest, counted all the time and logged at each hide (rest.ts, the log's perf.rest).
import { beforeEach, describe, expect, it, vi } from 'vitest';
const logged = vi.hoisted(() => [] as [string, Record<string, unknown>][]);
vi.mock('#lib/sync/log.ts', () => ({ log: (e: string, d: Record<string, unknown>) => void logged.push([e, d]) }));
import { REST_MS, watchRest, type RestClock } from './rest.ts';
import { wakes } from './pace.ts';

/** A clock by hand: timers in order of their time; hides and shows by hand. */
function sim() {
  let t = 0, id = 0;
  const q = new Map<number, { at: number; fn: () => void }>();
  const hides = new Set<(hidden: boolean) => void>();
  const clock: RestClock = {
    now: () => t,
    setTimeout: (fn, ms) => (q.set(++id, { at: t + ms, fn }), id),
    clearTimeout: (i) => void q.delete(i as number),
    onHide: (fn) => (hides.add(fn), () => void hides.delete(fn))
  };
  const run = (until: number) => {
    for (;;) {
      const next = [...q.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > until) return void (t = until);
      q.delete(next[0]);
      t = next[1].at;
      next[1].fn();
    }
  };
  return { clock, run, pending: () => q.size, at: () => t, hide: (h: boolean) => hides.forEach((f) => f(h)), listeners: () => hides.size };
}

/** 12 frames a second, a shadow pass every 4th, one wake-up each, ticking with the clock; every 4th frame at the full
 *  rate, a villager's (and a fish's dart every 8th, a name the log doesn't know every 12th). */
function island(s: ReturnType<typeof sim>) {
  const st = { frames: 0, shadows: 0, input: 0, sceneCalls: 240, sceneTris: 290_000, dpr: 2, camZ: 412.4, shadowSize: 2048, full: 0, fullWhy: {} as Record<string, number>, slots: 6, pointMask: true };
  const stats = () => {
    st.frames = Math.floor(s.at() / (1000 / 12));
    st.shadows = st.full = Math.floor(st.frames / 4);
    st.fullWhy = { vil: st.full, 'crit-fish': Math.floor(st.frames / 8), mystery: Math.floor(st.frames / 12), fx: 0 };
    wakes.n = st.frames;
    return { ...st, fullWhy: { ...st.fullWhy } };
  };
  return { st, stats };
}

beforeEach(() => void (logged.length = 0));

describe('perf.rest', () => {
  it('the seconds untouched past REST_MS add up across touches; at the hide: their rates, the full rate\'s share and top reasons, the scene', () => {
    const s = sim(), { st, stats } = island(s);
    watchRest({ stats, ok: () => true }, s.clock);
    // 10 s untouched (8 of them at rest), a touch, 5 s more (3 at rest), then the page hides
    s.run(10_000);
    st.input = s.at();
    s.run(15_000);
    s.hide(true);
    expect(logged).toHaveLength(1);
    const [e, d] = logged[0];
    expect(e).toBe('perf.rest');
    expect(d).toMatchObject({ s: 11, fps: expect.closeTo(12, 0) as number, shadows: expect.closeTo(3, 0) as number, wakes: expect.closeTo(12, 0) as number, calls: 240, tris: 290_000, dpr: 2, camZ: 412, sm: 2048, full: 25, why1: 'vil', w1: 25, why2: 'crit-fish', w2: 12, why3: 'other', w3: 8, pts: 6, pm: true });
    expect(d).not.toHaveProperty('why4');
    // hidden: no timer; the next show counts afresh and logs at its own hide
    expect(s.pending()).toBe(0);
    s.run(60_000);
    s.hide(false);
    st.input = s.at();
    s.run(s.at() + REST_MS + 5000);
    s.hide(true);
    expect(logged).toHaveLength(2);
    expect(logged[1][1].s).toBe(5);
  });

  it('less than 3 s of rest, a second with a touch in it, or under a sheet: nothing', () => {
    const s = sim(), { st, stats } = island(s);
    let ok = true;
    const stop = watchRest({ stats, ok: () => ok }, s.clock);
    // touched every 2 s (never at rest), then 4 s untouched: 2 s of rest
    for (let i = 1; i <= 5; i++) {
      s.run(i * 2000);
      st.input = s.at();
    }
    s.run(s.at() + 4000);
    s.hide(true);
    expect(logged).toHaveLength(0);
    s.hide(false);
    ok = false;
    s.run(s.at() + 20_000);
    stop();
    expect(logged).toHaveLength(0);
    expect(s.pending()).toBe(0);
    expect(s.listeners()).toBe(0);
  });

  it('the island going (a room): what was counted is logged', () => {
    const s = sim(), { stats } = island(s);
    const stop = watchRest({ stats, ok: () => true }, s.clock);
    s.run(9000);
    stop();
    expect(logged.map((l) => [l[0], l[1].s])).toEqual([['perf.rest', 7]]);
  });
});
