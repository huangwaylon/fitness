import { describe, expect, it } from 'vitest';
import { okinawa } from '#lib/travel/trips/okinawa.ts';
import { seattle } from '#lib/travel/trips/seattle.ts';
import { nz } from '#lib/travel/trips/nz.ts';
import type { Camp } from '#lib/travel/types.ts';
import { CAMP_FILTERS, campShown, dayLook, dayOpen, frozenPack, guideLang, hhmm, leadChip, rowState, shortDate, stopDays, stopRows, viewsOf } from './guide.ts';
import { ICONS, iconOf } from './icons.ts';

describe('classic guides', () => {
  it('are Okinawa and Seattle (the trips that are over), not New Zealand', () => {
    expect([okinawa, seattle, nz].filter((x) => x.classic).map((x) => x.id)).toEqual(['okinawa', 'seattle']);
  });
  it('have the site’s tabs: Okinawa all four, Seattle the itinerary and packing', () => {
    expect(viewsOf(okinawa)).toEqual(['itinerary', 'map', 'camps', 'packing']);
    expect(viewsOf(seattle)).toEqual(['itinerary', 'packing']);
  });
  it('speak the reader’s language where the guide is written in it, else the guide’s', () => {
    expect(guideLang(okinawa, 'ja')).toBe('ja');
    expect(guideLang(okinawa, 'en')).toBe('en');
    expect(guideLang(seattle, 'ja')).toBe('en');
  });
  it('give each day the site’s card: Okinawa’s itinerary days open, Seattle’s flights, hikes and plain days closed', () => {
    expect(okinawa.days.map(dayLook)).toEqual(['day', 'day', 'day']);
    expect(okinawa.days.every(dayOpen)).toBe(true);
    const looks = seattle.days.map(dayLook);
    expect(looks[0]).toBe('travel');
    expect(looks.at(-1)).toBe('travel');
    expect(looks.filter((l) => l === 'hike')).toHaveLength(seattle.days.filter((d) => d.hike).length);
    expect(seattle.days.some(dayOpen)).toBe(false);
  });
  it('date a day as the site’s chip, in the guide’s language', () => {
    expect(leadChip('2026-10-10', 'ja')).toEqual({ d: '10', m: '10月', wd: '土' });
    expect(leadChip('2026-10-10', 'en')).toEqual({ d: '10', m: 'OCT', wd: 'Sat' });
    expect(leadChip('2026-07-02', 'en')).toEqual({ d: '2', m: 'JUL', wd: 'Thu' });
    expect(shortDate('2026-07-03', 'en')).toBe('Jul 3');
    expect(shortDate('2026-07-03', 'ja')).toBe('7月3日');
  });
  it('know every icon the two guides name', () => {
    const names = [okinawa, seattle].flatMap((x) => [...x.days.map((d) => d.icon), ...x.logistics.map((c) => c.icon), ...x.packing.cats.map((c) => c.icon)]);
    expect(names.filter((n) => !ICONS[n])).toEqual([]);
    expect(iconOf('no-such-icon')).toBe(ICONS.backpack);
  });
});

describe('the campsite filter (one criterion at a time, as the site’s)', () => {
  const camps = okinawa.camps!;
  const count = (f: (typeof CAMP_FILTERS)[number]) => camps.filter((c) => campShown(c, f)).length;
  it('shows all 26 at first', () => {
    expect(camps).toHaveLength(26);
    expect(count('all')).toBe(26);
  });
  it('splits free and paid, and picks an amenity', () => {
    expect(count('wild') + count('paid')).toBe(26);
    expect(count('paid')).toBeGreaterThan(0);
    for (const a of ['beach', 'toilet', 'shower'] as const) expect(count(a)).toBe(camps.filter((c) => c[a]).length);
    const c: Camp = { ...camps[0], type: 'paid', beach: false, toilet: true, shower: false };
    expect(CAMP_FILTERS.filter((f) => campShown(c, f))).toEqual(['all', 'paid', 'toilet']);
  });
});

describe('the frozen packing list', () => {
  it('is the seed as it is: categories and items in its order, notes kept', () => {
    const p = frozenPack(okinawa.packing);
    expect(p.map((c) => c.id)).toEqual(okinawa.packing.cats.map((c) => c.id));
    expect(p[0].items.map((i) => i.id)).toEqual(okinawa.packing.cats[0].items.map((i) => i.id));
    expect(p[0].items[0].note).toEqual(okinawa.packing.cats[0].items[0].note);
    expect(frozenPack(seattle.packing).reduce((n, c) => n + c.items.length, 0)).toBe(seattle.packing.cats.reduce((n, c) => n + c.items.length, 0));
  });
  it('leaves an empty category out, and an item without a note has none', () => {
    const p = frozenPack({ cats: [{ id: 'a', name: { en: 'A' }, icon: 'tent', items: [] }, { id: 'b', name: { en: 'B' }, icon: 'gift', items: [{ id: 'b-0', text: { en: 'x' } }] }] });
    expect(p).toEqual([{ id: 'b', icon: 'gift', name: { en: 'B' }, items: [{ id: 'b-0', text: { en: 'x' } }] }]);
  });
});

describe('the map’s stop list', () => {
  it('lists a day’s stops in order, or every day’s', () => {
    const d1 = stopRows(okinawa.places, 1);
    expect(d1.map((r) => r.i)).toEqual(d1.map((_, i) => i));
    expect(hhmm(d1[0].min)).toBe('08:55');
    expect(stopDays(okinawa.places)).toEqual([1, 2, 3]);
    const all = stopRows(okinawa.places, 0);
    expect(all.length).toBe(stopRows(okinawa.places, 1).length + stopRows(okinawa.places, 2).length + stopRows(okinawa.places, 3).length);
    expect(all.map((r) => r.day)).toEqual([...all.map((r) => r.day)].sort());
  });
  it('greys what is behind "now" on its day only', () => {
    const [a, b, c] = stopRows(okinawa.places, 1);
    expect([a, b, c].map((r) => rowState(r, 1, b.min))).toEqual(['past', 'now', '']);
    expect(rowState(a, 2, b.min)).toBe('');
    expect(rowState(a, 0, b.min)).toBe('');
    expect(rowState(a, 1, null)).toBe('');
  });
});
