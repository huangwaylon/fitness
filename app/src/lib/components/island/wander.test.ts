import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WeekView } from '#lib/types.ts';
import { RING_FRUITS } from '#lib/config/rules.ts';
import { FOLLOW_MS, adjacent, besideSpots, goalMoves, pickPoi, pois, shouldFollow } from './wander.ts';
import { walkGeo, walkable } from './walkGraph.ts';
import { GOAL_TREES } from './world.ts';

describe('points of interest', () => {
  const g = walkGeo();
  it('the trees, the rock, the shore and centre stage; never a home or a bare waypoint', () => {
    const names = pois(g, false).map((p) => p.name);
    for (const n of ['treeA', 'treeB', 'rock', 'shoreL', 'shoreC', 'shoreR', 'centreStage']) expect(names).toContain(n);
    for (const n of ['homeA', 'homeB', 'rampTop', 'midA']) expect(names).not.toContain(n);
    expect(pois(g, false).find((p) => p.name === 'shoreC')!.kind).toBe('shore');
  });
  it('with a visitor out, centre stage and the shore in front of it are theirs', () => {
    const names = pois(g, true).map((p) => p.name);
    expect(names).not.toContain('centreStage');
    expect(names).not.toContain('shoreC');
    expect(names).toContain('shoreL');
  });
  it('a later spot (a pondside) is a point of interest as soon as it exists', () => {
    const more = walkGeo({ nodes: { lookout: [300, 420] } });
    expect(pois(more, false).map((p) => p.name)).toContain('lookout');
  });
  it('the pick is never where it already stands', () => {
    const list = pois(g, false);
    const at = list[0].at;
    for (let i = 0; i < 20; i++) expect(pickPoi(list, at, () => i / 20)!.name).not.toBe(list[0].name);
    expect(pickPoi([list[0]], at, Math.random)).toBeNull();
  });
});

describe('follow and chat', () => {
  const g = walkGeo();
  it('the partner follows once mine has been away 8 s, and only when free', () => {
    expect(shouldFollow(0, 50_000, true)).toBe(false); // mine is home
    expect(shouldFollow(10_000, 10_000 + FOLLOW_MS - 1, true)).toBe(false);
    expect(shouldFollow(10_000, 10_000 + FOLLOW_MS, true)).toBe(true);
    expect(shouldFollow(10_000, 30_000, false)).toBe(false);
  });
  it('side by side: beside mine on the side the partner comes from first, all walkable', () => {
    const at = [190, 270] as const;
    const s = besideSpots(g, at, [262, 214]);
    expect(s.length).toBeGreaterThan(1);
    expect(s[0][0]).toBeGreaterThan(at[0]);
    for (const [x, y] of s) expect(walkable(g, x, y)).toBe(true);
    for (const p of s) expect(adjacent(p, at)).toBe(true); // close enough to chat on arrival
  });
  it('chat when adjacent', () => {
    expect(adjacent([100, 200], [140, 200])).toBe(true);
    expect(adjacent([100, 200], [200, 200])).toBe(false);
  });
});

describe('goal reactions', () => {
  const view = (met: Record<'A' | 'B', number>): WeekView => {
    const person = (n: number) => ({ rings: Object.fromEntries(RING_FRUITS.map((f, i) => [f, { today: i < n ? 10 : 0, goal: 10, met: i < n }])) });
    return { me: 'A', partner: 'B', people: { A: person(met.A), B: person(met.B) } } as unknown as WeekView;
  };
  it('a fruit met walks that person’s villager to the tree (mine first)', () => {
    expect(goalMoves(view({ A: 1, B: 0 }), view({ A: 2, B: 0 }))).toEqual({ meet: false, walk: 'mine' });
    expect(goalMoves(view({ A: 1, B: 0 }), view({ A: 1, B: 1 }))).toEqual({ meet: false, walk: 'partner' });
    expect(goalMoves(view({ A: 1, B: 1 }), view({ A: 1, B: 1 }))).toEqual({ meet: false, walk: null });
  });
  it('ふたりでぜんぶ: both all four for the first time → they meet in the middle', () => {
    expect(goalMoves(view({ A: 4, B: 3 }), view({ A: 4, B: 4 }))).toEqual({ meet: true, walk: null });
    expect(goalMoves(view({ A: 4, B: 4 }), view({ A: 4, B: 4 })).meet).toBe(false);
  });
});

describe('the walkers (avatar.ts on a stand-in scene)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('document', { hidden: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  async function scene() {
    const d = await import('../motion/director.svelte.ts');
    const a = await import('./avatar.ts');
    const { HOMES } = await import('./world.ts');
    d.resetAll();
    d.setHome('mine', HOMES.A[0], HOMES.A[1]);
    d.setHome('partner', HOMES.B[0], HOMES.B[1]);
    const g = walkGeo();
    const off = a.attachAvatar({ geo: () => g, clear: () => true, where: (id) => [d.actors[id].x, d.actors[id].y], enabled: () => true });
    return { d, a, off };
  }

  it('mine away over 8 s (sent across the lawn): the partner comes over, they chat', async () => {
    const { d, a, off } = await scene();
    const r = a.sendTo(100, 300)!; // by the left tree: a tap on empty ground walks
    expect(r).not.toBeNull();
    expect(d.actors.mine.walking).toBe(true);
    await vi.advanceTimersByTimeAsync(r.ms + 100);
    expect(d.actors.partner.walking).toBe(false);
    await vi.advanceTimersByTimeAsync(FOLLOW_MS);
    expect(d.awayFromHome('partner')).toBe(true); // on its way
    await vi.advanceTimersByTimeAsync(4000);
    expect(adjacent([d.actors.partner.x, d.actors.partner.y], [d.actors.mine.x, d.actors.mine.y])).toBe(true);
    a.snapHome(); // (a tap's walk stays for the session: back home for the next case)
    await vi.advanceTimersByTimeAsync(30_000);
    off();
  });

  it('an action on something plays in place: no walk, my villager turns to it', async () => {
    const { d, a, off } = await scene();
    const [x0, y0] = [d.actors.mine.x, d.actors.mine.y];
    a.turnTo(x0 + 40);
    expect(d.actors.mine.walking).toBe(false);
    expect(d.actors.mine.face).toBe('r');
    a.turnTo(x0 - 300);
    expect(d.actors.mine.face).toBe('l');
    expect([d.actors.mine.x, d.actors.mine.y]).toEqual([x0, y0]);
    off();
  });

  it('one walker leaves home at a time', async () => {
    const { d, a, off } = await scene();
    expect(a.wander('partner')).toBe(true);
    expect(a.wander('mine')).toBe(false);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(d.awayFromHome('partner')).toBe(false); // the outing ends at home
    expect(a.wander('mine')).toBe(true);
    off();
  });

  it('goal reactions: a villager walks to its tree; ふたりでぜんぶ brings both to the middle and they high-five', async () => {
    const { d, a, off } = await scene();
    const ms = a.goalWalk('partner');
    expect(ms).toBeGreaterThan(0);
    await vi.advanceTimersByTimeAsync(ms + 10);
    expect(Math.hypot(d.actors.partner.x - GOAL_TREES.B[0], d.actors.partner.y - GOAL_TREES.B[1])).toBeLessThan(60); // by its tree
    await vi.advanceTimersByTimeAsync(30_000);
    const meet = a.meetUp();
    expect(meet).toBeGreaterThan(0);
    expect(d.actors.mine.walking && d.actors.partner.walking).toBe(true);
    await vi.advanceTimersByTimeAsync(meet + 10);
    expect([d.actors.mine.face, d.actors.partner.face]).toEqual(['r', 'l']);
    expect(d.actors.mine.motion).toBe('hop');
    off();
  });

  it('a sheet freezes the walkers where they are; uncovered they wander home', async () => {
    const { d, a, off } = await scene();
    expect(a.wander('partner', 1)).toBe(true);
    await vi.advanceTimersByTimeAsync(200);
    a.freeze();
    expect(d.actors.partner.walking).toBe(false);
    a.thaw();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(d.awayFromHome('partner')).toBe(false);
    off();
  });
});
