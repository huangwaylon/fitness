import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEVICE, type KV } from './storage.ts';

const logged: [string, unknown][] = [];
vi.mock('./log.ts', () => ({ log: (e: string, d: unknown) => void logged.push([e, d]) }));
const { persistOnce, storageDaily } = await import('./persist.ts');

const mem = (): KV & { m: Map<string, string> } => {
  const m = new Map<string, string>();
  return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};
const storage = (persisted: boolean, grant: boolean) => {
  const asked = { n: 0 };
  return { asked, s: { persisted: async () => persisted, persist: async () => (asked.n++, grant), estimate: async () => ({ usage: 52 * 1048576, quota: 1024 * 1048576 }) } as unknown as StorageManager };
};

describe('persistOnce (the installed app keeps its storage)', () => {
  beforeEach(() => void (logged.length = 0));

  it('asks once, in the installed app, and logs the answer and the quota (no PII)', async () => {
    const kv = mem(), st = storage(false, true);
    await persistOnce(kv, st.s, true);
    await persistOnce(kv, st.s, true);
    expect(st.asked.n).toBe(1);
    expect(kv.m.get(DEVICE.persistAsked)).toBe('1');
    expect(logged).toEqual([['storage.persist', { ok: true, was: false, useMb: 52, quotaMb: 1024 }]]);
  });

  it('never in a Safari tab, nor where the API is missing', async () => {
    const st = storage(false, true);
    await persistOnce(mem(), st.s, false);
    await persistOnce(mem(), undefined, true);
    expect([st.asked.n, logged]).toEqual([0, []]);
  });

  it('already persisted: not asked again, logged as so', async () => {
    const st = storage(true, false);
    await persistOnce(mem(), st.s, true);
    expect(st.asked.n).toBe(0);
    expect(logged[0][1]).toMatchObject({ ok: true, was: true });
  });
});

describe('storageDaily (the storage in use, once a Tokyo day)', () => {
  beforeEach(() => void (logged.length = 0));

  it('logs the use and the quota (MB) and whether it is kept, once a Tokyo day', async () => {
    const kv = mem(), st = storage(true, false);
    const t = Date.parse('2026-11-11T10:00:00+09:00');
    await storageDaily(kv, st.s, t);
    await storageDaily(kv, st.s, t + 3_600_000);
    // (past Tokyo's midnight: the next day's)
    await storageDaily(kv, st.s, Date.parse('2026-11-12T00:30:00+09:00'));
    expect(logged).toEqual([['storage.use', { useMb: 52, quotaMb: 1024, persisted: true }], ['storage.use', { useMb: 52, quotaMb: 1024, persisted: true }]]);
    await storageDaily(mem(), undefined, t);
    expect(logged).toHaveLength(2);
  });
});
