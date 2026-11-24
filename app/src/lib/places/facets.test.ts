// The search's facets (lib/places/facets.ts detTables): the relay's details read as the search's tables, on invented
// places (kind, rating, flags, hours, a description).
import { describe, expect, it } from 'vitest';
import type { PlaceDet } from '../contract/places.ts';
import { detTables } from './facets.ts';

const at = 1_790_000_000;
const PLACES: Record<string, PlaceDet> = {
  '111': { at, hours: [{ d: 0, o: 600, c: 1080 }, { d: 1, o: 660, c: 1260 }], kind: 'ラーメン屋', r: 4.4, rn: 812, web: 'https://example.com/', tel: '03-0000-0000', desc: '濃厚な一杯' },
  '222': { at, hours: null, kind: 'カフェ・喫茶', r: 3.9, rn: 12 },
  'f:0x1:0x2': { at, hours: [] },
  '333': { at, hours: null }
};

describe('the facets', () => {
  it('kind, rating, count, hours, descriptions; none for a place without details', () => {
    const { facets: f, descs: d } = detTables(PLACES);
    expect(f.size).toBe(4);
    expect(f.get('111')).toEqual({ kind: 'ラーメン屋', r: 4.4, rn: 812, hours: PLACES['111'].hours });
    expect(f.get('222')).toEqual({ kind: 'カフェ・喫茶', r: 3.9, rn: 12, hours: null });
    expect(f.get('f:0x1:0x2')?.hours).toBeNull(); // (an empty week: unknown, as none)
    expect(f.get('333')).toEqual({ kind: null, r: null, rn: 0, hours: null });
    expect(f.get('999')).toBeUndefined();
    expect(d.size).toBe(1);
    expect(d.get('111')).toBe('濃厚な一杯');
    expect(d.get('222')).toBeUndefined();
  });
});
