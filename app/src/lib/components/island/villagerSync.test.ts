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

describe('a phone gone a while: its villager walks home, the same on every phone', () => {
  const A_HOME = [132, 214] as const, B_HOME = [262, 214] as const;
  const MS = Math.round((400 / 90) * 1000);
  /** B's villager last walked to (262, 614); the way home is straight (in the app: the island's nav, `route`). */
  const setup = async (clock: { t: number }, me: 'A' | 'B' = 'A', last: [number, number] | null = [262, 614]) => {
    const d = await load();
    d.resetAll();
    d.setSleepClock(() => false);
    const [mh, ph] = me === 'A' ? [A_HOME, B_HOME] : [B_HOME, A_HOME];
    d.setHome('mine', mh[0], mh[1]);
    d.setHome('partner', ph[0], ph[1]);
    const told: Walk[] = [], home: string[] = [];
    const link = d.linkVillagers({
      share: (w) => void (w.kind === 'walk' && told.push(w)), me: () => me, serverNow: () => clock.t, enabled: () => true,
      lastAt: () => last, route: (_f, to) => [to], atHome: (id) => void home.push(id)
    });
    return { d, told, home, link };
  };

  it('the walk: from where its last walk ended to home at a stroll, setting off HOME_AFTER_MS after the relay saw it leave', async () => {
    const { homeWay, homeAt, HOME_AFTER_MS } = await load();
    expect(HOME_AFTER_MS).toBe(180_000);
    const w = homeWay([262, 614], [262, 214], 1_000_000, (_f, to) => [[262, 400], to]);
    expect(w).toEqual({ from: [262, 614], pts: [[262, 400], [262, 214]], s: 1_180_000, ms: MS });
    expect(homeAt(w, 1_179_999)).toEqual({ phase: 'wait' });
    expect(homeAt(w, 1_180_000 + w.ms / 2)).toMatchObject({ phase: 'way', rest: [[262, 400], [262, 214]] });
    expect(homeAt(w, 1_180_000 + w.ms)).toEqual({ phase: 'home' });
    // home already: nothing to walk; no way on the nav: straight
    expect(homeWay([263, 215], [262, 214], 0)).toMatchObject({ pts: [], ms: 0 });
    expect(homeWay([262, 614], [262, 214], 0, () => null).pts).toEqual([[262, 214]]);
  });

  it('B gone 3 min: B’s villager stays put (the relay’s: no life of this phone moves it), walks home, then is this island’s again', async () => {
    const clock = { t: 2_000_000 };
    const { d, home, link } = await setup(clock);
    d.place('partner', 262, 614);
    link.joined();
    link.here('partner', true);
    const left = clock.t;
    link.here('partner', false, left);
    expect(d.isRemote('partner')).toBe(true);
    expect(link.homeBound('partner')).toBe(true);
    link.here('partner', false, left); // the same news again (every status) changes nothing
    clock.t += 179_000;
    await vi.advanceTimersByTimeAsync(179_000);
    expect(d.walkTo('partner', [[0, 0]])).toBe(0);
    expect(d.livePos('partner')).toEqual([262, 614]);
    expect(d.actors.partner.walking).toBe(false);
    clock.t += 1000;
    await vi.advanceTimersByTimeAsync(1000);
    expect(d.actors.partner.walking).toBe(true);
    clock.t += MS / 2;
    await vi.advanceTimersByTimeAsync(MS / 2);
    expect(d.livePos('partner')[1]).toBeCloseTo(414, -1);
    clock.t += MS / 2 + 100;
    await vi.advanceTimersByTimeAsync(MS / 2 + 100);
    expect(d.livePos('partner')).toEqual([262, 214]);
    expect(d.actors.partner.face).toBe('home');
    expect(d.isRemote('partner')).toBe(false);
    expect(home).toEqual(['partner']);
    link.detach();
  });

  it('back within the window: no walk', async () => {
    const clock = { t: 2_000_000 };
    const { d, link } = await setup(clock);
    d.place('partner', 262, 614);
    link.here('partner', false, clock.t);
    clock.t += 60_000;
    await vi.advanceTimersByTimeAsync(60_000);
    link.here('partner', true);
    expect(link.homeBound('partner')).toBe(false);
    clock.t += 300_000;
    await vi.advanceTimersByTimeAsync(300_000);
    expect(d.livePos('partner')).toEqual([262, 614]);
    expect(d.isRemote('partner')).toBe(true); // theirs again (they're here)
    link.detach();
  });

  it('a phone opening later finds it where the walk has it by now (home, when it is over); this phone going offline changes nothing', async () => {
    const left = 2_000_000;
    const clock = { t: left + 180_000 + MS / 4 };
    const { d, link } = await setup(clock);
    d.place('partner', 262, 614); // (where this phone had it: its last walk's end)
    link.here('partner', false, left);
    expect(d.livePos('partner')[1]).toBeCloseTo(514, -1);
    expect(d.actors.partner.walking).toBe(true);
    // this phone's socket drops: the rule goes on (nobody knows more)
    link.here('partner', false, undefined);
    link.down();
    expect(link.homeBound('partner')).toBe(true);
    clock.t += MS;
    await vi.advanceTimersByTimeAsync(MS);
    expect(d.livePos('partner')).toEqual([262, 214]);
    link.detach();
    // long after: home, no walk, the island's own again
    const late = await setup({ t: left + 3_600_000 });
    late.d.place('partner', 262, 614);
    late.link.here('partner', false, left);
    expect(late.d.livePos('partner')).toEqual([262, 214]);
    expect(late.d.actors.partner.walking).toBe(false);
    expect(late.d.isRemote('partner')).toBe(false);
    late.link.detach();
  });

  it('at night: up for the walk home, dozing again there', async () => {
    const clock = { t: 2_000_000 };
    const { d, link } = await setup(clock);
    d.setSleepClock(() => true);
    d.place('partner', 262, 614);
    d.setAsleep('partner', true);
    link.here('partner', false, clock.t);
    clock.t += 180_000;
    await vi.advanceTimersByTimeAsync(180_000);
    expect([d.actors.partner.walking, d.actors.partner.asleep]).toEqual([true, false]);
    clock.t += MS + 100;
    await vi.advanceTimersByTimeAsync(MS + 100);
    expect(d.livePos('partner')).toEqual([262, 214]);
    expect(d.actors.partner.asleep).toBe(true);
    link.detach();
    d.setSleepClock(() => true);
  });

  it('the guest’s villager is no part of it (it leaves the island with its app)', async () => {
    const clock = { t: 2_000_000 };
    const { d, link } = await setup(clock);
    link.here('third', false, clock.t);
    expect(link.homeBound('third')).toBe(false);
    expect(d.isRemote('third')).toBe(false);
    link.detach();
  });

  it('my own phone back mid-walk: my villager where the walk home has it, the rest walked and told from there (no jump there)', async () => {
    const left = 2_000_000;
    const clock = { t: left + 180_000 + MS / 2 };
    const { d, told, home, link } = await setup(clock, 'B');
    d.place('mine', 262, 614); // where this phone had it (the day's stay)
    await Promise.resolve();
    expect(told).toEqual([]);
    link.joined(left);
    await Promise.resolve();
    expect(told).toHaveLength(1);
    expect(told[0]).toMatchObject({ to: [262, 214], f: 'home', s: clock.t });
    expect(told[0].from![1]).toBeCloseTo(414, -1);
    expect(told[0].ms).toBeCloseTo(MS / 2, -2);
    // A's phone, playing the same walk home, has B's villager at the same point: it walks on
    d.place('partner', told[0].from![0], told[0].from![1]);
    expect(d.playPartner({ ...told[0] }, clock.t, true, 'partner')).toBe('walk');
    clock.t += MS;
    await vi.advanceTimersByTimeAsync(MS);
    expect(d.livePos('mine')).toEqual([262, 214]);
    expect(home).toEqual(['mine']);
    link.detach();
    // back within the window: where it was
    const quick = await setup({ t: left + 60_000 }, 'B');
    quick.d.place('mine', 262, 614);
    await Promise.resolve();
    quick.link.joined(left);
    expect(quick.told).toMatchObject([{ to: [262, 614], ms: 0 }]);
    quick.link.detach();
  });
});
