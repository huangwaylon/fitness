import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Node has no DOM: stub just what the scheduler touches.
const stub = () => {
  vi.useFakeTimers();
  vi.stubGlobal('document', { hidden: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  vi.stubGlobal('addEventListener', vi.fn());
  vi.stubGlobal('removeEventListener', vi.fn());
};
const unstub = () => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
};
// (the modules loaded once in the hook, under the tests' stubs: their ~0.5–1.5 s of transform isn't charged to the first test)
beforeAll(async () => {
  stub();
  await import('./idleLife.svelte.ts');
  await import('./director.svelte.ts');
});
afterAll(unstub);
beforeEach(stub);
afterEach(unstub);

const WORLD = {
  villagers: { A: { at: [132, 214], home: [132, 214], free: true }, B: { at: [262, 214], home: [262, 214], free: true } },
  pois: [],
  scores: { A: 50, B: 50 }
} as const;
const base = { paused: () => false, asleep: () => false, treeShake: () => {}, me: () => 'A' as const, world: () => structuredClone(WORLD) as never };
/** Every slot, mine (A) leads a chat with the partner. */
const chatCtx = () => ({
  ...base,
  beats: () => ({ A: { kind: 'pair', action: 'chat', with: 'B', lead: true, at: 0 }, B: { kind: 'pair', action: 'chat', with: 'A', lead: false, at: 0 } }) as never
});

describe('idle life cleanup', () => {
  it('stop() cancels the chat follow-ups, so nobody is left facing inward', async () => {
    const { startIdleLife } = await import('./idleLife.svelte.ts');
    const { actors, pendingTimers, resetAll } = await import('./director.svelte.ts');
    resetAll();
    vi.setSystemTime(new Date('2026-10-29T12:00:00'));
    // the slot's beat (ambient.ts): mine leads a chat
    const stop = startIdleLife(chatCtx());
    await vi.advanceTimersByTimeAsync(10_600);
    expect(actors.mine.face).toBe('in'); // chat started: facing each other
    await vi.advanceTimersByTimeAsync(400);
    stop();
    // the partner's laugh (at +900 ms) and both "face home" beats (at +3 s) were idle-owned: gone
    await vi.advanceTimersByTimeAsync(60_000);
    expect(actors.partner.face).toBe('home'); // never turned
    expect(actors.mine.face).toBe('in'); // stop() alone doesn't move anyone; resetAll() (scene unmount) does
    expect(pendingTimers('mine') + pendingTimers('partner')).toBe(0);
    resetAll();
    expect(pendingTimers('mine') + pendingTimers('partner') + pendingTimers('host')).toBe(0);
  });

  it('stop() before the first tick schedules nothing', async () => {
    const { startIdleLife } = await import('./idleLife.svelte.ts');
    const { actors, resetAll } = await import('./director.svelte.ts');
    resetAll();
    const stop = startIdleLife(base);
    stop();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(actors.mine.motionN + actors.partner.motionN + actors.mine.emoteN + actors.partner.emoteN).toBe(0);
  });

  it('a reaction that preempts an actor also drops the idle-owned cancellers', async () => {
    const { startIdleLife } = await import('./idleLife.svelte.ts');
    const { actors, cancel, resetAll } = await import('./director.svelte.ts');
    resetAll();
    vi.setSystemTime(new Date('2026-10-29T12:00:00'));
    // the slot's beat (ambient.ts): mine leads a chat
    const stop = startIdleLife(chatCtx());
    await vi.advanceTimersByTimeAsync(10_600);
    expect(actors.mine.face).toBe('in');
    expect(stop.owned()).toBeGreaterThan(0);
    cancel('mine');
    cancel('partner');
    expect(stop.owned()).toBe(0);
    stop();
    resetAll();
  });
});

describe('event queue', () => {
  it('plays events one at a time; touch feedback never waits', async () => {
    const { react, queuedEvents, actors, resetAll } = await import('./director.svelte.ts');
    resetAll();
    react('R2'); // cheer: 2200 ms
    react('R3'); // partner data arrives meanwhile: queued
    react('R3'); // duplicate: dropped
    expect(queuedEvents()).toEqual(['R3']);
    const n = actors.mine.motionN;
    react('R9'); // tapping my villager plays now
    expect(actors.mine.motionN).toBe(n + 1);
    await vi.advanceTimersByTimeAsync(2_700);
    expect(queuedEvents()).toEqual([]);
    expect(actors.partner.emote).toBe('surprise'); // R3 started after R2 + the gap
    resetAll();
    expect(queuedEvents()).toEqual([]);
  });
});

describe('idle life while the page is hidden', () => {
  it('stops its timer on hide (no polling) and wakes on show', async () => {
    const { startIdleLife } = await import('./idleLife.svelte.ts');
    const { resetAll } = await import('./director.svelte.ts');
    resetAll();
    const doc = document as unknown as { hidden: boolean; addEventListener: ReturnType<typeof vi.fn> };
    let ticks = 0;
    const stop = startIdleLife({ ...base, paused: () => (ticks++, false) });
    const onVis = doc.addEventListener.mock.calls.find((c) => c[0] === 'visibilitychange')![1] as () => void;
    doc.hidden = true;
    onVis();
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(600_000);
    expect(ticks).toBe(0);
    doc.hidden = false;
    onVis();
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    await vi.advanceTimersByTimeAsync(11_000);
    expect(ticks).toBeGreaterThan(0);
    stop();
  });
});

describe('the visitor’s beat', () => {
  it('runs on every slot with the slot’s PRNG (awake or asleep: visitors keep their own hours), never under a sheet', async () => {
    const { startIdleLife } = await import('./idleLife.svelte.ts');
    const { lastEvent, resetAll } = await import('./director.svelte.ts');
    resetAll();
    lastEvent.at = 0;
    let beats = 0, covered = false, asleep = false;
    vi.setSystemTime(new Date('2026-10-29T12:00:03Z'));
    const draws: number[] = [];
    // a slot every 10 s, played 0.5 s past its start: 7.5 s from now, then every 10 s
    const stop = startIdleLife({ ...base, paused: () => covered, asleep: () => asleep, visitor: (r) => (beats++, draws.push(r())) });
    await vi.advanceTimersByTimeAsync(7_400);
    expect(beats).toBe(0);
    await vi.advanceTimersByTimeAsync(200);
    expect(beats).toBe(1);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(beats).toBe(2);
    asleep = true;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(beats).toBe(3);
    expect(new Set(draws).size).toBe(3); // each slot its own PRNG
    covered = true;
    await vi.advanceTimersByTimeAsync(120_000);
    expect(beats).toBe(3);
    stop();
  });
  it('the director drives a visitor like any actor: a motion, an emote, a walk, all dropped by cancel', async () => {
    const { actors, cancel, place, resetAll, setEmote, setMotion, walkTo, pendingTimers } = await import('./director.svelte.ts');
    resetAll();
    place('visitor', 195, 173);
    setMotion('visitor', 'twirl');
    setEmote('visitor', 'glee');
    expect(actors.visitor.motion).toBe('twirl');
    walkTo('visitor', [[225, 180]], { speed: 48 });
    expect(actors.visitor.walking).toBe(true);
    expect([actors.visitor.x, actors.visitor.y]).toEqual([225, 180]);
    cancel('visitor');
    expect(actors.visitor.walking).toBe(false);
    expect(pendingTimers('visitor')).toBe(0);
    resetAll();
  });
});

describe('idle life on ambient life’s slots', () => {
  it('plays the slot’s beats for whoever is mine, small moves at their `at`, outings through the given stops', async () => {
    const { startIdleLife } = await import('./idleLife.svelte.ts');
    const { actors, lastEvent, resetAll } = await import('./director.svelte.ts');
    resetAll();
    lastEvent.at = 0;
    vi.setSystemTime(new Date('2026-10-29T12:00:00Z'));
    const outings: unknown[] = [];
    let slots: number[] = [];
    const stop = startIdleLife({
      ...base,
      me: () => 'B', // A's villager is the partner on this phone
      outing: (id, stops) => (outings.push([id, stops]), true),
      beats: (_w, _d, slot) => ((slots = [...slots, slot]), slot % 2 ? { A: { kind: 'outing', stops: [{ node: 'rock', linger: 3000 }] } } : { B: { kind: 'idle', action: 'hop', at: 2000 } })
    });
    await vi.advanceTimersByTimeAsync(600); // the slot starting now, played 0.5 s in
    const n = actors.mine.motionN;
    await vi.advanceTimersByTimeAsync(2_000);
    expect(actors.mine.motionN).toBe(n + 1); // B (mine) hops 2 s into its slot
    await vi.advanceTimersByTimeAsync(10_000);
    expect(outings).toEqual([['partner', [{ node: 'rock', linger: 3000 }]]]);
    expect(slots[1]).toBe(slots[0] + 1);
    stop();
    resetAll();
  });

  it('after 3 min without input plays one slot in three, and stops after 10 min', async () => {
    const { startIdleLife } = await import('./idleLife.svelte.ts');
    const { lastEvent, resetAll } = await import('./director.svelte.ts');
    resetAll();
    lastEvent.at = 0;
    vi.setSystemTime(new Date('2026-10-29T12:00:00Z'));
    const played: number[] = [];
    const stop = startIdleLife({ ...base, beats: (_w, _d, slot) => (played.push(slot), {}) });
    await vi.advanceTimersByTimeAsync(175_000);
    const fast = played.length;
    expect(fast).toBe(18);
    await vi.advanceTimersByTimeAsync(300_000);
    expect(played.slice(fast).every((s) => s % 3 === 0)).toBe(true);
    expect(played.length - fast).toBe(10);
    await vi.advanceTimersByTimeAsync(600_000);
    const at10 = played.length;
    await vi.advanceTimersByTimeAsync(120_000);
    expect(played.length).toBe(at10);
    stop();
  });
  it('still (?idle=none, the e2e’s ambient life off): no beats, no visitor’s turn, no しずえ; asleep, the villagers still doze', async () => {
    const { startIdleLife } = await import('./idleLife.svelte.ts');
    const { actors, lastEvent, resetAll } = await import('./director.svelte.ts');
    resetAll();
    lastEvent.at = 0;
    vi.setSystemTime(new Date('2026-10-29T12:00:00Z'));
    let played = 0, visits = 0, asleep = false;
    const stop = startIdleLife({ ...base, still: true, asleep: () => asleep, beats: () => (played++, {}), visitor: () => visits++ });
    await vi.advanceTimersByTimeAsync(60_000);
    expect([played, visits]).toEqual([0, 0]);
    asleep = actors.mine.asleep = true;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(actors.mine.fx.some((f) => f.kind === 'zzz')).toBe(true);
    expect([played, visits]).toEqual([0, 0]);
    stop();
    resetAll();
  });
  it('the guest’s villager pairs up as a member’s: its chat with mine turns them to each other, a nod and a laugh', async () => {
    const { startIdleLife } = await import('./idleLife.svelte.ts');
    const { actors, lastEvent, resetAll } = await import('./director.svelte.ts');
    resetAll();
    lastEvent.at = 0;
    vi.setSystemTime(new Date('2026-10-29T12:00:00Z'));
    actors.mine.x = 100;
    actors.third.x = 200;
    const n = { mine: actors.mine.motionN, third: actors.third.motionN };
    const stop = startIdleLife({
      ...base,
      // (a member's phone: the guest's villager is the third)
      beats: () => ({ G: { kind: 'pair', action: 'chat', with: 'A', lead: true, at: 0 }, A: { kind: 'pair', action: 'chat', with: 'G', lead: false, at: 0 } }) as never
    });
    await vi.advanceTimersByTimeAsync(600);
    expect(actors.third.motion).toBe('nod');
    expect(actors.third.face).toBe('l'); // (mine stands to its left)
    await vi.advanceTimersByTimeAsync(1_000);
    expect(actors.mine.motion).toBe('laugh');
    expect(actors.mine.face).toBe('r');
    expect([actors.mine.motionN - n.mine, actors.third.motionN - n.third]).toEqual([1, 1]);
    stop();
    resetAll();
  });
});
