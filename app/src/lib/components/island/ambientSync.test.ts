// Two phones, one island (docs/backend.md#ambient-life "Positions"): each skips different beats (one hidden for two
// minutes, one under a sheet and then in the slow mode), and at the same wall time both have the villager nobody's
// phone moves (B's, woken by a tap while B is away) and the visitor at the same spot. Each phone is its own module
// graph (the director is a module's state), run one after the other on the same fake clock.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Pt } from '#lib/world/world.ts';
import type { PlanInput } from './ambientPlan.ts';

const T0 = Date.parse('2026-11-01T14:00:03+09:00');
const REST: Pt = [262, 214], STAGE: Pt = [200, 330];
const straight = (_from: Pt, to: Pt): Pt[] => [to];
const INPUT: PlanInput = {
  villagers: {
    A: { home: [132, 214], rest: [132, 214], present: true },
    B: { home: REST, rest: REST, present: false, wake: { from: T0 + 5_000 + 2_400, until: T0 + 5_000 + 900_000 } },
    G: { home: [195, 230], rest: [195, 230], present: false }
  },
  pois: [
    { node: 'treeA', at: [62, 350], kind: 'tree' }, { node: 'treeB', at: [330, 350], kind: 'tree' }, { node: 'rock', at: [112, 500], kind: 'rock' },
    { node: 'shoreL', at: [100, 20], kind: 'shore' }, { node: 'shoreR', at: [290, 20], kind: 'shore' }, { node: 'spot1', at: [200, 300], kind: 'spot' }
  ],
  phase: 'day',
  scores: { A: 50, B: 50 },
  route: straight
};

interface Pattern {
  /** Hidden over [from, to) (s after T0). */
  hidden?: [number, number];
  /** Under a sheet over [from, to). */
  covered?: [number, number];
  /** A touch this often (s; never: the slow mode after 3 min). */
  touchEvery?: number;
}
const CHECKS = [160, 200, 240, 280, 320, 360, 400, 440, 480, 520, 560, 590];

/** One phone through the first 10 minutes: where B's villager and the visitor stand at each check. */
async function phone(p: Pattern): Promise<{ b: Pt[]; v: Pt[] }> {
  vi.resetModules();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'], now: T0 });
  const doc = { hidden: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  const win = vi.fn();
  vi.stubGlobal('document', doc);
  vi.stubGlobal('addEventListener', win);
  vi.stubGlobal('removeEventListener', vi.fn());
  const { startIdleLife } = await import('../motion/idleLife.svelte.ts');
  const d = await import('../motion/director.svelte.ts');
  const tp = await import('./trackPlay.ts');
  const { planAt, worldAt } = await import('./ambientPlan.ts');
  const { DECIDE_MS, slotStart } = await import('./ambient.ts');
  const { strollTrack } = await import('./visitorLife.ts');
  d.resetAll();
  d.place('partner', ...REST);
  d.place('visitor', ...STAGE);
  let covered = false;
  // (islandLife's sync and avatar.ts followPlan, the island's parts left out: a straight walk graph)
  const keep = (id: 'partner' | 'visitor', tr: ReturnType<typeof planAt>['B'] | null, rest: Pt, t: number, jump: boolean) => {
    if (tr && t < tr.end) return void ((jump || !tp.following(id, tr.key)) && tp.playTrack(id, tr, t, jump));
    tp.drop(id);
    tp.settle(id, rest, jump);
  };
  const stop = startIdleLife({
    paused: () => covered,
    treeShake: () => {},
    me: () => 'A',
    world: (date, slot) => worldAt(INPUT, slotStart(date, slot), planAt(INPUT, slotStart(date, slot) + DECIDE_MS - 1)),
    outing: () => false,
    sync: ({ jump, t = Date.now() }) => {
      keep('partner', planAt(INPUT, t).B ?? null, REST, t, jump);
      keep('visitor', strollTrack('daisy-mae', STAGE, t, 'visitor', () => true, straight), STAGE, t, jump);
    }
  });
  const onVis = doc.addEventListener.mock.calls.find((c) => c[0] === 'visibilitychange')![1] as () => void;
  const touch = win.mock.calls.find((c) => c[0] === 'pointerdown')![1] as () => void;
  const out = { b: [] as Pt[], v: [] as Pt[] };
  for (let s = 1; s <= 600; s++) {
    await vi.advanceTimersByTimeAsync(1_000);
    if (p.hidden?.[0] === s) (doc.hidden = true), onVis();
    if (p.hidden?.[1] === s) (doc.hidden = false), onVis();
    if (p.covered?.[0] === s) {
      covered = true;
      // (avatar.ts freeze: a walk under a sheet stops where it is)
      d.place('partner', ...d.livePos('partner'));
    }
    if (p.covered?.[1] === s) (covered = false), stop.resync(true);
    const busy = (p.hidden && s >= p.hidden[0] && s < p.hidden[1]) || (p.covered && s >= p.covered[0] && s < p.covered[1]);
    if (p.touchEvery && !busy && s % p.touchEvery === 0) touch();
    if (CHECKS.includes(s)) {
      await vi.advanceTimersByTimeAsync(0);
      out.b.push(d.livePos('partner'));
      out.v.push(d.livePos('visitor'));
    }
  }
  stop();
  d.resetAll();
  return out;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('two phones, different skips, the same island', () => {
  it('one hidden for 2 min, one under a sheet and then idle: B’s woken villager and the visitor stand at the same spot at the same time', async () => {
    const one = await phone({ hidden: [30, 150], touchEvery: 20 });
    const two = await phone({ covered: [20, 100] });
    const gap = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    CHECKS.forEach((s, i) => {
      expect(gap(one.b[i], two.b[i]), `B at ${s} s`).toBeLessThan(2);
      expect(gap(one.v[i], two.v[i]), `the visitor at ${s} s`).toBeLessThan(2);
    });
    // (they went somewhere: not two phones agreeing that nobody moved)
    expect(one.b.some((p) => gap(p, REST) > 20)).toBe(true);
    expect(one.v.some((p) => gap(p, STAGE) > 20)).toBe(true);
  }, 30_000);

  it('a third phone that saw none of it (opened after) has them where the other two do', async () => {
    const one = await phone({ touchEvery: 20 });
    const late = await phone({ hidden: [1, 155] });
    const gap = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    CHECKS.forEach((s, i) => expect(gap(one.b[i], late.b[i]), `B at ${s} s`).toBeLessThan(2));
  }, 30_000);
});
