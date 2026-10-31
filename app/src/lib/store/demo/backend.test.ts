// The demo can't leak into live: its taps live under `island-demo.*`, it never reads or writes
// the live key, queue or cache, and nothing it does is sent.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LIVE, DEMO, configureStorage, type KV } from '#lib/sync/storage.ts';
import { configureTransport } from '#lib/sync/transport.ts';
import { enqueue, queued } from '#lib/sync/queue.ts';
import { DemoBackend } from './backend.ts';
import type { Host } from '../backend.ts';

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

const host = (): Host & { changes: number } => ({ status: 'loading', syncing: false, offline: false, lastSync: null, changes: 0, changed() { this.changes++; } });

let kv: Mem;
const fetchSpy = vi.fn(async () => new Response('{"ok":true}'));

beforeEach(() => {
  kv = new Mem();
  configureStorage({ local: kv });
  configureTransport({ fetch: fetchSpy as unknown as typeof fetch, url: 'https://script.example/exec' });
  fetchSpy.mockClear();
});

describe('demo isolation', () => {
  it('keeps its taps under island-demo.* and never touches the live queue or key', async () => {
    kv.m.set(LIVE.key, 'ab'.repeat(32));
    const live = enqueue('highfive', {});
    const before = new Map(kv.m);
    const h = host();
    const b = new DemoBackend(h, 'plain', 'A');
    await b.refresh();
    expect(h.status).toBe('ready');
    const r = b.send('pref', { key: 'moveGoal', value: 500 }, { holdMs: 5000 });
    expect(r.ok).toBe(true);
    expect(b.events()).toHaveLength(1);
    expect(b.events().some((e) => e.id === live.id)).toBe(false); // the live queue is not the demo's
    for (const [k, v] of before) expect(kv.m.get(k)).toBe(v);
    expect([...kv.m.keys()].filter((k) => !before.has(k))).toEqual([DEMO.events]);
    expect(queued().map((e) => e.id)).toEqual([live.id]);
    expect(r.undo!()).toBe(true);
    expect(b.events()).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('reads only today’s taps', async () => {
    kv.m.set(DEMO.events, JSON.stringify({ day: 'Mon Jan 01 2001', events: [{ id: 'old', type: 'highfive', data: {} }] }));
    const b = new DemoBackend(host(), 'plain', 'B');
    await b.refresh();
    expect(b.events()).toEqual([]);
    expect(b.cache()?.me).toBe('B');
    expect(b.cache()?.demo).toBeTruthy(); // the demo calendar travels with its rows, never as a global
  });
});
