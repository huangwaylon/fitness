// りょこう's km / mi (units.ts): this phone's choice (DEVICE travelUnits, km by default), fmtKm in it, and a read in an
// effect follows a change.
import { describe, expect, it, vi } from 'vitest';

const kv = vi.hoisted(() => new Map<string, string>([['island.travel.units', 'mi']]));
// (vitest runs Svelte's server build, where nothing re-runs: the subscriber is stood in for, as an effect would hold it)
const sub = vi.hoisted(() => ({ reads: 0, updates: 0, live: false }));
vi.mock('svelte/reactivity', () => ({
  createSubscriber: (start: (update: () => void) => () => void) => {
    let stop: (() => void) | null = null;
    return () => {
      sub.reads++;
      if (sub.live && !stop) stop = start(() => sub.updates++);
      if (!sub.live && stop) (stop(), (stop = null));
    };
  }
}));
vi.mock('#lib/sync/storage.ts', async (orig) => {
  const real = await orig<typeof import('#lib/sync/storage.ts')>();
  const store = { getItem: (k: string) => kv.get(k) ?? null, setItem: (k: string, v: string) => void kv.set(k, v), removeItem: (k: string) => void kv.delete(k) };
  return { ...real, localKV: () => store };
});
const { fmtKm, setUnits, units } = await import('./units.ts');

describe('units', () => {
  it('starts with the phone’s kept choice, formats in it, keeps a change', () => {
    expect(units.current).toBe('mi');
    expect(fmtKm(9.8)).toBe('6.1 mi');
    expect(fmtKm(1609.344)).toBe('1,000 mi');
    setUnits('km');
    expect(kv.get('island.travel.units')).toBe('km');
    expect(fmtKm(9.8)).toBe('9.8 km');
    expect(fmtKm(10)).toBe('10 km');
    expect(fmtKm(0.25)).toBe('0.3 km');
    expect(fmtKm(1234.5)).toBe('1,235 km');
  });

  it('a template or an effect reading it hears a change (and not the same again)', () => {
    setUnits('km');
    sub.live = true;
    expect(fmtKm(5)).toBe('5 km');
    setUnits('mi');
    setUnits('mi');
    expect(sub.updates).toBe(1);
    expect(fmtKm(5)).toBe('3.1 mi');
    sub.live = false;
    void units.current;
    setUnits('km');
    expect(sub.updates).toBe(1);
  });
});

describe('units’ default', () => {
  it('km on a phone that never chose', async () => {
    kv.clear();
    vi.resetModules();
    const m = await import('./units.ts');
    expect(m.units.current).toBe('km');
  });
});
