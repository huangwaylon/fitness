// The week store's undo/lock logic (round 7 M1, round 8 tests) and the banner controller: fake timers, a memory
// queue, a backend that never answers (nothing held is sent during a test).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configure, queued, setKey, type KV } from './gas.ts';
import { week, HOLD_MAX_MS, LOCK_MARGIN_MS } from './week.svelte.ts';
import { Toasts, TOAST_OUT_MS, RESUME_MIN_MS } from './toast.svelte.ts';
import { toasts } from './toast.svelte.ts';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

const NOW = Date.parse('2026-11-18T12:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers({ now: NOW });
  configure({ storage: new Mem(), fetch: (() => new Promise<Response>(() => {})) as typeof fetch, url: 'https://script.example/exec' });
  setKey('ab'.repeat(32), 'A');
  toasts.dismiss();
});
afterEach(() => vi.useRealTimers());

describe('week.send with a lock (M1)', () => {
  it('refuses an edit closer than 5 s to its lock, with a banner', async () => {
    const r = await week.send('metric_set', { date: '2026-11-17', metric: 'steps', value: 1 }, { holdMs: 5000, lockAt: NOW + 4000 });
    expect(r).toMatchObject({ ok: false, status: 409 });
    expect(queued()).toEqual([]);
    expect(toasts.current?.reaction).toBe('sheepishness');
  });

  it('shrinks the undo window so the edit still lands a minute before the lock', async () => {
    const lockAt = NOW + LOCK_MARGIN_MS + 2000;
    const r = await week.send('metric_set', { date: '2026-11-17', metric: 'steps', value: 1 }, { holdMs: 5000, lockAt });
    expect(r.ok).toBe(true);
    expect(queued()[0].nextAt).toBe(NOW + 2000);
  });

  it('sends at once (no undo) when the lock is within the margin', async () => {
    const r = await week.send('metric_set', { date: '2026-11-17', metric: 'steps', value: 1 }, { holdMs: 5000, lockAt: NOW + 30_000 });
    expect(r.ok).toBe(true);
    expect(r.undo).toBeUndefined();
    expect(queued()[0].nextAt).toBe(NOW);
  });

  it('caps a hold at HOLD_MAX_MS, and before the lock', async () => {
    const far = await week.send('transfer', { month: '2026-11' }, { holdMs: 5000 });
    expect(far.hold!(null)).toBe(HOLD_MAX_MS);
    const lockAt = NOW + LOCK_MARGIN_MS + 30_000;
    const near = await week.send('metric_set', { date: '2026-11-17', metric: 'steps', value: 1 }, { holdMs: 5000, lockAt });
    expect(near.hold!(null)).toBe(30_000);
    expect(queued().find((e) => e.lockAt === lockAt)!.nextAt).toBe(NOW + 30_000);
  });

  it('undo takes back only its own event', async () => {
    const a = await week.send('transfer', { month: '2026-10' }, { holdMs: 5000 });
    await week.send('transfer', { month: '2026-11' }, { holdMs: 5000 });
    expect(a.undo!()).toBe(true);
    expect(queued().map((e) => e.data.month)).toEqual(['2026-11']);
    expect(a.undo!()).toBe(false);
  });
});

describe('the banner (toast.svelte.ts)', () => {
  it('slides out after its time, then is dropped', () => {
    const t = new Toasts();
    t.show('hi', 1000);
    vi.advanceTimersByTime(999);
    expect(t.current?.leaving).toBeFalsy();
    vi.advanceTimersByTime(1);
    expect(t.current?.leaving).toBe(true);
    vi.advanceTimersByTime(TOAST_OUT_MS);
    expect(t.current).toBeNull();
  });

  it('pause holds the banner and its send (capped by the grant); resume gives at least 2 s', () => {
    const t = new Toasts();
    const hold = vi.fn((ms: number | null) => (ms === null ? 10_000 : ms));
    t.show('saved', 1000, { hold });
    t.pause();
    expect(hold).toHaveBeenLastCalledWith(null);
    vi.advanceTimersByTime(5000);
    expect(t.current?.leaving).toBeFalsy();
    t.resume();
    expect(hold).toHaveBeenLastCalledWith(RESUME_MIN_MS);
    vi.advanceTimersByTime(RESUME_MIN_MS);
    expect(t.current?.leaving).toBe(true);
  });

  it('a held banner ends when its grant does', () => {
    const t = new Toasts();
    t.show('saved', 1000, { hold: (ms) => (ms === null ? 3000 : ms) });
    t.pause();
    vi.advanceTimersByTime(3000);
    expect(t.current?.leaving).toBe(true);
  });

  it('dismissing or replacing a held banner sends its action now', () => {
    const t = new Toasts();
    const hold = vi.fn((ms: number | null) => ms ?? 10_000);
    t.show('a', 1000, { hold });
    t.pause();
    t.show('b');
    expect(hold).toHaveBeenLastCalledWith(0);
    const hold2 = vi.fn((ms: number | null) => ms ?? 10_000);
    t.show('c', 1000, { hold: hold2 });
    t.pause();
    t.dismiss();
    expect(hold2).toHaveBeenLastCalledWith(0);
    expect(t.current).toBeNull();
  });
});
