// 行きたい場所's contract (contract/places.ts): the payload's check, the rows it reads into, a delta's merge, the
// guest's columns, the link and the opening hours.
import { describe, expect, it } from 'vitest';
import { applyPlaces, isPlaceSub, openAt, placeRows, placesPayload, placesPayloadOf, placeUrl, PLACE_CAT_KEYS, type Place } from './places.ts';

const row = (id: string, added: number, o: Partial<Place> = {}): Place => ({
  id, name: `場所${id}`, lat: 35.1, lng: 139.2, addr: '東京都', cat: '麺', sub: 'ラーメン', added, hours: null, tz: 'Asia/Tokyo', web: '', note: 'n', by: 0, ...o
});

describe('the payload', () => {
  it('round-trips a member’s payload; the guest’s has no note, by or people', () => {
    const rows = [row('1', 10), row('2', 20, { hours: [{ d: 1, o: 600, c: 1320 }] })];
    const m = placesPayload(rows, { ver: 3, full: true, syncedAt: 5, people: ['A'] });
    expect(placesPayloadOf(JSON.parse(JSON.stringify(m)))).not.toBeNull();
    expect(placeRows(m)).toEqual(rows);
    const g = placesPayload(rows, { ver: 3, full: true, syncedAt: 5 });
    expect(placesPayloadOf(g)).not.toBeNull();
    expect(g.cols.note).toBeUndefined();
    expect(g.people).toBeUndefined();
    expect(placeRows(g)[0]).not.toHaveProperty('note');
  });
  it('refuses a column of the wrong length, an unknown category or a bad period', () => {
    const p = placesPayload([row('1', 1)], { ver: 1, full: true, syncedAt: null });
    expect(placesPayloadOf({ ...p, n: 2 })).toBeNull();
    expect(placesPayloadOf({ ...p, cols: { ...p.cols, cat: ['nope'] } })).toBeNull();
    expect(placesPayloadOf({ ...p, cols: { ...p.cols, hours: [[{ d: 7, o: 0, c: 10 }]] } })).toBeNull();
    expect(placesPayloadOf({ ...p, v: 2 })).toBeNull();
  });
  it('a delta replaces its rows and drops the gone; a full one replaces all; newest first', () => {
    const prev = [row('1', 10), row('2', 20), row('3', 30)];
    const d = placesPayload([row('2', 20, { name: 'new' }), row('4', 40)], { ver: 9, full: false, syncedAt: 1, gone: ['3'] });
    expect(applyPlaces(prev, d).map((r) => `${r.id}${r.name}`)).toEqual(['4場所4', '2new', '1場所1']);
    expect(applyPlaces(prev, { ...d, full: true }).map((r) => r.id)).toEqual(['4', '2']);
  });
});

describe('the rest', () => {
  it('every top has its subs; a sub of another top is not its', () => {
    expect(PLACE_CAT_KEYS).toHaveLength(13);
    expect(isPlaceSub('麺', 'うどん')).toBe(true);
    expect(isPlaceSub('麺', '寿司')).toBe(false);
  });
  it('links by cid, else by coordinates', () => {
    expect(placeUrl({ id: '123', name: 'x', lat: 1, lng: 2 })).toBe('https://maps.google.com/?cid=123');
    expect(placeUrl({ id: 'f:0x1:0x2', name: 'x', lat: 1.5, lng: 2 })).toContain('query=1.5,2');
  });
  it('open at: in the place’s zone, past midnight, wrapping Saturday night, unknown', () => {
    const fri18 = Date.parse('2026-11-20T09:00:00Z'); // Friday 18:00 Tokyo
    const sat0130 = Date.parse('2026-11-20T16:30:00Z'); // Saturday 01:30 Tokyo
    const h = [{ d: 5, o: 1080, c: 1560 }];
    expect(openAt(h, 'Asia/Tokyo', fri18)).toBe(true);
    expect(openAt(h, 'Asia/Tokyo', sat0130)).toBe(true);
    expect(openAt(h, 'Asia/Tokyo', fri18 - 3_600_000)).toBe(false);
    expect(openAt(h, 'Europe/London', fri18)).toBe(false); // 09:00 Friday in London
    const satLate = [{ d: 6, o: 1320, c: 1680 }]; // Saturday 22:00 to Sunday 04:00
    expect(openAt(satLate, 'Asia/Tokyo', Date.parse('2026-11-21T17:00:00Z'))).toBe(true); // Sunday 02:00
    expect(openAt([{ d: 0, o: 0, c: 10080 }], 'Asia/Tokyo', fri18)).toBe(true);
    expect(openAt(null, 'Asia/Tokyo', fri18)).toBeNull();
  });
});
