// Shared test helpers: a fake Bot (a real Store, everything else mocked; conftest.py's `bot` fixture), the days
// around the fixed test clock, and a Durable Object's state for a real GymBot (bot.test, worker.test).
import { vi } from 'vitest';
import type { Bot, StoredChange } from '../src/actions.ts';
import type { Line } from '../src/line.ts';
import { Store } from '../src/store.ts';
import { addDays, dayOf, type Clock, type Day } from '../src/time.ts';

export const GROUP = 'C123';
export const NOON: [Clock, Clock] = ['12:00', '13:00'];
/** The tests' clock: Monday 2026-10-12 12:00 in Tokyo (set with vi.setSystemTime). */
export const NOW = Date.parse('2026-10-12T12:00:00+09:00');

export const today = (): Day => dayOf(Date.now());
export const inDays = (n: number): Day => addDays(today(), n);

/** A stand-in for the bot, answering in GROUP; LINE's reply and name lookup (Bob) are mocks. */
export function fakeBot() {
  const line = {
    push: vi.fn<Line['push']>(async () => {}),
    reply: vi.fn<Line['reply']>(async () => {}),
    memberName: vi.fn<Line['memberName']>(async () => 'Bob'),
  };
  const bot = {
    store: new Store(),
    line: line as unknown as Line & typeof line,
    groupId: GROUP,
    lastCheck: null as number | null,
    nextCheck: vi.fn<Bot['nextCheck']>(async () => null),
    failures: 0,
    checking: false,
    lastManualCheck: null as number | null,
    runCheck: vi.fn<Bot['runCheck']>(async () => []),
    save: vi.fn<Bot['save']>(async () => {}),
    wake: vi.fn<Bot['wake']>(async () => {}),
    changes: [] as StoredChange[],
    nameOf: (who: 'A' | 'B') => (who === 'A' ? 'ウェイ' : 'うめ'),
  };
  return bot satisfies Bot;
}

/** A Durable Object's state: a key-value map and one alarm. */
export function fakeState(kv = new Map<string, unknown>()) {
  let alarm: number | null = null;
  let loading: Promise<unknown> = Promise.resolve();
  const storage = {
    get: async (k: string) => structuredClone(kv.get(k)),
    put: async (k: string, v: unknown) => void kv.set(k, structuredClone(v)),
    getAlarm: async () => alarm,
    setAlarm: async (t: number) => void (alarm = t),
    deleteAlarm: async () => void (alarm = null)
  };
  const ctx = {
    storage,
    blockConcurrencyWhile: (fn: () => Promise<unknown>) => (loading = fn())
  };
  return { ctx, kv, alarm: () => alarm, loaded: () => loading };
}
