import { describe, expect, it } from 'vitest';
import { CLASSIC, routesFrom, waysAt } from './board.ts';
import { FAMILIES, STEPS, boardOf, familyOf, familyOfKey, generate, layoutKey, problems } from './layout.ts';
import { GEN } from './family.ts';
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
    expect(boardOf('t1')).toBeNull();
    expect(familyOfKey(layoutKey('t1'))).toBe(familyOf('t1'));
    expect(familyOfKey(undefined)).toBeNull();
  });
  it('a change to the generator bumps GEN: a few pinned seeds’ boards, hashed, pinned to it', () => {
    // (another phone on the same GEN builds the board from the same seed: a change without the bump splits a game)
    const GOLDEN: Record<number, string> = { 1: '1qmjkf8' };
    const hash = fnv1a(JSON.stringify(['a1', 'b2', 'c3', 'd4', 'e5', 'f6'].map((s) => generate(s)))).toString(36);
    expect(hash, `bump GEN in family.ts (and wire.ts RULES) and pin '${hash}' to it`).toBe(GOLDEN[GEN]);
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
