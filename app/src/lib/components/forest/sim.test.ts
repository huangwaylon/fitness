import { describe, expect, it } from 'vitest';
import { BUSH, CLIFF, N, SAFE, TRUNK, WATER, at, bearWalk, buildMap, cellOf, sight } from './map.ts';
import { TUNE, adopt, bearNet, createWorld, handle, step, type World } from './sim.ts';
import { createMe, move } from './player.ts';
import type { Msg, PNet } from './protocol.ts';

const map = buildMap(7);
const P = (o: Partial<PNet> & { who: PNet['who'] }): PNet => ({ x: 0, z: 30, f: 0, v: 0, st: 'ok', top: false, n: 0, run: false, ...o });
/** A world with one bear awake at (x, z), facing +z. */
function awake(x: number, z: number, players: PNet['who'][] = ['A']): World {
  const w = createWorld(map, 1, players);
  Object.assign(w.bears[0], { x, z, f: 0, st: 'wander', until: 0, goal: [x, z] });
  w.t = 20;
  return w;
}
/** An open spot: walkable for a bear, nothing near. */
function open(): [number, number] {
  for (let z = -30; z < 30; z++)
    for (let x = -30; x < 30; x++) {
      let ok = true;
      for (let dz = -6; dz <= 6 && ok; dz++) for (let dx = -2; dx <= 2 && ok; dx++) if (!bearWalk(map, cellOf(x + dx), cellOf(z + dz))) ok = false;
      if (ok && sight(map, x, z, x, z + 6)) return [x, z];
    }
  throw new Error('no open spot');
}
const run = (w: World, ps: () => PNet[], s: number) => {
  const out: Msg[] = [];
  for (let i = 0; i < s * 30; i++) out.push(...step(w, ps(), 1 / 30));
  return out;
};

describe('the forest', () => {
  it('is the same from the same seed, different from another', () => {
    expect(buildMap(7).trees).toEqual(map.trees);
    expect(buildMap(8).trees).not.toEqual(map.trees);
  });
  it('has a river with one bridge, three cliffs with ladders, a safe dock and camp', () => {
    const cells = Array.from(map.cells);
    expect(cells.some((c) => c & WATER)).toBe(true);
    expect(map.plateaus).toHaveLength(3);
    for (const p of map.plateaus) {
      expect(at(map, p.head[0], p.head[1]) & CLIFF).toBeTruthy();
      expect(at(map, p.foot[0], p.foot[1]) & CLIFF).toBeFalsy();
    }
    expect(at(map, map.dock.x, map.dock.z) & SAFE).toBeTruthy();
    expect(map.trees.length).toBeGreaterThan(120);
    expect(map.items.filter((i) => i.kind === 'piece')).toHaveLength(5);
    expect(map.items.filter((i) => i.top)).toHaveLength(6);
    // nothing on a trunk or in a bush's cell where an item lies
    for (const i of map.items.filter((i) => !i.top)) expect(at(map, i.x, i.z) & (TRUNK | BUSH | WATER)).toBeFalsy();
    expect(cells.length).toBe(N * N);
  });
});

describe('a bear', () => {
  it('sees a player in the open, roars, chases and catches a player who stands still', () => {
    const [x, z] = open();
    const w = awake(x, z);
    const out = run(w, () => [P({ who: 'A', x, z: z + 5 })], 4);
    expect(out.some((m) => m.k === 'catch' && m.who === 'A')).toBe(true);
  });
  it('never sees a player behind it in the dark of the trees, past its cone', () => {
    const [x, z] = open();
    const w = awake(x, z);
    w.bears[0].f = Math.PI;
    const out = run(w, () => [P({ who: 'A', x, z: z + 6 })], 0.2);
    expect(w.bears[0].st).not.toBe('alert');
    expect(out).toHaveLength(0);
  });
  it('can’t catch a player hiding out of its sight, on a cliff, or in the safe dock', () => {
    const [x, z] = open();
    for (const p of [P({ who: 'A', x, z: z + 3, st: 'hide', bush: 0 }), P({ who: 'A', x, z: z + 3, top: true })]) {
      const w = awake(x, z);
      const out = run(w, () => [p], 3);
      expect(out.some((m) => m.k === 'catch')).toBe(false);
    }
    const w = awake(map.dock.x, map.dock.z - map.dock.r - 2);
    const out = run(w, () => [P({ who: 'A', x: map.dock.x, z: map.dock.z })], 3);
    expect(out.some((m) => m.k === 'catch')).toBe(false);
  });
  it('lunges with a telegraph, and a player who steps aside gets a ギリギリ', () => {
    const [x, z] = open();
    const w = awake(x, z);
    let px = x, pz = z + 3;
    const msgs: Msg[] = [];
    let dodged = false;
    for (let i = 0; i < 120 && !msgs.some((m) => m.k === 'catch'); i++) {
      if (w.bears[0].st === 'tele' && !dodged) {
        dodged = true;
        px += 2.2;
      }
      msgs.push(...step(w, [P({ who: 'A', x: px, z: pz })], 1 / 30));
      if (w.bears[0].st === 'recover') break;
    }
    expect(dodged).toBe(true);
    expect(msgs.some((m) => m.k === 'giri')).toBe(true);
    expect(msgs.some((m) => m.k === 'catch')).toBe(false);
  });
  it('falls into a pitfall seed and is stunned, then can’t be trapped again at once', () => {
    const [x, z] = open();
    const w = awake(x, z);
    handle(w, { k: 'seed', who: 'A', x, z: z + 0.5 });
    handle(w, { k: 'seed', who: 'A', x, z: z + 0.5 });
    const out = run(w, () => [], 0.1);
    expect(out.filter((m) => m.k === 'trap')).toHaveLength(1);
    expect(w.bears[0].st).toBe('trap');
    run(w, () => [], TUNE.stunTrap + 0.1);
    expect(w.bears[0].st).not.toBe('trap');
  });
  it('backs off when its menace fills (not in the last flight)', () => {
    const [x, z] = open();
    const w = awake(x, z);
    w.bears[0].menace = 99.9;
    w.bears[0].st = 'chase';
    w.bears[0].tg = 'A';
    step(w, [P({ who: 'A', x, z: z + 8 })], 1 / 30);
    expect(w.bears[0].st).toBe('relief');
  });
});

describe('the host', () => {
  it('gives an item to the first claim only, keeps the bank, makes a dropped pile an item', () => {
    const w = createWorld(map, 1, ['A', 'B']);
    expect(handle(w, { k: 'pick', who: 'A', id: 0 })).toEqual([{ k: 'picked', who: 'A', id: 0, n: 1 }]);
    expect(handle(w, { k: 'pick', who: 'B', id: 0 })).toEqual([]);
    expect(handle(w, { k: 'bank', who: 'B', n: 3 })).toEqual([{ k: 'banked', who: 'B', n: 3, total: 3 }]);
    const [pile] = handle(w, { k: 'drop', who: 'A', x: 1, z: 2, n: 2, top: false });
    expect(pile).toMatchObject({ k: 'pile', n: 2 });
    expect(handle(w, { k: 'pick', who: 'B', id: (pile as { id: number }).id })).toMatchObject([{ k: 'picked', n: 2 }]);
  });
  it('ends at the time, or when nobody is left standing', () => {
    const w = createWorld(map, 1, ['A']);
    w.t = TUNE.round - 0.01;
    expect(step(w, [P({ who: 'A' })], 0.05).some((m) => m.k === 'end')).toBe(true);
    const v = createWorld(map, 1, ['A', 'B']);
    expect(step(v, [P({ who: 'A', st: 'down' }), P({ who: 'B', st: 'home' })], 0.05)).toContainEqual({ k: 'end', why: 'wiped', total: 0 });
    const u = createWorld(map, 1, ['A']);
    expect(step(u, [P({ who: 'A', st: 'down', up: true })], 0.05).some((m) => m.k === 'end')).toBe(false);
  });
});

describe('a host gone quiet', () => {
  it('is taken over from what the others last heard: the bears where they were, the taken, fallen, planted and banked', () => {
    const w = createWorld(map, 2, ['A', 'B']);
    handle(w, { k: 'pick', who: 'A', id: 3 });
    handle(w, { k: 'push', who: 'A', id: 1 });
    handle(w, { k: 'seed', who: 'B', x: 1, z: 2 });
    handle(w, { k: 'bank', who: 'B', n: 4 });
    w.t = 50;
    w.bears[0].x = 5;
    const v = adopt(map, ['A', 'B'], { t: w.t, bears: bearNet(w), items: w.items, taken: w.taken, traps: w.traps, fallen: w.fallen, nests: w.nests, bank: w.bank });
    expect(v.bears.map((b) => b.x)).toEqual(w.bears.map((b) => b.x));
    expect([...v.taken]).toEqual([3]);
    expect([...v.fallen]).toEqual([1]);
    expect(v.traps).toHaveLength(1);
    expect(v.bank).toBe(4);
    expect(Array.from(v.logs).some(Boolean)).toBe(true);
    expect(handle(v, { k: 'pick', who: 'B', id: 3 })).toEqual([]);
  });
});

describe('a player', () => {
  it('walks, sprints faster till its stamina runs dry, then wheezes', () => {
    const me = createMe(0, 30);
    let t = 0;
    for (; t < 1; t += 1 / 30) move(map, me, { x: 0, z: -1 }, true, t, 1 / 30, new Set());
    expect(me.v).toBeGreaterThan(TUNE.walk);
    for (; t < 7; t += 1 / 30) move(map, me, { x: 1, z: 0 }, true, t, 1 / 30, new Set());
    expect(me.stamina).toBeLessThan(0.2);
  });
  it('can’t walk into a cliff’s side, and climbs its ladder up', () => {
    const p = map.plateaus[0];
    const me = createMe(p.foot[0], p.foot[1]);
    for (let t = 0; t < 2; t += 1 / 30) move(map, me, { x: 0, z: -1 }, false, t, 1 / 30, new Set());
    expect(me.top).toBe(false);
    expect(at(map, me.x, me.z) & CLIFF).toBeFalsy();
    me.climb = { p, t0: 0 };
    move(map, me, { x: 0, z: 0 }, false, 2, 1 / 30, new Set());
    expect(me.top).toBe(true);
  });
});
