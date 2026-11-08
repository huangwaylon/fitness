// The island's day on its one clock (ambientClock.ts islandDay): the relay's, never a skewed device's.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import type { Live, LiveStatus } from '#lib/sync/live.ts';
import { world } from '#lib/store/world.svelte.ts';
import { dayKey } from '#lib/time/clock.ts';
import { islandDay } from './ambientClock.ts';

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}
const T0 = Date.UTC(2026, 10, 1, 14, 59, 30); // 2026-11-01 23:59:30 Tokyo

beforeEach(() => {
  vi.useFakeTimers();
  configureStorage({ local: new Mem() });
  world.reset();
});
afterEach(() => vi.useRealTimers());

describe('islandDay', () => {
  it('is the relay’s Tokyo day: a device a minute fast is past midnight, the island not yet', () => {
    vi.setSystemTime(T0 + 60_000);
    const st: LiveStatus = { connected: true, me: 'A', peer: true, here: ['B'] };
    const live: Live = {
      start() {}, stop() {}, send: () => true, on: () => () => {}, onChange: () => () => {}, onStatus: (fn) => (fn(st), () => {}),
      status: () => st, serverNow: () => Date.now() - 60_000
    };
    world.attach(live, 'A');
    expect(dayKey()).toBe('2026-11-02');
    expect(islandDay()).toBe('2026-11-01');
  });
});
