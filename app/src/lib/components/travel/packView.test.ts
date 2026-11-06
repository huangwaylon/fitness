// PackList's view of a trip's list (packView.ts): my counts, the chips, the text's language, what A, B and the guest
// may change, the icons, and the 「じゅんび OK！」 celebration once per trip and person.
import { describe, expect, it } from 'vitest';
import { packFold, packList, type PackEntry, type PackSeed } from '#lib/contract/pack.ts';
import { celebrate, chipsOf, mayEditAs, myProgress, packView, pick } from './packView.ts';
import { glyphOf, iconOf } from './icons.ts';

const T = Date.parse('2026-11-06T03:00:00.000Z');
const SEED: PackSeed = {
  cats: [
    { id: 'ok-0', name: { ja: '書類', en: 'Documents' }, icon: 'file', items: [{ id: 'ok-0-0', text: { ja: '身分証明書', en: 'Photo ID' }, note: { en: 'On the phone' } }, { id: 'ok-0-1', text: { en: 'Licence' } }] },
    { id: 'ok-1', name: { ja: 'ふく' }, icon: 'shirt', items: [{ id: 'ok-1-0', text: { ja: 'Tシャツ' } }] }
  ]
};
const row = (who: 'A' | 'B' | 'G', type: PackEntry['type'], op: object): PackEntry => ({ type, who, op }) as PackEntry;
const chk = (who: 'A' | 'B' | 'G', id: string, at = T) => row(who, 'pack_chk', { trip: 'okinawa', id, at, v: 1 });
const listOf = (rows: PackEntry[]) => packList('okinawa', SEED, packFold(rows));
// the guest's own category with its own item, and a member's item in the seed's category
const G_CAT = row('G', 'pack', { trip: 'okinawa', id: '_g0000001', at: T, kind: 'cat', ord: 2, name: { ja: 'おやつ' }, icon: '🍙', by: 'G' });
const G_ITEM = row('G', 'pack', { trip: 'okinawa', id: '_g0000002', at: T + 1, kind: 'item', cat: '_g0000001', ord: 0, name: { ja: 'ちんすこう' }, by: 'G' });
const A_ITEM = row('A', 'pack', { trip: 'okinawa', id: '_a0000001', at: T + 2, kind: 'item', cat: 'ok-1', ord: 1, name: { ja: 'ぼうし' }, by: 'A' });

describe('packView', () => {
  it('counts my ticks per category and overall', () => {
    const list = listOf([chk('A', 'ok-0-0'), chk('B', 'ok-0-1'), chk('B', 'ok-0-0'), chk('A', 'ok-1-0')]);
    const a = packView(list, 'A', 'ja');
    expect(a.map((c) => [c.id, c.mine, c.total])).toEqual([['ok-0', 1, 2], ['ok-1', 1, 1]]);
    expect(myProgress(a)).toEqual({ mine: 2, total: 3, done: false });
    const b = packView(list, 'B', 'ja');
    expect(b.map((c) => c.mine)).toEqual([2, 0]);
    expect(b[0].rows.map((r) => r.mine)).toEqual([true, true]);
    expect(myProgress(packView(listOf([chk('G', 'ok-0-0'), chk('G', 'ok-0-1'), chk('G', 'ok-1-0')]), 'G', 'ja')).done).toBe(true);
    // nothing to pack is not "all packed"
    expect(myProgress(packView(packList('okinawa', { cats: [] }, packFold([])), 'A', 'ja'))).toEqual({ mine: 0, total: 0, done: false });
  });

  it('chips: the members always (lit when packed), the guest only once it has packed it', () => {
    expect(chipsOf([])).toEqual([{ who: 'A', on: false }, { who: 'B', on: false }]);
    expect(chipsOf(['B'])).toEqual([{ who: 'A', on: false }, { who: 'B', on: true }]);
    expect(chipsOf(['A', 'G'])).toEqual([{ who: 'A', on: true }, { who: 'B', on: false }, { who: 'G', on: true }]);
    const v = packView(listOf([chk('G', 'ok-0-0'), chk('B', 'ok-0-0')]), 'A', 'ja');
    expect(v[0].rows[0].chips).toEqual([{ who: 'A', on: false }, { who: 'B', on: true }, { who: 'G', on: true }]);
    expect(v[0].rows[1].chips.map((c) => c.who)).toEqual(['A', 'B']);
  });

  it('shows the reader’s language, else the other side', () => {
    expect(pick({ ja: 'あ', en: 'a' }, 'en')).toBe('a');
    expect(pick({ en: 'a' }, 'ja')).toBe('a');
    expect(pick(undefined, 'ja')).toBe('');
    const ja = packView(listOf([]), 'A', 'ja'), en = packView(listOf([]), 'A', 'en');
    expect([ja[0].name, ja[0].rows[0].text, ja[0].rows[0].note, ja[0].rows[1].text]).toEqual(['書類', '身分証明書', 'On the phone', 'Licence']);
    expect([en[0].name, en[0].rows[0].text, en[1].name, en[1].rows[0].text]).toEqual(['Documents', 'Photo ID', 'ふく', 'Tシャツ']);
  });

  it('edit permissions: the members anything, the guest only what it added', () => {
    const list = listOf([G_CAT, G_ITEM, A_ITEM]);
    for (const who of ['A', 'B'] as const) {
      const v = packView(list, who, 'ja');
      expect(v.every((c) => c.editable && c.rows.every((r) => r.editable))).toBe(true);
    }
    const g = packView(list, 'G', 'ja');
    expect(g.map((c) => [c.id, c.editable, c.rows.map((r) => r.editable)])).toEqual([
      ['ok-0', false, [false, false]],
      ['ok-1', false, [false, false]],
      ['_g0000001', true, [true]]
    ]);
    // the guest's category with a member's item in it: not the guest's to change any more (the item is)
    const mixed = listOf([G_CAT, G_ITEM, row('A', 'pack', { trip: 'okinawa', id: '_a0000002', at: T + 3, kind: 'item', cat: '_g0000001', ord: 1, name: { ja: 'A の' }, by: 'A' })]);
    const gc = packView(mixed, 'G', 'ja').at(-1)!;
    expect([gc.editable, gc.rows.map((r) => r.editable)]).toEqual([false, [true, false]]);
    expect(mayEditAs('A', gc.cat)).toBe(true);
  });

  it('icons: the guides’ names as NH art, an emoji as itself, anything else a bag', () => {
    expect(iconOf('file')).toEqual({ art: 'finds/items/antique-map' });
    expect(iconOf('gift')).toEqual({ art: 'deco/present' });
    expect(iconOf('plane-takeoff')).toEqual({ art: 'finds/items/shopping-bag' });
    expect(iconOf('🍙')).toEqual({ emoji: '🍙' });
    expect(iconOf('')).toEqual({ art: 'finds/items/shopping-bag' });
    // the cards' glyphs, from the same table
    expect(glyphOf('tent')).toBe('⛺');
    expect(glyphOf('nope')).toBe('📍');
  });
});

describe('the 「じゅんび OK！」 celebration', () => {
  it('once per trip and person on a phone', () => {
    const first = celebrate([], 'A', 'okinawa');
    expect(first).toEqual({ now: true, seen: ['A|okinawa'] });
    expect(celebrate(first.seen, 'A', 'okinawa').now).toBe(false);
    // another person on this phone (the demo's tabs), another trip: their own
    expect(celebrate(first.seen, 'B', 'okinawa')).toEqual({ now: true, seen: ['A|okinawa', 'B|okinawa'] });
    expect(celebrate(first.seen, 'A', 'nz').now).toBe(true);
    // kept short: the latest 24
    const many = Array.from({ length: 30 }, (_, i) => `A|t${i}`);
    expect(celebrate(many, 'G', 'nz').seen).toHaveLength(24);
  });
});
