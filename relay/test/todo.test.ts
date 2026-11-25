// やること in the record (docs/backend.md#events `todo`, contract/todo.ts): anyone (the guest too) adds, edits, ticks,
// moves and removes the one list's items; the latest `at` wins per id (then who), a removal final; the cap; the texts
// cleaned; an older build's list op acknowledged and dropped; a dump loads back the same items; and the one-shot move
// from lists (store.ts todoMigrate, todoMigrate.ts): each list one item, idempotent, a dump of lists loaded then moved.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { migrate } from '../src/todoMigrate.ts';
import { todoFold, todoItems, todoRowOf, TODO_NOTE, type TodoRow } from '../../app/src/lib/contract/todo.ts';
import type { Notice } from '../../app/src/lib/contract/live-protocol.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const T0 = Date.parse('2026-11-20T03:00:00.000Z');
type W = 'A' | 'B' | 'G';

describe('やること in the record', () => {
  let now: number;
  let notices: Notice[];
  let logged: [string, Record<string, unknown>][];
  let db: ReturnType<typeof memSql>;
  let store: StoreCore;
  let armed = 0;
  const open = () => new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => now, notify: (n) => notices.push(n), onTodo: () => armed++, log: (e, d) => logged.push([e, d]) });
  beforeEach(() => {
    now = T0;
    armed = 0;
    notices = [];
    logged = [];
    db = memSql();
    store = open();
  });
  const call = (key: string, action: string, extra: object = {}) => store.handle({ key, action, ...extra }, 100) as Record<string, any>;
  const keyOf = { A: KEY_A, B: KEY_B, G: KEY_C } as const;
  let n = 0;
  const send = (who: W, data: object) => call(keyOf[who], 'event', { id: `e${++n}`, type: 'todo', data });
  const at = () => (now += 1000);
  const item = (who: W, id: string, text: string, extra: object = {}, t = at()) => send(who, { id, at: t, text, ord: 0, done: 0, ...extra });
  const rows = (key = KEY_A) => (call(key, 'snapshot').rows.events as [string, W, string, string, string][]).filter((r) => r[3] === 'todo');
  /** The items as a phone gets them (its snapshot's rows, folded). */
  const items = (key = KEY_A) => todoItems(todoFold(rows(key).map((r) => todoRowOf(r[3], JSON.parse(r[4]), r[1])).filter((r): r is TodoRow => r !== null)));

  it('anyone, the guest too, adds, edits, ticks and removes items; every phone is told', () => {
    expect(item('G', 'dmilk01', '牛乳')).toMatchObject({ ok: true });
    expect(notices.at(-1)).toMatchObject({ what: 'event', who: 'G' });
    expect(item('A', 'degg001', '卵', { ord: 1 })).toMatchObject({ ok: true });
    expect(item('B', 'dmilk01', '牛乳 2本', { done: 1, note: '低脂肪\nなければ普通の' })).toMatchObject({ ok: true });
    expect(send('G', { id: 'degg001', at: at(), rm: true })).toMatchObject({ ok: true });
    expect(items(KEY_C)).toEqual([{ id: 'dmilk01', text: '牛乳 2本', note: '低脂肪\nなければ普通の', ord: 0, done: true }]);
  });

  it('the latest `at` wins, then who; an older op and anything after a removal are acknowledged and change nothing', () => {
    const t = at();
    expect(item('A', 'ditem01', 'あと', {}, t + 5000)).toMatchObject({ ok: true });
    expect(item('B', 'ditem01', 'まえ', {}, t + 2000)).toMatchObject({ ok: true, duplicate: true });
    // the same `at`: G over B over A
    expect(item('G', 'ditem01', 'ゲスト', {}, t + 5000)).toMatchObject({ ok: true });
    expect(items()[0].text).toBe('ゲスト');
    expect(send('A', { id: 'ditem01', at: t + 6000, rm: true })).toMatchObject({ ok: true });
    expect(item('B', 'ditem01', 'again', {}, t + 9000)).toMatchObject({ ok: true, duplicate: true });
    expect(items()).toEqual([]);
    expect(send('A', { id: 'dnever1', at: at(), rm: true })).toMatchObject({ ok: true, duplicate: true });
    expect(rows().map((r) => JSON.parse(r[4]).id)).toEqual(['ditem01']);
  });

  it('cleans the text and the note as the phone does; refuses a malformed op or one a day ahead', () => {
    item('A', 'ditem01', '  Shop\u0007 \n list ', { note: ' a  \r\n\n\n b‮ ' });
    expect(items()[0]).toMatchObject({ text: 'Shop list', note: 'a\n\n b' });
    item('A', 'ditem02', 'x', { note: ' \n ' });
    expect(items()[1]).not.toHaveProperty('note');
    const bad: object[] = [
      { id: 'dbad001', at: now, text: ' ', ord: 0, done: 0 },
      { id: 'BAD', at: now, text: 'x', ord: 0, done: 0 },
      { id: 'dbad001', at: now, text: 'x', ord: 0 },
      { id: 'dbad001', at: now, text: 'x', ord: 0, done: 2 },
      { id: 'dbad001', at: now, text: 'x', ord: 0, done: 0, html: 1 },
      { id: 'dbad001', at: now, text: 'x', ord: 0, done: 0, note: 5 },
      { id: 'dbad001', at: now + 2 * 86400_000, text: 'x', ord: 0, done: 0 },
      { id: 'dbad001', at: now, rm: true, text: 'x' }
    ];
    for (const d of bad) expect(send('A', d), JSON.stringify(d)).toMatchObject({ ok: false, error: 'bad_request' });
  });

  it('an older build’s list or list item op is acknowledged and dropped, never kept', () => {
    expect(send('A', { id: 'dlist01', at: at(), title: '買い物', ord: 0 })).toMatchObject({ ok: true, duplicate: true });
    expect(send('B', { id: 'ditem01', at: at(), list: 'dlist01', text: '牛乳', ord: 0, done: 0 })).toMatchObject({ ok: true, duplicate: true });
    expect(rows()).toEqual([]);
  });

  it('a due and a reminder (anyone’s, the guest’s too) kept and carried by the item’s whole state; bad ones refused; each kept row re-arms', () => {
    expect(item('G', 'ditem01', '歯医者', { due: '2026-11-24T09:30', rem: 'b60', to: ['A', 'G'] })).toMatchObject({ ok: true });
    expect(armed).toBe(1);
    expect(item('B', 'ditem01', '歯医者', { due: '2026-11-24T09:30', rem: 'b60', to: ['A', 'G'], done: 1 })).toMatchObject({ ok: true });
    expect(items(KEY_C)).toEqual([{ id: 'ditem01', text: '歯医者', ord: 0, done: true, due: '2026-11-24T09:30', rem: 'b60', to: ['A', 'G'] }]);
    expect(store.todoItems()[0]).toMatchObject({ due: '2026-11-24T09:30', rem: 'b60' });
    for (const x of [{ due: '2026-02-30' }, { rem: 'at', to: ['A'] }, { due: '2026-11-24', rem: 'at', to: ['A'] }, { due: '2026-11-24', to: ['A'] }, { due: '2026-11-24', rem: 'am', to: ['A', 'A'] }])
      expect(item('A', 'ditem01', 'x', x), JSON.stringify(x)).toMatchObject({ ok: false, error: 'bad_request' });
    // an op beaten by the one held: acknowledged, no re-arm; one without the fields clears them
    const was = armed;
    expect(item('A', 'ditem01', 'old', {}, T0 - 50_000)).toMatchObject({ duplicate: true });
    expect(armed).toBe(was);
    item('A', 'ditem01', '歯医者');
    expect(items()[0]).toEqual({ id: 'ditem01', text: '歯医者', ord: 0, done: false });
  });

  it('at most 500 items standing: a new one past them is refused, a removal frees a place', () => {
    for (let i = 0; i < 500; i++) expect(item('A', `di${String(i).padStart(5, '0')}`, `#${i}`).ok).toBe(true);
    expect(item('A', 'dfull01', 'one more')).toMatchObject({ ok: false, error: 'bad_request' });
    expect(send('A', { id: 'di00001', at: at(), rm: true })).toMatchObject({ ok: true });
    expect(item('A', 'dfull01', 'one more')).toMatchObject({ ok: true });
  });

  it('a dump loads back the same items, idempotent', () => {
    item('A', 'da00001', 'a', { done: 1 });
    item('G', 'db00001', 'b', { note: 'x\ny' });
    item('G', 'db00001', 'b2', { ord: 3 });
    const before = items();
    const dumped = store.dump().rows.events;
    db = memSql();
    store = open();
    expect(store.load({ rows: { events: dumped } })).toMatchObject({ ok: true, events: dumped.length, skipped: 0 });
    expect(items()).toEqual(before);
    expect(store.load({ rows: { events: dumped } })).toMatchObject({ ok: true, events: 0 });
  });

  describe('the move from lists (todo_migrate)', () => {
    /** A dump's row of the old shape (list or item), as the record held it. */
    let k = 0;
    const ev = (who: W, d: object) => [new Date(T0 - 100_000 + ++k).toISOString(), who, `old${k}`, 'todo', JSON.stringify({ at: T0 - 100_000 + k, ...d })];
    const L = (who: W, id: string, title: string, ord = 0) => ev(who, { id, title, ord });
    const I = (who: W, id: string, list: string, text: string, ord: number, extra: object = {}) => ev(who, { id, list, text, ord, done: 0, ...extra });
    const seed = () => store.load({ rows: { events: [
      L('A', 'dshop01', '買い物', 1),
      I('A', 'di00001', 'dshop01', '牛乳', 0, { due: '2026-11-24T15:00', rem: 'b10', to: ['A'] }),
      I('G', 'di00002', 'dshop01', '卵', 1, { done: 1 }),
      I('B', 'di00003', 'dshop01', 'パン', 2, { due: '2026-11-22' }),
      I('B', 'di00004', 'dshop01', 'バター', 3, { due: '2026-11-21', done: 1 }),
      L('G', 'dhome01', '家のこと', 0),
      I('G', 'di00005', 'dhome01', 'ゴミ出し', 0, { done: 1 }),
      L('B', 'dempty1', '空', 2),
      // an item whose list is gone (none should be), and a removal's row, kept as it is
      I('A', 'di00006', 'dgone01', '迷子', 0),
      ev('A', { id: 'dlist99', rm: true })
    ] } });

    it('a dump of lists loads as it was; a dry run counts and writes nothing', () => {
      expect(seed()).toMatchObject({ ok: true, skipped: 0 });
      expect(items()).toEqual([]);
      const before = rows();
      notices = [];
      expect(store.todoMigrate({ dry: true })).toEqual({ ok: true, dry: true, lists: 3, items: 5, done: 3, orphans: 1, cut: 0, due: 1, rem: 0 });
      expect(rows()).toEqual(before);
      expect(notices).toEqual([]);
    });

    it('each list one item under its id, its items the note; the old rows gone; logged, told, re-armed; a second run changes nothing', () => {
      seed();
      now = T0 + 5000;
      expect(store.todoMigrate()).toEqual({ ok: true, dry: false, lists: 3, items: 5, done: 3, orphans: 1, cut: 0, due: 1, rem: 0 });
      expect(items(KEY_C)).toEqual([
        { id: 'dhome01', text: '家のこと', note: '✓ ゴミ出し', ord: 0, done: true },
        { id: 'dshop01', text: '買い物', note: '牛乳（11/24 15:00）\nパン（11/22）\n✓ 卵\n✓ バター（11/21）', ord: 1, done: false, due: '2026-11-22' },
        { id: 'dempty1', text: '空', ord: 2, done: false }
      ]);
      // kept under the list's maker; only the new items and the removal's row left
      expect(rows().map((r) => [r[1], JSON.parse(r[4]).id]).sort()).toEqual([['A', 'dlist99'], ['A', 'dshop01'], ['B', 'dempty1'], ['G', 'dhome01']]);
      expect(logged).toContainEqual(['todo.migrate', { dry: false, lists: 3, items: 5, done: 3, orphans: 1, cut: 0, due: 1, rem: 0 }]);
      expect(notices.at(-1)).toMatchObject({ what: 'event' });
      expect(armed).toBe(1);
      // idempotent: nothing of the old shape left
      const after = rows();
      expect(store.todoMigrate()).toMatchObject({ lists: 0, items: 0, orphans: 0 });
      expect(rows()).toEqual(after);
      // and the items take the phones' ops as any other (the guest's too)
      expect(item('G', 'dshop01', '買い物', { done: 1, note: '牛乳' }, now + 1000)).toMatchObject({ ok: true });
      expect(items().find((i) => i.id === 'dshop01')).toMatchObject({ done: true, note: '牛乳' });
    });

    it('the earliest open due carries its reminder; a long list keeps the lines that fit and counts the rest', () => {
      const lists = [{ id: 'dlong01', title: 'L', ord: 0, who: 'A' as const }];
      const many = Array.from({ length: 200 }, (_, i) => ({ id: `dx${String(i).padStart(5, '0')}`, list: 'dlong01', text: `${'あ'.repeat(18)}${i}`, ord: i, done: false }));
      const { moved } = migrate(lists, [...many, { id: 'dy00001', list: 'dlong01', text: 'z', ord: 999, done: false, due: '2026-11-21T08:00', rem: 'at', to: ['B'] }], T0);
      const m = moved[0];
      expect([...m.op.note!].length).toBeLessThanOrEqual(TODO_NOTE);
      expect(m.op.note!.split('\n').at(-1)).toBe(`…ほか${m.cut}件`);
      expect(m.cut).toBeGreaterThan(0);
      expect(m.op).toMatchObject({ due: '2026-11-21T08:00', rem: 'at', to: ['B'] });
    });
  });
});
