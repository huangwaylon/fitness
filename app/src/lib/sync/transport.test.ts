// A request across a hide (iOS freezes a hidden page's requests): aborted once the phone is back, the phone's
// (`offline`), sent again at once when it's safe to; one that timed out hidden is the phone's too (review 11-24 R3).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from './storage.ts';
import { configureTransport, post } from './transport.ts';

class Mem implements KV {
  m = new Map<string, string>([['island.key', JSON.stringify('ab'.repeat(32))]]);
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' as DocumentVisibilityState });
const setVisible = (v: boolean) => {
  doc.visibilityState = v ? 'visible' : 'hidden';
  doc.dispatchEvent(new Event('visibilitychange'));
};

/** A fetch that answers only when told (or rejects on its abort, as a browser does). */
let pending: { action: string; answer: () => void }[] = [];
const fetchHeld = ((_u: unknown, init?: RequestInit) => new Promise<Response>((done, reject) => {
  const action = String(JSON.parse(String(init?.body)).action);
  init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
  pending.push({ action, answer: () => done(new Response(JSON.stringify({ ok: true, action }))) });
})) as typeof fetch;

beforeEach(() => {
  vi.stubGlobal('document', doc);
  doc.visibilityState = 'visible';
  pending = [];
  configureStorage({ local: new Mem() });
  configureTransport({ fetch: fetchHeld, url: 'https://relay.test/api' });
});
afterEach(() => vi.unstubAllGlobals());

describe('transport: a request across a hide', () => {
  it('a read in flight when the phone locked goes again at once when it is back, not at its timeout', async () => {
    const r = post('snapshot');
    await vi.waitFor(() => expect(pending).toHaveLength(1));
    setVisible(false);
    setVisible(true);
    await vi.waitFor(() => expect(pending).toHaveLength(2));
    pending[1].answer();
    expect(await r).toEqual({ ok: true, action: 'snapshot' });
  });

  it('only once: a second hide across the repeat answers `offline` (the queue backs off, nothing lost)', async () => {
    const r = post('events', { events: [] });
    await vi.waitFor(() => expect(pending).toHaveLength(1));
    setVisible(false);
    setVisible(true);
    await vi.waitFor(() => expect(pending).toHaveLength(2));
    setVisible(false);
    setVisible(true);
    expect(await r).toEqual({ ok: false, error: 'offline', detail: 'resumed' });
  });

  it('an op that makes something (a share link) is not sent twice: `offline`, its caller says so', async () => {
    const r = post('share_make', { kind: 'trip', ref: 'x', days: 7 });
    await vi.waitFor(() => expect(pending).toHaveLength(1));
    setVisible(false);
    setVisible(true);
    expect(await r).toEqual({ ok: false, error: 'offline', detail: 'resumed' });
    expect(pending).toHaveLength(1);
  });

  it('one started on screen and never hidden is left alone by a show', async () => {
    const r = post('snapshot');
    await vi.waitFor(() => expect(pending).toHaveLength(1));
    setVisible(true);
    pending[0].answer();
    expect(await r).toEqual({ ok: true, action: 'snapshot' });
  });

  it('timed out while hidden: the phone’s (`offline`), not the relay’s `unavailable`', async () => {
    setVisible(false);
    expect(await post('snapshot', {}, { timeoutMs: 10 })).toEqual({ ok: false, error: 'offline', detail: 'hidden' });
  });
});
