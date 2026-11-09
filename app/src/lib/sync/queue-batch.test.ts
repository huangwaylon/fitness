// The queue against the relay's record (docs/backend.md#write-queue, #the-record): what may go now goes in one
// `events` request, in order, holds and subjects kept; each id's answer acks, drops or holds it (and what follows).
import { beforeEach, describe, expect, it } from 'vitest';
import { configureStorage, type KV } from './storage.ts';
import { configureTransport } from './transport.ts';
import { enqueue, flush, queued, ackedEvents, lastSentAt, nextRetryAt, PARK_AFTER, releaseHeld, STUCK_MS, unpark, unsentStuck } from './queue.ts';
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
const bytes = (body: unknown) => new TextEncoder().encode(JSON.stringify(body)).length;

describe('a batch to the record', () => {
  it('a backlog writes the queue and the acked list once per batch, and parses neither again (2026-11-09: once per event)', async () => {
    const kv = new Mem();
    let writes = 0;
    kv.setItem = (k, v) => void (writes++, kv.m.set(k, v));
    configureStorage({ local: kv });
    setKey('ab'.repeat(32), 'A');
    for (let i = 0; i < 120; i++) enqueue('pref', { key: 'moveGoal', value: i }, T);
    writes = 0;
    const parse = JSON.parse;
    let parsed = 0;
    JSON.parse = ((t: string) => (t.startsWith("[") && parsed++, parse(t))) as typeof JSON.parse; // (the stored lists, not the bodies)
    try {
      await flush(() => T);
    } finally {
      JSON.parse = parse;
    }
    // 3 batches of ≤ 50: each the acked list, then the queue; the sent-at mark at the end
    expect(bodies).toHaveLength(3);
    expect(writes).toBe(3 * 2 + 1);
    expect(parsed).toBe(0);
    expect(queued()).toEqual([]);
    expect(ackedEvents()).toHaveLength(120);
  });

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

describe('a queue that never wedges (health A3: sync #1, #18, #19)', () => {
  const wnote = (i: number) => ({ id: `w${i}`, at: T, t: 'あ'.repeat(130_000) });

  it('keeps each request under the record’s body cap: 8 large notes and a pref all go', async () => {
    // the record refuses a body over 1,000,000 chars whole (storeRoute.ts): one batch of all 9 was refused forever
    answer = (b) => JSON.stringify(b).length > 1_000_000
      ? { ok: false, error: 'too_large' }
      : { ok: true, results: b.events.map((e: { id: string }) => ({ id: e.id, ok: true })) };
    for (let i = 0; i < 8; i++) enqueue('wnote', wnote(i), T);
    enqueue('pref', { key: 'moveGoal', value: 450 }, T);
    const r = await flush(() => T);
    expect(r).toMatchObject({ sent: 9, remaining: 0 });
    expect(bodies.every((b) => JSON.stringify(b.body).length <= 1_000_000)).toBe(true);
  });

  it('a batch refused whole is halved and sent again at once (order kept); one alone is set aside, kept', async () => {
    const evs = ['a', 'b', 'c', 'd'].map((x) => enqueue('find', { kind: 'fish', id: x }, T));
    answer = (b) => (b.events.some((e: { id: string }) => e.id === evs[2].id) ? { ok: false, error: 'too_large' } : { ok: true, results: b.events.map((e: { id: string }) => ({ id: e.id, ok: true })) });
    const r = await flush(() => T);
    expect(bodies.map((b) => b.body.events.length)).toEqual([4, 2, 2, 1, 1]);
    expect(r.acked.map((e) => e.id)).toEqual([evs[0].id, evs[1].id, evs[3].id]);
    expect(queued()).toEqual([expect.objectContaining({ id: evs[2].id, parked: true })]);
  });

  it('an event the record keeps failing is set aside after PARK_AFTER answers, never dropped, and the rest go', async () => {
    const bad = enqueue('find', { kind: 'fish', id: 'bad' }, T);
    const next = enqueue('find', { kind: 'fish', id: 'ok' }, T);
    answer = (b) => ({ ok: true, results: b.events.map((e: { id: string }) => (e.id === bad.id ? { id: e.id, ok: false, error: 'unavailable' } : { id: e.id, ok: true })) });
    let t = T;
    for (let i = 0; i < PARK_AFTER; i++) await flush(() => (t += 400_000));
    expect(queued().map((e) => [e.id, !!e.parked])).toEqual([[bad.id, true]]);
    expect(ackedEvents().map((e) => e.id)).toEqual([next.id]);
    expect(nextRetryAt(t)).toBeNull(); // no timer for it
    unpark(t);
    answer = (b) => ({ ok: true, results: b.events.map((e: { id: string }) => ({ id: e.id, ok: true })) });
    await flush(() => t);
    expect(queued()).toEqual([]);
  });

  it('a later sell waits behind a set-aside tally (its subject)', async () => {
    const tally = enqueue('tally', { date: '2026-11-18', counts: { 'fish:koi': 1 } }, T);
    const sell = enqueue('sell', { species: 'fish:koi', n: 1, v: 10 }, T);
    answer = () => ({ ok: false, error: 'too_large' });
    await flush(() => T);
    expect(queued().map((e) => [e.id, !!e.parked])).toEqual([[tally.id, true], [sell.id, false]]);
    expect(bodies.map((b) => b.body.events.length)).toEqual([2, 1]); // then the tally alone: the sell never passes it
  });

  it('a newer day row replaces the same day’s queued ones in the first one’s place (a tried one too); one in flight stays', async () => {
    const t1 = enqueue('tally', { date: '2026-11-18', counts: { a: 1 } }, T, 60_000);
    const sell = enqueue('sell', { species: 'a', n: 1, v: 10 }, T);
    const other = enqueue('tally', { date: '2026-11-17', counts: { a: 1 } }, T, 60_000);
    const t2 = enqueue('tally', { date: '2026-11-18', counts: { a: 2 } }, T, 60_000);
    const i1 = enqueue('island', { date: '2026-11-18', taken: [] }, T);
    const i2 = enqueue('island', { date: '2026-11-18', taken: ['catch:a'] }, T);
    expect(queued().map((e) => e.id)).toEqual([t2.id, sell.id, other.id, i2.id]);
    expect([t1.id, i1.id]).not.toContain(queued()[0].id);
    answer = () => ({ ok: false, error: 'offline' });
    await flush(() => T + 60_000); // t2 tried (offline): still replaced by a newer row, in its place
    expect(queued()[0].tries).toBe(1);
    const t3 = enqueue('tally', { date: '2026-11-18', counts: { a: 3 } }, T + 60_000);
    expect(queued().map((e) => e.id)).toEqual([t3.id, sell.id, other.id, i2.id]);
    // in flight: kept (its answer is on its way)
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    answer = (b) => ({ ok: true, results: b.events.map((e: { id: string }) => ({ id: e.id, ok: true })) });
    configureTransport({ url: RECORD, fetch: (async (_u: unknown, init?: RequestInit) => { const b = JSON.parse(String(init?.body)); await gate; return new Response(JSON.stringify(answer(b))); }) as typeof fetch });
    const p = flush(() => T + 200_000);
    await Promise.resolve();
    const t4 = enqueue('tally', { date: '2026-11-18', counts: { a: 4 } }, T + 200_000);
    expect(queued().map((e) => e.id)).toEqual([t3.id, sell.id, other.id, i2.id, t4.id]);
    release();
    await p;
  });

  it('a keepalive flush (the page hidden) keeps each request under the browser’s 64 KB; one larger waits for the next open', async () => {
    for (let i = 0; i < 6; i++) enqueue('island', { date: `2026-11-1${i}`, taken: [], pad: 'x'.repeat(20_000) }, T, 120_000);
    expect(releaseHeld(T)).toBe(true);
    enqueue('wnote', wnote(9), T);
    const r = await flush(() => T, { keepalive: true });
    expect(bodies.map((b) => b.body.events.length)).toEqual([3, 3]);
    expect(bodies.every((b) => bytes(b.body) < 64 * 1024)).toBe(true);
    expect(r.remaining).toBe(1); // the note: its own next flush
    expect(releaseHeld(T)).toBe(false);
  });

  it('a keepalive counts the body in bytes, as the browser does: 25k Japanese characters are 75 KB', async () => {
    enqueue('wnote', { id: 'n1', text: 'あ'.repeat(25_000) }, T);
    const small = enqueue('pref', { key: 'moveGoal', value: 450 }, T);
    await flush(() => T, { keepalive: true });
    expect(bodies.map((b) => b.body.events.map((e: { id: string }) => e.id))).toEqual([[small.id]]);
    expect(bodies.every((b) => bytes(b.body) < 64 * 1024)).toBe(true);
  });

  it('a keepalive passes over one event too big for it: the held rows behind it still go', async () => {
    enqueue('wnote', { id: 'n1', text: 'x'.repeat(70_000) }, T); // due, over 64 KB alone
    const row = enqueue('island', { date: '2026-11-10', taken: [] }, T, 120_000);
    releaseHeld(T);
    const r = await flush(() => T, { keepalive: true });
    expect(bodies.map((b) => b.body.events.map((e: { id: string }) => e.id))).toEqual([[row.id]]);
    expect(r.remaining).toBe(1);
  });
});

describe('what the unsent line counts (health A10)', () => {
  it('nothing while every write is held or fresh; all of them once one has waited STUCK_MS past its hold', async () => {
    enqueue('tally', { date: '2026-11-18', counts: { a: 1 } }, T, 60_000);
    expect(unsentStuck(T + 60_000 + STUCK_MS - 1)).toBe(0);
    expect(unsentStuck(T + 60_000 + STUCK_MS)).toBe(1);
    enqueue('pref', { key: 'moveGoal', value: 450 }, T);
    answer = () => ({ ok: false, error: 'unavailable' });
    await flush(() => T);
    expect(unsentStuck(T + 1000)).toBe(0);
    expect(unsentStuck(T + STUCK_MS)).toBe(2); // backed off that long: counted
    expect(lastSentAt()).toBeNull();
    answer = (b) => ({ ok: true, results: b.events.map((e: { id: string }) => ({ id: e.id, ok: true })) });
    await flush(() => T + STUCK_MS + 60_000);
    expect(lastSentAt()).toBe(T + STUCK_MS + 60_000);
    expect(unsentStuck(T + 10 * STUCK_MS)).toBe(0);
  });
});


describe('a group (the shop’s ぜんぶ かう: relay store.ts group)', () => {
  const ids = (b: { body: Record<string, any> }) => b.body.events.map((e: { id: string }) => e.id);
  const buy = (item: string, at: number, hold: number, group = 'g1') => enqueue('buy', { item, price: 10, d: '2026-11-04' }, at, hold, group);

  it('waits while any of it is held, then goes whole in one request, each event naming its group', async () => {
    const a = buy('f1', T, 5000), b = buy('f2', T + 1, 5000), c = buy('f3', T + 2, 5000);
    const find = enqueue('find', { kind: 'fish', id: 'dab' }, T);
    await flush(() => T + 5001); // a and b are due, c not yet
    expect(bodies.map(ids)).toEqual([[find.id]]);
    expect(nextRetryAt(T + 5001)).toBe(T + 5002);
    await flush(() => T + 5002);
    expect(ids(bodies[1])).toEqual([a.id, b.id, c.id]);
    expect(bodies[1].body.events.map((e: { group?: string }) => e.group)).toEqual(['g1', 'g1', 'g1']);
    expect(bodies[0].body.events[0]).not.toHaveProperty('group');
    expect(queued()).toEqual([]);
  });

  it('is never cut by a batch’s end: it goes whole in the next request', async () => {
    const before = Array.from({ length: 40 }, (_, i) => enqueue('find', { kind: 'fish', id: `x${i}` }, T));
    const group = Array.from({ length: 20 }, (_, i) => buy(`f${i + 1}`, T, 0));
    await flush(() => T);
    expect(bodies.map(ids)).toEqual([before.map((e) => e.id), group.map((e) => e.id)]);
  });

  it('a buy of a piece I have already (my other phone’s) is dropped with the record’s `owned`, the rest acked', async () => {
    const [a, b] = [buy('f1', T, 0), buy('f2', T, 0)];
    answer = () => ({ ok: true, results: [{ id: a.id, ok: false, error: 'bad_request', detail: 'owned' }, { id: b.id, ok: true, at: '2026-11-02T00:00:00.000Z' }] });
    const r = await flush(() => T);
    expect(r.dropped.map((e) => [e.id, e.detail])).toEqual([[a.id, 'owned']]);
    expect(r.acked.map((e) => e.id)).toEqual([b.id]);
  });
});
