// The trips' packing lists in the record (docs/travel.md "Packing list (relay)", docs/backend.md#events `pack`):
// last writer wins per id by `at` (then G over B over A), a removal final; names cleaned here as on the phone; the guest
// adds and changes only what it added (never a seed id, never a member's); each person ticks and resets only their own;
// a trip note the members' to write and everyone's to read; at most PACK_MAX rows a trip (the oldest removal of an id an
// op made dropped for a new one); the refusals logged as rules.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { apiWithMeta } from '../src/reqMeta.ts';
import { keyOwner } from '../src/auth.ts';
import { packFold, packList, packRowOf, tripNoteOf, type PackRow, type PackSeed } from '../../app/src/lib/contract/pack.ts';
import type { Notice } from '../../app/src/lib/contract/live-protocol.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const T0 = Date.parse('2026-11-06T03:00:00.000Z');
type W = 'A' | 'B' | 'G';

const SEED: PackSeed = {
  cats: [
    { id: 'gear', name: { ja: 'どうぐ', en: 'Gear' }, icon: '🎒', items: [{ id: 'tent', text: { ja: 'テント', en: 'Tent' } }, { id: 'lamp', text: { en: 'Lamp' } }] },
    { id: 'docs', name: { ja: 'しょるい' }, icon: '🪪', items: [{ id: 'passport', text: { ja: 'パスポート' } }] }
  ]
};

/** A trip's `pack` rows at most (contract/pack.ts). */
const PACK_MAX = 300;

describe('the packing list in the record', () => {
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
  const item = (who: W, id: string, name: string, extra: object = {}) => send(who, 'pack', { trip: 'okinawa', id, at: at(), kind: 'item', cat: 'gear', ord: 5, name: { ja: name }, ...(id.startsWith('_') ? { by: who } : {}), ...extra });
  const rm = (who: W, id: string, t = at()) => send(who, 'pack', { trip: 'okinawa', id, at: t, rm: true });
  const tick = (who: W, id: string, v: 0 | 1 = 1, t = at()) => send(who, 'pack_chk', { trip: 'okinawa', id, at: t, v });
  /** The rows as a phone gets them (its snapshot's), folded. */
  const book = (key = KEY_A) => {
    const rows = (call(key, 'snapshot').rows.events as [string, W, string, string, string][]).map((r) => packRowOf(r[3], JSON.parse(r[4]), r[1])).filter((r): r is PackRow => r !== null);
    return packFold(rows);
  };
  const list = (key = KEY_A) => packList('okinawa', SEED, book(key));
  const names = (key = KEY_A) => list(key).flatMap((c) => c.items.map((i) => i.name.ja ?? i.name.en));
  const packRows = () => (call(KEY_A, 'snapshot').rows.events as unknown[][]).filter((r) => r[3] === 'pack');

  it('the seed is the list until someone changes it; a member renames and removes a seed item; every phone told', () => {
    expect(names()).toEqual(['テント', 'Lamp', 'パスポート']);
    expect(item('A', 'tent', 'おおきいテント', { ord: 0 })).toMatchObject({ ok: true });
    expect(notices.at(-1)).toMatchObject({ what: 'event', who: 'A' });
    expect(rm('B', 'lamp')).toMatchObject({ ok: true });
    expect(names(KEY_C)).toEqual(['おおきいテント', 'パスポート']);
    expect(list()[0].items[0]).toMatchObject({ id: 'tent', seed: true, by: null });
  });

  it('last writer wins by `at`, then G over B over A; an older op is acknowledged and changes nothing', () => {
    const t = at();
    expect(send('A', 'pack', { trip: 'okinawa', id: 'tent', at: t + 5000, kind: 'item', cat: 'gear', ord: 0, name: { ja: 'あと' } })).toMatchObject({ ok: true });
    expect(send('B', 'pack', { trip: 'okinawa', id: 'tent', at: t + 2000, kind: 'item', cat: 'gear', ord: 0, name: { ja: 'まえ' } })).toMatchObject({ ok: true, duplicate: true });
    expect(names()[0]).toBe('あと');
    // the same `at`: B over A
    expect(send('B', 'pack', { trip: 'okinawa', id: 'tent', at: t + 5000, kind: 'item', cat: 'gear', ord: 0, name: { ja: 'うめ' } })).toMatchObject({ ok: true });
    expect(send('A', 'pack', { trip: 'okinawa', id: 'tent', at: t + 5000, kind: 'item', cat: 'gear', ord: 0, name: { ja: 'ウェイ' } })).toMatchObject({ ok: true, duplicate: true });
    expect(names()[0]).toBe('うめ');
    // a removal beats a later set and is final
    expect(rm('A', 'tent', t + 1)).toMatchObject({ ok: true });
    expect(send('B', 'pack', { trip: 'okinawa', id: 'tent', at: t + 9000, kind: 'item', cat: 'gear', ord: 0, name: { ja: 'もどれ' } })).toMatchObject({ ok: true, duplicate: true });
    expect(names()).toEqual(['Lamp', 'パスポート']);
    expect(packRows()).toHaveLength(1);
  });

  it('cleans the names as the phone does and refuses a malformed op or one stamped over a day ahead', () => {
    expect(item('A', '_pk000001', '  ラッシュ\u0007ガード\n（ながそで）  ', { note: { ja: ' ', en: ' SPF‮50 ' } })).toMatchObject({ ok: true });
    expect(list()[0].items.at(-1)).toMatchObject({ id: '_pk000001', name: { ja: 'ラッシュガード （ながそで）' }, note: { en: 'SPF50' }, by: 'A' });
    expect(item('A', '_pk000002', 'x'.repeat(200))).toMatchObject({ ok: true });
    expect([...list()[0].items.at(-1)!.name.ja!].length).toBe(80);
    const bad: object[] = [
      { trip: 'okinawa', id: '_pk000003', at: now, kind: 'item', cat: 'gear', ord: 1, name: { ja: ' ' }, by: 'A' },
      { trip: 'okinawa', id: '_pk000003', at: now, kind: 'item', cat: 'gear', ord: 1, name: { fr: 'x' }, by: 'A' },
      { trip: 'okinawa', id: '_pk000003', at: now, kind: 'item', cat: 'gear', ord: 1, name: { ja: 'x' } },
      { trip: 'okinawa', id: 'tent', at: now, kind: 'item', cat: 'gear', ord: 1, name: { ja: 'x' }, by: 'A' },
      { trip: 'okinawa', id: '_pk000003', at: now, kind: 'item', ord: 1, name: { ja: 'x' }, by: 'A' },
      { trip: 'okinawa', id: '_pk000003', at: now, kind: 'cat', ord: 1, name: { ja: 'x' }, by: 'A' },
      { trip: 'okinawa', id: '_pk000003', at: now, kind: 'item', cat: 'gear', ord: Infinity, name: { ja: 'x' }, by: 'A' },
      { trip: 'Okinawa!', id: 'tent', at: now, kind: 'item', cat: 'gear', ord: 1, name: { ja: 'x' } },
      { trip: 'okinawa', id: 'tent', at: now, kind: 'item', cat: 'gear', ord: 1, name: { ja: 'x' }, html: '<b>' },
      { trip: 'okinawa', id: 'tent', at: now + 2 * 86400_000, kind: 'item', cat: 'gear', ord: 1, name: { ja: 'x' } },
      { trip: 'okinawa', id: 'tent', at: now, rm: true, name: { ja: 'x' } }
    ];
    for (const d of bad) expect(send('A', 'pack', d), JSON.stringify(d)).toMatchObject({ ok: false, error: 'bad_request' });
    expect(send('A', 'pack_chk', { trip: 'okinawa', id: 'tent', at: now, v: 2 })).toMatchObject({ ok: false, error: 'bad_request' });
    expect(send('A', 'pack_reset', { trip: 'okinawa', at: now, who: 'B' })).toMatchObject({ ok: false, error: 'bad_request' });
  });

  it('the guest adds, edits and removes its own; never a seed item or a member’s', () => {
    expect(item('G', '_pkg00001', 'ゲストの')).toMatchObject({ ok: true });
    expect(item('G', '_pkg00001', 'ゲストの（なおした）')).toMatchObject({ ok: true });
    expect(item('A', '_pka00001', 'ウェイの')).toMatchObject({ ok: true });
    // a seed item: nobody's
    expect(item('G', 'tent', 'ゲストのテント')).toMatchObject({ ok: false, error: 'forbidden' });
    expect(rm('G', 'lamp')).toMatchObject({ ok: false, error: 'forbidden' });
    // a member's
    expect(item('G', '_pka00001', 'うばう', { by: 'A' })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(item('G', '_pka00001', 'うばう', { by: 'G' })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(rm('G', '_pka00001')).toMatchObject({ ok: false, error: 'forbidden' });
    // a new id passed off as a member's
    expect(item('G', '_pkg00002', 'なりすまし', { by: 'A' })).toMatchObject({ ok: false, error: 'forbidden' });
    // a set that changes an item's creator: refused, for a member too
    expect(item('B', '_pkg00001', 'うめが', { by: 'B' })).toMatchObject({ ok: false, error: 'bad_request', detail: 'pack owner' });
    // a member edits the guest's (it stays the guest's: the guest still may)
    expect(item('B', '_pkg00001', 'うめが なおした', { by: 'G' })).toMatchObject({ ok: true });
    expect(list()[0].items.find((i) => i.id === '_pkg00001')).toMatchObject({ by: 'G', name: { ja: 'うめが なおした' } });
    expect(rm('G', '_pkg00001')).toMatchObject({ ok: true });
    expect(names()).toEqual(['テント', 'Lamp', 'ウェイの', 'パスポート']);
  });

  it('the guest’s own category: never removed (or changed) while a member’s item is in it, as the phone’s ✎', () => {
    const cat = (who: W, extra: object = {}) => send(who, 'pack', { trip: 'okinawa', id: '_pkgcat01', at: at(), kind: 'cat', ord: 9, name: { ja: 'おやつ' }, icon: '🍙', by: 'G', ...extra });
    expect(cat('G')).toMatchObject({ ok: true });
    expect(item('G', '_pkg00001', 'ちんすこう', { cat: '_pkgcat01' })).toMatchObject({ ok: true });
    expect(item('A', '_pka00001', 'ウェイの', { cat: '_pkgcat01' })).toMatchObject({ ok: true });
    expect(rm('G', '_pkgcat01')).toMatchObject({ ok: false, error: 'forbidden' });
    expect(cat('G', { name: { ja: 'おかし' } })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(list().at(-1)!.items.map((i) => i.id)).toEqual(['_pka00001', '_pkg00001']);
    // the member's item moved out: the guest's to remove again
    expect(item('A', '_pka00001', 'ウェイの', { cat: 'gear' })).toMatchObject({ ok: true });
    expect(rm('G', '_pkgcat01')).toMatchObject({ ok: true });
    expect(list().map((c) => c.id)).toEqual(['gear', 'docs']);
  });

  it('an op on an id an op made that the record doesn’t hold is dropped, unless it is the id’s creation', () => {
    expect(rm('A', '_pk0gone1')).toMatchObject({ ok: true, duplicate: true });
    expect(item('A', '_pk0gone2', 'だれの？', { by: 'B' })).toMatchObject({ ok: true, duplicate: true });
    expect(packRows()).toHaveLength(0);
  });

  it('ticks are each person’s own; a reset clears only mine; a tick after it counts again', () => {
    expect(tick('A', 'tent')).toMatchObject({ ok: true });
    expect(tick('B', 'tent')).toMatchObject({ ok: true });
    expect(tick('G', 'tent')).toMatchObject({ ok: true });
    expect(tick('A', 'passport')).toMatchObject({ ok: true });
    expect(list(KEY_C)[0].items[0].ticks).toEqual(['A', 'B', 'G']);
    // untick: my slot only
    expect(tick('B', 'tent', 0)).toMatchObject({ ok: true });
    expect(list()[0].items[0].ticks).toEqual(['A', 'G']);
    // an older tick of mine changes nothing
    expect(tick('B', 'tent', 1, T0)).toMatchObject({ ok: true, duplicate: true });
    // a tick names no person: the sender's own
    expect(send('G', 'pack_chk', { trip: 'okinawa', id: 'lamp', at: at(), v: 1, person: 'A' })).toMatchObject({ ok: false });
    // A resets: A's ticks off, the others' stay
    expect(send('A', 'pack_reset', { trip: 'okinawa', at: at() })).toMatchObject({ ok: true });
    const l = list();
    expect(l[0].items[0].ticks).toEqual(['G']);
    expect(l[1].items[0].ticks).toEqual([]);
    expect(tick('A', 'tent')).toMatchObject({ ok: true });
    expect(list()[0].items[0].ticks).toEqual(['A', 'G']);
    // the guest resets its own
    expect(send('G', 'pack_reset', { trip: 'okinawa', at: at() })).toMatchObject({ ok: true });
    expect(list()[0].items[0].ticks).toEqual(['A']);
    // one row a person and item, one reset a person
    const rows = (call(KEY_A, 'snapshot').rows.events as unknown[][]);
    expect(rows.filter((r) => r[3] === 'pack_chk')).toHaveLength(4);
    expect(rows.filter((r) => r[3] === 'pack_reset')).toHaveLength(2);
  });

  it('a removed item’s ticks go with it, and a late tick of it is dropped', () => {
    item('A', '_pkt00001', 'すぐ けす');
    tick('A', '_pkt00001');
    tick('G', '_pkt00001');
    expect(rm('B', '_pkt00001')).toMatchObject({ ok: true });
    expect(tick('A', '_pkt00001')).toMatchObject({ ok: true, duplicate: true });
    expect((call(KEY_A, 'snapshot').rows.events as unknown[][]).filter((r) => r[3] === 'pack_chk')).toHaveLength(0);
    // a tick of an id an op made that was never there
    expect(tick('A', '_pknever1')).toMatchObject({ ok: true, duplicate: true });
  });

  it('trips are apart: a slug for a trip yet to come, with its own list and ticks', () => {
    expect(send('A', 'pack', { trip: 'hokkaido-2027', id: 'coat', at: at(), kind: 'item', cat: 'warm', ord: 0, name: { ja: 'コート' } })).toMatchObject({ ok: true });
    expect(send('A', 'pack', { trip: 'hokkaido-2027', id: 'warm', at: at(), kind: 'cat', ord: 0, name: { ja: 'あったか' }, icon: '🧣' })).toMatchObject({ ok: true });
    expect(send('B', 'pack_chk', { trip: 'hokkaido-2027', id: 'coat', at: at(), v: 1 })).toMatchObject({ ok: true });
    expect(packList('hokkaido-2027', null, book())).toMatchObject([{ id: 'warm', icon: '🧣', items: [{ id: 'coat', ticks: ['B'] }] }]);
    expect(names()).toEqual(['テント', 'Lamp', 'パスポート']);
  });

  it('keeps at most PACK_MAX rows a trip: the oldest removal of an added item goes for a new one; never a seed removal', () => {
    expect(rm('A', 'lamp')).toMatchObject({ ok: true });
    for (let i = 0; i < PACK_MAX - 2; i++) expect(item(i % 2 ? 'A' : 'G', `_cap${String(i).padStart(5, '0')}`, `#${i}`)).toMatchObject({ ok: true });
    expect(rm('A', '_cap00000')).toMatchObject({ ok: true });
    expect(rm('A', '_cap00001')).toMatchObject({ ok: true });
    expect(item('A', '_capnew01', 'あと ひとつ')).toMatchObject({ ok: true });
    expect(packRows()).toHaveLength(PACK_MAX);
    // full: the oldest added item's removal goes
    expect(item('A', '_capnew02', 'もうひとつ')).toMatchObject({ ok: true });
    expect(packRows()).toHaveLength(PACK_MAX);
    expect(packRows().some((r) => String(r[4]).includes('_cap00000'))).toBe(false);
    // the seed's removal stays: the lamp doesn't come back
    expect(names()).not.toContain('Lamp');
    expect(item('A', '_capnew03', 'さいご')).toMatchObject({ ok: true });
    // nothing left to drop: refused, logged as its rule
    const r = apiWithMeta(store, JSON.stringify({ key: KEY_A, action: 'event', id: 'efull', type: 'pack', data: { trip: 'okinawa', id: '_capnew04', at: at(), kind: 'item', cat: 'gear', ord: 1, name: { ja: 'むり' }, by: 'A' } }), (k) => keyOwner(String(k), { KEY_A, KEY_B, KEY_C }));
    expect(JSON.parse(r.body)).toMatchObject({ ok: false, error: 'bad_request', detail: 'pack full' });
    expect(r.meta).toMatchObject({ st: 'bad_request', why: 'pack.pack_full' });
    // an edit of one held still goes in, and another trip has its own room
    expect(item('A', '_capnew03', 'さいご（なおした）')).toMatchObject({ ok: true });
    expect(send('A', 'pack', { trip: 'nz', id: 'jacket', at: at(), kind: 'item', cat: 'wear', ord: 0, name: { en: 'Jacket' } })).toMatchObject({ ok: true });
  });

  it('a trip note: the members write it, all three read it, the latest wins; the guest may not write it', () => {
    expect(send('A', 'trip_note', { trip: 'okinawa', at: at(), v: { flightRef: 'ABC123', name: '  Wei  ' } })).toMatchObject({ ok: true });
    expect(tripNoteOf('okinawa', book(KEY_C))).toEqual({ flightRef: 'ABC123', name: 'Wei' });
    expect(send('G', 'trip_note', { trip: 'okinawa', at: at(), v: { flightRef: 'HACK' } })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(send('B', 'trip_note', { trip: 'okinawa', at: T0, v: { flightRef: 'OLD' } })).toMatchObject({ ok: true, duplicate: true });
    expect(send('B', 'trip_note', { trip: 'okinawa', at: at(), v: { flightRef: 'XYZ789' } })).toMatchObject({ ok: true });
    expect(tripNoteOf('okinawa', book(KEY_C))).toEqual({ flightRef: 'XYZ789' });
    expect(tripNoteOf('nz', book(KEY_C))).toBeNull();
    for (const v of [{ 'bad key': 'x' }, { k: 1 }, Object.fromEntries(Array.from({ length: 65 }, (_, i) => [`k${i}`, 'x'])), ['x']])
      expect(send('A', 'trip_note', { trip: 'okinawa', at: at(), v })).toMatchObject({ ok: false, error: 'bad_request' });
    expect((call(KEY_A, 'snapshot').rows.events as unknown[][]).filter((r) => r[3] === 'trip_note')).toHaveLength(1);
  });

  it('persists, and a dump loads back by the same rules', () => {
    item('G', '_pkp00001', 'のこる');
    tick('B', 'tent');
    send('A', 'trip_note', { trip: 'okinawa', at: at(), v: { ref: 'R1' } });
    store = open();
    expect(names()).toContain('のこる');
    const dumped = store.dump().rows.events;
    expect(dumped).toHaveLength(3);
    db = memSql();
    store = open();
    expect(store.load({ rows: { events: dumped } })).toMatchObject({ ok: true, events: 3 });
    expect(list()[0].items[0].ticks).toEqual(['B']);
    expect(tripNoteOf('okinawa', book(KEY_C))).toEqual({ ref: 'R1' });
    // a guest's trip note in a dump (never written so) is not taken
    db = memSql();
    store = open();
    expect(store.load({ rows: { events: [['2026-11-06T03:00:00.000Z', 'G', 'x1', 'trip_note', JSON.stringify({ trip: 'okinawa', at: T0, v: { ref: 'G' } })]] } })).toMatchObject({ ok: true, events: 0 });
  });
});
