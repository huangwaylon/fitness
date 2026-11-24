// The saved areas (areas.svelte.ts): one save at a time, a second tap while the first still checks storage is busy;
// the log's line for a save (counts only).
import { afterEach, describe, expect, it, vi } from 'vitest';
const saved: string[] = [];
vi.mock('./save.ts', () => ({
  saveArea: async (plan: { id: string }) => (saved.push(plan.id), { bytes: 1, done: true, at: 0, tileVersion: null }),
  readManifest: async () => null,
  deleteArea: async () => true
}));
import { areas, saveReport, saveWhy } from './areas.svelte.ts';
import { cleanData } from '#lib/contract/log.ts';

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

describe('the log\'s offline.save', () => {
  it('counts only: the source, whole or not, the tiles stored, empty and missing, kB; never the area or its id', () => {
    const plan = { id: 'trail-secret-peak', source: 'gsi', tiles: ['1/0/0', '1/0/1', '1/1/0', '1/1/1'] } as never;
    const r = saveReport(plan, { stored: 2, empty: ['1/1/1'], bytes: 4096, done: false }, 'net', 1234);
    expect(r).toEqual({ src: 'gsi', ok: false, tiles: 4, stored: 2, empty: 1, failed: 1, kB: 4, ms: 1234, why: 'net' });
    expect(cleanData('offline.save', { ...r, id: 'trail-secret-peak', name: 'x' })).toEqual(r);
    expect(saveReport(plan, null, 'tilejson', 5)).toMatchObject({ ok: false, stored: 0, failed: 4, why: 'tilejson' });
  });
  it('why a save threw: the player\'s stop, the TileJSON, storage full, the network, else other', () => {
    expect(saveWhy(new Error('x'), true)).toBe('abort');
    expect(saveWhy(new Error('tilejson 503'), false)).toBe('tilejson');
    expect(saveWhy(new DOMException('full', 'QuotaExceededError'), false)).toBe('quota');
    expect(saveWhy(new TypeError('Load failed'), false)).toBe('net');
    expect(saveWhy('?', false)).toBe('other');
  });
});
