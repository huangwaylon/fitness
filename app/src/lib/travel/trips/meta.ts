// What the りょこう list shows of each trip (docs/design.md §Trips), without its guide: the list loads only this; a
// guide's chunk loads when it is opened. `days` keeps only the rows on another date than their day's (the NZ flight
// out on the eve, the flight home after midnight), the ones that put a trip on outside its calendar (when.ts
// phaseOf). trips.test checks every field against the guide; `code` is the list's alone (its boarding pass's route,
// TYO ✈ the trip's airport).
import type { Trip } from '../types.ts';

export type TripMeta = Pick<Trip, 'id' | 'title' | 'eyebrow' | 'start' | 'end' | 'tz' | 'cover' | 'days'> & { code: string };

const L0 = { ja: '', en: '' };

export const TRIP_META: readonly TripMeta[] = [
  {
    id: 'okinawa',
    code: 'OKA',
    title: { ja: '沖縄', en: 'Okinawa' },
    eyebrow: { ja: '沖縄本島 · 3日間', en: 'Okinawa Main Island · 3 days' },
    start: '2026-10-10',
    end: '2026-10-12',
    tz: 'Asia/Tokyo',
    cover: { src: 'travel/okinawa/cover.webp', w: 560, h: 760 },
    days: []
  },
  {
    id: 'seattle',
    code: 'SEA',
    title: { en: 'Seattle' },
    eyebrow: { en: 'Cascades · 18 days' },
    start: '2026-07-02',
    end: '2026-07-19',
    tz: 'America/Los_Angeles',
    cover: { src: 'travel/seattle/cover.webp', w: 560, h: 760 },
    days: []
  },
  {
    id: 'nz',
    code: 'AKL',
    title: { ja: 'ニュージーランド', en: 'New Zealand' },
    eyebrow: { ja: '北島 · 6日間', en: 'North Island · 6 days' },
    start: '2027-02-11',
    end: '2027-02-16',
    tz: 'Pacific/Auckland',
    cover: { src: 'travel/nz/cover.webp', w: 560, h: 760 },
    days: [
      { n: 1, date: '2027-02-11', icon: '', title: L0, rows: [{ t: '18:30', text: L0, dd: -1, tz: 'Asia/Tokyo' }] },
      { n: 6, date: '2027-02-16', icon: '', title: L0, rows: [{ t: '00:10', text: L0, dd: 1 }] }
    ]
  }
];
