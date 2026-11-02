// The old つうち's leftovers dropped on open (sync/pushGone.ts).
import { describe, expect, it } from 'vitest';
import { dropPush, OLD_PUSH_KEYS } from './pushGone.ts';

function kv(init: Record<string, string>) {
  const m = new Map(Object.entries(init));
  return { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
}

describe('dropPush', () => {
  it('unsubscribes every registration’s subscription and forgets the old prefs, keeping the rest', async () => {
    const store = kv({ 'island.push': '{"on":true}', 'island.goalSent': '{"me":"A","date":"2026-11-01"}', 'island.key': 'k' });
    let calls = 0;
    const sub = { unsubscribe: async () => (calls++, true) };
    const n = await dropPush({ kv: store, sw: { getRegistrations: async () => [{ pushManager: { getSubscription: async () => sub } }, { pushManager: { getSubscription: async () => null } }, {}] } });
    expect(n).toBe(1);
    expect(calls).toBe(1);
    for (const k of OLD_PUSH_KEYS) expect(store.m.has(k)).toBe(false);
    expect(store.m.get('island.key')).toBe('k');
  });

  it('a phone that never subscribed, no service worker, or a failing browser: nothing thrown', async () => {
    expect(await dropPush({ kv: null })).toBe(0);
    expect(await dropPush({ kv: kv({}), sw: { getRegistrations: async () => [] } })).toBe(0);
    expect(await dropPush({ kv: kv({}), sw: { getRegistrations: async () => Promise.reject(new Error('no')) } })).toBe(0);
    const throwing = { getItem: () => null, setItem() {}, removeItem() { throw new Error('blocked'); } };
    expect(await dropPush({ kv: throwing, sw: { getRegistrations: async () => [{ pushManager: { getSubscription: async () => ({ unsubscribe: async () => true }) } }] } })).toBe(1);
  });
});
