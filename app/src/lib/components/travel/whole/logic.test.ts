// The whole-trip map's pure side (地図 tab): the days it draws, the box each focus fits, the faded days, the ring, a
// stop's card, whether a point is in the visible part; and its style is a valid one.
import { describe, expect, it } from 'vitest';
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import { FONT, fontFaces } from '../../map/fonts.ts';
import { labelField } from '../../map/basemap.ts';
import { okinawa } from '#lib/travel/trips/okinawa.ts';
import { nz } from '#lib/travel/trips/nz.ts';
import { seattle } from '#lib/travel/trips/seattle.ts';
import type { Trip } from '#lib/travel/types.ts';
import { boundsOf, candidatesData, candidatesOf, dom, FADED, farFrom, findStop, inView, legsData, mapDays, nameOf, openOn, pathOf, stopsData } from './logic.ts';
import { CAND_LAYER, OVER_LABELS, STOP_LAYER, WSRC, wholeStyle } from './style.ts';
import type { MapDay } from './types.ts';

/** A trip's days in the itinerary's shape (as the list's model hands them over). */
const daysOf = (t: Trip): MapDay[] =>
  t.days.map((d) => ({
    i: d.n, date: d.date, title: d.title, colour: t.dayColors[d.n - 1] ?? '#2F86BD',
    stops: t.places.filter((p) => p.kind === 'stop' && p.day === d.n).map((p) => ({ id: p.id, name: p.name, lat: p.lat, lng: p.lon, kind: 'stop', time: '11:55' })),
    legs: t.legs.filter((l) => l.day === d.n).map((l) => ({ line: l.line, mode: l.mode }))
  }));

const days: MapDay[] = [
  { i: 1, date: '2026-11-11', colour: '#111111', stops: [{ id: 'a', name: 'A', lat: 0, lng: 0, time: '09:00' }, { id: 'b', name: { ja: 'ビー', en: 'B' }, lat: 1, lng: 2 }], legs: [{ line: [[0, 0], [2, 1]], mode: 'drive' }] },
  { i: 2, date: '2026-11-12', colour: '#222222', stops: [{ id: 'c', name: 'C', lat: -1, lng: 5 }, { id: 'flight', name: 'Flight' }], legs: [{ line: [[2, 1], [5, -1]], mode: 'walk' }, { line: [[5, -1]] }] },
  { i: 3, date: '2026-11-13', colour: '#333333', stops: [{ id: 'free', name: 'Free day' }], legs: [] }
];

describe('the days the map draws', () => {
  it('a stop with a position or a leg with a line; a day of neither (a free day) is left out', () => {
    expect(mapDays(days).map((d) => d.i)).toEqual([1, 2]);
    expect(mapDays(daysOf(nz)).length).toBe(nz.days.filter((d) => nz.places.some((p) => p.day === d.n)).length);
  });
  it('a trip without places (Seattle): no day, so the tab says it has no map', () => {
    expect(mapDays(daysOf(seattle))).toEqual([]);
  });
  it('opens on the day asked for if drawn, else 全体', () => {
    expect(openOn(days, 2)).toBe(2);
    expect(openOn(days, 3)).toBeNull();
    expect(openOn(days, 9)).toBeNull();
    expect(openOn(days, null)).toBeNull();
    expect(openOn(days, undefined)).toBeNull();
  });
});

describe('a focus’s box', () => {
  it('全体: every stop and line', () => expect(boundsOf(days, null)).toEqual([[0, -1], [5, 1]]));
  it('a day: its own stops and lines only', () => {
    expect(boundsOf(days, 1)).toEqual([[0, 0], [2, 1]]);
    expect(boundsOf(days, 2)).toEqual([[2, -1], [5, 1]]);
  });
  it('a day with nothing: null (the camera stays)', () => expect(boundsOf(days, 3)).toBeNull());
  it("NZ: each day's box inside the whole trip's", () => {
    const d = daysOf(nz), all = boundsOf(d, null)!;
    for (const x of mapDays(d)) {
      const b = boundsOf(d, x.i)!;
      expect(b[0][0]).toBeGreaterThanOrEqual(all[0][0]);
      expect(b[0][1]).toBeGreaterThanOrEqual(all[0][1]);
      expect(b[1][0]).toBeLessThanOrEqual(all[1][0]);
      expect(b[1][1]).toBeLessThanOrEqual(all[1][1]);
    }
  });
});

describe('what a focus draws', () => {
  it('every day’s legs in its colour; walks dashed; a one-point line left out', () => {
    const l = legsData(days, null).features;
    expect(l.map((f) => [f.properties.c, f.properties.dash, f.properties.o])).toEqual([['#111111', false, 1], ['#222222', true, 1]]);
  });
  it('a day focused: the others faded, the focused drawn last (over them)', () => {
    const l = legsData(days, 1).features;
    expect(l.map((f) => [f.properties.c, f.properties.o])).toEqual([['#222222', FADED], ['#111111', 1]]);
    const s = stopsData(days, 1, null).features;
    expect(s.map((f) => [f.properties.id, f.properties.o])).toEqual([['c', FADED], ['a', 1], ['b', 1]]);
  });
  it('stops without a position aren’t dots', () => {
    expect(stopsData(days, null, null).features.map((f) => f.properties.id)).toEqual(['a', 'b', 'c']);
  });
  it('the selected stop ringed and drawn last; its day kept faded if another is focused (a ring never refocuses)', () => {
    const s = stopsData(days, 1, 'c').features;
    expect(s.at(-1)!.properties).toMatchObject({ id: 'c', sel: true, o: FADED });
    expect(s.filter((f) => f.properties.sel)).toHaveLength(1);
  });
  it('[lng, lat] as GeoJSON wants', () => {
    expect(stopsData(days, null, null).features[1].geometry.coordinates).toEqual([2, 1]);
  });
});

describe("a stop's card", () => {
  it('finds the stop and its day; a stop with no position or an unknown id: none', () => {
    expect(findStop(days, 'c')?.day.i).toBe(2);
    expect(findStop(days, 'flight')).toBeNull();
    expect(findStop(days, 'nope')).toBeNull();
    expect(findStop(days, null)).toBeNull();
  });
  it('names in the reader’s language, else the other; the day of the month', () => {
    expect(nameOf({ ja: 'ビー', en: 'B' }, 'en')).toBe('B');
    expect(nameOf({ en: 'B' }, 'ja')).toBe('B');
    expect(nameOf('A', 'en')).toBe('A');
    expect(dom('2026-11-03')).toBe('3');
    expect(dom('2026-11-13')).toBe('13');
  });
});

describe('in the visible part (a ringed stop panned only if not)', () => {
  it('inside the edges and above the card: in view', () => expect(inView({ x: 100, y: 100 }, 393, 700, 128)).toBe(true));
  it('under the card and the foot row, or off an edge: not', () => {
    expect(inView({ x: 100, y: 650 }, 393, 700, 128)).toBe(false);
    expect(inView({ x: -5, y: 100 }, 393, 700, 128)).toBe(false);
    expect(inView({ x: 390, y: 100 }, 393, 700, 128)).toBe(false);
  });
});

describe('the style', () => {
  const s = wholeStyle('ja', fontFaces('https://example.test/fitness/'));
  it('is valid', () => expect(validateStyleMin(s).map((e) => e.message)).toEqual([]));
  it('the legs under the basemap’s labels, the dots (and the ring) over them', () => {
    const ids = s.layers.map((l) => l.id);
    const firstLabel = s.layers.findIndex((l) => l.type === 'symbol');
    expect(ids.indexOf('w-legs')).toBeLessThan(firstLabel);
    expect(ids.indexOf(STOP_LAYER)).toBeGreaterThan(firstLabel);
    expect(ids.indexOf('w-stops-ring')).toBeLessThan(ids.indexOf(STOP_LAYER));
    expect(Object.keys(s.sources).sort()).toEqual(Object.values(WSRC).sort());
    // the saved places' squares go in under the candidates, the candidates under the stops, the location dot on top
    expect(ids.indexOf(OVER_LABELS)).toBeGreaterThan(firstLabel);
    expect(ids.indexOf(CAND_LAYER)).toBeLessThan(ids.indexOf(STOP_LAYER));
    expect(ids.at(-1)).toMatch(/^loc-/);
  });
  it("labels in the reader's locale, in the app's font: Japanese wrapped at 12 ems (エメラルドビーチ whole), Latin at 9", () => {
    for (const locale of ['ja', 'en'] as const) {
      const st = wholeStyle(locale, fontFaces('https://example.test/fitness/'));
      const labels = st.layers.filter((l) => l.type === 'symbol' && 'source' in l && l.source === WSRC.base);
      expect(labels.length).toBeGreaterThan(8);
      for (const l of labels) {
        const layout = (l as { layout: Record<string, unknown> }).layout;
        expect(layout['text-field'], l.id).toEqual(labelField(locale));
        expect(layout['text-max-width'], l.id).toBe(locale === 'ja' ? 12 : 9);
        expect(layout['text-font'], l.id).toEqual([FONT]);
      }
    }
    expect(labelField('en')).toEqual(['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']]);
  });
});

describe('the saved places’ path, the far fix, the candidates', () => {
  it('the path: the focused day’s lines and stops, every day’s under 全体; none for a day with nothing', () => {
    expect(pathOf(days, 1)).toEqual([[0, 0], [2, 1], [0, 0], [2, 1]]);
    expect(pathOf(days, null)!.length).toBe(pathOf(days, 1)!.length + pathOf(days, 2)!.length);
    expect(pathOf(days, 3)).toBeNull();
  });
  it('a fix over 50 km from every stop is far (home before the trip); one by a stop is not', () => {
    const d = daysOf(nz);
    expect(farFrom(d, { lat: 35.68, lon: 139.77, acc: 25 })).toBe(true);
    expect(farFrom(d, { lat: -36.9, lon: 174.69, acc: 25 })).toBe(false);
  });
  it('Okinawa’s candidates: only the layers on, the chosen one marked', () => {
    expect(candidatesOf(okinawa.places, {})).toEqual([]);
    const camps = candidatesOf(okinawa.places, { camp: true });
    expect(camps.length).toBeGreaterThan(0);
    expect(camps.every((p) => p.kind === 'camp')).toBe(true);
    const f = candidatesData(camps, camps[0].id).features;
    expect(f.filter((x) => x.properties.sel).map((x) => x.properties.id)).toEqual([camps[0].id]);
  });
});
