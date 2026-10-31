import { beforeEach, describe, expect, it } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { mulberry32 } from '#lib/random.ts';
import {
  NEST_GAP_MS, NEST_ODDS, SHAKE_WINDOW_MS, SWARM_MS, lastNest, markNest, netsSwarm, shakeDrop, shakeTap
} from './treeShake.ts';
import { BUGS, pickBug } from './critters.ts';
import { CATCH_LINES } from './catchLines.ts';

function memKV(): KV {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}
beforeEach(() => configureStorage({ local: memKV() }));

/** Taps at these times (ms), in order: which ones shake. */
function run(times: number[]): boolean[] {
  let taps: number[] = [];
  return times.map((t) => {
    const r = shakeTap(taps, t);
    taps = r.taps;
    return r.shake;
  });
}

describe('a tap or a shake', () => {
  it('one tap and two taps stay the popup (open, close); the third quick one shakes, and each quick one after', () => {
    expect(run([0])).toEqual([false]);
    expect(run([0, 300])).toEqual([false, false]);
    expect(run([0, 300, 600, 800, 1000])).toEqual([false, false, true, true, true]);
  });
  it('the three must fall within the window: slow taps never shake', () => {
    expect(run([0, 700, 1400, 2100, 2800])).toEqual([false, false, false, false, false]);
    expect(run([0, 500, SHAKE_WINDOW_MS - 1])).toEqual([false, false, true]);
    expect(run([0, 500, SHAKE_WINDOW_MS])).toEqual([false, false, false]);
  });
  it('a pause starts a new run', () => {
    expect(run([0, 200, 400, 3000, 3200, 3400])).toEqual([false, false, true, false, false, true]);
  });
});

describe('what a shake drops', () => {
  it('about 1 in 8 shakes a nest when one is due, about 1 in 5 of the rest a branch (seeded)', () => {
    const r = mulberry32(42);
    const n = 8000;
    const got = { nest: 0, branch: 0, none: 0 };
    for (let i = 0; i < n; i++) got[shakeDrop(r, 0, undefined) ?? 'none']++;
    expect(got.nest / n).toBeCloseTo(1 / NEST_ODDS, 1);
    expect(got.branch / (n - got.nest)).toBeCloseTo(1 / 5, 1);
  });
  it('at most one nest per tree an hour: before the gap only branches (or nothing)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 500; i++) expect(shakeDrop(r, 1000 + NEST_GAP_MS - 1, 1000)).not.toBe('nest');
    let nests = 0;
    for (let i = 0; i < 500; i++) nests += shakeDrop(r, 1000 + NEST_GAP_MS, 1000) === 'nest' ? 1 : 0;
    expect(nests).toBeGreaterThan(0);
  });
  it('frequent enough to find in a session: within 30 shakes a nest is very likely', () => {
    const r = mulberry32(3);
    let found = 0;
    for (let s = 0; s < 200; s++) {
      let got = false;
      for (let i = 0; i < 30 && !got; i++) got = shakeDrop(r, 0, undefined) === 'nest';
      found += got ? 1 : 0;
    }
    expect(found / 200).toBeGreaterThan(0.9);
  });
  it('the dev hook forces the drop', () => {
    expect(shakeDrop(() => 0.99, 0, 0, 'nest')).toBe('nest');
    expect(shakeDrop(() => 0, 0, undefined, 'branch')).toBe('branch');
  });
  it("each tree's last nest is kept on this phone; a broken record has none", () => {
    expect(lastNest('A')).toBeUndefined();
    markNest('A', 5000);
    markNest('B', 7000);
    expect([lastNest('A'), lastNest('B')]).toEqual([5000, 7000]);
    const kv = memKV();
    kv.setItem('tree-nest', '{"A":"x"}');
    configureStorage({ local: kv });
    expect(lastNest('A')).toBeUndefined();
  });
});

describe('the swarm', () => {
  it('a tap nets it while it is on its way; after SWARM_MS it has stung', () => {
    expect(netsSwarm(0)).toBe(true);
    expect(netsSwarm(SWARM_MS)).toBe(true);
    expect(netsSwarm(SWARM_MS + 1)).toBe(false);
    expect(netsSwarm(-1)).toBe(false);
  });
  it('the wasp is in the ずかん with its NH lines, but never about on its own', () => {
    expect(BUGS.wasp.weight).toBe(0);
    for (let m = 1; m <= 12; m++) for (let h = 0; h < 24; h++) for (const x of [0, 0.5, 0.999]) expect(pickBug(m, h, () => x)).not.toBe('wasp');
    expect(CATCH_LINES.wasp[0]).toMatch(/^ハチを つかまえた！/);
    expect(CATCH_LINES.wasp[1]).toBe("I caught a wasp! That's gotta sting...");
  });
});
