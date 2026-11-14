// loadGarden: a failed chunk fetch isn't kept for the session; the next call (the island's next mount) tries again.
import { describe, expect, it, vi } from 'vitest';

let fail = true;
vi.mock('./garden.json', () => {
  if (fail) throw new Error('chunk fetch failed');
  return { default: { models: { 'garden/x': { v: '1', pack: 'p', kb: 1 } } } };
});

describe('loadGarden after a failed import', () => {
  it('rejects, then loads on the next call', async () => {
    const { gardenReady, loadGarden } = await import('./garden.ts');
    await expect(loadGarden()).rejects.toThrow();
    expect(gardenReady()).toBe(false);
    fail = false;
    await loadGarden();
    expect(gardenReady()).toBe(true);
  });
});
