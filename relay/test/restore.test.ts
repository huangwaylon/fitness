// A restore is faithful (docs/backend.md#the-record, the admin `load`): a dump holds each slot's latest row only, so a
// board post's, a packing list's and the wedding board's rows load into an empty record as the record had them, never
// through the rules a phone's op meets (an edited post's first posting, an item's creation and a tick's item may be
// gone from the dump). Until 2026-11-06 the load judged them by those rules: an edited post, a guest's item a member
// edited, a removal of an added item and a tick older than its item's latest row were dropped.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { boardOpOf, boardPosts, type BoardEntry } from '../../app/src/lib/contract/board.ts';
import { packFold, packRowOf, type PackRow } from '../../app/src/lib/contract/pack.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const T0 = Date.parse('2026-11-06T03:00:00.000Z');
type W = 'A' | 'B' | 'G';

describe('a dump loads back into an empty record as it was', () => {
  let now: number;
  let db: ReturnType<typeof memSql>;
  let store: StoreCore;
  const open = () => new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => now, notify: () => {} });
  beforeEach(() => {
    now = T0;
    db = memSql();
    store = open();
  });
  const keyOf = { A: KEY_A, B: KEY_B, G: KEY_C } as const;
  let n = 0;
  const send = (who: W, type: string, data: object) => store.handle({ key: keyOf[who], action: 'event', id: `e${++n}`, type, data }, 100) as Record<string, unknown>;
  const at = () => (now += 1000);
  const events = () => (store.handle({ key: KEY_A, action: 'snapshot' }, 100) as unknown as { rows: { events: [string, W, string, string, string][] } }).rows.events;
  /** Restore: the dump into a fresh record. */
  const restore = () => {
    const dumped = store.dump().rows.events;
    db = memSql();
    store = open();
    return store.load({ rows: { events: dumped } });
  };

  it('the board: an edited post', () => {
    const p = at();
    expect(send('A', 'board', { id: 'bpost001', at: p, p, t: 'はじめ' })).toMatchObject({ ok: true });
    expect(send('A', 'board', { id: 'bpost001', at: at(), p, t: 'なおした' })).toMatchObject({ ok: true });
    const q = at();
    send('G', 'board', { id: 'bpost002', at: q, p: q, t: 'ゲスト' });
    send('B', 'board', { id: 'bpost002', at: at(), rm: true });
    expect(restore()).toMatchObject({ ok: true, events: 2, skipped: 0 });
    const rows = events().filter((r) => r[3] === 'board');
    expect(rows).toHaveLength(2);
    expect(boardPosts(rows.map((r) => ({ ...boardOpOf(JSON.parse(r[4]))!, who: r[1] }) as BoardEntry))).toMatchObject([{ id: 'bpost001', t: 'なおした' }]);
    // the removal still final after the restore
    expect(send('G', 'board', { id: 'bpost002', at: at(), p: q, t: 'もどれ' })).toMatchObject({ ok: true, duplicate: true });
  });

  it('the packing list: a guest’s item a member edited, an added item removed, a tick older than its item’s row', () => {
    const item = (who: W, id: string, name: string, by: W) => send(who, 'pack', { trip: 'okinawa', id, at: at(), kind: 'item', cat: 'gear', ord: 1, name: { ja: name }, by });
    expect(item('G', '_pkg00001', 'ゲストの', 'G')).toMatchObject({ ok: true });
    expect(send('B', 'pack_chk', { trip: 'okinawa', id: '_pkg00001', at: at(), v: 1 })).toMatchObject({ ok: true });
    expect(item('A', '_pkg00001', 'ウェイが なおした', 'G')).toMatchObject({ ok: true });
    expect(item('A', '_pka00001', 'すぐ けす', 'A')).toMatchObject({ ok: true });
    expect(send('A', 'pack', { trip: 'okinawa', id: '_pka00001', at: at(), rm: true })).toMatchObject({ ok: true });
    expect(restore()).toMatchObject({ ok: true, events: 3, skipped: 0 });
    const rows = events().map((r) => packRowOf(r[3], JSON.parse(r[4]), r[1])).filter((r): r is PackRow => r !== null);
    expect(rows).toHaveLength(3);
    const items = [...packFold(rows).rows.values()].filter((r) => r.type === 'pack');
    expect(items.map((r) => r.op)).toMatchObject([{ id: '_pkg00001', by: 'G', name: { ja: 'ウェイが なおした' } }, { id: '_pka00001', rm: true }]);
    expect(rows.find((r) => r.type === 'pack_chk')).toMatchObject({ who: 'B', op: { id: '_pkg00001', v: 1 } });
    // the removal still final after the restore
    expect(item('A', '_pka00001', 'もどれ', 'A')).toMatchObject({ ok: true, duplicate: true });
  });
});
