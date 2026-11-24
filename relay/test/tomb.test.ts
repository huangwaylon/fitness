// Removals expire (contract/tomb.ts, docs/backend.md#events "Latest op only"): the daily prune deletes the removal rows
// stored more than 60 days ago (never an outdoor object's or a seed item's, never another row), their ids kept; a late
// op on a removed item is still acknowledged and dropped; a phone whose `since` predates a pruned removal refetches.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { newPostId } from '../../app/src/lib/contract/board.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const T0 = Date.parse('2026-09-01T03:00:00.000Z');
const DAY = 86_400_000;
const RICE = { id: 'mext:01088', n: 'こめ 精白米 うるち米 めし', k: 156, p: 2.5, fa: 0.3, c: 37.1, s: 0, u: '1杯' };
type W = 'A' | 'B' | 'G';

describe('removals expire', () => {
  let now: number;
  let db: ReturnType<typeof memSql>;
  let store: StoreCore;
  beforeEach(() => {
    now = T0;
    db = memSql();
    store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => now, notify: () => {} });
  });
  const call = (key: string, action: string, extra: object = {}) => store.handle({ key, action, ...extra }, 100) as Record<string, any>;
  const keyOf = { A: KEY_A, B: KEY_B, G: KEY_C } as const;
  let n = 0;
  const send = (who: W, type: string, data: object, id = `e${++n}`) => call(keyOf[who], 'event', { id, type, data });
  const at = () => (now += 1000);
  const rows = (type: string) => (call(KEY_A, 'snapshot').rows.events as [string, W, string, string, string][]).filter((r) => r[3] === type);
  const removals = () => db.sql.exec<{ type: string }>("SELECT type FROM events WHERE json_extract(data, '$.rm') = 1 ORDER BY type").toArray().map((r) => r.type);
  const count = () => db.sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM events').toArray()[0].n;

  /** One of each: a board post, a meal, a room's piece, a to-do list, a packing item (and a seed's), an outdoor object
   *  made and removed; a spend kept beside them. */
  function seed() {
    const post = newPostId(now);
    expect(send('A', 'board', { id: post, at: now, p: now, t: 'やあ' })).toMatchObject({ ok: true });
    expect(send('A', 'board', { id: post, at: at(), rm: true }, 'rm-board')).toMatchObject({ ok: true });
    expect(send('A', 'food', { id: 'fmeal001', at: at(), d: '2026-09-01', m: 'l', g: 150, f: RICE })).toMatchObject({ ok: true });
    expect(send('A', 'food', { id: 'fmeal001', at: at(), rm: true }, 'rm-food')).toMatchObject({ ok: true });
    const piece = `d${now.toString(36)}000`;
    expect(send('A', 'decor', { sc: 't', id: piece, at: at(), item: 'f1', x: 0, z: 0, f: 0, p: now })).toMatchObject({ ok: true });
    expect(send('A', 'decor', { sc: 't', id: piece, at: at(), rm: true }, 'rm-tent')).toMatchObject({ ok: true });
    expect(send('B', 'todo', { id: 'dshop01', at: at(), title: '買い物', ord: 0 })).toMatchObject({ ok: true });
    expect(send('B', 'todo', { id: 'dshop01', at: at(), rm: true }, 'rm-todo')).toMatchObject({ ok: true });
    expect(send('A', 'pack', { trip: 'okinawa', id: '_capnew04', at: at(), kind: 'item', cat: 'gear', ord: 5, name: { ja: 'かさ' }, by: 'A' })).toMatchObject({ ok: true });
    expect(send('A', 'pack', { trip: 'okinawa', id: '_capnew04', at: at(), rm: true }, 'rm-pack')).toMatchObject({ ok: true });
    expect(send('A', 'pack', { trip: 'okinawa', id: 'sunscreen', at: at(), rm: true }, 'rm-seed')).toMatchObject({ ok: true });
    expect(send('A', 'decor', { sc: 'o', id: 'oz', at: at(), rm: true }, 'rm-outdoor')).toMatchObject({ ok: true });
    expect(send('A', 'spend', { spendId: 's1', item: 'tree', bells: 1, day: '2026-09-01' })).toMatchObject({});
    return { post, piece };
  }

  it('deletes only the removals stored more than 60 days ago, never an outdoor object’s or a seed item’s; their ids stay known', () => {
    seed();
    const before = count();
    now = T0 + 60 * DAY - 60_000;
    expect(call(KEY_A, 'snapshot').rev).toBe('e1');
    // not yet 60 days: nothing
    expect(store.tombPrune()).toMatchObject({ old: 0, deleted: 0 });
    now = T0 + 61 * DAY;
    // a dry run counts them and names them, deleting nothing
    const dry = store.tombPrune(true);
    expect(dry).toMatchObject({ old: 5, deleted: 0, types: { board: 1, food: 1, decor: 1, todo: 1, pack: 1 } });
    expect(dry.ids?.sort()).toEqual(['rm-board', 'rm-food', 'rm-pack', 'rm-tent', 'rm-todo']);
    expect(count()).toBe(before);
    expect(store.tombPrune()).toMatchObject({ old: 5, deleted: 5 });
    expect(count()).toBe(before - 5);
    expect(removals()).toEqual(['decor', 'pack']);
    expect(store.tombPrune()).toMatchObject({ deleted: 0 });
    // a retry of a removal is a duplicate
    expect(send('A', 'board', { id: 'bwhatever', at: now, rm: true }, 'rm-board')).toEqual({ ok: true, duplicate: true });
  });

  it('a late op on a removed item, its own old or fresh, is acknowledged and dropped; a new item is kept', () => {
    const { post, piece } = seed();
    now = T0 + 61 * DAY;
    store.tombPrune();
    // a queued edit from before the removal
    expect(send('B', 'board', { id: post, at: T0 + 500, p: T0, t: 'まえ' })).toEqual({ ok: true, duplicate: true });
    expect(send('A', 'food', { id: 'fmeal001', at: T0 + 2500, d: '2026-09-01', m: 'l', g: 99, f: RICE })).toEqual({ ok: true, duplicate: true });
    expect(send('B', 'todo', { id: 'dshop01', at: T0 + 6500, title: 'まえ', ord: 0 })).toEqual({ ok: true, duplicate: true });
    // a fresh edit from a cache that never saw the removal: the id tells the item's age
    expect(send('B', 'board', { id: post, at: now, p: T0, t: 'いま' })).toEqual({ ok: true, duplicate: true });
    expect(send('A', 'decor', { sc: 't', id: piece, at: now, item: 'f1', x: 1, z: 1, f: 0, p: now })).toEqual({ ok: true, duplicate: true });
    expect(rows('board')).toEqual([]);
    expect(rows('food')).toEqual([]);
    expect(rows('todo')).toEqual([]);
    // and a new one goes in as ever
    const fresh = newPostId(now);
    expect(send('A', 'board', { id: fresh, at: now, p: now, t: 'あたらしい' })).toEqual({ ok: true });
    expect(send('A', 'food', { id: 'fmeal002', at: now, d: '2026-10-31', m: 'l', g: 150, f: RICE })).toEqual({ ok: true });
  });

  it('an old op on an item still held is judged as ever', () => {
    expect(send('A', 'food', { id: 'fkeep001', at: T0, d: '2026-09-01', m: 'l', g: 150, f: RICE })).toMatchObject({ ok: true });
    now = T0 + 80 * DAY;
    store.tombPrune();
    // (queued 70 days, newer than the row held)
    expect(send('A', 'food', { id: 'fkeep001', at: T0 + 10 * DAY, d: '2026-09-01', m: 'l', g: 99, f: RICE })).toEqual({ ok: true });
    expect(JSON.parse(rows('food')[0][4])).toMatchObject({ g: 99 });
  });

  it('a snapshot since before a removal let go answers another rev: the phone refetches everything', () => {
    seed();
    const since = call(KEY_A, 'snapshot').rows.events.at(-1)[0] as string;
    const early = new Date(T0).toISOString();
    now = T0 + 61 * DAY;
    // nothing pruned yet: as ever
    expect(call(KEY_A, 'snapshot', { since: early }).rev).toBe('e1');
    store.tombPrune();
    const stale = call(KEY_A, 'snapshot', { since: early, page: 500 });
    expect(stale).toMatchObject({ ok: true, rev: 'e1~t', rows: { metrics: [], events: [] } });
    expect(stale.next).toBeUndefined();
    // a cache that saw the removals, and a whole fetch, as ever
    expect(call(KEY_A, 'snapshot', { since }).rev).toBe('e1');
    expect(call(KEY_A, 'snapshot').rev).toBe('e1');
  });

  it('the metrics, the ベル rows and every other row stay', () => {
    seed();
    call(KEY_A, 'ingest', { dates: '2026-09-01', steps: '9000' });
    const kept = () => db.sql.exec<{ id: string }>("SELECT id FROM events WHERE json_extract(data, '$.rm') IS NOT 1 ORDER BY id").toArray().map((r) => r.id);
    const metrics = () => db.sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM metrics').toArray()[0].n;
    const was = { rows: kept(), metrics: metrics() };
    now = T0 + 200 * DAY;
    store.tombPrune();
    expect(kept()).toEqual(was.rows);
    expect(metrics()).toBe(was.metrics);
  });
});
