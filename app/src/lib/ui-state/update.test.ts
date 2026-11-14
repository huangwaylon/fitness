import { describe, expect, it, vi } from 'vitest';
import { COMPAT } from '#lib/contract/compat.ts';
import { claimed, doneFor, incompatible, markDone, takeUpdate, watchClaims, type UpdateState } from './update.ts';

const s = (o: Partial<UpdateState>): UpdateState => ({ updated: true, ready: true, incompatible: false, busy: false, hidden: false, ...o });

describe('when a deployed build is taken (update.ts)', () => {
  it('never in front for an ordinary deploy: as the app is hidden, its worker in, nothing open', () => {
    expect(takeUpdate(s({}))).toBe(false);
    expect(takeUpdate(s({ hidden: true }))).toBe(true);
    expect(takeUpdate(s({ hidden: true, busy: true })), 'a sheet open: kept for the next hide or launch').toBe(false);
    expect(takeUpdate(s({ hidden: true, ready: false })), 'before its worker: the old shell again').toBe(false);
    expect(takeUpdate(s({ hidden: true, updated: false }))).toBe(false);
  });
  it('a build this one can\'t work with: in front too, but only once nothing is open', () => {
    expect(takeUpdate(s({ incompatible: true }))).toBe(true);
    expect(takeUpdate(s({ incompatible: true, busy: true }))).toBe(false);
    expect(takeUpdate(s({ incompatible: true, ready: false }))).toBe(false);
  });
  it('incompatible: version.json\'s compat past this build\'s; none or not a number is compatible', () => {
    expect(incompatible(COMPAT + 1)).toBe(true);
    expect(incompatible(COMPAT)).toBe(false);
    expect(incompatible(COMPAT - 1)).toBe(false);
    expect(incompatible(undefined)).toBe(false);
    expect(incompatible('9')).toBe(false);
  });
});

describe('the reloads\' guards and the claims (update.ts)', () => {
  it('one reload a deployed version a session (doneFor / markDone)', () => {
    const m = new Map<string, string>();
    vi.stubGlobal('sessionStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) });
    try {
      expect(doneFor('island.updateFor', 'v2')).toBe(false);
      markDone('island.updateFor', 'v2');
      expect(doneFor('island.updateFor', 'v2')).toBe(true);
      expect(doneFor('island.updateFor', 'v3')).toBe(false);
      expect(doneFor('island.staleFor', 'v2')).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('a newer worker\'s claim asks Kit at once, from the start; one before Kit can is counted for the layout\'s mount', () => {
    const sw = new EventTarget() as unknown as ServiceWorkerContainer;
    const check = vi.fn(() => Promise.resolve(true));
    watchClaims(check, sw);
    const before = claimed();
    sw.dispatchEvent(new Event('controllerchange'));
    expect(check).toHaveBeenCalledTimes(1);
    const early = vi.fn(() => {
      throw new Error('Kit not started');
    });
    watchClaims(early, sw);
    expect(() => sw.dispatchEvent(new Event('controllerchange'))).not.toThrow();
    expect(claimed()).toBe(before + 3);
  });
});
