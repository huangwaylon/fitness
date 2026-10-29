import { describe, expect, it } from 'vitest';
import { staleCaches } from './caches.ts';

describe('service worker cache generations', () => {
  const keep = ['island-fonts-v1', 'island-villagers-v1'];

  it('keeps the current and the newest previous shell, and the runtime caches', () => {
    const keys = ['island-fonts-v1', 'island-shell-1', 'island-villagers-v1', 'island-shell-2', 'island-shell-3', 'island-shell-4'];
    expect(staleCaches(keys, 'island-shell-4', keep)).toEqual(['island-shell-1', 'island-shell-2']);
  });

  it('first install: nothing to delete', () => {
    expect(staleCaches(['island-shell-1'], 'island-shell-1', keep)).toEqual([]);
  });

  it('drops caches from older schemes', () => {
    expect(staleCaches(['island-fonts-v0', 'island-shell-1', 'island-shell-2'], 'island-shell-2', keep)).toEqual(['island-fonts-v0']);
  });
});
