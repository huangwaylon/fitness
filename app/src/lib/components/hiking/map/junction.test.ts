import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { NetFile } from '#lib/hiking/net.ts';
import { dirOf, headOf, junctionAt, nextJunction } from './junction.ts';

const TINY = JSON.parse(readFileSync(join(import.meta.dirname, '../../../../../e2e/fixtures/hiking/tiny-net.json'), 'utf8')) as NetFile;

/** A fork on a route heading north: the route's way out at `take` (deg), the others as given. */
function fork(take: number, others: { deg: number; n?: string; h?: string }[]): NetFile {
  const lines = others.map((o) => ({ c: [[139, 35], [139.001, 35.001]] as [number, number][], h: o.h ?? 'path', ...(o.n ? { n: o.n } : {}) }));
  return {
    v: 1, src: 'osm', at: '2026-11-21', trk: '00000000', north: 'true', lines,
    forks: [{ p: [139, 35], pass: [{ at: 500, inDeg: 0, take: 1 }], br: [{ deg: 180, line: -1 }, { deg: take, n: '山頂', line: -1 }, ...others.map((o, i) => ({ deg: o.deg, line: i }))] }]
  };
}

describe('the junction card (R1, R12)', () => {
  it('a word only when the route stands > 45° from every other way out: 右 / 左 / まっすぐ by the route into the fork', () => {
    expect(nextJunction(fork(80, [{ deg: 280, n: '小屋' }]), 400)!.dir).toBe('right');
    expect(nextJunction(fork(280, [{ deg: 80, n: '小屋' }]), 400)!.dir).toBe('left');
    expect(nextJunction(fork(10, [{ deg: 90 }, { deg: 270 }]), 400)!.dir).toBe('straight');
    // 40° apart: no word, the names and the map's highlight say it
    expect(nextJunction(fork(20, [{ deg: 340, n: '小屋' }]), 400)!.dir).toBeNull();
    expect([dirOf(30), dirOf(31), dirOf(-31), dirOf(-180)]).toEqual(['straight', 'right', 'left', 'left']);
  });

  it("the branches: the route's first, the way it arrives by left off, each one's word only when it stands clear", () => {
    const j = nextJunction(fork(80, [{ deg: 280, n: '小屋' }, { deg: 300, n: '沢' }]), 400)!;
    expect(j.to).toBe(100);
    expect(j.br).toEqual([
      { name: '山頂', dir: 'right', take: true, line: -1 },
      { name: '小屋', dir: null, take: false, line: 0 },
      { name: '沢', dir: null, take: false, line: 1 }
    ]);
  });

  it('only within 150 m ahead (kept 15 m past it); a fork with roads alone is no junction to ask about', () => {
    const net = fork(80, [{ deg: 280 }]);
    expect(nextJunction(net, 340)).toBeNull();
    expect(nextJunction(net, 350)!.to).toBe(150);
    expect(nextJunction(net, 514)!.to).toBe(-14);
    expect(nextJunction(net, 516)).toBeNull();
    expect(nextJunction(fork(80, [{ deg: 280, h: 'unclassified' }]), 400)).toBeNull();
  });

  it("the e2e fixture: fork 1 on the way up (東山荘 44° from the route: names only, 沢コース 左), fork 2 names only, fork 1 again on the way down", () => {
    const up = nextJunction(TINY, 500)!;
    expect([up.fork, up.to, up.dir]).toEqual([0, 88, null]);
    expect(up.br.map((b) => [b.name, b.dir, b.take])).toEqual([['東峰', null, true], ['沢コース', 'left', false], ['東山荘', null, false]]);
    const two = nextJunction(TINY, 850)!;
    expect([two.fork, two.dir]).toEqual([1, null]);
    expect(two.br.map((b) => b.name)).toEqual(['東峰', '西峰', null]);
    const down = nextJunction(TINY, 1650)!;
    expect([down.fork, down.to]).toEqual([0, 82]);
    expect(down.br[0]).toMatchObject({ take: true, line: -1 });
    expect(down.br.some((b) => b.name === '東峰')).toBe(false); // (the way it came down by)
    expect(junctionAt(TINY, 0, 1, 1732)!.to).toBe(0);
  });

  it("walking the route backward: the fork behind it, entered by the route's way out, the way the route came in as the route's branch", () => {
    const net = fork(80, [{ deg: 280, n: '小屋' }]);
    // 100 m past the fork, walking back toward it
    const j = nextJunction(net, 600, -1)!;
    expect([j.fork, j.pass, j.to, j.rev, j.dir]).toEqual([0, 0, 100, true, 'left']);
    expect(j.br).toEqual([
      { name: null, dir: 'left', take: true, line: -1 },
      { name: '小屋', dir: 'straight', take: false, line: 0 }
    ]);
    // forward from there: it is behind, none; backward from before it: none either
    expect(nextJunction(net, 600, 1)).toBeNull();
    expect(nextJunction(net, 400, -1)).toBeNull();
    expect(nextJunction(net, 486, -1)!.to).toBe(-14);
    // the way the route came in can't be told (no route branch within 60° of behind): no card
    const odd: NetFile = { ...net, forks: [{ ...net.forks[0], br: [{ deg: 90, line: -1 }, ...net.forks[0].br.slice(1)] }] };
    expect(nextJunction(odd, 600, -1)).toBeNull();
  });

  it("the e2e fixture walked backward from past fork 2: fork 2, then fork 1, each with the route's way back first", () => {
    const two = nextJunction(TINY, 1000, -1)!;
    expect([two.fork, two.rev]).toEqual([1, true]);
    expect(two.br[0]).toMatchObject({ take: true, line: -1 });
    const one = nextJunction(TINY, 700, -1)!;
    expect([one.fork, one.rev, one.to]).toEqual([0, true, 112]);
    expect(one.br[0]).toMatchObject({ take: true, line: -1 });
    expect(one.br.some((b) => b.name === '東峰')).toBe(false); // (the way it came back by)
  });

  it("headOf: a line's first metres from its end at the fork", () => {
    const c: [number, number][] = [[139.002, 35], [139.001, 35], [139, 35]];
    const h = headOf(c, [139, 35], 50);
    expect(h[0]).toEqual([139, 35]);
    expect(h.length).toBe(2);
    expect((h[1][0] - 139) * 111_320 * Math.cos((35 * Math.PI) / 180)).toBeCloseTo(50, 0);
  });
});
