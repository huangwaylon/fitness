// The one-off delete of the retired ききみみ's `listen` rows (store.ts purgeListen, the user's 2026-11-16 decision):
// every person's old rows go, English Study's (`gm` 'tv') stay, as do Health rows and every other event; a dry run
// deletes nothing; a deleted row's resend is never kept again; a new epoch after. Made-up content only.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const T0 = Date.parse('2026-11-05T03:00:00.000Z'); // 12:00 Tokyo, 2026-11-05

const quiz = (g: string, extra: object = {}) => ({ d: '2026-11-05', g, lv: 3, n: 1, ms: 240_000, r: [['w3-gotta', 1, 0, 0]], ...extra });
const tv = (g: string) => ({ d: '2026-11-05', g, gm: 'tv', u: 'waitress', lv: 7, n: 1, ms: 420_000, f: 1, r: [['waitress-q1', 1, 1, 0]] });
const flag = { item: 'waitress', q: 1, kind: 'answer', note: 'x', t: 4.2, v: 'k3f9', seen: { stem: 'How much?', answer: '$100', line: 'a line' } };

describe('purge_listen', () => {
  let now: number;
  let store: StoreCore;
  let told: unknown[];
  beforeEach(() => {
    now = T0;
    told = [];
    const db = memSql();
    store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => now, notify: (n) => told.push(n) });
  });
  const call = (key: string, action: string, extra: object = {}) => store.handle({ key, action, ...extra }, 100) as Record<string, any>;
  let n = 0;
  const send = (key: string, type: string, data: object, id = `e${++n}`) => {
    now += 1000;
    return call(key, 'event', { id, type, data });
  };
  const types = () => (call(KEY_A, 'snapshot').rows.events as string[][]).map((r) => `${r[1]}:${r[3]}:${JSON.parse(r[4]).gm ?? ''}`).sort();

  const seed = () => {
    store.load({ rows: { metrics: [['2026-11-05T01:00:00.000Z', 'A', '2026-11-05', 'steps', 4000], ['2026-11-05T01:00:00.000Z', 'B', '2026-11-05', 'steps', 5000]] } });
    // (the old rows as a dump brings them: no phone can send one since listen.ts took English Study's rows only)
    const old = [['A', 'old-a1', quiz('game1')], ['A', 'old-a2', quiz('game2', { gm: 'tile' })], ['B', 'old-b1', quiz('game3', { gm: 'story', r: [] })], ['G', 'old-g1', quiz('game4')]] as const;
    expect(store.load({ rows: { events: old.map(([who, id, d], i) => [`2026-11-05T02:0${i}:00.000Z`, who, id, 'listen', JSON.stringify(d)]) } })).toMatchObject({ events: 4 });
    expect(send(KEY_A, 'listen', quiz('game5')).ok).toBe(false);
    for (const [key, data, id] of [[KEY_A, tv('clip1'), 'tv-a1'], [KEY_C, tv('clip2'), 'tv-g1']] as const) expect(send(key, 'listen', data, id).ok, id).toBe(true);
    expect(send(KEY_A, 'eflag', flag).ok).toBe(true);
    expect(send(KEY_B, 'pref', { key: 'locale', value: 'en' }).ok).toBe(true);
  };

  it('counts the listen rows per person and game', () => {
    seed();
    expect(store.listenCounts()).toEqual({ A: { quiz: 1, tile: 1, tv: 1 }, B: { story: 1 }, G: { quiz: 1, tv: 1 } });
  });

  it('a dry run deletes nothing and says what would go', () => {
    seed();
    const was = types(), counts = store.counts();
    const r = store.purgeListen({ keep_gm: 'tv', dry_run: true });
    expect(r).toMatchObject({ ok: true, dry_run: true, gone: { A: 2, B: 1, G: 1 }, deleted: 0, counts });
    expect(r.after).toEqual(r.before);
    expect(r.rev).toBeUndefined();
    expect(types()).toEqual(was);
  });

  it('deletes only the old listen rows: English Study, Health and every other event stay; a new epoch after', () => {
    seed();
    const was = store.counts();
    told.length = 0;
    const r = store.purgeListen({ keep_gm: 'tv' });
    expect(r).toMatchObject({ ok: true, dry_run: false, gone: { A: 2, B: 1, G: 1 }, deleted: 4, after: { A: { tv: 1 }, G: { tv: 1 } }, rev: 'e2' });
    expect(store.counts()).toEqual({ ...was, events: was.events - 4 }); // the ids kept: a resend stays a duplicate
    expect(types()).toEqual(['A:eflag:', 'A:listen:tv', 'B:pref:', 'G:listen:tv']);
    expect((call(KEY_A, 'snapshot').rows.metrics as unknown[]).length).toBe(2);
    expect(told).toHaveLength(1); // the phones drop their caches
    // an old build's resend of a deleted row: acknowledged, never kept again
    expect(send(KEY_A, 'listen', quiz('game1'), 'old-a1')).toEqual({ ok: true, duplicate: true });
    expect(store.load({ rows: { events: [['2026-11-05T02:00:00.000Z', 'A', 'old-a2', 'listen', JSON.stringify(quiz('game2', { gm: 'tile' }))]] } })).toMatchObject({ events: 0 });
    expect(store.listenCounts()).toEqual({ A: { tv: 1 }, G: { tv: 1 } });
    // again: nothing to delete, no epoch
    expect(store.purgeListen({ keep_gm: 'tv' })).toMatchObject({ deleted: 0, gone: {} });
    expect(store.counts().events).toBe(was.events - 4);
  });

  it('is refused without keep_gm: tv', () => {
    seed();
    for (const o of [{}, { keep_gm: 'quiz' }, { keep_gm: 'TV' }]) expect(store.purgeListen(o)).toMatchObject({ ok: false, error: 'bad_request' });
    expect(store.listenCounts().A).toEqual({ quiz: 1, tile: 1, tv: 1 });
  });
});
