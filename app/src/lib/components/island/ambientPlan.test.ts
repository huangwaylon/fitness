import { describe, expect, it } from 'vitest';
import { DECIDE_MS, SETTLE_MS, SLOT_MS, hostBeat, settledDay, slotAt, villagerBeats, type DayLatch, type Poi } from './ambient.ts';
import { outingTrack, planAt, trackAt, worldAt, type PlanInput } from './ambientPlan.ts';
import { strollTrack } from './visitorLife.ts';
import type { Pt } from '#lib/world/world.ts';

const T0 = Date.parse('2026-11-01T14:00:00+09:00');
const POIS: Poi[] = [
  { node: 'treeA', at: [62, 350], kind: 'tree' }, { node: 'treeB', at: [330, 350], kind: 'tree' }, { node: 'rock', at: [112, 500], kind: 'rock' },
  { node: 'shoreL', at: [100, 20], kind: 'shore' }, { node: 'shoreR', at: [290, 20], kind: 'shore' }, { node: 'spot1', at: [200, 300], kind: 'spot' }
];
const straight = (_from: Pt, to: Pt): Pt[] => [to];
/** A (here) at home; B away, woken by a tap at `woke` for `ms`. */
function input(woke = T0, ms = 600_000, o: Partial<PlanInput> = {}): PlanInput {
  return {
    villagers: {
      A: { home: [132, 214], rest: [132, 214], present: true },
      B: { home: [262, 214], rest: [262, 214], present: false, wake: { from: woke + 2_400, until: woke + ms } },
      G: { home: [195, 230], rest: [195, 230], present: false }
    },
    pois: POIS,
    phase: 'day',
    scores: { A: 50, B: 50 },
    route: straight,
    ...o
  };
}

describe('ambient plan: where the villagers nobody’s phone moves are', () => {
  it('a woken villager’s outings come from the slots of its wake alone: asked at any moment, the same walks', () => {
    const inp = input();
    const keys = new Set<string>();
    // a phone asking every second vs one asking once a minute: the track under way at each moment is the same
    for (let t = T0; t < T0 + 600_000; t += 1_000) {
      const tr = planAt(inp, t).B;
      if (tr) keys.add(tr.key);
      if ((t - T0) % 60_000 === 0) expect(planAt(input(), t).B).toEqual(tr);
    }
    expect(keys.size).toBeGreaterThan(3); // (it does go out, several times)
  });

  it('every outing is back at its rest before the wake runs out, one at a time, starting on a slot’s decision', () => {
    const inp = input(T0, 60_000);
    let last: string | undefined;
    for (let t = T0; t < T0 + 70_000; t += 500) {
      const tr = planAt(inp, t).B;
      if (!tr || tr.key === last) continue;
      last = tr.key;
      expect((tr.legs[0].t0 - DECIDE_MS) % SLOT_MS).toBe(0);
      expect(tr.end).toBeLessThanOrEqual(T0 + 60_000);
      expect(trackAt(tr, tr.end).at).toEqual([262, 214]);
    }
  });

  it('nobody out while its person is here (their phone moves it), asleep, or in a room', () => {
    for (const B of [{ present: true }, { wake: undefined }, { inside: true }])
      for (let t = T0; t < T0 + 300_000; t += 10_000) {
        const inp = input();
        inp.villagers.B = { ...inp.villagers.B!, ...B };
        expect(planAt(inp, t).B).toBeUndefined();
      }
  });

  it('a track fits its wake: lingers shortened, then stops dropped; none when even one won’t fit', () => {
    const v = input().villagers.B!;
    const stops = [{ node: 'treeA', linger: 5000 }, { node: 'rock', linger: 5000 }];
    const full = outingTrack('k', { ...v, wake: { from: T0, until: T0 + 600_000 } }, stops, T0, input())!;
    expect(full.legs.map((l) => l.stay)).toEqual([5000, 5000, 0]);
    const walking = full.legs.reduce((s, l) => s + l.ms, 0);
    const tight = outingTrack('k', { ...v, wake: { from: T0, until: T0 + walking + 1_000 + 4_000 } }, stops, T0, input())!;
    expect(tight.end).toBeLessThanOrEqual(T0 + walking + 4_000);
    expect(tight.legs.length).toBe(3);
    expect(outingTrack('k', { ...v, wake: { from: T0, until: T0 + 2_000 } }, stops, T0, input())).toBeNull();
  });

  it('trackAt walks a leg by its time, stands its stay, and is over at the end', () => {
    const tr = outingTrack('k', input().villagers.B!, [{ node: 'spot1', linger: 4000 }], T0, input())!;
    const l = tr.legs[0];
    expect(trackAt(tr, T0 - 1).leg).toBe(-1);
    const mid = trackAt(tr, T0 + l.ms / 2);
    expect(mid.walking).toBe(true);
    expect(mid.at[0]).toBeCloseTo((262 + 200) / 2, 0);
    expect(trackAt(tr, T0 + l.ms + 100)).toMatchObject({ leg: 0, walking: false, at: [200, 300] });
    expect(trackAt(tr, tr.end).leg).toBe(tr.legs.length);
  });

  it('a slot’s world is built from shared inputs: where this phone’s villagers happen to stand doesn’t enter it', () => {
    const inp = input();
    const tracks = planAt(inp, T0 + 300_000);
    const w = worldAt(inp, T0 + 300_000 - DECIDE_MS, tracks);
    expect(w.villagers.A).toMatchObject({ at: [132, 214], free: true, present: true });
    expect(w.villagers.G).toBeUndefined(); // (asleep, the guest's is in nothing)
  });
});

describe('ambient plan: a lagging record changes nothing', () => {
  it('a phone whose record has a fresh Health sync and one still on the older copy decide the same slots', () => {
    const now = T0 + 3_600_000, day = '2026-11-01';
    // both saw A at 75 settled earlier; A's phone fetched a sync 10 s ago (100), the guest's not yet
    const latch: DayLatch = { day, score: 75, exercise: true };
    const fresh = settledDay({ score: 100, exercise: true }, now - 10_000, now, day, latch).mark;
    const stale = settledDay({ score: 75, exercise: true }, now - 3_600_000, now, day, latch).mark;
    expect(fresh).toEqual(stale);
    const w = (a: number) => input(T0, 6 * 3_600_000, { scores: { A: a, B: 100 } });
    for (let s = 0; s < 360; s++) {
      const start = now + s * SLOT_MS, { date, slot } = slotAt(start);
      expect(villagerBeats(worldAt(w(fresh.score), start, {}), date, slot)).toEqual(villagerBeats(worldAt(w(stale.score), start, {}), date, slot));
    }
    // settled (SETTLE_MS on), the new score counts; a latch from yesterday counts as nothing met yet
    expect(settledDay({ score: 100, exercise: true }, now - SETTLE_MS, now, day, latch).mark.score).toBe(100);
    expect(settledDay({ score: 25, exercise: false }, now - 1_000, now, day, { ...latch, day: '2026-10-31' }).mark).toEqual({ score: 0, exercise: false });
  });
});

describe('ambient plan: しずえ and the visitors', () => {
  it('しずえ’s move is the slot’s alone, never the same twice running (within its 10-minute block), about one slot in eight', () => {
    const moves: (string | null)[] = [];
    for (let s = 0; s < 4000; s++) moves.push(hostBeat('2026-11-01', s));
    const played = moves.map((m, s) => [m, s] as const).filter(([m]) => m);
    expect(played.length / moves.length).toBeGreaterThan(0.09);
    expect(played.length / moves.length).toBeLessThan(0.16);
    for (let i = 1; i < played.length; i++) if (Math.floor(played[i][1] / 60) === Math.floor(played[i - 1][1] / 60)) expect(played[i][0]).not.toBe(played[i - 1][0]);
    // (asked again, or only now and then: the same)
    expect(hostBeat('2026-11-01', played[30][1])).toBe(played[30][0]);
  });

  it('a visitor’s strolls come from the clock: asked at any moment, the same; back on its spot between them', () => {
    const home: Pt = [200, 200];
    const at = (t: number) => {
      const tr = strollTrack('daisy-mae', home, t, 'visitor', () => true, straight);
      return tr && t < tr.end ? trackAt(tr, t) : null;
    };
    let strolls = 0;
    for (let t = T0; t < T0 + 7_200_000; t += 250) {
      const p = at(t), q = at(t);
      expect(p).toEqual(q);
      if (p?.leg === 0 && p.walking && !at(t - 250)) strolls++;
      if (!p) continue;
      expect(Math.hypot(p.at[0] - home[0], p.at[1] - home[1])).toBeLessThanOrEqual(70);
    }
    expect(strolls).toBeGreaterThan(360 * 0.2); // (about a third of the 20 s windows)
    expect(strollTrack('gulliver', home, T0, 'visitor', () => true, straight)).toBeNull(); // (stays put)
  });
});

describe('ambient plan: the jump on coming back is cheap', () => {
  // (its cost is the walk graph's ways, ~1 ms each on a laptop, the rest ~0.05 ms a slot: counted, not timed, so a
  // busy runner can't fail it)
  it('a woken villager’s slots replayed on the real walk graph: a few ways the first time, kept, then none', async () => {
    const { walkGeo, route } = await import('#lib/world/walkGraph.ts');
    const { pois } = await import('#lib/world/wander.ts');
    const { HOMES } = await import('#lib/world/world.ts');
    const g = walkGeo();
    // (avatar.ts ambientRoute keeps the ways asked, per walk graph)
    const kept = new Map<string, Pt[] | null>();
    let asked = 0;
    const ways = (a: Pt, b: Pt) => {
      const k = `${a}>${b}`;
      if (!kept.has(k)) kept.set(k, (asked++, route(g, a, b)));
      return kept.get(k)!;
    };
    const inp = input(T0, 900_000, { pois: pois(g, false).map((p) => ({ node: p.name, at: p.at, kind: p.kind })), route: ways });
    inp.villagers.A = { home: HOMES.A, rest: HOMES.A, present: true };
    inp.villagers.B = { ...inp.villagers.B!, home: HOMES.B, rest: HOMES.B };
    // back after 2 min hidden (12 slots of the wake, every way new), then a tick later (the ways kept)
    planAt(inp, T0 + 120_000);
    const cold = asked;
    planAt(inp, T0 + 125_000);
    expect(cold).toBeGreaterThan(0);
    expect(cold).toBeLessThanOrEqual(16);
    expect(asked).toBe(cold);
  });
});
