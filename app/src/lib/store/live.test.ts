// The live backend says so when the phone can't keep data (round 9 §2 item 2), once per kind and session.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { configureTransport } from '#lib/sync/transport.ts';
import { configureCache } from '#lib/sync/cache.ts';
import { queued } from '#lib/sync/queue.ts';
import { setKey } from '#lib/sync/pairing.ts';
import { toasts } from '#lib/ui-state/toast.svelte.ts';
import { t } from '#lib/i18n/index.ts';
import { LiveBackend } from './live.ts';
import type { Host } from './backend.ts';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

class Mem implements KV {
  m = new Map<string, string>();
  full = false;
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) {
    if (this.full) throw new DOMException('quota', 'QuotaExceededError');
    this.m.set(k, v);
  }
  removeItem(k: string) { this.m.delete(k); }
}

const host = (): Host => ({ status: 'loading', syncing: false, offline: false, lastSync: null, changed() {} });

beforeEach(() => {
  vi.stubGlobal('location', { hash: '', search: '' });
  vi.stubGlobal('addEventListener', () => {});
  configureCache({ indexedDB: null });
  configureTransport({ url: 'https://script.example/exec', fetch: (async () => new Response('{"ok":false,"error":"busy"}')) as typeof fetch });
  toasts.dismiss();
});
afterEach(() => vi.unstubAllGlobals());

describe('LiveBackend storage problems', () => {
  it('a full localStorage: the tap still counts (in memory) and a banner says so, once', async () => {
    const kv = new Mem();
    configureStorage({ local: kv });
    setKey('ab'.repeat(32), 'A');
    const h = host();
    const b = new LiveBackend(h);
    await b.refresh({});
    expect(h.offline || h.status === 'error').toBe(true); // the fake server is busy
    kv.full = true;
    expect(b.send('highfive', {}, {}).ok).toBe(true);
    expect(queued()).toHaveLength(1);
    expect(toasts.current?.text).toBe(t('state.storageFull'));
    toasts.dismiss();
    b.send('highfive', {}, {});
    expect(toasts.current).toBeNull();
  });
});

describe('LiveBackend sync recovery (round 16 H2)', () => {
  it('a malformed reply stops the spinner, and the next refresh fetches again', async () => {
    configureStorage({ local: new Mem() });
    setKey('ab'.repeat(32), 'A');
    let body: unknown = { ok: true, me: 'A', now: '2026-11-02T05:00:00.000Z' }; // no rows
    let calls = 0;
    configureTransport({ url: 'https://script.example/exec', fetch: (async () => (calls++, new Response(JSON.stringify(body)))) as typeof fetch });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const h = host();
    const b = new LiveBackend(h);
    await b.refresh({});
    expect(h.syncing).toBe(false);
    expect(h.status).toBe('error');
    body = { ok: true, me: 'A', now: '2026-11-02T05:00:00.000Z', rev: 'r1', rows: { metrics: [], workouts: [], presence: [], events: [] } };
    await b.refresh({});
    expect(calls).toBe(2);
    expect(h.syncing).toBe(false);
    expect(h.status).toBe('ready');
    warn.mockRestore();
  });
});
