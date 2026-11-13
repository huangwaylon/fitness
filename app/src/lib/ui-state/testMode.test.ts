import { afterEach, describe, expect, it, vi } from 'vitest';
import { shaderChecks, testHooks, testModeAllowed, testModeAsked } from './testMode.ts';
import { hooksOn } from './preview.ts';
import { opensIsland } from './boot.ts';

/** The page at `search`, its storage holding `stored`. */
function page(search: string, stored: Record<string, string> = {}) {
  vi.stubGlobal('location', { search, hash: '' });
  vi.stubGlobal('localStorage', { getItem: (k: string) => stored[k] ?? null });
  vi.stubGlobal('sessionStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} });
}
const TEST = { 'e2e.testMode': '1' };

describe('test mode (`?demo`) in a production build', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("is a test's browser's only: a visitor's ?demo is the normal app", () => {
    vi.stubEnv('DEV', false);
    page('?demo');
    expect(testModeAllowed()).toBe(false);
    const q = new URLSearchParams('?demo');
    expect([testModeAsked(q), hooksOn(q), testHooks(), shaderChecks(), opensIsland()]).toEqual([false, false, false, false, false]);
  });

  it('switches on with e2e.testMode and ?demo both', () => {
    vi.stubEnv('DEV', false);
    page('?demo', TEST);
    const q = new URLSearchParams('?demo');
    expect([testModeAsked(q), hooksOn(q), testHooks(), shaderChecks(), opensIsland()]).toEqual([true, true, true, true, true]);
    page('', TEST);
    expect(testModeAsked(new URLSearchParams(''))).toBe(false);
  });

  it('is always allowed in the dev server', () => {
    vi.stubEnv('DEV', true);
    page('?demo');
    expect(testModeAsked(new URLSearchParams('?demo'))).toBe(true);
  });
});
