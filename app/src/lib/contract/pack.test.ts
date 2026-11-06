// The packing list's contract (docs/travel.md "Packing list (relay)"): the ops' shapes and cleaning, the merge, who may
// do what, the caps, the phone's fold (the record's rows taken, its own queued ones judged) and the list over the seed.
import { describe, expect, it } from 'vitest';
import {
  newPackId, ordBetween, PACK_MAX, PackBook, packClean, packCounts, packFold, packList, packMayEdit, packOpOf, packRowOf,
  packSlot, tripNoteOf, type PackEntry, type PackSeed
} from './pack.ts';
import { eventSlot, validEventData } from './record.ts';
import { guestMayWrite } from './guest.ts';

const T = Date.parse('2026-11-06T03:00:00.000Z');
type W = 'A' | 'B' | 'G';
const SEED: PackSeed = {
  cats: [
    { id: 'ok-0', name: { ja: '書類', en: 'Documents' }, icon: 'file', items: [{ id: 'ok-0-0', text: { ja: '身分証明書' } }, { id: 'ok-0-1', text: { en: 'Licence' }, note: { en: 'JP' } }] },
    { id: 'ok-1', name: { ja: 'ふく' }, icon: 'shirt', items: [{ id: 'ok-1-0', text: { ja: 'Tシャツ' } }] }
  ]
};
const row = (type: string, who: W, d: Record<string, unknown>, queued = false): PackEntry => ({ ...packRowOf(type, d, who)!, ...(queued ? { queued: true as const } : {}) });
const set = (who: W, id: string, at: number, extra: Record<string, unknown> = {}) =>
  row('pack', who, { trip: 'okinawa', id, at, kind: 'item', cat: 'ok-0', ord: 9, name: { ja: id }, ...(id.startsWith('_') ? { by: who } : {}), ...extra });
const rm = (who: W, id: string, at: number) => row('pack', who, { trip: 'okinawa', id, at, rm: true });
const chk = (who: W, id: string, at: number, v: 0 | 1 = 1) => row('pack_chk', who, { trip: 'okinawa', id, at, v });

describe('the ops', () => {
  it('reads each type, its known keys only', () => {
    expect(packOpOf('pack', { trip: 'okinawa', id: 'ok-0-0', at: T, kind: 'item', cat: 'ok-0', ord: 1.5, name: { ja: 'x' }, note: { en: 'y' } })).toEqual({ trip: 'okinawa', id: 'ok-0-0', at: T, kind: 'item', cat: 'ok-0', ord: 1.5, name: { ja: 'x' }, note: { en: 'y' } });
    expect(packOpOf('pack', { trip: 'nz', id: '_abc1234', at: T, kind: 'cat', ord: -2, name: { en: 'Hut' }, icon: 'tent', by: 'G' })).toMatchObject({ kind: 'cat', icon: 'tent', by: 'G' });
    expect(packOpOf('pack', { trip: 'nz', id: '_abc1234', at: T, rm: true })).toEqual({ trip: 'nz', id: '_abc1234', at: T, rm: true });
    expect(packOpOf('pack_chk', { trip: 'nz', id: 'nz-1-2', at: T, v: 0 })).toEqual({ trip: 'nz', id: 'nz-1-2', at: T, v: 0 });
    expect(packOpOf('pack_reset', { trip: 'nz', at: T })).toEqual({ trip: 'nz', at: T });
    expect(packOpOf('trip_note', { trip: 'nz', at: T, v: { flightRef: 'NZ99' } })).toEqual({ trip: 'nz', at: T, v: { flightRef: 'NZ99' } });
    for (const [type, d] of [
      ['pack', { trip: 'nz', id: 'NZ', at: T, rm: true }],
      ['pack', { trip: 'a'.repeat(25), id: 'nz', at: T, rm: true }],
      ['pack', { trip: 'nz', id: '_short', at: T, rm: true }],
      ['pack', { trip: 'nz', id: 'x', at: 5, rm: true }],
      ['pack', { trip: 'nz', id: 'x', at: T, kind: 'cat', ord: 0, name: { en: 'x' } }],
      ['pack', { trip: 'nz', id: 'x', at: T, kind: 'item', cat: 'c', ord: 0, name: { en: 'x' }, icon: 'tent' }],
      ['pack', { trip: 'nz', id: 'x', at: T, kind: 'item', cat: 'c', ord: 0, name: { en: ' x' } }],
      ['pack', { trip: 'nz', id: 'x', at: T, kind: 'item', cat: 'c', ord: 0, name: {} }],
      ['pack', { trip: 'nz', id: 'x', at: T, kind: 'item', cat: 'c', ord: 2e9, name: { en: 'x' } }],
      ['pack', { trip: 'nz', id: 'x', at: T, kind: 'item', cat: 'c', ord: 0, name: { en: 'x' }, by: 'A' }],
      ['pack', { trip: 'nz', id: '_abc1234', at: T, kind: 'item', cat: 'c', ord: 0, name: { en: 'x' }, by: 'Z' }],
      ['pack_chk', { trip: 'nz', id: 'x', at: T, v: true }],
      ['pack_reset', { trip: 'nz', at: T, id: 'x' }],
      ['trip_note', { trip: 'nz', at: T, v: { k: 'a\nb' } }],
      ['trip_note', { trip: 'nz', at: T, v: { k: 'x'.repeat(501) } }],
      ['trip_note', { trip: 'nz', at: T, v: 'x' }],
      ['other', { trip: 'nz', at: T }]
    ] as const) expect(packOpOf(type, d as Record<string, unknown>), JSON.stringify(d)).toBeNull();
  });

  it('cleans names, notes and a note’s values as the record keeps them (idempotent)', () => {
    const d = packClean('pack', { trip: 'nz', id: 'x', at: T, kind: 'item', cat: 'c', ord: 0, name: { ja: ' あ\u0007い\nう ', en: '' }, note: { en: ' ' } });
    expect(d).toEqual({ trip: 'nz', id: 'x', at: T, kind: 'item', cat: 'c', ord: 0, name: { ja: 'あい う' } });
    expect(packClean('pack', d)).toEqual(d);
    expect(packOpOf('pack', d)).not.toBeNull();
    expect(Array.from((packClean('pack', { name: { en: 'y'.repeat(200) } }).name as { en: string }).en)).toHaveLength(80);
    expect(packClean('trip_note', { trip: 'nz', at: T, v: { a: '  A1 ' } })).toEqual({ trip: 'nz', at: T, v: { a: 'A1' } });
  });

  it('is an event the record takes (an `at` at most a day ahead) and fills its slot', () => {
    const d = { trip: 'okinawa', id: 'ok-0-0', at: T, v: 1 };
    expect(validEventData('pack_chk', d, T)).toBe(true);
    expect(validEventData('pack_chk', { ...d, at: T + 2 * 86400_000 }, T)).toBe(false);
    expect(eventSlot('pack_chk', 'G', 'G', d, T)).toBe('pack_chk|okinawa|ok-0-0|G');
    expect(eventSlot('pack', 'A', 'A', d, T)).toBe('pack|okinawa|ok-0-0');
    expect(eventSlot('pack_reset', 'B', 'B', d, T)).toBe('pack_reset|okinawa|B');
    expect(eventSlot('trip_note', 'A', 'A', d, T)).toBe('trip_note|okinawa');
    expect(packSlot('pack', 'A', { trip: 'Bad!', id: 'x' })).toBeNull();
    expect(['pack', 'pack_chk', 'pack_reset', 'trip_note'].map((t) => guestMayWrite(t, {}))).toEqual([true, true, true, false]);
    expect(newPackId(T)).toMatch(/^_[0-9a-z]{6,24}$/);
  });
});

describe('the rules (PackBook)', () => {
  it('the latest `at` wins, then G over B over A; a removal beats everything and is final', () => {
    const b = new PackBook();
    expect(b.apply(set('A', 'ok-0-0', T + 10)).v).toBe('append');
    expect(b.apply(set('B', 'ok-0-0', T + 5)).v).toBe('stale');
    expect(b.apply(set('A', 'ok-0-0', T + 20)).v).toBe('append');
    expect(b.apply(set('B', 'ok-0-0', T + 20)).v).toBe('append');
    expect(b.apply(set('A', 'ok-0-0', T + 20)).v).toBe('stale');
    expect(b.apply(rm('A', 'ok-0-0', T + 1)).v).toBe('append');
    expect(b.apply(set('G', '_new00001', T + 1)).v).toBe('append');
    expect(b.apply(set('B', 'ok-0-0', T + 99)).v).toBe('stale');
    expect(b.rows.size).toBe(2);
  });

  it('the guest: only what it made; a seed id is nobody’s; a member any; `by` stays its creator', () => {
    const b = new PackBook();
    b.apply(set('A', '_mine0001', T));
    b.apply(set('G', '_gst00001', T));
    expect(b.accept(set('G', 'ok-0-0', T + 1)).v).toBe('forbidden');
    expect(b.accept(rm('G', 'ok-0-0', T + 1)).v).toBe('forbidden');
    expect(b.accept(set('G', '_mine0001', T + 1, { by: 'A' })).v).toBe('forbidden');
    expect(b.accept(rm('G', '_mine0001', T + 1)).v).toBe('forbidden');
    expect(b.accept(set('G', '_gst00002', T + 1, { by: 'A' })).v).toBe('forbidden');
    expect(b.accept(set('G', '_gst00001', T + 1)).v).toBe('append');
    expect(b.accept(rm('G', '_gst00001', T + 1)).v).toBe('append');
    expect(b.accept(set('B', '_gst00001', T + 1, { by: 'G' })).v).toBe('append');
    expect(b.accept(set('B', '_gst00001', T + 1, { by: 'B' })).v).toBe('owner');
    expect(b.accept(rm('B', 'ok-0-0', T + 1)).v).toBe('append');
    // an id an op made that isn't held: only its creation
    expect(b.accept(rm('A', '_gone0001', T + 1)).v).toBe('stale');
    expect(b.accept(set('A', '_gone0001', T + 1, { by: 'B' })).v).toBe('stale');
    // the guest's note: never
    expect(b.accept(row('trip_note', 'G', { trip: 'okinawa', at: T, v: {} })).v).toBe('forbidden');
  });

  it('ticks: a removed item’s go with it, a late one is stale; one slot a person', () => {
    const b = new PackBook();
    b.apply(set('A', '_tick0001', T));
    expect(b.apply(chk('A', '_tick0001', T + 1)).v).toBe('append');
    expect(b.apply(chk('G', '_tick0001', T + 1)).v).toBe('append');
    expect(b.apply(chk('A', '_tick0001', T)).v).toBe('stale');
    expect(b.apply(rm('B', '_tick0001', T + 2))).toEqual({ v: 'append', drop: ['pack_chk|okinawa|_tick0001|A', 'pack_chk|okinawa|_tick0001|G'] });
    expect(b.apply(chk('A', '_tick0001', T + 3)).v).toBe('stale');
    expect(b.apply(chk('A', '_never001', T + 3)).v).toBe('stale');
    expect(b.apply(chk('A', 'ok-0-0', T + 3)).v).toBe('append');
    expect(b.rows.size).toBe(2);
  });

  it('caps a trip at PACK_MAX rows: the oldest removal of an id an op made goes; a seed removal never', () => {
    const b = new PackBook();
    b.apply(rm('A', 'ok-0-1', T));
    for (let i = 0; i < PACK_MAX - 1; i++) b.apply(set('A', `_cap${String(i).padStart(5, '0')}`, T + i));
    b.apply(rm('A', '_cap00007', T + 1000));
    b.apply(rm('A', '_cap00003', T + 1001));
    expect(b.accept(set('A', '_capnew01', T + 2000))).toEqual({ v: 'append', drop: ['pack|okinawa|_cap00007'] });
    b.apply(set('A', '_capnew01', T + 2000));
    b.apply(set('A', '_capnew02', T + 2001));
    expect(b.accept(set('A', '_capnew03', T + 2002)).v).toBe('full');
    // an edit of one held, another trip: room
    expect(b.accept(set('A', '_capnew02', T + 2003)).v).toBe('append');
    expect(b.accept(row('pack', 'A', { trip: 'nz', id: 'nz-0', at: T, rm: true })).v).toBe('append');
    expect(b.rows.has('pack|okinawa|ok-0-1')).toBe(true);
  });
});

describe('the phone’s fold and the list', () => {
  it('takes the record’s rows as they are (an item edited by a member after the guest made it) and judges its queued ones', () => {
    // the record keeps the slot's latest only: B's edit of the guest's item
    const rows: PackEntry[] = [set('B', '_gst00001', T + 5, { by: 'G' }), set('G', '_gst00002', T + 6, { cat: 'ok-1' })];
    const b = packFold([...rows, set('G', '_gst00001', T + 7, { name: { ja: 'ゲストが' } }), { ...set('G', 'ok-0-0', T + 8), queued: true }]);
    expect(b.item('okinawa', '_gst00001')!.op).toMatchObject({ name: { ja: 'ゲストが' }, by: 'G' });
    // the guest's queued edit of a seed item: the record would refuse it
    expect(b.item('okinawa', 'ok-0-0')).toBeNull();
    // an older record row never replaces a newer one
    expect(packFold([set('A', 'ok-0-0', T + 9), set('B', 'ok-0-0', T + 1)]).item('okinawa', 'ok-0-0')!.who).toBe('A');
  });

  it('the list: the seed with the ops over it, by ord; a removed category hides its items; ticks after each one’s reset', () => {
    const b = packFold([
      set('A', 'ok-0-0', T, { ord: 5, name: { ja: 'パスポート' } }),
      set('G', '_gst00001', T + 1, { ord: 0.5 }),
      rm('B', 'ok-1', T + 2),
      row('pack', 'A', { trip: 'okinawa', id: '_cat00001', at: T + 3, kind: 'cat', ord: -1, name: { en: 'Snacks' }, icon: 'cart', by: 'A' }),
      set('A', '_snk00001', T + 4, { cat: '_cat00001', ord: 0 }),
      chk('A', 'ok-0-1', T + 10), chk('B', 'ok-0-1', T + 10), chk('G', 'ok-0-1', T + 10), chk('A', '_gst00001', T + 30),
      chk('B', '_gst00001', T + 10, 0),
      row('pack_reset', 'A', { trip: 'okinawa', at: T + 20 }),
      chk('A', 'ok-1-0', T + 30),
      row('pack', 'A', { trip: 'nz', id: 'nz-0-0', at: T, rm: true }),
      row('trip_note', 'A', { trip: 'okinawa', at: T, v: { flightRef: 'X1' } })
    ]);
    const l = packList('okinawa', SEED, b);
    expect(l.map((c) => [c.id, c.seed, c.by, c.items.map((i) => [i.id, i.ticks.join('')])])).toEqual([
      ['_cat00001', false, 'A', [['_snk00001', '']]],
      ['ok-0', true, null, [['_gst00001', 'A'], ['ok-0-1', 'BG'], ['ok-0-0', '']]]
    ]);
    expect(l[1].items[2]).toMatchObject({ name: { ja: 'パスポート' }, seed: true, by: null });
    expect(l[1].items[1]).toMatchObject({ name: { en: 'Licence' }, note: { en: 'JP' } });
    expect(packCounts(l)).toEqual({ total: 4, done: { A: 1, B: 1, G: 1 } });
    expect(packList('nz', null, b)).toEqual([]);
    expect(tripNoteOf('okinawa', b)).toEqual({ flightRef: 'X1' });
    expect(tripNoteOf('seattle', b)).toBeNull();
    expect([packMayEdit('G', l[1].items[0]), packMayEdit('G', l[1].items[1]), packMayEdit('B', l[1].items[1])]).toEqual([true, false, true]);
  });

  it('ord between neighbours', () => {
    expect([ordBetween(undefined, undefined), ordBetween(3, undefined), ordBetween(undefined, 3), ordBetween(1, 2)]).toEqual([0, 4, 2, 1.5]);
  });
});
