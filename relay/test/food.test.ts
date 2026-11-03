// The meal log in the record (docs/backend.md#events `food`): an entry set or removed, each entry's latest op kept
// (one row per entry), removal final; the food's name cleaned here as on the phone; anyone logs their own (the guest
// too), only the owner edits or removes; every phone sees every meal, the guest's too; the daily kcal goal a pref.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { foodFold, foodOp, type FoodEntry, type FoodOp } from '../../app/src/lib/contract/food.ts';
import type { Notice } from '../../app/src/lib/sync/live-protocol.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const T0 = Date.parse('2026-11-03T03:00:00.000Z');
const RICE = { id: 'mext:01088', n: 'こめ 精白米 うるち米 めし', k: 156, p: 2.5, fa: 0.3, c: 37.1, s: 0, u: '1杯' };

describe('the meal log in the record', () => {
  let now: number;
  let notices: Notice[];
  let db: ReturnType<typeof memSql>;
  let store: StoreCore;
  const open = () => new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => now, notify: (n) => notices.push(n) });
  beforeEach(() => {
    now = T0;
    notices = [];
    db = memSql();
    store = open();
  });
  const call = (key: string, action: string, extra: object = {}) => store.handle({ key, action, ...extra }, 100) as Record<string, any>;
  const keyOf = { A: KEY_A, B: KEY_B, G: KEY_C } as const;
  let n = 0;
  /** `who` sends a food op (its event id fresh each time). */
  const send = (who: 'A' | 'B' | 'G', data: object) => call(keyOf[who], 'event', { id: `e${++n}`, type: 'food', data });
  const log = (who: 'A' | 'B' | 'G', id: string, extra: object = {}, at = (now += 1000)) =>
    send(who, { id, at, d: '2026-11-03', m: 'l', g: 150, f: RICE, ...extra });
  const rows = (key = KEY_A) => (call(key, 'snapshot').rows.events as [string, 'A' | 'B' | 'G', string, string, string][]).filter((r) => r[3] === 'food');
  /** The entries as a phone gets them (its snapshot's food rows, folded). */
  const entries = (key = KEY_A): FoodEntry[] => foodFold(rows(key).map((r) => ({ ...foodOp(JSON.parse(r[4]))!, who: r[1] }) as FoodOp & { who: 'A' | 'B' | 'G' }));

  it('keeps an entry, tells the phones, and the partner’s and the guest’s phones see it', () => {
    expect(log('A', 'fmeal001')).toMatchObject({ ok: true });
    expect(notices.at(-1)).toMatchObject({ what: 'event', who: 'A' });
    for (const key of [KEY_B, KEY_C]) expect(entries(key)).toMatchObject([{ id: 'fmeal001', who: 'A', d: '2026-11-03', m: 'l', g: 150, f: RICE }]);
  });

  it('cleans the food’s name and label, rounds the grams, and keeps it as cleaned', () => {
    expect(log('B', 'fmeal002', { g: 12.3, f: { ...RICE, n: '  ご\u0007はん\n大盛り\u202e ', u: ' 1\t杯 ' } })).toMatchObject({ ok: true });
    expect(JSON.parse(rows()[0][4]).f).toEqual({ ...RICE, n: 'ごはん 大盛り', u: '1 杯' });
    expect(entries()[0].g).toBe(12.3);
    // a long name is cut at 60 characters; a missing nutrient is unknown (null)
    const { p: _p, ...noProtein } = RICE;
    expect(log('B', 'fmeal003', { f: { ...noProtein, n: 'あ'.repeat(80) } })).toMatchObject({ ok: true });
    expect(entries().find((e) => e.id === 'fmeal003')?.f).toMatchObject({ n: 'あ'.repeat(60), p: null });
  });

  it('refuses a malformed op', () => {
    const at = now;
    const bad = [
      { id: 'nope', at, d: '2026-11-03', m: 'l', g: 150, f: RICE },
      { id: 'fmeal010', at: 'x', d: '2026-11-03', m: 'l', g: 150, f: RICE },
      { id: 'fmeal010', at, d: '2026-02-30', m: 'l', g: 150, f: RICE },
      { id: 'fmeal010', at, d: '2026-11-05', m: 'l', g: 150, f: RICE }, // after tomorrow
      { id: 'fmeal010', at, d: '2026-11-03', m: 'x', g: 150, f: RICE },
      { id: 'fmeal010', at, d: '2026-11-03', m: 'l', g: 0, f: RICE },
      { id: 'fmeal010', at, d: '2026-11-03', m: 'l', g: 5000.1, f: RICE },
      { id: 'fmeal010', at, d: '2026-11-03', m: 'l', g: 1.25, f: RICE },
      { id: 'fmeal010', at, d: '2026-11-03', m: 'l', g: 150, f: { ...RICE, k: 951 } },
      { id: 'fmeal010', at, d: '2026-11-03', m: 'l', g: 150, f: { ...RICE, s: 101 } },
      { id: 'fmeal010', at, d: '2026-11-03', m: 'l', g: 150, f: { ...RICE, n: ' \u0000 ' } },
      { id: 'fmeal010', at, d: '2026-11-03', m: 'l', g: 150, f: { ...RICE, id: 'x'.repeat(65) } },
      { id: 'fmeal010', at, d: '2026-11-03', m: 'l', g: 150, f: { ...RICE, html: '<b>' } },
      { id: 'fmeal010', at, d: '2026-11-03', m: 'l', g: 150, f: RICE, person: 'B' },
      { id: 'fmeal010', at, rm: true, g: 1 }
    ];
    for (const d of bad) expect(send('A', d)).toMatchObject({ ok: false, error: 'bad_request' });
    expect(log('A', 'fmeal011', { d: '2026-11-04' })).toMatchObject({ ok: true }); // tomorrow is fine
  });

  it('lets the owner edit, the latest op kept as the entry’s one row, an older edit acknowledged and dropped', () => {
    const at = now + 1000;
    log('A', 'fmeal020', {}, at);
    expect(log('A', 'fmeal020', { g: 200, m: 'd' }, at + 5000)).toMatchObject({ ok: true });
    expect(log('A', 'fmeal020', { g: 50 }, at + 2000)).toMatchObject({ ok: true, duplicate: true });
    expect(entries()).toMatchObject([{ id: 'fmeal020', g: 200, m: 'd', at: at + 5000 }]);
    expect(rows()).toHaveLength(1);
  });

  it('lets only the owner edit or remove: the partner, a member, the guest are refused', () => {
    log('G', 'fmeal030');
    log('A', 'fmeal031');
    expect(log('A', 'fmeal030', { g: 1 })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(send('B', { id: 'fmeal030', at: (now += 1000), rm: true })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(log('G', 'fmeal031', { g: 1 })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(send('G', { id: 'fmeal031', at: (now += 1000), rm: true })).toMatchObject({ ok: false, error: 'forbidden' });
    // the guest edits and removes its own
    expect(log('G', 'fmeal030', { g: 300 })).toMatchObject({ ok: true });
    expect(entries().map((e) => [e.id, e.who, e.g])).toEqual([['fmeal030', 'G', 300], ['fmeal031', 'A', 150]]);
    expect(send('G', { id: 'fmeal030', at: (now += 1000), rm: true })).toMatchObject({ ok: true });
    expect(entries().map((e) => e.id)).toEqual(['fmeal031']);
  });

  it('a removal is final: a later set is acknowledged and dropped; a removal of an entry it never held too', () => {
    log('B', 'fmeal040');
    expect(send('B', { id: 'fmeal040', at: (now += 1000), rm: true })).toMatchObject({ ok: true });
    expect(log('B', 'fmeal040', { g: 99 })).toMatchObject({ ok: true, duplicate: true });
    expect(send('B', { id: 'fmeal041', at: (now += 1000), rm: true })).toMatchObject({ ok: true, duplicate: true });
    expect(entries()).toEqual([]);
    expect(rows()).toHaveLength(1); // the removal's row
  });

  it('acknowledges a retry of the same event as a duplicate', () => {
    const ev = { id: 'e-retry', type: 'food', data: { id: 'fmeal050', at: now + 1000, d: '2026-11-03', m: 'b', g: 80, f: RICE } };
    expect(call(KEY_A, 'event', ev)).toMatchObject({ ok: true });
    expect(call(KEY_A, 'event', ev)).toEqual({ ok: true, duplicate: true });
    expect(rows()).toHaveLength(1);
  });

  it('takes a kcal goal: either member for either, the guest its own only', () => {
    const pref = (who: 'A' | 'B' | 'G', data: object) => call(keyOf[who], 'event', { id: `p${++n}`, type: 'pref', data });
    expect(pref('A', { person: 'B', key: 'kcalGoal', value: 1800 })).toMatchObject({ ok: true });
    expect(pref('G', { key: 'kcalGoal', value: 2000 })).toMatchObject({ ok: true });
    expect(pref('G', { person: 'A', key: 'kcalGoal', value: 2000 })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(pref('G', { key: 'kcalGoal', value: null })).toMatchObject({ ok: true });
    const goals = (call(KEY_C, 'snapshot').rows.events as unknown[][]).filter((r) => r[3] === 'pref');
    // one row per person (the latest): the guest's clear replaced its goal
    expect(goals.map((r) => [r[1], JSON.parse(r[4] as string)])).toEqual([
      ['A', { person: 'B', key: 'kcalGoal', value: 1800 }],
      ['G', { key: 'kcalGoal', value: null }]
    ]);
  });

  it('persists: a new store has the entries, and a dump loads back as it was (a beaten op skipped)', () => {
    log('A', 'fmeal060');
    log('G', 'fmeal061');
    store = open();
    expect(entries().map((e) => e.id)).toEqual(['fmeal060', 'fmeal061']);
    const dumped = store.dump().rows.events.filter((r) => r[3] === 'food');
    expect(dumped).toHaveLength(2);
    db = memSql();
    store = open();
    expect(store.load({ rows: { events: dumped } })).toMatchObject({ ok: true, events: 2 });
    expect(entries().map((e) => [e.id, e.who])).toEqual([['fmeal060', 'A'], ['fmeal061', 'G']]);
    // someone else's op on an entry, in a load: only its id is kept
    const other = [new Date(now + 5000).toISOString(), 'B', 'e-other', 'food', JSON.stringify({ id: 'fmeal060', at: now + 5000, rm: true })];
    expect(store.load({ rows: { events: [other] } })).toMatchObject({ ok: true, events: 0 });
    expect(entries().map((e) => e.id)).toEqual(['fmeal060', 'fmeal061']);
  });
});
