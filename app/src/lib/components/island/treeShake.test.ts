import { describe, expect, it } from 'vitest';
import { mulberry32 } from '#lib/random.ts';
import {
  BUG_ODDS, NEST_GAP_MS, NEST_ODDS, SCENERY_TREES, SHAKE_WINDOW_MS, SWARM_MS, bearsCoconuts, dropIds, fallen, goalTree, lastNestOf, netsSwarm,
  shakeDrop, shakeTap, shakenBug, treeById, wireDrop
} from './treeShake.ts';
import { BUGS, pickBug } from './critters.ts';
import { CATCH_LINES } from './catchLines.ts';
import { SCENERY, surfaceAt } from './world.ts';
import type { Shake } from '#lib/sync/world-day.ts';

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
  it('about 1 in 8 shakes a nest when one is due, 1 in 7 of the rest a dangling bug, about 1 in 5 of the rest a branch (seeded)', () => {
    const r = mulberry32(42);
    const n = 20_000;
    const got = { nest: 0, bug: 0, branch: 0, coconut: 0, none: 0 };
    for (let i = 0; i < n; i++) got[shakeDrop(r, 0, undefined) ?? 'none']++;
    expect(got.nest / n).toBeCloseTo(1 / NEST_ODDS, 1);
    expect(got.bug / (n - got.nest)).toBeCloseTo(1 / BUG_ODDS, 1);
    expect(got.branch / (n - got.nest - got.bug)).toBeCloseTo(1 / 5, 1);
  });
  it('the dangling bug: a bagworm by day; in the spider’s hours (7 pm – 8 am) a spider 3 times in 8 (NH’s rates, seeded)', () => {
    const r = mulberry32(5);
    for (let i = 0; i < 400; i++) expect(shakenBug(12, r)).toBe('bagworm');
    const night = Array.from({ length: 8000 }, () => shakenBug(22, r));
    expect(night.filter((b) => b === 'spider').length / night.length).toBeCloseTo(3 / 8, 1);
    expect(shakenBug(7, () => 0)).toBe('spider');
    expect(shakenBug(8, () => 0)).toBe('bagworm');
    // never about on their own: only out of a shaken tree
    for (let m = 1; m <= 12; m++) for (let h = 0; h < 24; h++) for (const x of [0, 0.5, 0.999]) expect(['bagworm', 'spider']).not.toContain(pickBug(m, h, () => x));
    expect(BUGS.bagworm.flight).toBe('dangle');
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
    expect(shakeDrop(() => 0.99, 0, 0, 'bug')).toBe('bug');
  });
});

describe('every tree shakes, each its own way (NH)', () => {
  it("every oak, cedar and palm of the scenery is a tree to shake (bamboo isn't), its outer side by where it stands", () => {
    const kinds = SCENERY.filter((s) => ['oak', 'cedar', 'palm'].includes(s.kind));
    expect(SCENERY_TREES.map((t) => t.id)).toEqual(kinds.map((s) => s.id));
    expect(SCENERY_TREES.length).toBeGreaterThanOrEqual(12);
    expect(SCENERY_TREES.some((t) => t.id.startsWith('bamboo'))).toBe(false);
    for (const t of SCENERY_TREES) expect(t.out).toBe(t.x < 195 ? -1 : 1);
  });
  it("a goal tree is its person's, on their side on both phones (A's left, B's right)", () => {
    expect(goalTree('B')).toMatchObject({ id: 'goal-B', kind: 'goal', out: 1 });
    expect(goalTree('B').x).toBeGreaterThan(195);
    expect(treeById('goal-A')).toMatchObject({ id: 'goal-A', out: -1 });
    expect(treeById('goal-A')!.x).toBeLessThan(195);
    expect(treeById('palm-3')).toMatchObject({ kind: 'palm' });
    expect(treeById('bamboo-1')).toBeNull();
  });
  it("a palm drops its two coconuts the first time it's shaken in a day, then only (rarely) a nest: no branch, no bagworm", () => {
    const r = mulberry32(11);
    expect(shakeDrop(r, 0, undefined, undefined, 'palm', true)).toBe('coconut');
    const got = new Set(Array.from({ length: 3000 }, () => shakeDrop(r, 0, undefined, undefined, 'palm', false)));
    expect(got).toEqual(new Set(['nest', null]));
    // the dev hook can't make a palm drop a branch, nor a hardwood a coconut
    expect(shakeDrop(r, 0, undefined, 'branch', 'palm', false)).not.toBe('branch');
    expect(shakeDrop(() => 0.99, 0, undefined, 'coconut', 'oak')).not.toBe('coconut');
    expect(shakeDrop(() => 0.99, 0, undefined, 'coconut', 'palm', false)).toBe('coconut');
  });
  it('a cedar and an oak drop like a hardwood (nest, bagworm or spider, branch)', () => {
    const r = mulberry32(12);
    for (const kind of ['oak', 'cedar'] as const) {
      const got = new Set(Array.from({ length: 4000 }, () => shakeDrop(r, 0, undefined, undefined, kind)));
      expect(got).toEqual(new Set(['nest', 'bug', 'branch', null]));
    }
    expect(wireDrop('bug', 12, r)).toBe('bagworm');
    expect(wireDrop(null, 12, r)).toBe('none');
  });
});

describe("the day's shakes (shared by both phones)", () => {
  const shakes: Shake[] = [
    { tree: 'oak-k1', drop: 'branch', who: 'A', t: 1 },
    { tree: 'palm-1', drop: 'coconut', who: 'B', t: 2 },
    { tree: 'oak-k1', drop: 'nest', who: 'B', t: 3 },
    { tree: 'oak-k1', drop: 'branch', who: 'B', t: 4 },
    { tree: 'cedar-k1', drop: 'bagworm', who: 'A', t: 5 },
    { tree: 'goal-B', drop: 'branch', who: 'A', t: 6 }
  ];
  it('names what each left alike on both phones', () => {
    expect(shakes.map((_, i) => dropIds(shakes, i))).toEqual([
      ['br:oak-k1:0'], ['co:palm-1:0', 'co:palm-1:1'], ['ws:oak-k1:0'], ['br:oak-k1:1'], ['dg:cedar-k1:0'], ['br:goal-B:0']
    ]);
  });
  it('the nest rule and the coconuts read the day', () => {
    expect(lastNestOf(shakes, 'oak-k1')).toBe(3);
    expect(lastNestOf(shakes, 'palm-1')).toBeUndefined();
    expect(bearsCoconuts(shakes, 'palm-1')).toBe(false);
    expect(bearsCoconuts(shakes, 'palm-3')).toBe(true);
  });
  it("what lies about (picked ones gone), beside its tree, a goal tree's on its person's side on both phones", () => {
    const mine = fallen(shakes, treeById, (id) => id === 'br:oak-k1:0');
    expect(mine.map((f) => f.id)).toEqual(['co:palm-1:0', 'co:palm-1:1', 'br:oak-k1:1', 'br:goal-B:0']);
    for (const f of mine) expect(['grass', 'sand', 'dirt']).toContain(surfaceAt(f.x, f.z));
    // B's tree stands on the right (the same island on both phones)
    expect(mine.find((f) => f.id === 'br:goal-B:0')!.x).toBeGreaterThan(195);
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
