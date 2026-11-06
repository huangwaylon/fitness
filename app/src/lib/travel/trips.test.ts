// The port of the old travel-plans guides (docs/travel.md "Content"): the counts pinned against the source page, and
// the data's own rules (links, coordinates, tokens, private keys, photos).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { L, Trip, TripId } from './types.ts';
import { parseTokens, privateKeys } from './tokens.ts';
import { okinawa } from './trips/okinawa.ts';
import { seattle } from './trips/seattle.ts';
import { nz } from './trips/nz.ts';
import { TRIP_IDS, loadTrip } from './trips/index.ts';

const TRIPS: Record<TripId, Trip> = { okinawa, seattle, nz };
const STATIC = join(import.meta.dirname, '..', '..', '..', 'static');

/** The private values each trip note carries (the keys only: the values live on the relay). */
const NOTE_KEYS: Record<TripId, string[]> = {
  okinawa: ['flightRef', 'ticket', 'carRef', 'onboardingUrl', 'traveller1'],
  seattle: [],
  nz: ['flightRef', 'expediaRef', 'traveller1', 'traveller2']
};

/** Counted from the source page (index.html: each day card's timeline rows, its outlinks) and its map tables. */
const SOURCE = {
  okinawa: { rows: [12, 11, 16], links: 29, stops: [8, 6, 9], camps: 26, nature: 9, food: 11, packing: [4, 6, 7, 8, 4, 6] },
  seattle: { rows: [3, 6, 0, 4, 5, 4, 5, 0, 0, 3, 0, 5, 5, 0, 5, 0, 5, 3], links: 8, stops: [], camps: 0, nature: 0, food: 0, packing: [9, 2, 6, 2] },
  nz: { rows: [8, 7, 8, 10, 11, 10], links: 6, stops: [6, 7, 4, 6, 9, 7], camps: 0, nature: 0, food: 0, packing: [5, 6, 6, 5, 3, 4] }
} satisfies Record<TripId, unknown>;

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

describe('the trips, against the source', () => {
  it('27 days: okinawa 3, seattle 18, nz 6, numbered and dated from the start to the end', () => {
    expect(TRIP_IDS.map((id) => TRIPS[id].days.length)).toEqual([3, 18, 6]);
    for (const t of Object.values(TRIPS)) {
      t.days.forEach((d, i) => {
        expect(d.n).toBe(i + 1);
        expect(d.date).toBe(new Date(Date.parse(`${t.start}T00:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10));
      });
      expect(t.days.at(-1)?.date).toBe(t.end);
    }
  });
  it.each(TRIP_IDS)('%s: each day has its timeline rows, and every link', (id) => {
    const t = TRIPS[id];
    expect(t.days.map((d) => d.rows.length)).toEqual(SOURCE[id].rows);
    expect(hrefs(t).length - t.places.filter((p) => p.link).length).toBe(SOURCE[id].links);
  });
  it('seattle: 8 hikes, each with its stats and trail map', () => {
    const hikes = seattle.days.filter((d) => d.kind === 'hike');
    expect(hikes.length).toBe(8);
    for (const d of hikes) {
      expect(d.hike?.km).toBeGreaterThan(0);
      expect(d.hike?.gainM).toBeGreaterThan(0);
      expect(d.hike?.gpx).toMatch(/^https:\/\/huangwaylon\.github\.io\/gpx\/#\/trail\/[\w-]+$/);
      expect(d.photo?.src).toMatch(/^travel\/seattle\//);
    }
  });
  it.each(TRIP_IDS)('%s: the map stops per day, and the candidates', (id) => {
    const t = TRIPS[id];
    const s = SOURCE[id];
    expect(s.stops.map((_, i) => t.places.filter((p) => p.kind === 'stop' && p.day === i + 1).length)).toEqual(s.stops);
    expect(t.places.filter((p) => p.kind === 'stop').length).toBe(s.stops.reduce((a, b) => a + b, 0));
    expect(['camp', 'nature', 'food'].map((k) => t.places.filter((p) => p.kind === k).length)).toEqual([s.camps, s.nature, s.food]);
    expect(t.camps?.length ?? 0).toBe(s.camps);
  });
  it('okinawa 23 stops + 46 candidates, nz 39 stops (6 + 7 + 4 + 6 + 9 + 7: the generator says 38, its table has 39)', () => {
    expect([okinawa.places.length, nz.places.length]).toEqual([23 + 26 + 9 + 11, 39]);
  });
  it.each(TRIP_IDS)('%s: the packing seed, its categories and items, with stable ids', (id) => {
    const t = TRIPS[id];
    expect(t.packing.cats.map((c) => c.items.length)).toEqual(SOURCE[id].packing);
    const prefix = { okinawa: 'ok', seattle: 'se', nz: 'nz' }[id];
    t.packing.cats.forEach((c, ci) => {
      expect(c.id).toBe(`${prefix}-${ci}`);
      c.items.forEach((it, ii) => expect(it.id).toBe(`${prefix}-${ci}-${ii}`));
    });
  });
  it('83 packing items in all: 35 / 19 / 29', () => {
    expect(TRIP_IDS.map((id) => TRIPS[id].packing.cats.reduce((n, c) => n + c.items.length, 0))).toEqual([35, 19, 29]);
  });
  it('the campsites: one place each, the filter flags as the source chips them', () => {
    for (const c of okinawa.camps ?? []) {
      expect(okinawa.places.find((p) => p.id === c.place)?.kind).toBe('camp');
      expect(c.photo.src).toBe(`travel/okinawa/camps/${c.id}.webp`);
      for (const f of ['beach', 'toilet', 'shower'] as const) if (c[f]) expect(c.chips.some((ch) => ch.text.en?.toLowerCase() === f)).toBe(true);
    }
    expect((okinawa.camps ?? []).filter((c) => c.type === 'wild').length).toBe(15);
    expect((okinawa.camps ?? []).flatMap((c) => c.chips.filter((ch) => ch.pick).map((ch) => ch.text.en))).toEqual(expect.arrayContaining(['Night 1', 'Night 2']));
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
