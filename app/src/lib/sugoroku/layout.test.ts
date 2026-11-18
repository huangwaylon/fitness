import { describe, expect, it } from 'vitest';
import { CLASSIC, routesFrom, waysAt } from './board.ts';
import { FAMILIES, STEPS, boardOf, familyOf, familyOfKey, generate, layoutKey, problems } from './layout.ts';
import { GEN, GENS, genOfKey } from './family.ts';
import { fnv1a } from '#lib/random.ts';

/** Pinned seeds: the generator's rules over many boards. */
const SEEDS = Array.from({ length: 240 }, (_, i) => `t${i}`);
const boards = SEEDS.map((s) => boardOf(layoutKey(s))!);

describe('layouts', () => {
  it('every seed builds a board that keeps every rule (none falls back to the classic)', () => {
    for (const b of boards) {
      expect(b.family, b.key).not.toBe('classic');
      expect(problems(b), b.key).toEqual([]);
    }
  });
  it('the same seed builds the same board (every phone, every reload); the key is versioned', () => {
    for (const s of SEEDS.slice(0, 20)) expect(JSON.stringify(generate(s))).toBe(JSON.stringify(boardOf(layoutKey(s))));
    expect(boardOf(layoutKey('t1'))).toBe(boardOf(layoutKey('t1')));
    expect(boardOf()).toBe(CLASSIC);
    expect(boardOf('9:t1')).toBeNull();
    expect(boardOf('0:t1')).toBeNull();
    expect([genOfKey('1:t1'), genOfKey('2:t1'), genOfKey('3:t1'), genOfKey('t1')]).toEqual([1, 2, null, null]);
    expect(boardOf('t1')).toBeNull();
    expect(familyOfKey(layoutKey('t1'))).toBe(familyOf('t1'));
    expect(familyOfKey(undefined)).toBeNull();
  });
  it('a change to the generator bumps GEN: a few pinned seeds’ boards, hashed, pinned to it', () => {
    // (another phone on the same GEN builds the board from the same seed: a change without the bump splits a game)
    // (each version this build builds: 1 as it was, 2 with みんなで！ stones; new boards GEN's, 1 till mini-games are on)
    const GOLDEN: Record<number, string> = { 1: '1qmjkf8', 2: '1ghnty3' };
    for (const gen of GENS) {
      const hash = fnv1a(JSON.stringify(['a1', 'b2', 'c3', 'd4', 'e5', 'f6'].map((s) => generate(s, layoutKey(s, gen))))).toString(36);
      expect(hash, `bump GEN in family.ts (and wire.ts RULES) and pin '${hash}' to it`).toBe(GOLDEN[gen]);
    }
    expect(GEN).toBe(1);
    expect(layoutKey('a1')).toBe('1:a1');
  });
  it('every route from ふりだし reaches あがり in the band of steps, about as long as the others', () => {
    for (const b of boards) {
      const steps = routesFrom(b).map((r) => r.length - 1);
      expect(Math.min(...steps)).toBeGreaterThanOrEqual(STEPS[0]);
      expect(Math.max(...steps)).toBeLessThanOrEqual(STEPS[1]);
      for (const r of routesFrom(b)) expect(r.at(-1)).toBe(b.goal);
      expect(b.spaces[0].area).toBe('home');
      expect(b.spaces[b.goal].area).toBe('beach');
    }
  });
  it('variety: every family, 1–3 forks, crossroads, new stretches, mirrored; two seeds in a row different', () => {
    const fams = new Set(boards.map((b) => b.family)), forks = new Set(boards.map((b) => b.forks.length));
    expect([...fams].sort()).toEqual([...FAMILIES].sort());
    // (4: a crossroads' two and a lane's split, 十字路 only)
    expect([...forks].sort()).toEqual([1, 2, 3, 4]);
    for (const b of boards) if (b.forks.length === 4) expect(b.crossing?.length, b.key).toBeTruthy();
    expect(boards.some((b) => b.crossing?.length)).toBe(true);
    const areas = new Set(boards.flatMap((b) => b.spaces.map((s) => s.area)));
    for (const a of ['forest', 'hill', 'station', 'park', 'museum', 'river']) expect(areas.has(a as never), a).toBe(true);
    expect(new Set(boards.map((b) => b.spaces[0].x < 180)).size).toBe(2);
    for (let i = 1; i < boards.length; i++) expect(JSON.stringify(boards[i].spaces)).not.toBe(JSON.stringify(boards[i - 1].spaces));
    // heights vary, none absurd
    const hs = boards.map((b) => b.h);
    expect(Math.max(...hs) - Math.min(...hs)).toBeGreaterThan(150);
    expect(Math.max(...hs)).toBeLessThan(2000);
  });
  it('scenery no more than the classic’s: signs, trees, one house, two bridges at most', () => {
    for (const b of boards) {
      expect(b.signs.length).toBeLessThanOrEqual(CLASSIC.signs.length);
      expect(b.trees.length).toBeLessThanOrEqual(22);
      expect(CLASSIC.trees.length).toBe(22);
    }
  });
  it('a fork’s two ways read differently: their areas, and 近道 / 遠回り by their steps', () => {
    for (const b of boards) for (const f of b.forks) {
      const [a, c] = waysAt(b, f);
      expect(a.area, `${b.key} fork ${f}`).not.toBe(c.area);
      expect(a.steps).toBeGreaterThan(0);
    }
    // the classic's: 川の近道 4+1 steps, 博物館の遠回り 7+1
    const [short, long] = waysAt(CLASSIC, CLASSIC.forks[0]);
    expect([short.area, short.steps, long.area, long.steps]).toEqual(['river', 5, 'museum', 8]);
    expect(long.kinds.picture).toBe(2);
  });
});

describe('layouts with みんなで！ stones (GEN 2)', () => {
  const minis = SEEDS.map((s) => boardOf(layoutKey(s, 2))!);
  it('every seed builds a board that keeps every rule; the same stones as GEN 1’s rules but for the みんなで！', () => {
    for (const b of minis) {
      expect(b.family, b.key).not.toBe('classic');
      expect(problems(b), b.key).toEqual([]);
    }
    // GEN 1's boards never hold one (and one there is a broken rule)
    for (const b of boards) expect(b.spaces.some((s) => s.mini), b.key).toBe(false);
    const b0 = minis[0], i = b0.spaces.findIndex((s) => s.mini);
    expect(problems({ ...b0, key: layoutKey('t0', 1) })).toContain('a みんなで！ on a GEN 1 board');
    expect(i).toBeGreaterThan(0);
  });
  it('every route 2–3 of them, 6 apart, none in its first 5 steps or last 3; a ことば underneath, never a fork or a join', () => {
    const per = new Set<number>();
    for (const b of minis) {
      for (const r of routesFrom(b)) {
        const at = r.map((j, n) => (b.spaces[j].mini ? n : -1)).filter((n) => n >= 0);
        per.add(at.length);
        expect(at.length, b.key).toBeGreaterThanOrEqual(2);
        expect(at.length, b.key).toBeLessThanOrEqual(3);
        for (let k = 1; k < at.length; k++) expect(at[k] - at[k - 1], b.key).toBeGreaterThanOrEqual(6);
        expect(at[0], b.key).toBeGreaterThan(5);
        expect(r.length - 1 - at.at(-1)!, b.key).toBeGreaterThan(3);
      }
      const into = b.spaces.map(() => 0);
      b.spaces.forEach((s) => s.next.forEach((j) => into[j]++));
      for (const [j, s] of b.spaces.entries()) if (s.mini) {
        expect(s.kind).toBe('word');
        expect(s.next.length === 1 && into[j] === 1, `${b.key} ${j}`).toBe(true);
      }
    }
    expect([...per].sort()).toEqual([2, 3]);
  });
  it('the rest as GEN 1’s: families, forks, steps, a fork’s ways counting them', () => {
    expect(new Set(minis.map((b) => b.family)).size).toBe(FAMILIES.length);
    for (const b of minis) for (const r of routesFrom(b)) expect(r.length - 1).toBeGreaterThanOrEqual(STEPS[0]);
    const counted = minis.flatMap((b) => b.forks.flatMap((f) => waysAt(b, f))).filter((w) => w.kinds.mini);
    expect(counted.length).toBeGreaterThan(0);
  });
});
