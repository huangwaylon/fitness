import { describe, expect, it } from 'vitest';
import { linkKey, takeLinkKey } from './linkKey.ts';

const K = 'ab'.repeat(32);
const tab = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
};

describe('the LINE link’s key', () => {
  it('is read from the hash and kept for the tab (a reload has no hash)', () => {
    const s = tab();
    expect(takeLinkKey(`#${K.toUpperCase()}`, s)).toBe(K);
    expect(linkKey()).toBe(K);
    expect(takeLinkKey('', s)).toBe(K);
  });

  it('is none for a hash that is not a key, and none kept', () => {
    expect(takeLinkKey('#nope', tab())).toBeNull();
    expect(linkKey()).toBeNull();
    const s = tab();
    s.setItem('island.gymLink', 'not-hex');
    expect(takeLinkKey('', s)).toBeNull();
    expect(takeLinkKey(`#${K}`, null)).toBe(K); // no storage: this load only
  });
});
