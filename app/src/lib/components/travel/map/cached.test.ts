import { describe, expect, it } from 'vitest';
import { engineReady } from './cached.ts';

const store = (shells: Record<string, string[]>) => ({
  keys: async () => Object.keys(shells),
  open: async (k: string) => ({ keys: async () => shells[k].map((u) => new Request(u)) })
}) as unknown as CacheStorage;

describe('the maps offline (engineReady)', () => {
  it('online: always tried', async () => {
    expect(await engineReady(true, undefined)).toBe(true);
  });
  it('offline: only when a shell holds the MapLibre chunk (a map drew before)', async () => {
    const drew = store({ 'island-fonts-v1': [], 'island-shell-a': ['https://x/_app/immutable/chunks/A1.js', 'https://x/_app/immutable/chunks/maplibre.Bx9.js'] });
    const never = store({ 'island-shell-a': ['https://x/_app/immutable/chunks/A1.js', 'https://x/_app/immutable/assets/maplibre.c.css'] });
    expect([await engineReady(false, drew), await engineReady(false, never), await engineReady(false, undefined)]).toEqual([true, false, false]);
  });
});
