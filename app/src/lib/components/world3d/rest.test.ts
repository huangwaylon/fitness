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
  it('a minute untouched, then 10 s of frames, shadow passes and wake-ups a second; again after a touch; once a load', () => {
    const s = sim();
    const st = { frames: 0, shadows: 0, input: 0 };
    let ok = true;
    // 12 frames a second, a shadow pass every 4th, one wake-up each, ticking with the clock
    const stats = () => ((st.frames = Math.floor(s.at() / (1000 / 12))), (st.shadows = Math.floor(st.frames / 4)), (wakes.n = st.frames), { ...st });
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
    expect(logged[0][1]).toMatchObject({ fps: expect.closeTo(12, 0) as number, shadows: expect.closeTo(3, 0) as number, wakes: expect.closeTo(12, 0) as number });
    expect(s.pending()).toBe(0);
    stop();
    // (once a load)
    watchRest({ stats, ok: () => true }, s.clock);
    expect(s.pending()).toBe(0);
  });
});
