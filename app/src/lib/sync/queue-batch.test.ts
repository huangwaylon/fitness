// The queue against the relay's record (docs/backend.md#write-queue, #the-record): what may go now goes in one
// `events` request, in order, holds and subjects kept; each id's answer acks, drops or holds it (and what follows).
import { beforeEach, describe, expect, it } from 'vitest';
import { configureStorage, type KV } from './storage.ts';
import { configureTransport } from './transport.ts';
import { enqueue, flush, queued, ackedEvents } from './queue.ts';
import { setKey } from './pairing.ts';

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

const RECORD = 'https://relay.example/api';
let bodies: { url: string; body: Record<string, any> }[];
let answer: (body: Record<string, any>) => unknown;

beforeEach(() => {
  configureStorage({ local: new Mem() });
  bodies = [];
  answer = (b) => ({ ok: true, results: b.events.map((e: { id: string }, i: number) => ({ id: e.id, ok: true, at: `2026-11-02T00:00:0${i}.000Z` })) });
  configureTransport({
    url: RECORD,
    fetch: (async (u: unknown, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      bodies.push({ url: String(u), body });
      return new Response(JSON.stringify(answer(body)));
    }) as typeof fetch
  });
  setKey('ab'.repeat(32), 'A');
});

const T = 1_000_000;

describe('a batch to the record', () => {
  it('sends what may go now in one request, in queue order, skipping a held one and what follows it on its subject', async () => {
    const goal = enqueue('pref', { key: 'moveGoal', value: 450 }, T);
    const buy = enqueue('spend', { spendId: 's1', item: 'snack', bells: 40 }, T, 5000); // held: the undo window
    const voidIt = enqueue('spend_void', { spendId: 's1' }, T); // waits for its buy
    const find = enqueue('find', { kind: 'fish', id: 'dab' }, T);
    const r = await flush(() => T);
    expect(bodies.map((b) => [b.url, b.body.action, b.body.events.map((e: { id: string }) => e.id)])).toEqual([[RECORD, 'events', [goal.id, find.id]]]);
    expect(r.stored.map((x) => [x.ev.id, x.at])).toEqual([[goal.id, '2026-11-02T00:00:00.000Z'], [find.id, '2026-11-02T00:00:01.000Z']]);
    expect(queued().map((e) => e.id)).toEqual([buy.id, voidIt.id]);
    expect(ackedEvents().map((e) => e.id)).toEqual([goal.id, find.id]);
    // the window ends: the buy, then its void, together
    await flush(() => T + 5000);
    expect(bodies[1].body.events.map((e: { id: string }) => e.id)).toEqual([buy.id, voidIt.id]);
    expect(queued()).toEqual([]);
  });

  it('a tally_back never passes a held tally (the record takes one only while the day’s tally covers it)', async () => {
    const tally = enqueue('tally', { date: '2026-11-18', counts: { 'fish:koi': 1 } }, T, 60_000);
    const back = enqueue('tally_back', { date: '2026-11-18', counts: { 'fish:koi': 1 } }, T);
    await flush(() => T);
    expect(bodies).toEqual([]);
    await flush(() => T + 60_000);
    expect(bodies[0].body.events.map((e: { id: string }) => e.id)).toEqual([tally.id, back.id]);
  });

  it('each id’s answer: acked (a duplicate without a row), dropped (it can never succeed), or held with all after it', async () => {
    const [a, b, c, d] = ['a', 'b', 'c', 'd'].map((x) => enqueue('find', { kind: 'fish', id: x }, T));
    answer = () => ({ ok: true, results: [
      { id: a.id, ok: true, duplicate: true },
      { id: b.id, ok: false, error: 'bad_request' },
      { id: c.id, ok: false, error: 'busy' },
      { id: d.id, ok: true, at: '2026-11-02T00:00:00.000Z' }
    ] });
    const r = await flush(() => T);
    expect(r).toMatchObject({ sent: 1, stored: [], error: 'busy', remaining: 2 });
    expect(r.dropped.map((e) => e.id)).toEqual([b.id]);
    expect(queued().map((e) => [e.id, e.tries])).toEqual([[c.id, 1], [d.id, 0]]);
  });

  it('a request that fails whole holds the first event (backoff) and keeps the order', async () => {
    const [a, b] = ['a', 'b'].map((x) => enqueue('find', { kind: 'fish', id: x }, T));
    answer = () => ({ ok: false, error: 'unavailable' });
    expect(await flush(() => T)).toMatchObject({ sent: 0, error: 'unavailable', remaining: 2 });
    expect(queued().map((e) => [e.id, e.tries])).toEqual([[a.id, 1], [b.id, 0]]);
  });

  it('a subtask refused for its parent while that parent failed in the same batch waits with it, never dropped', async () => {
    // the record went on past the parent's failed write (unavailable) and refused the subtask (`wedding parent`)
    const parent = enqueue('wtask', { id: 'p', at: T, c: T, title: 'Invitations', cat: '', due: '2027-04-18' }, T);
    const sub = enqueue('wtask', { id: 's', at: T + 1, c: T + 1, title: 'Order cards', cat: '', parent: 'p' }, T);
    answer = () => ({ ok: true, results: [
      { id: parent.id, ok: false, error: 'unavailable' },
      { id: sub.id, ok: false, error: 'bad_request', detail: 'wedding parent' }
    ] });
    expect(await flush(() => T)).toMatchObject({ sent: 0, dropped: [], error: 'unavailable', remaining: 2 });
    // the retry: the parent, then its subtask, both taken
    answer = (b) => ({ ok: true, results: b.events.map((e: { id: string }) => ({ id: e.id, ok: true, at: '2026-11-02T00:00:00.000Z' })) });
    await flush(() => T + 60_000);
    expect(bodies[1].body.events.map((e: { id: string }) => e.id)).toEqual([parent.id, sub.id]);
    expect(queued()).toEqual([]);
  });
});
