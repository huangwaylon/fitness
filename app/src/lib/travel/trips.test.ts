// The trip guides' data (docs/travel.md "Content"): its own rules (days, links, coordinates, legs, tokens, private keys,
// photos, the packing seed's ids).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { L, Trip, TripId } from './types.ts';
import { parseTokens, privateKeys } from './tokens.ts';
import { okinawa } from './trips/okinawa.ts';
import { seattle } from './trips/seattle.ts';
import { nz } from './trips/nz.ts';
import { TRIP_IDS, loadTrip } from './trips/index.ts';
import { TRIP_META } from './trips/meta.ts';

const TRIPS: Record<TripId, Trip> = { okinawa, seattle, nz };
const STATIC = join(import.meta.dirname, '..', '..', '..', 'static');

/** The private values each trip note carries (the keys only: the values live on the relay). */
const NOTE_KEYS: Record<TripId, string[]> = {
  okinawa: ['flightRef', 'ticket', 'carRef', 'onboardingUrl', 'traveller1'],
  seattle: [],
  nz: ['flightRef', 'expediaRef', 'traveller1', 'traveller2']
};

/** Every L in a value, with where it is. */
function texts(v: unknown, path = '', out: [string, L][] = []): [string, L][] {
  if (Array.isArray(v)) v.forEach((x, i) => texts(x, `${path}[${i}]`, out));
  else if (v && typeof v === 'object') {
    const keys = Object.keys(v);
    if (keys.length && keys.every((k) => k === 'ja' || k === 'en')) out.push([path, v as L]);
    else for (const [k, x] of Object.entries(v)) texts(x, `${path}.${k}`, out);
  }
  return out;
}
const strs = (l: L) => [l.ja, l.en].filter((s): s is string => s !== undefined);
const hrefs = (t: Trip) => [
  ...t.days.flatMap((d) => [...(d.links ?? []).map((l) => l.href), ...(d.hike?.gpx ? [d.hike.gpx] : [])]),
  ...t.logistics.flatMap((c) => (c.links ?? []).map((l) => l.href)),
  ...(t.camps ?? []).map((c) => c.maps),
  ...t.places.flatMap((p) => (p.link ? [p.link] : []))
];
const photos = (t: Trip) => [t.cover, t.hero, ...t.days.flatMap((d) => (d.photo ? [d.photo] : [])), ...t.logistics.flatMap((c) => (c.photo ? [c.photo] : [])), ...(t.camps ?? []).map((c) => c.photo)];

describe('the trips', () => {
  it('numbered and dated from the start to the end', () => {
    for (const t of Object.values(TRIPS)) {
      t.days.forEach((d, i) => {
        expect(d.n).toBe(i + 1);
        expect(d.date).toBe(new Date(Date.parse(`${t.start}T00:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10));
      });
      expect(t.days.at(-1)?.date).toBe(t.end);
    }
  });
  it('a hike: its stats, its photo and its trail map', () => {
    for (const d of Object.values(TRIPS).flatMap((t) => t.days.filter((d) => d.hike))) {
      expect(d.hike?.km).toBeGreaterThan(0);
      expect(d.hike?.gainM).toBeGreaterThan(0);
      expect(d.hike?.gpx).toMatch(/^https:\/\/huangwaylon\.github\.io\/gpx\/#\/trail\/[\w-]+$/);
      expect(d.photo?.src).toBeTruthy();
    }
  });
  it.each(TRIP_IDS)('%s: the map stops numbered per day from 0, on the trip’s days', (id) => {
    const t = TRIPS[id];
    for (const d of t.days) {
      const stops = t.places.filter((p) => p.kind === 'stop' && p.day === d.n);
      expect(stops.map((p) => p.id)).toEqual(stops.map((_, i) => `s${d.n}-${i}`));
    }
    expect(t.places.filter((p) => p.kind === 'stop').every((p) => t.days.some((d) => d.n === p.day))).toBe(true);
  });
  it.each(TRIP_IDS)('%s: the packing seed’s categories and items, with stable ids', (id) => {
    const prefix = { okinawa: 'ok', seattle: 'se', nz: 'nz' }[id];
    TRIPS[id].packing.cats.forEach((c, ci) => {
      expect(c.id).toBe(`${prefix}-${ci}`);
      c.items.forEach((it, ii) => expect(it.id).toBe(`${prefix}-${ci}-${ii}`));
    });
  });
  it('the campsites: a camp pin each, the filter flags as the source chips them', () => {
    for (const c of okinawa.camps ?? []) {
      expect(okinawa.places.find((p) => p.id === c.id)?.kind).toBe('camp');
      expect(c.photo.src).toBe(`travel/okinawa/camps/${c.id}.webp`);
      for (const f of ['beach', 'toilet', 'shower'] as const) if (c[f]) expect(c.chips.some((ch) => ch.text.en?.toLowerCase() === f)).toBe(true);
    }
    expect(okinawa.places.filter((p) => p.kind === 'camp').length).toBe(okinawa.camps?.length);
    expect((okinawa.camps ?? []).flatMap((c) => c.chips.filter((ch) => ch.pick).map((ch) => ch.text.en))).toEqual(expect.arrayContaining(['Night 1', 'Night 2']));
  });
  it.each(TRIP_IDS)('%s: a row’s own zone is a real one, never the trip’s', (id) => {
    for (const r of TRIPS[id].days.flatMap((d) => d.rows)) {
      if (!r.tz) continue;
      expect(r.tz).not.toBe(TRIPS[id].tz);
      expect(() => new Intl.DateTimeFormat('en', { timeZone: r.tz })).not.toThrow();
    }
  });
});

describe('the trip data', () => {
  it.each(TRIP_IDS)('%s: every link is https (a private one a {p:} token)', (id) => {
    for (const h of hrefs(TRIPS[id])) {
      if (/^\{p:\w+\}$/.test(h)) continue;
      expect(new URL(h).protocol, h).toBe('https:');
    }
  });
  it.each(TRIP_IDS)('%s: every place is inside the trip’s box', (id) => {
    const [w, s, e, n] = TRIPS[id].bbox;
    for (const p of TRIPS[id].places) {
      expect(p.lon >= w && p.lon <= e && p.lat >= s && p.lat <= n, p.id).toBe(true);
    }
  });
  it.each(TRIP_IDS)('%s: the legs join the day’s stops in order, their lines inside the box', (id) => {
    const t = TRIPS[id];
    const [w, s, e, n] = t.bbox;
    const ids = new Set(t.places.map((p) => p.id));
    for (const l of t.legs) {
      expect(ids.has(l.from) && ids.has(l.to), `${l.from} → ${l.to}`).toBe(true);
      expect(l.line.length).toBeGreaterThanOrEqual(2);
      for (const [lon, lat] of l.line) expect(lon >= w && lon <= e && lat >= s && lat <= n).toBe(true);
      if (l.mode === 'drive' || l.mode === 'bus') expect(l.min! > 0 && l.km! > 0).toBe(true);
    }
    // the legs into a stop chain up to it (Okinawa's day 2 into Ufuya: the boat back to the shop, then the drive)
    const groups = Map.groupBy(t.legs, (l) => `${l.day}-${l.i}`);
    for (const [k, ls] of groups) {
      expect(ls.at(-1)!.to).toBe(`s${k}`);
      expect(ls[0].from).toBe(`s${ls[0].day}-${ls[0].i - 1}`);
      for (let j = 1; j < ls.length; j++) expect(ls[j].from).toBe(ls[j - 1].to);
    }
    // a leg into every stop but each day's first, plus that one
    const into = t.places.filter((p) => p.kind === 'stop' && p.i! > 0).length;
    expect(t.legs.length).toBe(into + (id === 'okinawa' ? 1 : 0));
  });
  it.each(TRIP_IDS)('%s: a day row’s place is one of that day’s stops', (id) => {
    const t = TRIPS[id];
    for (const d of t.days) for (const r of d.rows) if (r.place) expect(t.places.find((p) => p.id === r.place)?.day).toBe(d.n);
  });
  it.each(TRIP_IDS)('%s: no text is empty, and none has a broken character or markup left', (id) => {
    for (const [path, l] of texts(TRIPS[id])) {
      expect(strs(l).length, path).toBeGreaterThan(0);
      for (const s of strs(l)) {
        expect(s.trim(), path).toBe(s);
        expect(s.length, path).toBeGreaterThan(0);
        expect(/[\uFFFD<>]|&[a-z]+;|\s{2}/.test(s.replace(/<21:00/, '')), `${path}: ${s}`).toBe(false);
      }
    }
  });
  it.each(TRIP_IDS)('%s: the bilingual guides have both sides of their prose; Seattle is English', (id) => {
    const all = texts(TRIPS[id]).map(([, l]) => l);
    if (id === 'seattle') expect(all.every((l) => l.en && !l.ja)).toBe(true);
    else expect(all.filter((l) => l.ja && l.en).length / all.length).toBeGreaterThan(0.9);
  });
  it.each(TRIP_IDS)('%s: every brace is a token, and the tokens parse', (id) => {
    const all = [...texts(TRIPS[id]).flatMap(([, l]) => strs(l)), ...hrefs(TRIPS[id])];
    for (const s of all) {
      const parts = parseTokens(s);
      expect(parts.map((p) => (p.t === 'text' ? p.s : '')).join(''), s).not.toMatch(/[{}]/);
      for (const p of parts) if (p.t === 'km' || p.t === 'm' || p.t === 'c') expect(Number.isFinite(p.n) && p.n > 0).toBe(true);
    }
  });
  it.each(TRIP_IDS)('%s: every {p:} key is one the trip note carries, and each is used', (id) => {
    const used = new Set([...texts(TRIPS[id]).flatMap(([, l]) => strs(l)), ...hrefs(TRIPS[id])].flatMap(privateKeys));
    expect([...used].sort()).toEqual([...NOTE_KEYS[id]].sort());
  });
  it('no booking reference, ticket or itinerary number is left in the data', () => {
    for (const t of Object.values(TRIPS)) {
      const body = JSON.stringify(t);
      expect(body).not.toMatch(/(?:ticket|航空券番号|itinerary|旅程番号|confirmation|予約番号|\bref|[Bb]ooking) #?[A-Z0-9]{5,}/);
      expect(body).not.toMatch(/evertrail-onboarding/);
    }
  });
  it.each(TRIP_IDS)('%s: every photo is in static/, ≤ 720 px wide', (id) => {
    for (const p of photos(TRIPS[id])) {
      expect(p.src).toMatch(new RegExp(`^travel/${id}/[\\w/-]+\\.webp$`));
      expect(existsSync(join(STATIC, p.src)), p.src).toBe(true);
      expect(p.w).toBeLessThanOrEqual(720);
      const b = readFileSync(join(STATIC, p.src));
      expect(b.subarray(8, 12).toString()).toBe('WEBP');
    }
  });
  it('loadTrip gives each module', async () => {
    for (const id of TRIP_IDS) expect((await loadTrip(id)).id).toBe(id);
  });
});

describe('tokens', () => {
  it('splits text and tokens in order', () => {
    expect(parseTokens('約{km:6}・標高差{m:600} · {c:29} · 予約番号 {p:flightRef}')).toEqual([
      { t: 'text', s: '約' }, { t: 'km', n: 6 }, { t: 'text', s: '・標高差' }, { t: 'm', n: 600 }, { t: 'text', s: ' · ' }, { t: 'c', n: 29 },
      { t: 'text', s: ' · 予約番号 ' }, { t: 'p', key: 'flightRef' }
    ]);
    expect(parseTokens('{x:1} {km:} plain')).toEqual([{ t: 'text', s: '{x:1} {km:} plain' }]);
    expect(privateKeys('{p:a} and {p:b}')).toEqual(['a', 'b']);
  });
});

describe('the list\'s meta (trips/meta.ts)', () => {
  it('is each guide\'s own: title, area, dates, zone, cover, and the rows on another date', () => {
    expect(TRIP_META.map((m) => m.id).sort()).toEqual([...TRIP_IDS].sort());
    for (const m of TRIP_META) {
      const t = TRIPS[m.id];
      expect({ title: m.title, eyebrow: m.eyebrow, start: m.start, end: m.end, tz: m.tz, cover: m.cover }, m.id).toEqual({ title: t.title, eyebrow: t.eyebrow, start: t.start, end: t.end, tz: t.tz, cover: t.cover });
      const edge = (days: Trip['days']) => days.flatMap((d) => d.rows.filter((r) => r.dd).map((r) => ({ n: d.n, date: d.date, t: r.t, dd: r.dd, tz: r.tz })));
      expect(edge(m.days), m.id).toEqual(edge(t.days));
    }
  });
});
