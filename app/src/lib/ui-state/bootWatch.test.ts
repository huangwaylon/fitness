import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { BOOT_WATCH_JS, BOOT_WATCH_MS, bootWatch } from './bootWatch.ts';

class Mem {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}
/** A window as the watchdog sees it: its timers faked, its reloads recorded. */
function win(session = new Mem(), shell: string | null = 'net') {
  const t = new EventTarget();
  const went: string[] = [];
  const performance = { getEntriesByType: () => [{ serverTiming: shell ? [{ name: 'shell', description: shell }] : [] }] };
  const w = Object.assign(t, { sessionStorage: session, performance, location: { href: 'https://x/?demo', replace: (u: string) => went.push(u) }, setTimeout, clearTimeout }) as unknown as Window & { __islandStarted?: () => void; __islandUp?: boolean };
  return { w, went, session };
}
const failed = () => Object.assign(new Event('unhandledrejection'), { reason: new TypeError('Importing a module script failed.') });

describe('the boot watchdog (bootWatch.ts, inline in index.html)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('a page that never starts: reloaded once onto the cached shell (?shell=cache) after BOOT_WATCH_MS', () => {
    const { w, went } = win();
    bootWatch(w, BOOT_WATCH_MS);
    vi.advanceTimersByTime(BOOT_WATCH_MS);
    expect(went).toEqual(['https://x/?demo&shell=cache']);
  });
  it('a cached shell (or no worker: a first visit) is left alone, its slow start a busy phone\'s, not a missing chunk', () => {
    for (const shell of ['cache', 'same', 'skip', null]) {
      const { w, went } = win(new Mem(), shell);
      bootWatch(w, BOOT_WATCH_MS);
      w.dispatchEvent(failed());
      vi.advanceTimersByTime(BOOT_WATCH_MS);
      expect(went).toEqual([]);
      w.__islandStarted!();
    }
  });
  it('a module that fails to load (the new build\'s entry, the network gone): at once; a rejection of another kind: not', () => {
    const { w, went } = win();
    bootWatch(w, BOOT_WATCH_MS);
    w.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: new Error('nope') }));
    expect(went).toEqual([]);
    w.dispatchEvent(failed());
    expect(went).toHaveLength(1);
  });
  it('once a session: the cached shell failing as well stays put, no loop', () => {
    const session = new Mem();
    const a = win(session);
    bootWatch(a.w, BOOT_WATCH_MS);
    a.w.dispatchEvent(failed());
    const b = win(session);
    bootWatch(b.w, BOOT_WATCH_MS);
    b.w.dispatchEvent(failed());
    vi.advanceTimersByTime(BOOT_WATCH_MS);
    expect([a.went.length, b.went.length]).toEqual([1, 0]);
  });
  it('the app started (+layout.ts): it stands down and clears its guard for the next launch', () => {
    const session = new Mem();
    session.setItem('island.bootWatch', '1');
    const { w, went } = win(session);
    bootWatch(w, BOOT_WATCH_MS);
    w.__islandStarted!();
    w.dispatchEvent(failed());
    vi.advanceTimersByTime(BOOT_WATCH_MS);
    expect(went).toEqual([]);
    expect(session.getItem('island.bootWatch')).toBeNull();
  });
  it('its inline source is the function, called with the window (its CSP hash is this text\'s: scripts/headers.ts)', () => {
    expect(BOOT_WATCH_JS).toMatch(/^\(function bootWatch\(w/);
    expect(BOOT_WATCH_JS.endsWith(`)(window,${BOOT_WATCH_MS})`)).toBe(true);
    expect(BOOT_WATCH_JS).not.toMatch(/\s{2}/);
  });
});
