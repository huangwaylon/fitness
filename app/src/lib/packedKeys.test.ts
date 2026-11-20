import { describe, expect, it } from 'vitest';
import { catalogNameKeys, pack, packRefs, unpack, unpackRefs, type RoomPlaces, type Ref } from './packedKeys.ts';
import more from './components/tent/more.json';
import hha from './components/tent/hha.json';
import tentJa from './i18n/tent.ja.json';
import tentEn from './i18n/tent.en.json';
import catalogJa from './i18n/catalog.ja.json';
import catalogEn from './i18n/catalog.en.json';
import catalog from './components/island/catalog.json';
import { ITEMS, TENT_CODES, TENT_NAME_KEYS } from './components/tent/items.ts';
import { loadHha } from './components/tent/hha.ts';

describe('packedKeys', () => {
  it('packs a table to its values in the keys’ order, the rest aside, and back', () => {
    const t = { b: 2, a: 1, z: 26 };
    const p = pack(t, ['a', 'b', 'c']);
    expect(p).toEqual({ v: [1, 2, null], x: { z: 26 } });
    expect(unpack(p, ['a', 'b', 'c'])).toEqual(t);
    expect(pack({ a: 1 }, ['a'])).toEqual({ v: [1] });
  });

  it('refuses values packed by another key list', () => {
    expect(() => unpack({ v: [1, 2] }, ['a'])).toThrow(/2 values for 1 keys/);
  });

  it('the shipped tables round-trip with the app’s own key lists, nearly all by their order', () => {
    for (const [t, keys] of [[hha, TENT_CODES], [tentJa, TENT_NAME_KEYS], [tentEn, TENT_NAME_KEYS], [catalogJa, catalogNameKeys(catalog)], [catalogEn, catalogNameKeys(catalog)]] as const) {
      const p = pack(t as Record<string, unknown>, keys);
      expect(unpack(p, keys)).toEqual(t);
      expect(Object.keys(p.x ?? {}).length).toBeLessThan(60); // the tent's series' names
    }
  });

  it('a packed import is the table itself (vite.config.ts packed-keys)', async () => {
    expect(await loadHha()).toEqual(hha);
    expect((await import('./i18n/tent.en.json?packed')).default).toEqual(tentEn);
    expect((await import('./i18n/catalog.ja.json?packed')).default).toEqual(catalogJa);
  });

  it('more.json’s pack places: by a pack’s index, an offset only off the run, back the same (but the scripts’ g)', () => {
    const t: RoomPlaces<Ref> = { items: { a: { pk: ['p.1', 10, 5], g: 'misc' }, b: {}, c: { pk: ['q.2', 0, 7] } }, tex: { w: ['p.1', 15, 3] }, icons: { a: ['p.1', 40, 2], c: ['q.2', 7, 1] } };
    const p = packRefs(t);
    expect(p).toEqual({ packs: ['p.1', 'q.2'], items: { a: { pk: [0, 10, 5] }, b: {}, c: { pk: [1, 0, 7] } }, tex: { w: [0, 3] }, icons: { a: [0, 40, 2], c: [1, 1] } });
    expect(unpackRefs(p)).toEqual({ ...t, items: { ...t.items, a: { pk: ['p.1', 10, 5] } } });
    const raw = more as unknown as RoomPlaces<Ref>;
    expect(unpackRefs(packRefs(raw)).tex).toEqual(raw.tex);
    for (const [c, m] of Object.entries(raw.items)) expect(ITEMS[c].pk).toEqual(m.pk);
  });
});
