// The search's facets (lib/places/facets.ts): the pack's round trip on invented places (kind, rating, flags, hours,
// a description), broken files read as none, the hash vendored.ts shards by, and the committed
// files in step with the committed shards (scripts/places-facets.ts; `npm run places:facets` after a re-vendor).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { descTableOf, facetTableOf, fnv1a, packFacets } from './facets.ts';
import type { VendoredPlace } from './vendored.ts';

import { shardOf } from './vendored.ts';

const APP = join(import.meta.dirname, '..', '..', '..');
const at = 1_790_000_000;
const PLACES: Record<string, VendoredPlace> = {
  '111': { at, hours: [{ d: 1, o: 660, c: 1260 }, { d: 0, o: 600, c: 1080 }], kind: 'ラーメン屋', r: 4.4, rn: 812, web: 'https://example.com/', tel: '03-0000-0000', desc: '濃厚な一杯' },
  '222': { at, hours: null, kind: 'カフェ・喫茶', r: 3.9, rn: 12 },
  'f:0x1:0x2': { at, hours: [{ d: 0, o: 600, c: 1080 }, { d: 1, o: 660, c: 1260 }] },
  '333': { at, hours: null }
};

describe('the facets', () => {
  it('packed and read back: kind, rating, count, flags, hours (one pattern shared), descriptions', () => {
    const { facets, descs } = packFacets(PLACES);
    expect(facets.hp).toHaveLength(1);
    const f = facetTableOf(JSON.parse(JSON.stringify(facets)))!;
    expect(f.size).toBe(4);
    expect(f.get('111')).toEqual({ kind: 'ラーメン屋', r: 4.4, rn: 812, hours: [{ d: 0, o: 600, c: 1080 }, { d: 1, o: 660, c: 1260 }], web: true, tel: true });
    expect(f.get('222')).toEqual({ kind: 'カフェ・喫茶', r: 3.9, rn: 12, hours: null, web: false, tel: false });
    expect(f.get('f:0x1:0x2')?.hours).toHaveLength(2);
    expect(f.get('333')).toEqual({ kind: null, r: null, rn: 0, hours: null, web: false, tel: false });
    expect(f.get('999')).toBeUndefined();
    const d = descTableOf(JSON.parse(JSON.stringify(descs)))!;
    expect(d.size).toBe(1);
    expect(d.get('111')).toBe('濃厚な一杯');
    expect(d.get('222')).toBeUndefined();
    expect(JSON.stringify(packFacets(PLACES))).toBe(JSON.stringify(packFacets(Object.fromEntries(Object.entries(PLACES).reverse()))));
  });
  it('a broken file is none; the hash is the shards’ own', () => {
    const { facets } = packFacets(PLACES);
    expect(facetTableOf(null)).toBeNull();
    expect(facetTableOf({ ...facets, v: 2 })).toBeNull();
    expect(facetTableOf({ ...facets, k: facets.k.slice(1) })).toBeNull();
    expect(facetTableOf({ ...facets, h: facets.h.map((x, i) => (i === 1 ? -x : x)) })).toBeNull();
    expect(facetTableOf({ ...facets, hz: facets.hz.map(() => 9) })).toBeNull();
    expect(descTableOf({ v: 1, h: [1], d: [] })).toBeNull();
    for (const id of ['111', 'f:0x1:0x2', '18446744073709551615']) expect(shardOf(id, 35)).toBe(fnv1a(id) % 35);
  });
  it.runIf(existsSync(join(APP, 'static/places/d')))('the committed files are the committed shards’ (npm run places:facets)', async () => {
    const { facetFiles } = await import('../../../scripts/places-facets.ts');
    const want = facetFiles();
    const dir = join(import.meta.dirname, 'data');
    expect(readFileSync(join(dir, 'places-facets.json'), 'utf8') === want.facets, 'places-facets.json is stale: npm run places:facets').toBe(true);
    expect(readFileSync(join(dir, 'places-descs.json'), 'utf8') === want.descs, 'places-descs.json is stale: npm run places:facets').toBe(true);
  });
});
