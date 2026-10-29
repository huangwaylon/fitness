// Round 5 U3: an action must move the score and fruit at once, in live mode (queued events through the model)
// (the demo runs the same model on generated rows: demoRows.test.ts), and must not snap back between the server's ack and the next fetch.
import { beforeEach, describe, expect, it } from 'vitest';
import type { SnapshotRows } from '#lib/contract/api.ts';
import { applySnapshot, configure, enqueue, flush, queued, setKey, unqueue, type KV, type QueuedEvent } from './gas.ts';
import { composeView, notInCache } from './view.ts';
import { mergeRows } from '#lib/model/snapshot.ts';

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

const NOW = Date.parse('2026-11-18T12:00:00.000Z'); // Wed 21:00 JST, a scored (non-calibration) week
const rows = (): SnapshotRows => ({
  metrics: [['2026-11-17T12:00:00.000Z', 'A', '2026-11-17', 'steps', 6000]],
  // A 45-minute yoga session: an ask-type workout, so it waits for 「筋トレでしたか？」.
  workouts: [['2026-11-17T12:00:00.000Z', 'A', 'yoga-1', '2026-11-17', 'Yoga', '2026-11-17T19:00:00+09:00', '2026-11-17T19:45:00+09:00', 45, 110]],
  presence: [],
  events: []
});
const ev = (id: string, type: QueuedEvent['type'], data: Record<string, unknown>): QueuedEvent => ({ id, type, data, queuedAt: NOW, tries: 0, nextAt: NOW });

beforeEach(() => {
  configure({ storage: new Mem(), fetch: (async () => new Response(JSON.stringify({ ok: true }))) as typeof fetch, url: 'https://script.example/exec' });
  setKey('ab'.repeat(32), 'A');
});

describe('live optimistic view', () => {
  const cache = applySnapshot(null, { me: 'A', now: new Date(NOW).toISOString(), rows: rows() }, NOW);

  it('はい on a pending yoga workout counts a strength day and raises the score at once', () => {
    const before = composeView(cache, [], NOW);
    expect(before.pending.map((p) => p.id)).toEqual(['yoga-1']);
    const after = composeView(cache, [ev('c1', 'confirm', { kind: 'workout', id: 'yoga-1', yes: true })], NOW);
    expect(after.pending).toEqual([]);
    expect(after.people.A.fruits.coconut.actual).toBe((before.people.A.fruits.coconut.actual ?? 0) + 1);
    expect(after.people.A.score).toBeGreaterThan(before.people.A.score);
  });

  it('a habit tick grows the pear and the score at once', () => {
    const before = composeView(cache, [], NOW);
    const after = composeView(cache, [ev('t1', 'checkin', { date: '2026-11-18', habit: 'teishoku_lunch', done: true })], NOW);
    expect(after.people.A.fruits.pear.milli).toBeGreaterThan(before.people.A.fruits.pear.milli);
    expect(after.people.A.score).toBeGreaterThanOrEqual(before.people.A.score);
  });

  it('keeps an acked event in the view until the server rows bring it back', async () => {
    enqueue('checkin', { date: '2026-11-18', habit: 'teishoku_lunch', done: true }, NOW);
    const sent = queued();
    const r = await flush(() => NOW);
    expect(r.sent).toBe(1);
    expect(queued()).toEqual([]);
    // Before the fix the store composed only `queued()` here, so the tick vanished until the reconcile fetch.
    const pending = notInCache(cache, sent);
    expect(composeView(cache, [...pending, ...queued()], NOW).people.A.habits?.ticksByDate['2026-11-18']).toEqual(['teishoku_lunch']);
    const fetched = { ...cache, rows: mergeRows(cache.rows, { events: [['2026-11-18T12:00:01.000Z', 'A', sent[0].id, 'checkin', JSON.stringify(sent[0].data)]] }) };
    expect(notInCache(fetched, sent)).toEqual([]);
  });

  it('holds an undoable event: it shows at once, is not sent in the window, and undo drops it', async () => {
    const held = enqueue('transfer', { month: '2026-10' }, NOW, 5000);
    expect((await flush(() => NOW)).sent).toBe(0);
    expect(unqueue(held.id)).toBe(true);
    expect(queued()).toEqual([]);
    const later = enqueue('transfer', { month: '2026-10' }, NOW, 5000);
    expect((await flush(() => NOW + 5000)).sent).toBe(1);
    expect(unqueue(later.id)).toBe(false);
  });
});
