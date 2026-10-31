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
  it('one transition per segment: facing, depth at the start toward the camera and at the end away from it', async () => {
    const { actors, resetAll, setHome, walkTo } = await import('./director.svelte.ts');
    resetAll();
    setHome('mine', 100, 200);
    const a = actors.mine;
    const ms = walkTo('mine', [[140, 200], [140, 160], [140, 240]], { ms: 1200 });
    expect(ms).toBe(1200);
    // segment 1 (40u of 160): right, level
    expect([a.x, a.y, a.face, a.walking, a.walkMs]).toEqual([140, 200, 'r', true, 300]);
    expect(a.zy).toBe(200);
    await vi.advanceTimersByTimeAsync(300);
    // segment 2: away from the camera: its depth only changes at its end
    expect([a.x, a.y]).toEqual([140, 160]);
    expect(a.zy).toBe(200);
    await vi.advanceTimersByTimeAsync(300);
    // segment 3: toward the camera: depth at once
    expect(a.y).toBe(240);
    expect(a.zy).toBe(240);
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
    expect([actors.mine.x, actors.mine.y, actors.mine.walkMs, actors.mine.zy]).toEqual([5, 6, 0, 6]);
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
