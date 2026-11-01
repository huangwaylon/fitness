import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('document', { hidden: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('walkTo (the director)', () => {
  it('segment by segment: facing, and the feet move along each segment by the clock (livePos)', async () => {
    const { actors, inMotion, livePos, resetAll, setHome, walkTo } = await import('./director.svelte.ts');
    resetAll();
    setHome('mine', 100, 200);
    const a = actors.mine;
    const ms = walkTo('mine', [[140, 200], [140, 160], [140, 240]], { ms: 1200 });
    expect(ms).toBe(1200);
    // segment 1 (40u of 160): right, level
    expect([a.x, a.y, a.face, a.walking, a.walkMs]).toEqual([140, 200, 'r', true, 300]);
    expect(livePos('mine', a.t0)).toEqual([100, 200]);
    expect(livePos('mine', a.t0 + 150)).toEqual([120, 200]);
    expect(inMotion('mine', a.t0 + 150)).toBe(true);
    expect(inMotion('mine', a.t0 + 301)).toBe(false);
    await vi.advanceTimersByTimeAsync(300);
    // segment 2 starts where segment 1 ended
    expect([a.x, a.y, a.from]).toEqual([140, 160, [140, 200]]);
    expect(livePos('mine', a.t0 + 150)).toEqual([140, 180]);
    await vi.advanceTimersByTimeAsync(300);
    expect(a.y).toBe(240);
    await vi.advanceTimersByTimeAsync(600);
    expect(a.walking).toBe(false);
    resetAll();
    expect([a.x, a.y]).toEqual([100, 200]); // home again
  });

  it('a new walk re-targets: the old one’s timers are dropped and it heads off from where it is', async () => {
    const { actors, pendingTimers, resetAll, setHome, walkTo } = await import('./director.svelte.ts');
    resetAll();
    setHome('mine', 0, 0);
    walkTo('mine', [[100, 0], [100, 100]], { ms: 900 });
    await vi.advanceTimersByTimeAsync(200);
    walkTo('mine', [[-50, 0]], { ms: 300, from: [22, 0] });
    expect(actors.mine.face).toBe('l');
    await vi.advanceTimersByTimeAsync(2000);
    expect([actors.mine.x, actors.mine.y, actors.mine.walking]).toEqual([-50, 0, false]); // never went on to (100, 100)
    expect(pendingTimers('mine')).toBe(0);
  });

  it('puffs and footsteps: one every other step, never closer than 320 ms', async () => {
    const { onStep, resetAll, setHome, walkTo, STEP_GAP_MS } = await import('./director.svelte.ts');
    resetAll();
    setHome('partner', 0, 0);
    const steps: number[] = [];
    const off = onStep(() => steps.push(Date.now()));
    walkTo('partner', [[300, 0]], { speed: 240 });
    await vi.advanceTimersByTimeAsync(1300);
    off();
    expect(steps.length).toBeGreaterThan(2);
    for (let i = 1; i < steps.length; i++) expect(steps[i] - steps[i - 1]).toBeGreaterThanOrEqual(STEP_GAP_MS);
  });

  it('place() snaps (no transition) and cancel() leaves a villager where it is', async () => {
    const { actors, cancel, place, resetAll, setHome, walkTo } = await import('./director.svelte.ts');
    resetAll();
    setHome('mine', 0, 0);
    walkTo('mine', [[90, 0]], { ms: 500 });
    cancel('mine');
    expect([actors.mine.x, actors.mine.walking]).toEqual([90, false]);
    place('mine', 5, 6);
    expect([actors.mine.x, actors.mine.y, actors.mine.walkMs, actors.mine.from]).toEqual([5, 6, 0, [5, 6]]);
  });

  it('the hold-up: the item over the head, then gone; a tool goes away after its time', async () => {
    const { actors, holdUp, resetAll, useTool } = await import('./director.svelte.ts');
    resetAll();
    useTool('mine', 'net', 450);
    expect(actors.mine.tool).toBe('net');
    holdUp('mine', 'critters/wasp', 1000);
    expect(actors.mine.tool).toBeNull(); // both hands up
    expect(actors.mine.holding?.art).toBe('critters/wasp');
    expect(actors.mine.motion).toBe('holdup');
    await vi.advanceTimersByTimeAsync(1001);
    expect(actors.mine.holding).toBeNull();
    actors.mine.asleep = true;
    holdUp('mine', 'critters/wasp');
    expect(actors.mine.holding).toBeNull(); // asleep: nothing
    resetAll();
  });
});
