import { describe, expect, it } from 'vitest';
import { mulberry32 } from '#lib/random.ts';
import {
  BUG_ODDS, NEST_GAP_MS, NEST_ODDS, apart, dropAt, dropSpot, dropSpots, sceneryTrees, SHAKE_WINDOW_MS, SWARM_MS, WOOD_A_DAY, WOOD_ODDS, WOODS, bearsCoconuts, dropIds, fallen,
  legacyDropIds, liesUnder, goalTree, lastNestOf, netsSwarm, shakeDrop, shakeTap, shakenBug, treeById, wireDrop, woodFall, woodId, woodOut, woodTree, type Ground
} from './treeShake.ts';
import type { Put } from '#lib/sync/world-day.ts';
import { BUGS, pickBug } from './critters.ts';
import { CATCH_LINES } from './catchLines.ts';
import { SCENERY, surfaceAt } from './world.ts';
import { FRUIT_SPOTS, fruitLean } from './scene.ts';
import { site } from './site.svelte.ts';
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
    const got = { nest: 0, bug: 0, branch: 0, coconut: 0, gift: 0, none: 0 };
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
    expect(sceneryTrees().map((t) => t.id)).toEqual(kinds.map((s) => s.id));
    expect(sceneryTrees().length).toBeGreaterThanOrEqual(12);
    expect(sceneryTrees().some((t) => t.id.startsWith('bamboo'))).toBe(false);
    for (const t of sceneryTrees()) expect(t.out).toBe(t.x < 195 ? -1 : 1);
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

/** The ground with only `ids` picked up (at 0), nothing else about. */
const pickedOnly = (...ids: string[]): Ground => ({ pickedAt: (id) => (ids.includes(id) ? 0 : undefined) });

describe("the day's shakes (shared by both phones)", () => {
  const shakes: Shake[] = [
    { tree: 'oak-k1', drop: 'branch', who: 'A', t: 1 },
    { tree: 'palm-1', drop: 'coconut', who: 'B', t: 2 },
    { tree: 'oak-k1', drop: 'nest', who: 'B', t: 3 },
    { tree: 'oak-k1', drop: 'branch', who: 'B', t: 4 },
    { tree: 'cedar-k1', drop: 'bagworm', who: 'A', t: 5 },
    { tree: 'goal-B', drop: 'branch', who: 'A', t: 6 }
  ];
  it('names what each left alike on both phones, by the shake (who, its time), not its place in the day', () => {
    expect(shakes.map((_, i) => dropIds(shakes, i))).toEqual([
      ['br:oak-k1:A1'], ['co:palm-1:0', 'co:palm-1:1'], ['ws:oak-k1:B3'], ['br:oak-k1:B4'], ['dg:cedar-k1:A5'], ['br:goal-B:A6']
    ]);
    // the partner's earlier shake arriving after mine: my branch keeps its id (it was br:t:0, then br:t:1)
    const mine: Shake = { tree: 'oak-k1', drop: 'branch', who: 'A', t: 1_762_000_000_500 };
    const theirs: Shake = { tree: 'oak-k1', drop: 'branch', who: 'B', t: 1_762_000_000_100 };
    const before = dropIds([mine], 0)[0];
    expect(dropIds([theirs, mine], 1)[0]).toBe(before);
    expect(dropIds([theirs, mine], 0)[0]).not.toBe(before);
    // an editor tree's id (o + base-36 time + 3) still fits the relay's 32-character id
    expect(dropIds([{ ...mine, tree: 'omh7k2x1qa3f' }], 0)[0].length).toBeLessThanOrEqual(32);
  });
  it('a claim an older app made under the positional id still takes the drop', () => {
    expect(shakes.map((_, i) => legacyDropIds(shakes, i))).toEqual([['br:oak-k1:0'], [], ['ws:oak-k1:0'], ['br:oak-k1:1'], ['dg:cedar-k1:0'], ['br:goal-B:0']]);
    expect(fallen(shakes, treeById, pickedOnly('br:oak-k1:1')).map((f) => f.id)).not.toContain('br:oak-k1:B4');
  });
  it('the nest rule and the coconuts read the day', () => {
    expect(lastNestOf(shakes, 'oak-k1')).toBe(3);
    expect(lastNestOf(shakes, 'palm-1')).toBeUndefined();
    expect(bearsCoconuts(shakes, 'palm-1')).toBe(false);
    expect(bearsCoconuts(shakes, 'palm-3')).toBe(true);
  });
  it("what lies about (picked ones gone), beside its tree, a goal tree's on its person's side on both phones", () => {
    const mine = fallen(shakes, treeById, pickedOnly('br:oak-k1:A1'));
    expect(mine.map((f) => f.id)).toEqual(['co:palm-1:0', 'co:palm-1:1', 'br:oak-k1:B4', 'br:goal-B:A6']);
    for (const f of mine) expect(['grass', 'sand', 'dirt']).toContain(surfaceAt(f.x, f.z));
    // B's tree stands on the right (the same island on both phones)
    expect(mine.find((f) => f.id === 'br:goal-B:A6')!.x).toBeGreaterThan(195);
  });
});

describe('the wood (NH’s axe, without one)', () => {
  /** A phone shaking `tree` `shakes` times on `date`: the puts it makes, as treeShakes' shaken does (the shake's place
   *  among the tree's, the pieces out so far). */
  const shakeOut = (date: string, tree: string, shakes: number, puts: Record<string, Put> = {}) => {
    for (let n = 0; n < shakes; n++) {
      const w = woodFall(date, tree, n, woodOut(puts, tree));
      if (w) puts[w.id] = { id: w.id, what: w.what, at: [0, 0], who: 'A', t: n };
    }
    return puts;
  };
  const trees = [...sceneryTrees(), goalTree('A'), goalTree('B')];
  it('is the date’s and the tree’s: the same shakes give the same wood on both phones, another day another', () => {
    const days = Array.from({ length: 20 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`);
    const differ = days.flatMap((d) => trees.filter((t) => JSON.stringify(shakeOut(d, t.id, 12)) !== JSON.stringify(shakeOut(d, t.id, 12))).map((t) => `${d} ${t.id}`));
    expect(differ).toEqual([]);
    const a = trees.map((t) => Object.values(shakeOut('2026-11-04', t.id, 6)).map((p) => p.what).join());
    const b = trees.map((t) => Object.values(shakeOut('2026-11-05', t.id, 6)).map((p) => p.what).join());
    expect(a).not.toEqual(b);
  });
  it('gives at most WOOD_A_DAY a tree a day, 1 in 3 shakes until then, NH’s three kinds about alike', () => {
    const kinds: Record<string, number> = {};
    let over = 0, first = 0, n = 0;
    for (let d = 1; d <= 60; d++) for (const t of trees) {
      const date = `2026-${String(9 + Math.floor((d - 1) / 30)).padStart(2, '0')}-${String(((d - 1) % 30) + 1).padStart(2, '0')}`;
      const puts = shakeOut(date, t.id, 30);
      const ids = Object.keys(puts);
      if (ids.length > WOOD_A_DAY || ids.some((id, k) => id !== `wd:${t.id}:${k}` || woodTree(id) !== t.id)) over++;
      for (const p of Object.values(puts)) kinds[p.what] = (kinds[p.what] ?? 0) + 1;
      if (woodFall(date, t.id, 0, 0)) first++;
      n++;
    }
    expect(over).toBe(0);
    expect(WOOD_ODDS).toBe(3);
    expect(first / n).toBeGreaterThan(0.27);
    expect(first / n).toBeLessThan(0.4);
    expect(Object.keys(kinds).sort()).toEqual([...WOODS].sort());
    for (const w of WOODS) expect(kinds[w] / (n * WOOD_A_DAY)).toBeGreaterThan(0.25);
    // the fourth and later: none, even forced
    const full = shakeOut('2026-11-04', 'goal-A', 40);
    expect(woodOut(full, 'goal-A')).toBe(WOOD_A_DAY);
    expect(woodFall('2026-11-04', 'goal-A', 41, WOOD_A_DAY, undefined, true)).toBeNull();
    expect(woodFall('2026-11-04', 'goal-A', 0, 0, undefined, true)).not.toBeNull();
    // every id the relay takes (live-protocol's ID: at most 32), a put-down tree's longest (`d` + 24) too
    expect([...trees.map((t) => t.id), `d${'x'.repeat(24)}`].map((id) => woodId(id, WOOD_A_DAY - 1)).filter((id) => !/^[\w:.-]{1,32}$/.test(id))).toEqual([]);
  });
});

describe('no piles under a tree (one drop lying at a time, each on its own spot)', () => {
  const trees = [...sceneryTrees(), goalTree('A'), goalTree('B')];
  const put = (id: string, at: readonly [number, number], t = 0): Put => ({ id, what: 'wood', at, who: 'A', t });
  it('a tree drops nothing while its branch, coconuts, wood or present still lies there; another tree’s don’t count', () => {
    const shakes: Shake[] = [{ tree: 'oak-k1', drop: 'branch', who: 'A', t: 1 }];
    const lyingBranch = fallen(shakes, treeById, pickedOnly());
    expect(liesUnder('oak-k1', lyingBranch, [])).toBe(true);
    expect(liesUnder('oak-k1', fallen(shakes, treeById, pickedOnly('br:oak-k1:A1')), [])).toBe(false);
    expect(liesUnder('cedar-k1', lyingBranch, [])).toBe(false);
    expect(liesUnder('oak-k1', [], [put('wd:oak-k1:0', [0, 0])])).toBe(true);
    expect(liesUnder('oak-k1', [], [put('tf:oak-k1', [0, 0])])).toBe(true);
    expect(liesUnder('oak-k1', [], [put('wd:oak-k10:0', [0, 0]), put('tf:cedar-k1', [0, 0])])).toBe(false);
    expect(liesUnder('palm-1', fallen([{ tree: 'palm-1', drop: 'coconut', who: 'B', t: 2 }], treeById, pickedOnly('co:palm-1:0')), [])).toBe(true);
  });
  it('a drop lands on the ring by its trunk, on the ground, its spots a tap’s width apart', () => {
    const bad = trees.flatMap((t) => {
      const spots = dropSpots(t);
      const near = spots.every(([x, z]) => Math.hypot(x - t.x, z - t.z) <= (t.kind === 'goal' ? 64 : 56));
      const land = spots.every(([x, z]) => ['grass', 'sand', 'dirt'].includes(surfaceAt(x, z)));
      const spread = spots.every((a, i) => spots.every((b, j) => i === j || apart(a, b)));
      // and clear of the nest's and the dangling bug's spot (the outer side) and a palm's coconuts
      const others = [dropAt(t, 'nest'), dropAt(t, 'bagworm'), ...(t.kind === 'palm' ? [dropAt(t, 'coconut', 0), dropAt(t, 'coconut', 1)] : [])];
      const clear = spots.every((s) => others.every((o) => apart(s, [o.x, o.z])));
      return spots.length && near && land && spread && clear ? [] : [t.id];
    });
    expect(bad).toEqual([]);
  });
  it('never on another thing lying there: the next free spot, whatever lies about', () => {
    for (const t of trees) {
      // a goal tree's keep off its fruit row (scene.ts FRUIT_SPOTS)
      const fruit = t.kind === 'goal' ? FRUIT_SPOTS.map(([a, b]): [number, number] => [t.x + fruitLean(t.x, site.midX) + a, t.z + b]) : [];
      const spots = dropSpots(t).filter((s) => fruit.every((f) => apart(s, f))), placed: [number, number][] = [];
      expect(spots.length).toBeGreaterThanOrEqual(4);
      for (let k = 0; k < spots.length; k++) {
        const at = dropSpot(t, `wd:${t.id}:${k}`, placed);
        expect([...placed, ...fruit].every((p) => apart(at, p))).toBe(true);
        placed.push(at);
      }
    }
  });
  it('the spot is the drop id’s: both phones pick the same, different ids spread over the front spots', () => {
    const t = treeById('oak-k1')!;
    const ids = Array.from({ length: 40 }, (_, i) => `br:oak-k1:A${(1_762_000_000_000 + i * 977).toString(36)}`);
    const a = ids.map((id) => dropSpot(t, id, [])), b = ids.map((id) => dropSpot({ ...t }, id, []));
    expect(a).toEqual(b);
    expect(new Set(a.map(String)).size).toBeGreaterThan(2);
  });
  it('the day’s branches lie at one spot on both phones, in whatever order the shakes arrived, clear of what lay about', () => {
    const tA = treeById('oak-k1')!;
    // a piece of wood of another tree lying on each of oak-k1's front spots but one; then a branch, a picked-up one, another
    const spots = dropSpots(tA);
    const puts = spots.slice(0, 3).map((p, i) => put(`wd:x${i}:0`, p, 0));
    const shakes: Shake[] = [
      { tree: 'oak-k1', drop: 'branch', who: 'A', t: 10 },
      { tree: 'cedar-k1', drop: 'branch', who: 'B', t: 20 },
      { tree: 'oak-k1', drop: 'branch', who: 'B', t: 30 }
    ];
    const g: Ground = { puts, pickedAt: (id) => (id === 'br:oak-k1:Aa' ? 25 : undefined) };
    const here = fallen(shakes, treeById, g, true), there = fallen([shakes[2], shakes[0], shakes[1]], treeById, g, true);
    expect(there.map((f) => [f.id, f.x, f.z])).toEqual(here.map((f) => [f.id, f.x, f.z]));
    const first = here.find((f) => f.id === 'br:oak-k1:Aa')!;
    expect(puts.every((p) => apart([first.x, first.z], p.at))).toBe(true);
    // a later put (wood landing after) doesn't move it
    const later = fallen(shakes, treeById, { ...g, puts: [...puts, put('wd:y:0', [first.x, first.z], 40)] }, true);
    expect(later.find((f) => f.id === first.id)).toEqual(first);
    // the picked-up ones gone unless asked for
    expect(fallen(shakes, treeById, g).map((f) => f.id)).not.toContain('br:oak-k1:Aa');
  });
  it('fewer pieces: over seeded shakes about 1 in 3 knocks one out, never a fourth a day', () => {
    let hits = 0, shakes = 0;
    for (let d = 1; d <= 28; d++) for (const t of trees) {
      const date = `2026-10-${String(d).padStart(2, '0')}`;
      for (let n = 0; n < 6; n++) {
        shakes++;
        if (woodFall(date, t.id, n, 0)) hits++;
      }
      let out = 0;
      for (let n = 0; n < 60; n++) if (woodFall(date, t.id, n, out)) out++;
      expect(out).toBeLessThanOrEqual(WOOD_A_DAY);
    }
    expect(hits / shakes).toBeGreaterThan(0.29);
    expect(hits / shakes).toBeLessThan(0.38);
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
