// The week store's undo logic and the banner controller: fake timers, a memory
// queue, a backend that never answers (nothing held is sent during a test).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { configureTransport } from '#lib/sync/transport.ts';
import { queued } from '#lib/sync/queue.ts';
import { setKey } from '#lib/sync/pairing.ts';
import { week } from './week.svelte.ts';
import { HOLD_MAX_MS } from './backend.ts';
import { Toasts, TOAST_OUT_MS, RESUME_MIN_MS } from '#lib/ui-state/toast.svelte.ts';
import { toasts } from '#lib/ui-state/toast.svelte.ts';

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
  configureStorage({ local: new Mem() });
  configureTransport({ fetch: (() => new Promise<Response>(() => {})) as typeof fetch, url: 'https://script.example/exec' });
  setKey('ab'.repeat(32), 'A');
  toasts.dismiss();
});
afterEach(() => vi.useRealTimers());

describe('week.send with an undo window', () => {
  it('holds the event for its window; a hold is capped at HOLD_MAX_MS', async () => {
    const r = week.send('spend_void', { spendId: 's1' }, { holdMs: 5000 });
    expect(r.ok).toBe(true);
    expect(queued()[0].nextAt).toBe(NOW + 5000);
    expect(r.hold!(null)).toBe(HOLD_MAX_MS);
    expect(queued()[0].nextAt).toBe(NOW + HOLD_MAX_MS);
  });

  it('sends at once (no undo) without a window', async () => {
    const r = week.send('pref', { key: 'moveGoal', value: 500 }, {});
    expect(r).toEqual({ ok: true });
    expect(queued()[0].nextAt).toBe(NOW);
  });

  it('undo takes back only its own event', async () => {
    const a = week.send('spend_void', { spendId: 's1' }, { holdMs: 5000 });
    week.send('spend_void', { spendId: 's2' }, { holdMs: 5000 });
    expect(a.undo!()).toBe(true);
    expect(queued().map((e) => e.data.spendId)).toEqual(['s2']);
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
