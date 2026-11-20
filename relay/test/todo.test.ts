// やること in the record (docs/backend.md#events `todo`, contract/todo.ts): anyone (the guest too) makes, edits, ticks,
// moves and removes lists and items; the latest `at` wins per id (then who), a removal final, a list's removal takes
// its items' rows with it; an item only in a list held; the cap; the texts cleaned; a dump loads back the same lists.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { todoFold, todoLists, todoRowOf, type TodoRow } from '../../app/src/lib/contract/todo.ts';
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
  const send = (who: W, data: object) => call(keyOf[who], 'event', { id: `e${++n}`, type: 'todo', data });
  const at = () => (now += 1000);
  const list = (who: W, id: string, title: string, t = at()) => send(who, { id, at: t, title, ord: 0 });
  const item = (who: W, id: string, l: string, text: string, extra: object = {}, t = at()) => send(who, { id, at: t, list: l, text, ord: 0, done: 0, ...extra });
  const rows = (key = KEY_A) => (call(key, 'snapshot').rows.events as [string, W, string, string, string][]).filter((r) => r[3] === 'todo');
  /** The lists as a phone gets them (its snapshot's rows, folded). */
  const lists = (key = KEY_A) => todoLists(todoFold(rows(key).map((r) => todoRowOf(r[3], JSON.parse(r[4]), r[1])).filter((r): r is TodoRow => r !== null)));

  it('anyone, the guest too, makes a list and its items, edits, ticks and removes them; every phone is told', () => {
    expect(list('G', 'dshop01', '買い物')).toMatchObject({ ok: true });
    expect(notices.at(-1)).toMatchObject({ what: 'event', who: 'G' });
    expect(item('A', 'dmilk01', 'dshop01', '牛乳')).toMatchObject({ ok: true });
    expect(item('G', 'degg001', 'dshop01', '卵', { ord: 1 })).toMatchObject({ ok: true });
    expect(item('B', 'dmilk01', 'dshop01', '牛乳 2本', { done: 1 })).toMatchObject({ ok: true });
    expect(send('G', { id: 'degg001', at: at(), rm: true })).toMatchObject({ ok: true });
    expect(list('B', 'dshop01', '週末の買い物')).toMatchObject({ ok: true });
    expect(lists(KEY_C)).toEqual([{ id: 'dshop01', title: '週末の買い物', ord: 0, items: [{ id: 'dmilk01', text: '牛乳 2本', ord: 0, done: true }] }]);
  });

  it('the latest `at` wins, then who; an older op and anything after a removal are acknowledged and change nothing', () => {
    list('A', 'dlist01', 'L');
    const t = at();
    expect(item('A', 'ditem01', 'dlist01', 'あと', {}, t + 5000)).toMatchObject({ ok: true });
    expect(item('B', 'ditem01', 'dlist01', 'まえ', {}, t + 2000)).toMatchObject({ ok: true, duplicate: true });
    // the same `at`: G over B over A
    expect(item('G', 'ditem01', 'dlist01', 'ゲスト', {}, t + 5000)).toMatchObject({ ok: true });
    expect(lists()[0].items[0].text).toBe('ゲスト');
    expect(send('A', { id: 'ditem01', at: t + 6000, rm: true })).toMatchObject({ ok: true });
    expect(item('B', 'ditem01', 'dlist01', 'again', {}, t + 9000)).toMatchObject({ ok: true, duplicate: true });
    expect(lists()[0].items).toEqual([]);
    // an edit or a removal of something never held, an item in no list held
    expect(send('A', { id: 'dnever1', at: at(), rm: true })).toMatchObject({ ok: true, duplicate: true });
    expect(item('A', 'dorph01', 'dnolist', 'x')).toMatchObject({ ok: true, duplicate: true });
    expect(rows().map((r) => JSON.parse(r[4]).id).sort()).toEqual(['ditem01', 'dlist01']);
  });

  it('a list’s removal takes its items’ rows with it; a late item op for it is acknowledged', () => {
    list('A', 'dlist01', 'L');
    list('A', 'dlist02', 'M');
    item('A', 'da00001', 'dlist01', 'a');
    item('B', 'db00001', 'dlist01', 'b');
    item('B', 'dc00001', 'dlist02', 'c');
    expect(send('G', { id: 'dlist01', at: at(), rm: true })).toMatchObject({ ok: true });
    expect(rows().map((r) => JSON.parse(r[4]).id).sort()).toEqual(['dc00001', 'dlist01', 'dlist02']);
    expect(item('A', 'da00001', 'dlist01', 'late')).toMatchObject({ ok: true, duplicate: true });
    expect(item('A', 'dd00001', 'dlist01', 'new')).toMatchObject({ ok: true, duplicate: true });
    expect(lists().map((l) => l.id)).toEqual(['dlist02']);
  });

  it('cleans the texts as the phone does; refuses a malformed op, a move to another list, a list made an item, one a day ahead', () => {
    list('A', 'dlist01', '  Shop\u0007 \n list ');
    list('A', 'dlist02', 'Other');
    expect(lists()[0].title).toBe('Shop list');
    item('A', 'ditem01', 'dlist01', 'x');
    const bad: object[] = [
      { id: 'dbad001', at: now, title: ' ', ord: 0 },
      { id: 'dbad001', at: now, title: 'x'.repeat(41), ord: 0, html: 1 },
      { id: 'BAD', at: now, title: 'x', ord: 0 },
      { id: 'dbad001', at: now, title: 'x' },
      { id: 'dbad001', at: now, list: 'dlist01', text: 'x', ord: 0, done: 2 },
      { id: 'dbad001', at: now, list: 'dlist01', text: 'x', ord: 0 },
      { id: 'dbad001', at: now + 2 * 86400_000, title: 'x', ord: 0 },
      { id: 'dbad001', at: now, rm: true, title: 'x' }
    ];
    for (const d of bad) expect(send('A', d), JSON.stringify(d)).toMatchObject({ ok: false, error: 'bad_request' });
    expect(item('A', 'ditem01', 'dlist02', 'moved')).toMatchObject({ ok: false, error: 'bad_request' });
    expect(list('A', 'ditem01', 'a list now')).toMatchObject({ ok: false, error: 'bad_request' });
    expect(item('A', 'dlist02', 'dlist01', 'an item now')).toMatchObject({ ok: false, error: 'bad_request' });
    expect(lists().map((l) => [l.title, l.items.map((i) => i.text)])).toEqual([['Shop list', ['x']], ['Other', []]]);
  });

  it('at most 500 lists and items standing: a new one past them is refused, a removal frees a place', () => {
    list('A', 'dlist01', 'L');
    for (let i = 1; i < 500; i++) expect(item('A', `di${String(i).padStart(5, '0')}`, 'dlist01', `#${i}`).ok).toBe(true);
    expect(item('A', 'dfull01', 'dlist01', 'one more')).toMatchObject({ ok: false, error: 'bad_request' });
    expect(send('A', { id: 'di00001', at: at(), rm: true })).toMatchObject({ ok: true });
    expect(item('A', 'dfull01', 'dlist01', 'one more')).toMatchObject({ ok: true });
  });

  it('a dump loads back the same lists; a load drops a removed list’s items as a phone’s op would', () => {
    list('A', 'dlist01', 'L');
    list('G', 'dlist02', 'M');
    item('A', 'da00001', 'dlist01', 'a', { done: 1 });
    item('G', 'db00001', 'dlist02', 'b');
    item('G', 'db00001', 'dlist02', 'b2', { ord: 3 });
    const before = lists();
    const dumped = store.dump().rows.events;
    db = memSql();
    store = open();
    expect(store.load({ rows: { events: dumped } })).toMatchObject({ ok: true, events: dumped.length, skipped: 0 });
    expect(lists()).toEqual(before);
    // idempotent
    expect(store.load({ rows: { events: dumped } })).toMatchObject({ ok: true, events: 0 });
    // a file with an item and its list's removal (in either order)
    const ev = (id: string, d: object, t: number) => [new Date(t).toISOString(), 'B', id, 'todo', JSON.stringify({ at: t, ...d })];
    expect(store.load({ rows: { events: [ev('x1', { id: 'dc00001', list: 'dlist03', text: 'c', ord: 0, done: 0 }, T0 - 5), ev('x2', { id: 'dlist03', rm: true }, T0 - 9)] } })).toMatchObject({ ok: true, skipped: 0 });
    expect(rows().map((r) => JSON.parse(r[4]).id)).not.toContain('dc00001');
  });
});
