// The saved areas (areas.svelte.ts): one save at a time, a second tap while the first still checks storage is busy.
import { afterEach, describe, expect, it, vi } from 'vitest';
const saved: string[] = [];
vi.mock('./save.ts', () => ({
  saveArea: async (plan: { id: string }) => (saved.push(plan.id), { bytes: 1, done: true, at: 0, tileVersion: null }),
  readManifest: async () => null,
  deleteArea: async () => true
}));
import { areas } from './areas.svelte.ts';

afterEach(() => vi.unstubAllGlobals());

describe('areas.save', () => {
  it('two quick taps: one save, the second busy', async () => {
    let free!: () => void;
    const slow = new Promise<void>((r) => (free = r));
    vi.stubGlobal('navigator', { onLine: true, storage: { estimate: () => slow.then(() => ({ quota: 1e12, usage: 0 })), persist: async () => true } });
    vi.stubGlobal('caches', {});
    const plan = { id: 'a1', source: 'ofm', tiles: [], bytes: 1000 } as never;
    const first = areas.save(plan, { ja: 'x', en: 'x' } as never);
    const second = await areas.save(plan, { ja: 'x', en: 'x' } as never);
    free();
    expect([second, await first, saved]).toEqual(['busy', null, ['a1']]);
  });
});
