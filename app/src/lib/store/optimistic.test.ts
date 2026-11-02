// An action must show at once, in live mode (queued events through the model)
// (the demo runs the same model on generated rows: demoRows.test.ts), and must not snap back between the server's ack and the next fetch.
import { beforeEach, describe, expect, it } from 'vitest';
import type { SnapshotRows } from '#lib/contract/api.ts';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { configureTransport } from '#lib/sync/transport.ts';
import { enqueue, flush, queued, unqueue, type QueuedEvent } from '#lib/sync/queue.ts';
import { applySnapshot, type SnapshotCache } from '#lib/sync/cache.ts';
import { setKey } from '#lib/sync/pairing.ts';
import { buildWeekView } from '#lib/model/week.ts';
import { composeModel, notInCache } from './view.ts';
import { asRecord } from '#lib/sync/fake-record.ts';
import { mergeRows } from '#lib/model/snapshot.ts';
import { reduce } from '#lib/model/state.ts';

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

const NOW = Date.parse('2026-11-18T12:00:00.000Z'); // Wed 21:00 JST
const rows = (): SnapshotRows => ({
  metrics: [['2026-11-17T12:00:00.000Z', 'A', '2026-11-17', 'steps', 6000], ['2026-11-18T11:00:00.000Z', 'A', '2026-11-18', 'move_kcal', 450]],
  events: []
});
const ev = (id: string, type: QueuedEvent['type'], data: Record<string, unknown>): QueuedEvent => ({ id, type, data, queuedAt: NOW, tries: 0, nextAt: NOW });

function composeView(cache: SnapshotCache, queue: QueuedEvent[], now: number) {
  const m = composeModel(cache, queue, now);
  return buildWeekView(m.state, m.me, m.now);
}

beforeEach(() => {
  configureStorage({ local: new Mem() });
  configureTransport({ fetch: (async (_u: unknown, init?: RequestInit) => new Response(JSON.stringify(asRecord(() => ({ ok: true }))(JSON.parse(String(init?.body)))))) as typeof fetch, url: 'https://script.example/exec' });
  setKey('ab'.repeat(32), 'A');
});

describe('live optimistic view', () => {
  const cache = applySnapshot(null, { me: 'A', rev: 'r1', now: new Date(NOW).toISOString(), rows: rows() }, NOW);

  it('a new Move goal re-prices today’s 🍐 at once', () => {
    const before = composeView(cache, [], NOW);
    expect(before.people.A.rings.pear).toEqual({ today: 450, goal: 600, met: false, stretched: false });
    const after = composeView(cache, [ev('g1', 'pref', { key: 'moveGoal', value: 450 })], NOW);
    expect(after.people.A.rings.pear).toEqual({ today: 450, goal: 450, met: true, stretched: false });
    expect(after.people.A.today.bells).toBe(before.people.A.today.bells + 1);
  });

  it('keeps an acked event in the view until the server rows bring it back', async () => {
    enqueue('pref', { key: 'moveGoal', value: 450 }, NOW);
    const sent = queued();
    const r = await flush(() => NOW);
    expect(r.sent).toBe(1);
    expect(queued()).toEqual([]);
    // Before the fix the store composed only `queued()` here, so the change vanished until the reconcile fetch.
    const pending = notInCache(cache, sent);
    expect(composeView(cache, [...pending, ...queued()], NOW).people.A.moveGoal).toBe(450);
    const fetched = { ...cache, rows: mergeRows(cache.rows, { events: [['2026-11-18T12:00:01.000Z', 'A', sent[0].id, 'pref', JSON.stringify(sent[0].data)]] }) };
    expect(notInCache(fetched, sent)).toEqual([]);
  });

  it('holds an undoable event: it shows at once, is not sent in the window, and undo drops it', async () => {
    const held = enqueue('spend_void', { spendId: 's1' }, NOW, 5000);
    expect((await flush(() => NOW)).sent).toBe(0);
    expect(unqueue(held.id)).toBe(true);
    expect(queued()).toEqual([]);
    const later = enqueue('spend_void', { spendId: 's1' }, NOW, 5000);
    expect((await flush(() => NOW + 5000)).sent).toBe(1);
    expect(unqueue(later.id)).toBe(false);
  });

  it('queued events fold over the cached rows’ one reduce: the same State as a whole reduce, the base untouched', () => {
    const base = applySnapshot(null, { me: 'A', rev: 'r1', now: new Date(NOW).toISOString(), rows: {
      ...rows(),
      events: [
        ['2026-11-17T12:00:01.000Z', 'A', 'p0', 'pref', '{"key":"villagerName","value":"ウェイ"}'],
        ['2026-11-17T12:00:02.000Z', 'B', 'f0', 'find', '{"kind":"fish","id":"dab"}'],
        ['2026-11-17T12:00:03.000Z', 'A', 's0', 'spend', '{"spendId":"sp0","item":"snack","bells":8}']
      ]
    } }, NOW);
    const q = [
      ev('g1', 'pref', { key: 'moveGoal', value: 450 }), ev('n1', 'pref', { key: 'villagerName', value: 'うめ' }),
      ev('v1', 'spend_void', { spendId: 'sp0' }), ev('f1', 'find', { kind: 'bug', id: 'moth' }), ev('h1', 'harvest', { week: '2026-11-09' })
    ];
    const plain = composeModel(base, [], NOW);
    const snap = JSON.stringify(plain.state, (_k, v) => (v instanceof Map ? [...v] : v));
    const folded = composeModel(base, q, NOW, plain);
    expect(folded.state).not.toBe(plain.state);
    // the cached rows' State is reused (not reduced again) and never changed by the fold
    expect(composeModel(base, [], NOW).state).toBe(plain.state);
    expect(JSON.stringify(plain.state, (_k, v) => (v instanceof Map ? [...v] : v))).toBe(snap);
    expect(folded.state.metrics).toBe(plain.state.metrics);
    // …and the fold is exactly what reducing everything at once gives
    const whole = { state: reduce({ ...base.rows, events: [...base.rows.events, ...JSON.parse(folded.from!.extra)] }, folded.from!.rev) };
    const norm = (s: unknown) => JSON.stringify(s, (_k, v) => (v instanceof Map ? [...v] : v));
    expect(norm(folded.state)).toBe(norm(whole.state));
    expect(folded.state.prefs.A.villagerName).toBe('うめ');
    expect(folded.state.spendVoids.map((x) => x.spendId)).toEqual(['sp0']);
    expect(plain.state.spendVoids).toEqual([]);
  });
});
