import { afterEach, describe, expect, it, vi } from 'vitest';
import { hook, hookFlag } from './devHooks.ts';

/** The page at `search`, its storage holding `stored`. */
function page(search: string, stored: Record<string, string> = {}) {
  vi.stubGlobal('location', { search });
  vi.stubGlobal('localStorage', { getItem: (k: string) => stored[k] ?? null });
}
const OFF = { 'e2e.ambient': 'off' };

describe("the e2e's ambient life off (localStorage['e2e.ambient'])", () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads as none for each of its hooks the URL leaves unset, the day visitor as events', () => {
    page('?demo', OFF);
    expect([hook('critter'), hook('visitor'), hook('balloon'), hook('idle'), hook('stars')]).toEqual(['none', 'events', 'none', 'none', 'none']);
    expect(hook('weather')).toBeNull();
  });

  it("gives way to the URL's own param", () => {
    page('?demo&critter=fish&balloon', OFF);
    expect(hook('critter')).toBe('fish');
    expect(hookFlag('balloon') && hook('balloon')).toBe('');
    expect(hook('visitor')).toBe('events');
  });

  it('is nothing with the hooks off (no ?demo in a production build) or without the key', () => {
    page('', OFF);
    expect(hook('critter')).toBe(import.meta.env.DEV ? 'none' : null);
    page('?demo');
    expect(hook('critter')).toBeNull();
    expect(hook('idle')).toBeNull();
  });
});
