import { afterEach, describe, expect, it } from 'vitest';
import { awake, islandActors, online, othersOf, setCast, setEveryoneAwake, setPresence, setPresenceClock, setWoke, sleepIn } from './cast.ts';
import { GRACE_MS, WAKE_MS } from './presence.ts';
import { configureStorage } from '#lib/sync/storage.ts';

const mem = new Map<string, string>();
configureStorage({ local: { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k) } });

let t = 1_000_000;
const at = (ms: number) => (t = ms);

describe('the island’s villagers (whose life is shared: 2026-11-06; awake while online: 2026-11-09)', () => {
  afterEach(() => (setCast('A'), setEveryoneAwake(false), setPresence({ connected: true, here: [] })));

  it('a member’s phone: mine, and the others while their apps are open', () => {
    setCast('A');
    setPresenceClock(() => t);
    setPresence({ connected: true, here: [] });
    expect(islandActors()).toEqual(['mine']);
    setPresence({ connected: true, here: ['B'] });
    expect(islandActors()).toEqual(['mine', 'partner']);
    expect(othersOf('mine')).toEqual(['partner']);
    setPresence({ connected: true, here: ['B', 'G'] });
    expect(islandActors()).toEqual(['mine', 'partner', 'third']);
    expect(othersOf('third')).toEqual(['mine', 'partner']);
  });

  it('the guest’s phone: its own, and A’s and B’s while theirs are open', () => {
    setCast('G');
    setPresenceClock(() => t);
    setPresence({ connected: true, here: ['A'] });
    expect(islandActors()).toEqual(['mine', 'partner']);
    expect(awake('G')).toBe(true);
    expect(awake('B')).toBe(false);
  });

  it('one gone stays awake for the grace (a reload, a moment away), then sleeps; nothing heard: asleep', () => {
    setCast('A');
    setPresenceClock(() => t);
    at(1_000_000);
    mem.clear();
    setCast('A');
    setPresenceClock(() => t);
    expect(awake('B')).toBe(false); // (no word from the relay yet, nothing kept)
    setPresence({ connected: true, here: [], gone: { B: 1_000_000 } });
    expect(online('B')).toBe(true);
    expect(sleepIn()).toBe(GRACE_MS);
    at(1_000_000 + GRACE_MS - 1);
    expect(awake('B')).toBe(true);
    at(1_000_000 + GRACE_MS);
    expect(awake('B')).toBe(false);
    expect(sleepIn()).toBe(null);
  });

  it('disconnected, the last word holds; reloaded, those here count as gone then (awake within the grace)', () => {
    setCast('A');
    setPresenceClock(() => t);
    at(2_000_000);
    setPresence({ connected: true, here: ['B'] });
    setPresence({ connected: false, here: [] });
    at(2_000_000 + 10 * GRACE_MS);
    expect(awake('B')).toBe(true);
    at(2_000_000);
    setPresence({ connected: true, here: ['B'] }); // kept (localStorage) at 2_000_000
    setCast('A'); // a reload
    setPresenceClock(() => t);
    at(2_000_000 + GRACE_MS / 2);
    expect(awake('B')).toBe(true);
    at(2_000_000 + GRACE_MS);
    expect(awake('B')).toBe(false);
  });

  it('a tap’s wake: awake for WAKE_MS from its `at` (the relay’s: the same end on every phone), in the island’s life but not online', () => {
    setCast('A');
    setPresenceClock(() => t);
    at(3_000_000);
    setPresence({ connected: true, here: [] });
    setWoke('B', 3_000_000 - 5_000);
    expect(awake('B')).toBe(true);
    expect(online('B')).toBe(false);
    expect(islandActors()).toEqual(['mine', 'partner']);
    expect(sleepIn()).toBe(WAKE_MS - 5_000);
    at(3_000_000 - 5_000 + WAKE_MS);
    expect(awake('B')).toBe(false);
  });

  it('`?awake`: everyone online', () => {
    setCast('A');
    setEveryoneAwake(true);
    expect(islandActors()).toEqual(['mine', 'partner', 'third']);
    expect(sleepIn()).toBe(null);
  });
});
