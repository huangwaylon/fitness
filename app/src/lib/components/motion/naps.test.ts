import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The night nap waits while my line is out (Critters' holdNaps; the user: "while fishing don't fall asleep").
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('naps held off while fishing', () => {
  it('a held villager stays awake, then nods off once let go', async () => {
    const d = await import('./director.svelte.ts');
    d.setSleepClock(() => true);
    let fishing = true;
    const release = d.holdNaps((id) => id === 'mine' && fishing);
    d.setAsleep('mine', true);
    d.setAsleep('partner', true);
    expect([d.actors.mine.asleep, d.actors.partner.asleep]).toEqual([false, true]);
    vi.advanceTimersByTime(20_000);
    expect(d.actors.mine.asleep).toBe(false);
    fishing = false;
    vi.advanceTimersByTime(5_000);
    expect(d.actors.mine.asleep).toBe(true);
    release();
    d.setAsleep('mine', false);
    d.setAsleep('partner', false);
  });
});
