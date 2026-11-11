// The island at rest, sampled once a load (rest.ts, the log's perf.rest).
import { describe, expect, it, vi } from 'vitest';
const logged = vi.hoisted(() => [] as [string, unknown][]);
vi.mock('#lib/sync/log.ts', () => ({ log: (e: string, d: unknown) => void logged.push([e, d]) }));
import { REST_MS, SAMPLE_MS, watchRest, type RestClock } from './rest.ts';
import { wakes } from './pace.ts';

/** A clock by hand: timers in order of their time. */
function sim() {
  let t = 0, id = 0;
  const q = new Map<number, { at: number; fn: () => void }>();
  const clock: RestClock = { now: () => t, setTimeout: (fn, ms) => (q.set(++id, { at: t + ms, fn }), id), clearTimeout: (i) => void q.delete(i as number) };
  const run = (until: number) => {
    for (;;) {
      const next = [...q.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > until) return void (t = until);
      q.delete(next[0]);
      t = next[1].at;
      next[1].fn();
    }
  };
  return { clock, run, pending: () => q.size, at: () => t };
}

describe('perf.rest', () => {
  it('15 s untouched, then 10 s of frames, shadow passes and wake-ups a second, the scene calls and triangles, and the full rate\'s share and top reasons; again after a touch; once a load', () => {
    const s = sim();
    const st = { frames: 0, shadows: 0, input: 0, sceneCalls: 240, sceneTris: 290_000, dpr: 2, camZ: 412.4, shadowSize: 2048, full: 0, fullWhy: {} as Record<string, number>, slots: 6, pointMask: true };
    let ok = true;
    // 12 frames a second, a shadow pass every 4th, one wake-up each, ticking with the clock; every 4th frame at the full
    // rate, a villager's (and the things' every 8th, a name the log doesn't know every 12th)
    const stats = () => {
      st.frames = Math.floor(s.at() / (1000 / 12));
      st.shadows = st.full = Math.floor(st.frames / 4);
      st.fullWhy = { vil: st.full, things: Math.floor(st.frames / 8), mystery: Math.floor(st.frames / 12), fx: 0 };
      wakes.n = st.frames;
      return { ...st, fullWhy: { ...st.fullWhy } };
    };
    const stop = watchRest({ stats, ok: () => ok }, s.clock);
    // covered at the minute: it waits on
    ok = false;
    s.run(REST_MS + 100);
    ok = true;
    // a touch midway through the sample: not this one
    s.run(REST_MS * 2 + SAMPLE_MS / 2);
    st.input = s.at();
    s.run(st.input + REST_MS + SAMPLE_MS + 100);
    expect(logged).toHaveLength(1);
    expect(logged[0][0]).toBe('perf.rest');
    expect(logged[0][1]).toMatchObject({ fps: expect.closeTo(12, 0) as number, shadows: expect.closeTo(3, 0) as number, wakes: expect.closeTo(12, 0) as number, calls: 240, tris: 290_000, dpr: 2, camZ: 412, sm: 2048, full: 25, why1: 'vil', w1: 25, why2: 'things', w2: 13, why3: 'other', w3: 8, pts: 6, pm: true });
    expect(logged[0][1]).not.toHaveProperty('why4');
    expect(s.pending()).toBe(0);
    stop();
    // (once a load)
    watchRest({ stats, ok: () => true }, s.clock);
    expect(s.pending()).toBe(0);
  });
});
