// The wedding board in the record (docs/wedding.md "The record (relay)", docs/backend.md#events `wtask`, `wdone`,
// `wconf`, `wnote`): the latest `at` wins per slot (then who), a purge final; the guest reads all four and writes none;
// the note's own cap; a note saved over one it wasn't edited from kept with that one beside it; a subtask only under a
// task held; the admin's load takes the rows as they are (imported, idempotent) and a dump loads back the same.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { apiWithMeta } from '../src/reqMeta.ts';
import { keyOwner } from '../src/auth.ts';
import { wedConfig, wedFold, wedNote, wedRowOf, wedTasks, WNOTE_CHARS, type WedRow } from '../../app/src/lib/contract/wedding.ts';
import type { Notice } from '../../app/src/lib/contract/live-protocol.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const T0 = Date.parse('2026-11-06T03:00:00.000Z');
type W = 'A' | 'B' | 'G';

describe('the wedding board in the record', () => {
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
  const send = (who: W, type: string, data: object) => call(keyOf[who], 'event', { id: `e${++n}`, type, data });
  const at = () => (now += 1000);
  const task = (who: W, id: string, title: string, extra: object = {}, t = at()) => send(who, 'wtask', { id, at: t, c: T0, title, cat: 'Venue', due: '2027-04-18', ...extra });
  /** The board as a phone gets it (its snapshot's rows, folded). */
  const book = (key = KEY_A) => {
    const rows = (call(key, 'snapshot').rows.events as [string, W, string, string, string][]).map((r) => wedRowOf(r[3], JSON.parse(r[4]), r[1])).filter((r): r is WedRow => r !== null);
    return wedFold(rows);
  };
  const tasks = (key = KEY_A) => wedTasks(book(key)).sort((a, b) => (a.id < b.id ? -1 : 1));
  const wedRows = () => (call(KEY_A, 'snapshot').rows.events as unknown[][]).filter((r) => ['wtask', 'wdone', 'wconf', 'wnote'].includes(r[3] as string));

  it('keeps a task, tells the phones; the latest `at` wins, then who; an older op is acknowledged and changes nothing', () => {
    expect(task('A', 'venue', 'Book the hall')).toMatchObject({ ok: true });
    expect(notices.at(-1)).toMatchObject({ what: 'event', who: 'A' });
    const t = at();
    expect(task('B', 'venue', 'あとの', {}, t + 5000)).toMatchObject({ ok: true });
    expect(task('A', 'venue', 'まえの', {}, t + 2000)).toMatchObject({ ok: true, duplicate: true });
    expect(tasks(KEY_C)).toMatchObject([{ id: 'venue', title: 'あとの' }]);
    expect(wedRows()[0][1]).toBe('B');
    // the same `at`: B over A
    expect(task('A', 'venue', 'ウェイ', {}, t + 5000)).toMatchObject({ ok: true, duplicate: true });
    expect(tasks()[0].title).toBe('あとの');
    expect(wedRows()).toHaveLength(1);
  });

  it('cleans the texts as the phone does and refuses a malformed op, one stamped over a day ahead, or an imported one', () => {
    expect(task('A', 'clean1', '  Ring\u0007 the\n  florist  ', { cat: ' Flowers‮ ' })).toMatchObject({ ok: true });
    expect(tasks()[0]).toMatchObject({ title: 'Ring the florist', category: 'Flowers' });
    const bad: object[] = [
      { id: 'x1', at: now, c: T0, title: ' ', cat: '' },
      { id: 'x1', at: now, c: T0, title: 'a', cat: '', due: '2027-02-30' },
      { id: 'x1', at: now, c: T0, title: 'a', cat: '', start: '2027/02/01' },
      { id: 'x1', at: now, title: 'a', cat: '' },
      { id: 'x 1', at: now, c: T0, title: 'a', cat: '' },
      { id: 'x1', at: now, c: T0, title: 'a', cat: '', html: '<b>' },
      { id: 'x1', at: now + 2 * 86400_000, c: T0, title: 'a', cat: '' },
      { id: 'x1', at: now, c: T0, title: 'a', cat: '', imported: true },
      { id: 'x1', at: now, c: T0, title: 'a', cat: '', del: 'yes' },
      { id: 'x1', at: now, rm: true, title: 'a' }
    ];
    for (const d of bad) expect(send('A', 'wtask', d), JSON.stringify(d)).toMatchObject({ ok: false, error: 'bad_request' });
    expect(send('A', 'wdone', { id: 'clean1', at: now, v: 2 })).toMatchObject({ ok: false, error: 'bad_request' });
    expect(send('A', 'wconf', { k: 'colour', at: now, v: 'red' })).toMatchObject({ ok: false, error: 'bad_request' });
    expect(send('A', 'wconf', { k: 'date', at: now, v: '18 April' })).toMatchObject({ ok: false, error: 'bad_request' });
    expect(send('A', 'wconf', { k: 'time', at: now, v: '25:00' })).toMatchObject({ ok: false, error: 'bad_request' });
    expect(send('A', 'wconf', { k: 'cats', at: now, v: Array.from({ length: 31 }, (_, i) => `c${i}`) })).toMatchObject({ ok: false, error: 'bad_request' });
    expect(send('A', 'wnote', { at: now, md: 'x', was: { at: T0, md: 'y', who: 'B' } })).toMatchObject({ ok: false, error: 'bad_request' });
  });

  it('the guest reads all four and writes none: forbidden', () => {
    task('A', 'venue', 'Book the hall');
    send('A', 'wdone', { id: 'venue', at: at(), v: 1 });
    send('B', 'wconf', { k: 'p1', at: at(), v: 'たろう' });
    send('B', 'wnote', { at: at(), md: '# メモ' });
    expect(task('G', 'venue', 'ゲスト')).toMatchObject({ ok: false, error: 'forbidden' });
    expect(task('G', 'guest1', 'ゲストの')).toMatchObject({ ok: false, error: 'forbidden' });
    expect(send('G', 'wtask', { id: 'venue', at: at(), rm: true })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(send('G', 'wdone', { id: 'venue', at: at(), v: 0 })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(send('G', 'wconf', { k: 'p1', at: at(), v: 'x' })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(send('G', 'wnote', { at: at(), md: 'x' })).toMatchObject({ ok: false, error: 'forbidden' });
    const b = book(KEY_C);
    expect(wedTasks(b)).toMatchObject([{ id: 'venue', title: 'Book the hall', doneAt: expect.any(String) }]);
    expect(wedConfig(b)).toEqual({ p1: 'たろう' });
    expect(wedNote(b)).toMatchObject({ md: '# メモ', who: 'B' });
  });

  it('a subtask: one level, under a task the record holds, no dates', () => {
    task('A', 'p', 'Invitations');
    expect(task('B', 's1', 'Order cards', { parent: 'p', due: undefined })).toMatchObject({ ok: true });
    expect(tasks().find((t) => t.id === 's1')).toMatchObject({ parentId: 'p', due: '' });
    // under a subtask, under nothing, under itself, with a date
    expect(task('A', 's2', 'x', { parent: 's1', due: undefined })).toMatchObject({ ok: false, error: 'bad_request', detail: 'wedding parent' });
    expect(task('A', 's3', 'x', { parent: 'nope', due: undefined })).toMatchObject({ ok: false, error: 'bad_request', detail: 'wedding parent' });
    // logged as its rule
    const r = apiWithMeta(store, JSON.stringify({ key: KEY_A, action: 'event', id: 'eparent', type: 'wtask', data: { id: 's6', at: at(), c: T0, title: 'x', cat: '', parent: 'nope' } }), (k) => keyOwner(String(k), { KEY_A, KEY_B, KEY_C }));
    expect(r.meta).toMatchObject({ st: 'bad_request', why: 'wtask.wedding_parent' });
    expect(task('A', 's4', 'x', { parent: 's4', due: undefined })).toMatchObject({ ok: false, error: 'bad_request' });
    expect(task('A', 's5', 'x', { parent: 'p' })).toMatchObject({ ok: false, error: 'bad_request' });
  });

  it('a tick is shared, the latest wins; a tick of a task not held is dropped', () => {
    task('A', 'cake', 'Taste cakes');
    expect(send('A', 'wdone', { id: 'cake', at: at(), v: 1 })).toMatchObject({ ok: true });
    expect(send('B', 'wdone', { id: 'cake', at: at(), v: 0 })).toMatchObject({ ok: true });
    expect(send('A', 'wdone', { id: 'cake', at: T0, v: 1 })).toMatchObject({ ok: true, duplicate: true });
    expect(tasks()[0].doneAt).toBe('');
    expect(send('A', 'wdone', { id: 'ghost', at: at(), v: 1 })).toMatchObject({ ok: true, duplicate: true });
    expect(wedRows().filter((r) => r[3] === 'wdone')).toHaveLength(1);
  });

  it('a soft delete is restorable; a purge is final and takes the tick with it; restore after delete', () => {
    task('A', 'dress', 'Fit the dress');
    send('A', 'wdone', { id: 'dress', at: at(), v: 1 });
    const del = at();
    expect(task('B', 'dress', 'Fit the dress', { del }, del)).toMatchObject({ ok: true });
    expect(tasks()[0].deletedAt).toBe(new Date(del).toISOString());
    // restore: a set without `del`
    expect(task('A', 'dress', 'Fit the dress')).toMatchObject({ ok: true });
    expect(tasks()[0]).toMatchObject({ deletedAt: '', doneAt: expect.any(String) });
    // delete again, then purge: final
    task('A', 'dress', 'Fit the dress', { del: at() });
    expect(send('B', 'wtask', { id: 'dress', at: at(), rm: true })).toMatchObject({ ok: true });
    expect(tasks()).toEqual([]);
    expect(task('A', 'dress', 'もどれ', {}, now + 60_000)).toMatchObject({ ok: true, duplicate: true });
    expect(send('A', 'wdone', { id: 'dress', at: at(), v: 1 })).toMatchObject({ ok: true, duplicate: true });
    expect(wedRows().map((r) => r[3])).toEqual(['wtask']);
    // a purge of a task the record never held changes nothing
    expect(send('A', 'wtask', { id: 'never', at: at(), rm: true })).toMatchObject({ ok: true, duplicate: true });
  });

  it('settings: one row a key, the latest wins', () => {
    expect(send('A', 'wconf', { k: 'cats', at: at(), v: [' Venue ', 'Food', '', 'Food'] })).toMatchObject({ ok: true });
    expect(send('B', 'wconf', { k: 'date', at: at(), v: '2027-04-18' })).toMatchObject({ ok: true });
    expect(send('B', 'wconf', { k: 'time', at: at(), v: '14:00' })).toMatchObject({ ok: true });
    expect(send('A', 'wconf', { k: 'date', at: at(), v: '2027-05-01' })).toMatchObject({ ok: true });
    expect(wedConfig(book())).toEqual({ cats: ['Venue', 'Food'], date: '2027-05-01', time: '14:00' });
    expect(wedRows()).toHaveLength(3);
  });

  it('the note: its own cap (64,000 characters, past the 20,000 of the others)', () => {
    const big = 'あ'.repeat(WNOTE_CHARS);
    expect(send('A', 'wnote', { at: at(), md: big })).toMatchObject({ ok: true });
    expect(wedNote(book())?.md).toBe(big);
    expect(send('A', 'wnote', { at: at(), md: big + 'x' })).toMatchObject({ ok: false, error: 'bad_request' });
    // a JSON past the note's data cap (escapes): too large
    expect(send('A', 'wnote', { at: at(), md: '\u0001'.repeat(WNOTE_CHARS) })).toMatchObject({ ok: false, error: 'too_large' });
    // the others keep 20,000
    expect(task('A', 'big', 'x'.repeat(200), { cat: 'y'.repeat(40), extra: 'z'.repeat(20_000) })).toMatchObject({ ok: false, error: 'too_large' });
  });

  it('a note saved over one it was not edited from is kept, with that one beside it; a save from the new one clears it', () => {
    const a0 = at();
    send('A', 'wnote', { at: a0, md: 'v1' });
    // B saves from v1: no conflict
    const b1 = at();
    send('B', 'wnote', { at: b1, md: 'v2 (B)', base: a0 });
    expect(wedNote(book())).toEqual({ at: b1, md: 'v2 (B)', base: a0, who: 'B' });
    // A, still on v1, saves: kept, B's beside it
    const a2 = at();
    expect(send('A', 'wnote', { at: a2, md: 'v2 (A)', base: a0 })).toMatchObject({ ok: true });
    expect(wedNote(book(KEY_B))).toEqual({ at: a2, md: 'v2 (A)', base: a0, was: { at: b1, md: 'v2 (B)', who: 'B' }, who: 'A' });
    // a save with no base over a held note: a conflict too
    // B resolves: saves from A's
    const b3 = at();
    send('B', 'wnote', { at: b3, md: 'merged', base: a2 });
    expect(wedNote(book())).toEqual({ at: b3, md: 'merged', base: a2, who: 'B' });
    expect(send('A', 'wnote', { at: at(), md: 'blind' })).toMatchObject({ ok: true });
    expect(wedNote(book())?.was).toEqual({ at: b3, md: 'merged', who: 'B' });
    expect(wedRows()).toHaveLength(1);
  });

  it('a note saved offline over one saved meanwhile: kept, restamped after it, the conflict on both phones', () => {
    const a0 = at();
    send('A', 'wnote', { at: a0, md: 'v1' });
    // A edits offline from v1 (stamped then); B saves from v1 later, and reaches the record first
    const aOff = at();
    const b1 = at();
    expect(send('B', 'wnote', { at: b1, md: 'B’s', base: a0 })).toMatchObject({ ok: true });
    expect(send('A', 'wnote', { at: aOff, md: 'A’s', base: a0 })).toMatchObject({ ok: true });
    expect(send('A', 'wnote', { at: aOff, md: 'A’s', base: a0 })).toMatchObject({ ok: true }); // (a retry under a new id: the same text, stale)
    for (const k of [KEY_A, KEY_B, KEY_C]) expect(wedNote(book(k))).toEqual({ at: b1 + 1, md: 'A’s', base: a0, was: { at: b1, md: 'B’s', who: 'B' }, who: 'A' });
    expect(wedRows()).toHaveLength(1);
  });

  it('two note saves crossing in flight: the conflict on both phones, whichever reached the record first', () => {
    for (const first of ['A', 'B'] as const) {
      db = memSql();
      store = open();
      const a0 = at();
      send('A', 'wnote', { at: a0, md: 'v1' });
      const ta = at(), tb = at();
      const save = { A: () => send('A', 'wnote', { at: ta, md: 'A’s', base: a0 }), B: () => send('B', 'wnote', { at: tb, md: 'B’s', base: a0 }) };
      save[first]();
      save[first === 'A' ? 'B' : 'A']();
      const n = wedNote(book(KEY_A))!;
      expect(wedNote(book(KEY_B))).toEqual(n);
      expect([n.md, n.was?.md].sort()).toEqual(['A’s', 'B’s']);
    }
  });

  it('a subtask added while its parent is purged stays editable and deletable; a stale edit brings nothing back', () => {
    task('A', 'p', 'Invitations', { del: at() });
    // B, not yet seeing the delete, adds a subtask; A purges the task (its deleted subtasks with it)
    expect(task('B', 's', 'Order cards', { parent: 'p', due: undefined })).toMatchObject({ ok: true });
    task('A', 'old', 'Old card', { parent: 'p', due: undefined });
    task('A', 'old', 'Old card', { parent: 'p', due: undefined, del: now });
    expect(send('A', 'wtask', { id: 'p', at: at(), rm: true })).toMatchObject({ ok: true });
    expect(send('A', 'wtask', { id: 'old', at: at(), rm: true })).toMatchObject({ ok: true });
    // the orphan: an edit, a delete, a restore, a purge, all taken
    expect(task('B', 's', 'Order the cards', { parent: 'p', due: undefined })).toMatchObject({ ok: true });
    expect(task('B', 's', 'Order the cards', { parent: 'p', due: undefined, del: now })).toMatchObject({ ok: true });
    expect(task('B', 's', 'Order the cards', { parent: 'p', due: undefined })).toMatchObject({ ok: true });
    // the purging phone's set without the parent: a task of its own
    expect(task('A', 's', 'Order the cards', { due: undefined })).toMatchObject({ ok: true });
    expect(tasks().map((t) => [t.id, t.parentId])).toEqual([['s', '']]);
    // a stale edit of the purged subtask, or a new one under the purged task, or moving one there: nothing
    expect(task('B', 'old', 'Old card', { parent: 'p', due: undefined }, now + 60_000)).toMatchObject({ ok: true, duplicate: true });
    expect(task('B', 'new', 'x', { parent: 'p', due: undefined })).toMatchObject({ ok: false, detail: 'wedding parent' });
    expect(task('B', 's', 'x', { parent: 'p', due: undefined })).toMatchObject({ ok: false, detail: 'wedding parent' });
    expect(tasks().map((t) => t.id)).toEqual(['s']);
  });

  it('caps the tasks at WTASK_MAX rows', () => {
    const WTASK_MAX = 2000; // contract/wedding.ts
    const rows = Array.from({ length: WTASK_MAX }, (_, i) => [new Date(T0 - 1000 + i).toISOString(), 'A', `w${i}`, 'wtask', JSON.stringify({ id: `t${i}`, at: T0 - 1000 + i, c: T0, title: `#${i}`, cat: '' })]);
    expect(store.load({ rows: { events: rows } })).toMatchObject({ ok: true, events: WTASK_MAX });
    expect(task('A', 'onemore', 'x')).toMatchObject({ ok: false, error: 'bad_request', detail: 'wedding full' });
    // an edit of one held still goes in
    expect(task('A', 't1', 'なおした')).toMatchObject({ ok: true });
  });

  describe('the admin load', () => {
    const imp = (id: string, type: string, d: object, t = T0 - 86400_000) => [new Date(t).toISOString(), 'A', id, type, JSON.stringify({ at: t, ...d, imported: true })];
    const file = () => [
      imp('wed-p-wtask', 'wtask', { id: 'p', c: T0 - 9e8, title: 'Hall', cat: 'Venue', due: '2027-01-10', start: '2026-12-01' }, T0 - 5e8),
      imp('wed-s-wtask', 'wtask', { id: 's', c: T0 - 8e8, title: 'Call', cat: '', parent: 'p' }, T0 - 4e8),
      // a tick older than its task's row (done, then edited) and a subtask before its parent: taken as they are
      imp('wed-p-wdone', 'wdone', { id: 'p', v: 1 }, T0 - 7e8),
      imp('wed-o-wtask', 'wtask', { id: 'o', c: T0 - 8e8, title: 'Orphan', cat: '', parent: 'gone' }, T0 - 6e8),
      imp('wed-d-wtask', 'wtask', { id: 'd', c: T0 - 8e8, title: 'Deleted', cat: 'Other', due: '2026-10-01', del: T0 - 3e8 }, T0 - 3e8),
      imp('wed-p1-wconf', 'wconf', { k: 'p1', v: 'たろう' }),
      imp('wed-cats-wconf', 'wconf', { k: 'cats', v: ['Venue', 'Other'] }),
      imp('wed-notes-wnote', 'wnote', { md: '# Notes\n\n- one\n' })
    ];

    it('takes the rows as they are (imported, a tick before its task, an orphan), and a load again adds nothing', () => {
      expect(store.load({ rows: { events: file() } })).toMatchObject({ ok: true, events: 8, skipped: 0 });
      expect(notices.at(-1)).toMatchObject({ what: 'ingest' });
      const t = tasks(KEY_C);
      expect(t.map((x) => [x.id, x.parentId, !!x.doneAt, !!x.deletedAt])).toEqual([
        ['d', '', false, true], ['o', 'gone', false, false], ['p', '', true, false], ['s', 'p', false, false]
      ]);
      expect(wedRows().every((r) => JSON.parse(r[4] as string).imported === true)).toBe(true);
      expect(store.load({ rows: { events: file() } })).toMatchObject({ ok: true, events: 0, skipped: 0 });
      expect(wedRows()).toHaveLength(8);
      // a phone's edit after the load: the import's mark goes with it
      expect(task('A', 'p', 'Hall (booked)', { cat: 'Venue' })).toMatchObject({ ok: true });
      expect(tasks().find((x) => x.id === 'p')).toMatchObject({ title: 'Hall (booked)', doneAt: expect.any(String) });
      expect(JSON.parse(wedRows().find((r) => r[3] === 'wtask' && JSON.parse(r[4] as string).id === 'p')![4] as string).imported).toBeUndefined();
      // and the old rows again under other ids don't take it back (the same rows tie: the held one stays)
      expect(store.load({ rows: { events: file().map((r) => [r[0], r[1], `${String(r[2])}-again`, r[3], r[4]]) } })).toMatchObject({ events: 0 });
      expect(tasks().find((x) => x.id === 'p')?.title).toBe('Hall (booked)');
    });

    it('the imported shapes (the 2026-11-06 load into production, its fields as the deleted wedding-sheet.ts wrote them; values invented) stay valid and editable', () => {
      const t0 = Date.parse('2026-08-01T01:00:00.000Z');
      const r = (id: string, type: string, d: Record<string, unknown>) => [new Date(d.at as number).toISOString(), 'A', id, type, JSON.stringify({ ...d, imported: true })];
      const big = ('# Venue\n\n- **Hall** [map](https://map.example/a_(b))\n1. deposit 50%\n\n' + 'メモ '.repeat(40) + '\n').repeat(200).slice(0, 63_468);
      const rows = [
        r('wed-u1-wtask', 'wtask', { id: '00000000-0000-4000-8000-000000000001', at: t0 + 9e8, c: t0, title: 'Visit three halls', cat: 'Venue', due: '2026-09-30' }),
        r('wed-u1-wdone', 'wdone', { id: '00000000-0000-4000-8000-000000000001', at: t0 + 9e8, v: 1 }),
        r('wed-u2-wtask', 'wtask', { id: '00000000-0000-4000-8000-000000000002', at: t0, c: t0, title: 'Guest list', cat: 'Guests', due: '2026-12-01', start: '2026-11-01' }),
        r('wed-u3-wtask', 'wtask', { id: '00000000-0000-4000-8000-000000000003', at: t0 + 1e8, c: t0 + 1000, title: 'Family', cat: '', parent: '00000000-0000-4000-8000-000000000002' }),
        r('wed-u3-wdone', 'wdone', { id: '00000000-0000-4000-8000-000000000003', at: t0 + 1e8, v: 1 }),
        r('wed-u8-wtask', 'wtask', { id: '00000000-0000-4000-8000-000000000008', at: t0 + 5e9, c: t0, title: 'Book a band', cat: 'Music', due: '2027-02-01', del: t0 + 5e9 }),
        r('wed-u12-wtask', 'wtask', { id: '00000000-0000-4000-8000-000000000012', at: t0, c: t0, title: 'Self parent', cat: '' }),
        ...(['p1', 'p2', 'date', 'time', 'venue', 'tz'] as const).map((k) => r(`wed-conf-${k}`, 'wconf', { k, at: t0 + 5e9, v: { p1: 'Taro Test', p2: 'Hanako Test', date: '2027-04-18', time: '09:30', venue: 'Example Chapel', tz: 'Asia/Tokyo' }[k] })),
        r('wed-conf-cats', 'wconf', { k: 'cats', at: t0 + 5e9, v: ['Venue', 'Guests', 'Food', 'Other'] }),
        r('wed-note', 'wnote', { at: t0 + 5e9, md: big })
      ];
      expect(store.load({ rows: { events: rows } })).toMatchObject({ ok: true, events: rows.length, skipped: 0 });
      // every row the record holds still reads (the phone's model drops one that doesn't)
      for (const x of wedRows()) expect(wedRowOf(x[3] as string, JSON.parse(x[4] as string), x[1] as W), String(x[2])).not.toBeNull();
      const b = book();
      expect(wedTasks(b)).toHaveLength(5);
      expect(wedConfig(b)).toMatchObject({ venue: 'Example Chapel', cats: ['Venue', 'Guests', 'Food', 'Other'] });
      expect(wedNote(b)).toMatchObject({ md: big, imported: true });
      // and each takes a phone's change: an edit, a subtask's, a tick, a delete, a restore, a purge, a setting, the note
      const u = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
      expect(task('A', u(1), 'Visit three halls (done)', { due: '2026-09-30' })).toMatchObject({ ok: true });
      expect(send('B', 'wtask', { id: u(3), at: at(), c: t0 + 1000, title: 'Family (all)', cat: '', parent: u(2) })).toMatchObject({ ok: true });
      expect(send('B', 'wdone', { id: u(3), at: at(), v: 0 })).toMatchObject({ ok: true });
      expect(task('A', u(2), 'Guest list', { del: now })).toMatchObject({ ok: true });
      expect(task('A', u(8), 'Book a band')).toMatchObject({ ok: true });
      expect(send('A', 'wtask', { id: u(12), at: at(), rm: true })).toMatchObject({ ok: true });
      expect(send('A', 'wconf', { k: 'cats', at: at(), v: ['Venue', 'Food'] })).toMatchObject({ ok: true });
      expect(send('A', 'wnote', { at: at(), md: big + '\n- more', base: t0 + 5e9 })).toMatchObject({ ok: true });
      expect(wedNote(book())?.was).toBeUndefined();
    });

    it('drops what a phone’s op would have dropped with a row it takes as it was: a purged task’s tick, a removed item’s ticks, the board’s oldest removals', async () => {
      const { BOARD_MAX } = await import('../../app/src/lib/contract/board.ts');
      const ev = (id: string, who: W, type: string, d: object, t: number) => [new Date(t).toISOString(), who, id, type, JSON.stringify({ at: t, ...d })];
      const t0 = T0 - 1e8;
      const rows = [
        // the tick before the purge in the file, and after it (a dump's order is the record's, a hand-made file's anything)
        ev('k1', 'A', 'wdone', { id: 'w1', v: 1 }, t0), ev('w1', 'A', 'wtask', { id: 'w1', rm: true }, t0 + 1),
        ev('w2', 'A', 'wtask', { id: 'w2', rm: true }, t0 + 2), ev('k2', 'B', 'wdone', { id: 'w2', v: 1 }, t0 + 1),
        ev('w3', 'A', 'wtask', { id: 'w3', c: t0, title: 'kept', cat: '' }, t0), ev('k3', 'A', 'wdone', { id: 'w3', v: 1 }, t0 + 3),
        ev('c1', 'A', 'pack_chk', { trip: 'nz', id: 'passport', v: 1 }, t0), ev('c2', 'B', 'pack_chk', { trip: 'nz', id: 'passport', v: 1 }, t0),
        ev('r1', 'A', 'pack', { trip: 'nz', id: 'passport', rm: true }, t0 + 5), ev('c3', 'A', 'pack_chk', { trip: 'nz', id: 'socks', v: 1 }, t0),
        ...Array.from({ length: BOARD_MAX + 3 }, (_, i) => ev(`bp${i}`, 'A', 'board', { id: `bpost${String(i).padStart(3, '0')}`, rm: true }, t0 + 10 + i))
      ];
      expect(store.load({ rows: { events: rows } })).toMatchObject({ ok: true, skipped: 0 });
      const left = (call(KEY_A, 'snapshot').rows.events as unknown[][]).map((r) => `${String(r[3])}:${String(r[2])}`);
      expect(left.filter((x) => /^(wdone|wtask|pack|pack_chk):/.test(x)).sort()).toEqual(['pack:r1', 'pack_chk:c3', 'wdone:k3', 'wtask:w1', 'wtask:w2', 'wtask:w3']);
      expect(left.filter((x) => x.startsWith('board:'))).toHaveLength(BOARD_MAX);
    });

    it('a guest row, or a malformed one, is not taken', () => {
      const g = imp('g1', 'wconf', { k: 'p2', v: 'x' });
      g[1] = 'G';
      expect(store.load({ rows: { events: [g, imp('bad', 'wtask', { id: 'b', c: T0, title: '', cat: '' })] } })).toMatchObject({ ok: true, events: 0, skipped: 2 });
    });

    it('a dump loads back the same board (a note with its `was`, a purge, an edited task)', () => {
      store.load({ rows: { events: file() } });
      task('A', 'p', 'Hall v2', { cat: 'Venue' });
      send('B', 'wtask', { id: 'd', at: at(), rm: true });
      const n0 = wedNote(book())!;
      send('B', 'wnote', { at: at(), md: 'B', base: n0.at });
      send('A', 'wnote', { at: at(), md: 'A', base: n0.at });
      const before = book();
      const dumped = store.dump().rows.events;
      db = memSql();
      store = open();
      expect(store.load({ rows: { events: dumped } })).toMatchObject({ ok: true, events: dumped.length, skipped: 0 });
      const after = book();
      expect(wedTasks(after).sort((a, b) => (a.id < b.id ? -1 : 1))).toEqual(wedTasks(before).sort((a, b) => (a.id < b.id ? -1 : 1)));
      expect(wedConfig(after)).toEqual(wedConfig(before));
      expect(wedNote(after)).toEqual(wedNote(before));
      expect(wedNote(after)?.was?.md).toBe('B');
      expect([...after.rows.keys()].sort()).toEqual([...before.rows.keys()].sort());
    });
  });
});
