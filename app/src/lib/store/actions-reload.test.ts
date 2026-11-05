// A race lost after a reload or a kill (store/actions.ts lostRace): the claim's tally key kept with its day, so the
// catch still comes out of my pocket when the partner's claim is heard on the next open. Its own file: it loads the
// store's modules afresh (a new page) over the same storage.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { configureTransport } from '#lib/sync/transport.ts';
import { setKey } from '#lib/sync/pairing.ts';
import { week } from './week.svelte.ts';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

const NOW = Date.parse('2026-11-18T12:00:00.000Z');
let mem: Mem;
beforeEach(() => {
  vi.useFakeTimers({ now: NOW });
  mem = new Mem();
  configureStorage({ local: mem });
  configureTransport({ fetch: (() => new Promise<Response>(() => {})) as typeof fetch, url: 'https://script.example/exec' });
  setKey('ab'.repeat(32), 'A');
});

describe('a race lost across a reload', () => {
  const model = async () => {
    const { reduce } = await import('#lib/model/state.ts');
    week.model = { state: reduce({ metrics: [], events: [] }), me: 'A', now: NOW } as unknown as typeof week.model;
  };

  it('a race lost after the app was killed between the claim and its beat: the catch still comes out (the claim kept with its day)', async () => {
    const { recordFind } = await import('./actions.ts');
    await model();
    recordFind('fish', 'koi', 'catch:fresh:9');
    const day = '2026-11-18';
    // killed (its tally held a minute, in the queue), opened again: new modules, the same storage
    vi.resetModules();
    (await import('#lib/sync/storage.ts')).configureStorage({ local: mem });
    const q = await import('#lib/sync/queue.ts');
    const w2 = (await import('./week.svelte.ts')).week;
    const { reduce } = await import('#lib/model/state.ts');
    const held = q.queued().filter((e) => e.type === 'tally').at(-1)!;
    expect(held.data).toEqual({ date: day, counts: { 'fish:koi': 1 } });
    w2.model = { state: reduce({ metrics: [], events: [[new Date(NOW).toISOString(), 'A', held.id, 'tally', JSON.stringify(held.data)]] as never }), me: 'A', now: NOW } as unknown as typeof w2.model;
    const a2 = await import('./actions.ts');
    // the partner's claim heard at last (the relay's replay, or the room's refusal of my resend)
    expect(a2.lostRace('catch:fresh:9', 'B', true)).toBe(true);
    expect(q.queued().filter((e) => e.type === 'tally_back').map((e) => e.data)).toEqual([{ date: day, counts: { 'fish:koi': 1 } }]);
    // once only
    expect(a2.lostRace('catch:fresh:9', 'B', true)).toBe(false);
  });

});
