// The villagers on both phones (villagerSync.ts): every move of mine as the very walk; the partner's played from the
// same start at the same time (caught up when late, a big gap a jump), their villager the relay's to move while they're
// here; and two phones linked through a fake relay end with both villagers at the same points.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Intent } from '#lib/contract/live-protocol.ts';
import { WAKE_MS } from '#lib/ui-state/presence.ts';

type Walk = Extract<Intent, { kind: 'walk' }>;

const stub = () => {
  vi.useFakeTimers();
  vi.stubGlobal('document', { hidden: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
};
const unstub = () => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
};

const load = async () => ({ ...(await import('../motion/director.svelte.ts')), ...(await import('./villagerSync.ts')) });
// (the modules loaded once in the hook, under the tests' stubs: their ~0.5–1.5 s of transform isn't charged to the first test)
beforeAll(async () => {
  stub();
  await load();
});
afterAll(unstub);
beforeEach(stub);
afterEach(unstub);

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
    // heard 1.5 s late, 300u from where its walk has it, the island hidden: a jump to there, then the rest in the time
    // left
    setHome('partner', 262, 214);
    resetAll();
    expect(playPartner({ ...w, to: [262, 1014], ms: 4000 }, 13_000, false)).toBe('jump');
    expect(actors.partner.from).toEqual([262, 814]);
    expect(actors.partner.walkMs).toBe(1000);
    // in view: never a jump: it glides off the gap from where it stands, no slower than the run (a little late)
    resetAll();
    expect(playPartner({ ...w, to: [262, 1014], ms: 4000 }, 13_000)).toBe('glide');
    expect(actors.partner.from).toEqual([262, 214]);
    expect(actors.partner.walkMs).toBe(1500);
    // over long ago, a phone opening later (not in view yet): put at its end, facing as it does there
    resetAll();
    expect(playPartner({ ...w, f: 'home' }, 99_000, false)).toBe('put');
    expect(livePos('partner')).toEqual([262, 614]);
    expect(actors.partner.face).toBe('home');
    // over, far, in view (another phone's put, live): a glide there, never a jump
    resetAll();
    expect(playPartner({ ...w, f: 'l' }, 99_000)).toBe('glide');
    expect(actors.partner.walking).toBe(true);
    expect(actors.partner.walkMs).toBeLessThanOrEqual(1500);
    await vi.advanceTimersByTimeAsync(1600);
    expect(livePos('partner')).toEqual([262, 614]);
    expect(actors.partner.face).toBe('l');
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
  it('a wake here is told with its time; there it wakes the same villager for what is left of its minute, and both sleep again then', async () => {
    const d = await load();
    d.resetAll();
    d.setSleepClock(() => true);
    for (const id of ['partner', 'third'] as const) d.setAsleep(id, true);
    const told: unknown[] = [];
    const link = d.linkVillagers({ share: (w) => void told.push(w), me: () => 'B', serverNow: () => 70_000, enabled: () => true });
    d.wake('partner'); // a tap here (B's phone) wakes A's villager, A's app closed: the guest's phone hears it
    expect(told).toEqual([{ kind: 'act', act: 'wake', id: 'A', at: 70_000 }]);
    link.detach();
    // the guest's phone (A's villager its `partner`): up for the minute less the 3 s the message took, then asleep
    d.setAsleep('partner', true);
    expect(d.playWake({ id: 'A', at: 70_000 }, 'G', 73_000)).toBe(true);
    expect(d.actors.partner.asleep).toBe(false);
    await vi.advanceTimersByTimeAsync(WAKE_MS - 3_000 - 100);
    expect(d.actors.partner.asleep).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    expect(d.actors.partner.asleep).toBe(true);
    // too late (over already) or awake: nothing
    expect(d.playWake({ id: 'A', at: 0 }, 'G', 73_000 + WAKE_MS)).toBe(false);
    // its person's app open by the minute's end: it stays up
    d.setSleepClock(() => false);
    d.playWake({ id: 'A', at: 80_000 }, 'G', 80_000);
    await vi.advanceTimersByTimeAsync(WAKE_MS + 100);
    expect(d.actors.partner.asleep).toBe(false);
    d.setSleepClock(() => true);
  });

  it('the same home again tells nothing and leaves a walk home on its way (the scene sets it on every layout recompute)', async () => {
    const d = await load();
    d.resetAll();
    d.setHome('mine', 132, 214);
    const told: Walk[] = [];
    const link = d.linkVillagers({ share: (w) => void (w.kind === 'walk' && told.push(w)), me: () => 'A', serverNow: () => 50_000, enabled: () => true });
    link.joined();
    await Promise.resolve();
    told.length = 0;
    d.setHome('mine', 132, 214);
    await Promise.resolve();
    expect(told).toEqual([]);
    // on the last leg home (its x, y already the leg's end): not snapped there
    d.place('mine', 132, 400);
    d.walkTo('mine', [[132, 214]], { ms: 2000, face: 'home' });
    await vi.advanceTimersByTimeAsync(500);
    told.length = 0;
    d.setHome('mine', 132, 214);
    d.setHome('mine', 140, 214);
    await Promise.resolve();
    expect(d.actors.mine.walking).toBe(true);
    expect(told).toEqual([]);
    link.detach();
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
    // (nothing is told before the socket is up and the day in: then my villager as it is)
    d.walkTo('mine', [[132, 300]], { ms: 100 });
    await Promise.resolve();
    expect(told).toEqual([]);
    await vi.advanceTimersByTimeAsync(100);
    link.joined();
    expect(told).toEqual([{ kind: 'walk', to: [132, 300], from: [132, 214], s: 50_000, ms: 100 }]);
    d.place('mine', 132, 214);
    await Promise.resolve();
    told.length = 0;
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

describe('a phone gone, however long: its villager stays where it was, on every phone', () => {
  const A_HOME = [132, 214] as const, B_HOME = [262, 214] as const;
  /** A phone of `me`'s, linked to a fake relay at `clock`. */
  const phone = async (clock: { t: number }, me: 'A' | 'B') => {
    const d = await load();
    d.resetAll();
    d.setSleepClock(() => false);
    const [mh, ph] = me === 'A' ? [A_HOME, B_HOME] : [B_HOME, A_HOME];
    d.setHome('mine', mh[0], mh[1]);
    d.setHome('partner', ph[0], ph[1]);
    const told: Walk[] = [];
    const link = d.linkVillagers({ share: (w) => void (w.kind === 'walk' && told.push(w)), me: () => me, serverNow: () => clock.t, enabled: () => true });
    return { d, told, link };
  };

  it('B’s phone closed for a day: on A’s phone B’s villager stays at its last walk’s end, this island’s again (not the relay’s)', async () => {
    const clock = { t: 2_000_000 };
    const { d, link } = await phone(clock, 'A');
    link.joined();
    link.here('partner', true);
    d.playPartner({ kind: 'walk', from: [262, 214], to: [262, 614], s: clock.t, ms: 2000 }, clock.t);
    clock.t += 2000;
    await vi.advanceTimersByTimeAsync(2000);
    link.here('partner', false);
    expect(d.isRemote('partner')).toBe(false);
    for (const ms of [180_000, 3_600_000, 86_400_000]) {
      clock.t += ms;
      await vi.advanceTimersByTimeAsync(ms);
      expect(d.livePos('partner')).toEqual([262, 614]);
      expect(d.actors.partner.walking).toBe(false);
    }
    link.detach();
  });

  it('the partner arriving mid-walk (a hello after their other tab\'s bye): the relay\'s walk of theirs goes on to its end; this phone\'s own walk of it stops where it is', async () => {
    const clock = { t: 2_000_000 };
    const { d, link } = await phone(clock, 'A');
    link.joined();
    // (B gone here, as its editor tab's bye said: then the walk of B's comes, and then B's hello)
    d.playPartner({ kind: 'walk', from: [262, 214], to: [262, 614], s: clock.t, ms: 2000 }, clock.t);
    clock.t += 500;
    await vi.advanceTimersByTimeAsync(500);
    link.here('partner', true);
    expect(d.actors.partner.walking).toBe(true);
    clock.t += 1600;
    await vi.advanceTimersByTimeAsync(1600);
    expect(d.livePos('partner')).toEqual([262, 614]);
    link.here('partner', false);
    // this phone's own life walking it (an outing): stopped where it is as they arrive
    d.walkTo('partner', [[262, 214]], { ms: 2000 });
    await vi.advanceTimersByTimeAsync(500);
    link.here('partner', true);
    expect(d.actors.partner.walking).toBe(false);
    link.detach();
  });

  it('a phone opening later finds it where its last walk ended, however old (the relay’s last walk), not home', async () => {
    const clock = { t: 2_000_000 + 86_400_000 * 2 };
    const { d, link } = await phone(clock, 'A');
    // (the relay's last walk of B's, two days ago: a phone opening puts it there)
    expect(d.playPartner({ kind: 'walk', from: [262, 214], to: [262, 614], s: 2_000_000, ms: 2000 }, clock.t, false)).toBe('put');
    link.here('partner', false);
    clock.t += 600_000;
    await vi.advanceTimersByTimeAsync(600_000);
    expect(d.livePos('partner')).toEqual([262, 614]);
    link.detach();
  });

  it('my own phone back after a long while: my villager where I left it, told from there (never home)', async () => {
    const clock = { t: 2_000_000 + 86_400_000 };
    const { d, told, link } = await phone(clock, 'B');
    d.place('mine', 262, 614); // (the island opened where it last stood: avatar.ts startAt)
    await Promise.resolve();
    expect(told).toEqual([]);
    link.joined();
    expect(told).toMatchObject([{ kind: 'walk', to: [262, 614], from: [262, 614], s: clock.t, ms: 0 }]);
    clock.t += 600_000;
    await vi.advanceTimersByTimeAsync(600_000);
    expect(d.livePos('mine')).toEqual([262, 614]);
    // and the other phone, playing that, has it there too
    d.place('partner', 262, 614);
    expect(d.playPartner(told[0], clock.t, true)).toBe('put');
    expect(d.livePos('partner')).toEqual([262, 614]);
    link.detach();
  });

  it('every move of mine is kept as where my villager stands (its end), told or not', async () => {
    const d = await load();
    d.resetAll();
    const kept: unknown[] = [];
    const link = d.linkVillagers({ share: () => {}, me: () => 'A', serverNow: () => 0, enabled: () => true, kept: (p) => void kept.push(p) });
    d.walkTo('mine', [[150, 300], [170, 420]], { ms: 500 });
    await Promise.resolve();
    d.place('mine', 99.6, 120.2);
    await Promise.resolve();
    expect(kept).toEqual([[170, 420], [100, 120]]);
    link.detach();
  });
});
