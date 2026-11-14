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

  it('logs the use and the quota (MB), whether it is kept and each cache\'s MB, once a Tokyo day', async () => {
    const kv = mem(), st = storage(true, false), by = async () => ({ shell: 8.2, room: 31.5, stt: false });
    const t = Date.parse('2026-11-11T10:00:00+09:00');
    await storageDaily(kv, st.s, t, by, 0);
    await storageDaily(kv, st.s, t + 3_600_000, by, 0);
    // (past Tokyo's midnight: the next day's; the caches unreadable: the rest as ever)
    await storageDaily(kv, st.s, Date.parse('2026-11-12T00:30:00+09:00'), () => Promise.reject(new Error('no')), 0);
    expect(logged).toEqual([['storage.use', { useMb: 52, quotaMb: 1024, persisted: true, shell: 8.2, room: 31.5, stt: false }], ['storage.use', { useMb: 52, quotaMb: 1024, persisted: true }]]);
    await storageDaily(mem(), undefined, t, by, 0);
    expect(logged).toHaveLength(2);
  });

  it('waits past the launch; the day marked only once logged: an estimate that failed is tried again by the next sync; syncs meanwhile ask once', async () => {
    vi.useFakeTimers();
    try {
      const kv = mem(), t = Date.parse('2026-11-11T10:00:00+09:00'), by = async () => ({ shell: 8.2 });
      let fail = true;
      const st = { persisted: async () => true, estimate: async () => (fail ? Promise.reject(new Error('busy')) : { usage: 52 * 1048576, quota: 1024 * 1048576 }) } as unknown as StorageManager;
      const first = storageDaily(kv, st, t, by, 15_000);
      void storageDaily(kv, st, t + 1000, by, 15_000);
      await vi.advanceTimersByTimeAsync(14_999);
      expect(logged).toEqual([]);
      await vi.advanceTimersByTimeAsync(1);
      await first;
      expect([logged, kv.m.has(DEVICE.storageDay)]).toEqual([[], false]);
      fail = false;
      const again = storageDaily(kv, st, t + 60_000, by, 15_000);
      await vi.advanceTimersByTimeAsync(15_000);
      await again;
      expect(logged).toEqual([['storage.use', { useMb: 52, quotaMb: 1024, persisted: true, shell: 8.2 }]]);
      expect(kv.m.has(DEVICE.storageDay)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
