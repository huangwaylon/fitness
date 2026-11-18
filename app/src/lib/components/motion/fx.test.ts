import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FX_MS } from './reactions.ts';

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('document', { hidden: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("an actor's fx (the director's, no DOM to remove them)", () => {
  it('each goes after its FX_MS, a zzz stays, cancel() leaves them to run out', async () => {
    const { actors, addFx, cancel } = await import('./director.svelte.ts');
    actors.mine.fx = [];
    addFx('mine', 'puff');
    addFx('mine', 'hearts');
    addFx('mine', 'zzz');
    cancel('mine');
    expect(actors.mine.fx.map((f) => f.kind)).toEqual(['puff', 'hearts', 'zzz']);
    vi.advanceTimersByTime(FX_MS.puff + 60);
    expect(actors.mine.fx.map((f) => f.kind)).toEqual(['hearts', 'zzz']);
    vi.advanceTimersByTime(FX_MS.hearts);
    expect(actors.mine.fx.map((f) => f.kind)).toEqual(['zzz']);
    vi.advanceTimersByTime(60_000);
    expect(actors.mine.fx.map((f) => f.kind)).toEqual(['zzz']);
    actors.mine.fx = [];
  });

  it('keeps ≤ 6 (the oldest goes), each with its own number', async () => {
    const { actors, addFx } = await import('./director.svelte.ts');
    actors.partner.fx = [];
    for (let i = 0; i < 8; i++) addFx('partner', 'sparkles');
    expect(actors.partner.fx).toHaveLength(6);
    expect(new Set(actors.partner.fx.map((f) => f.n)).size).toBe(6);
    vi.advanceTimersByTime(FX_MS.sparkles + 60);
    expect(actors.partner.fx).toEqual([]);
  });
});
