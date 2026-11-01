// The villagers on both phones (villagerSync.ts): every move of mine as the very walk; the partner's played from the
// same start at the same time (caught up when late, a big gap a jump), their villager the relay's to move while they're
// here; and two phones linked through a fake relay end with both villagers at the same points.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Intent } from '#lib/sync/live-protocol.ts';

type Walk = Extract<Intent, { kind: 'walk' }>;

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('document', { hidden: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const load = async () => ({ ...(await import('../motion/director.svelte.ts')), ...(await import('./villagerSync.ts')) });

describe('a walk as the relay carries it', () => {
  it('rounds, keeps at most VIA_MAX waypoints (the end always), and its facing', async () => {
    const { thin, walkOf } = await load();
    const pts = Array.from({ length: 25 }, (_, i) => [i * 10 + 0.4, 300] as const);
    const t = thin(pts);
    expect(t.length).toBeLessThanOrEqual(11);
    expect(t.at(-1)).toEqual([240, 300]);
    const w = walkOf({ id: 'mine', from: [132.4, 214.6], pts: [[160.2, 300], [190, 400.5]], ms: 1234.5, face: 'home' }, 1_793_500_000_000.7);
    expect(w).toEqual({ kind: 'walk', to: [190, 401], from: [132, 215], via: [[160, 300]], s: 1_793_500_000_001, ms: 1235, f: 'home' });
    expect(walkOf({ id: 'mine', from: [10, 20], pts: [], ms: 0 }, 5)).toEqual({ kind: 'walk', to: [10, 20], from: [10, 20], s: 5, ms: 0 });
  });
  it('along: where the walk has its walker by a time, the rest of the way and how long it takes', async () => {
    const { along } = await load();
    expect(along([0, 0], [[100, 0], [100, 100]], 2000, 500)).toEqual({ at: [50, 0], rest: [[100, 0], [100, 100]], left: 1500 });
    expect(along([0, 0], [[100, 0], [100, 100]], 2000, 1500)).toEqual({ at: [100, 50], rest: [[100, 100]], left: 500 });
    expect(along([0, 0], [[100, 0]], 1000, 1000)).toEqual({ at: [100, 0], rest: [], left: 0 });
    expect(along([0, 0], [[100, 0]], 1000, -50)).toEqual({ at: [0, 0], rest: [[100, 0]], left: 1000 });
  });
});

describe('the partner’s walk played here', () => {
  it('from the same start at the same time: on time it walks the way; late it starts where the walk is by now; over, it is there', async () => {
    const { actors, livePos, playPartner, resetAll, setHome } = await load();
    resetAll();
    setHome('partner', 262, 214);
    const w: Walk = { kind: 'walk', to: [262, 614], from: [262, 214], s: 10_000, ms: 2000 };
    expect(playPartner(w, 10_000)).toBe('walk');
    expect(actors.partner.walking).toBe(true);
    await vi.advanceTimersByTimeAsync(2000);
    expect(livePos('partner')).toEqual([262, 614]);
    // heard 1.5 s late, 300u from where its walk has it: a jump to there, then the rest in the time left
    setHome('partner', 262, 214);
    resetAll();
    expect(playPartner({ ...w, to: [262, 1014], ms: 4000 }, 13_000)).toBe('jump');
    expect(actors.partner.from).toEqual([262, 814]);
    expect(actors.partner.walkMs).toBe(1000);
    // over long ago (a phone opening later): put at its end, facing as it does there
    resetAll();
    expect(playPartner({ ...w, f: 'home' }, 99_000)).toBe('put');
    expect(livePos('partner')).toEqual([262, 614]);
    expect(actors.partner.face).toBe('home');
    // just over, and near: walked off briskly
    resetAll();
    expect(playPartner({ ...w, to: [262, 300], ms: 400 }, 10_500)).toBe('catch-up');
    // an older app's walk (no very walk): the caller plans it
    expect(playPartner({ kind: 'walk', to: [1, 2] }, 0)).toBeNull();
  });

  it('while the partner is here their villager is the relay’s: a local walk or put of it does nothing, a reaction doesn’t stop the remote walk', async () => {
    const { actors, cancel, livePos, place, playPartner, resetAll, setHome, setRemote, walkTo } = await load();
    resetAll();
    setHome('partner', 262, 214);
    setRemote('partner', true);
    expect(walkTo('partner', [[300, 300]])).toBe(0);
    place('partner', 0, 0);
    expect(livePos('partner')).toEqual([262, 214]);
    playPartner({ kind: 'walk', to: [262, 414], from: [262, 214], via: [[262, 314]], s: 0, ms: 2000 }, 0);
    await vi.advanceTimersByTimeAsync(500);
    cancel('partner'); // a reaction takes the actor
    expect(actors.partner.walking).toBe(true);
    await vi.advanceTimersByTimeAsync(1600);
    expect(livePos('partner')).toEqual([262, 414]);
    setRemote('partner', false);
  });
});

describe('two phones linked through a relay', () => {
  it('a wake here is told with its time; there it wakes the same villager for what is left, and both sleep again then', async () => {
    const d = await load();
    d.resetAll();
    d.setSleepClock(() => true);
    for (const id of ['mine', 'partner'] as const) d.setAsleep(id, true);
    const told: unknown[] = [];
    const link = d.linkVillagers({ share: (w) => void told.push(w), me: () => 'B', serverNow: () => 70_000, enabled: () => true });
    d.wake('partner'); // a high-five here wakes A's villager (my partner): A's phone hears it
    expect(told).toEqual([{ kind: 'act', act: 'wake', id: 'A', at: 70_000 }]);
    link.detach();
    // A's phone (me A): its own villager wakes for the 10 s less the 3 s the message took, then sleeps
    d.setAsleep('mine', true);
    expect(d.playWake({ id: 'A', at: 70_000 }, 'A', 73_000)).toBe(true);
    expect(d.actors.mine.asleep).toBe(false);
    await vi.advanceTimersByTimeAsync(6900);
    expect(d.actors.mine.asleep).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    expect(d.actors.mine.asleep).toBe(true);
    // too late (over already) or awake: nothing
    expect(d.playWake({ id: 'A', at: 0 }, 'A', 73_000)).toBe(false);
    // past the night's end: a woken villager stays up
    d.setSleepClock(() => false);
    d.setAsleep('partner', true);
    d.playWake({ id: 'B', at: 80_000 }, 'A', 80_000);
    await vi.advanceTimersByTimeAsync(10_100);
    expect(d.actors.partner.asleep).toBe(false);
    d.setSleepClock(() => true);
  });

  it('every move of mine is told (a burst as one), and the other phone ends with my villager where mine is', async () => {
    const d = await load();
    d.resetAll();
    d.setHome('mine', 132, 214);
    d.setHome('partner', 262, 214);
    const told: Walk[] = [];
    const woke: unknown[] = [];
    let clock = 50_000;
    const link = d.linkVillagers({ share: (w) => void (w.kind === 'walk' ? told.push(w) : woke.push(w)), me: () => 'A', serverNow: () => clock, enabled: () => true });
    d.walkTo('mine', [[132, 400], [200, 500]], { ms: 1500, face: 'l' });
    await Promise.resolve();
    expect(told).toEqual([{ kind: 'walk', to: [200, 500], from: [132, 214], via: [[132, 400]], s: 50_000, ms: 1500, f: 'l' }]);
    // a put then a walk in one go: one message, the walk
    d.place('mine', 140, 220);
    d.walkTo('mine', [[150, 260]], { ms: 300 });
    await Promise.resolve();
    expect(told).toHaveLength(2);
    expect(told[1]).toMatchObject({ from: [140, 220], to: [150, 260], ms: 300 });
    // stopped mid-walk (a reaction): told where it stops
    d.walkTo('mine', [[150, 460]], { ms: 2000 });
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(400);
    d.cancel('mine');
    await Promise.resolve();
    expect(told.at(-1)).toMatchObject({ to: [150, 460] });
    // a long walk under way is said again every RESAY_MS while the partner is here; their arrival hears it at once
    d.walkTo('mine', [[150, 1260]], { ms: 12_000 });
    await Promise.resolve();
    const n = told.length;
    link.partnerHere(true);
    expect(told.length).toBe(n + 1);
    clock += d.RESAY_MS;
    await vi.advanceTimersByTimeAsync(d.RESAY_MS);
    expect(told.length).toBe(n + 2);
    expect(told.at(-1)).toEqual(told[n - 1]);
    // the other phone plays the last one at its time: where mine is when it ends
    d.resetAll();
    d.setHome('partner', 262, 214);
    d.playPartner(told.at(-1)!, clock);
    await vi.advanceTimersByTimeAsync(12_000);
    expect(d.livePos('partner')).toEqual([150, 1260]);
    link.detach();
  });
});
