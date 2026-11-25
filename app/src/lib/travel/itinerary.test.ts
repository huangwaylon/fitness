// The itinerary 日程 and 地図 share (itinerary.ts): stops in order with their places, the legs, the night's stay.
import { describe, expect, it } from 'vitest';
import { itinerary, namePart } from './itinerary.ts';
import { nz } from './trips/nz.ts';
import { okinawa } from './trips/okinawa.ts';
import { seattle } from './trips/seattle.ts';
import { zao } from './trips/zao.ts';

describe('itinerary', () => {
  it('a day each, its colour, date and title in the locale', () => {
    const it = itinerary(nz, 'ja');
    expect(it.days.map((d) => d.i)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(it.days[2]).toMatchObject({ date: '2027-02-13', title: 'マーケット、そして南へ', colour: nz.dayColors[2] });
    expect(itinerary(nz, 'en').days[2].title).toBe('Market, then south');
  });

  it('a day’s stops: where it sets off, the stops, the stay; places with their positions, the rest without', () => {
    const d3 = itinerary(nz, 'ja').days[2];
    expect(d3.stops.map((s) => [s.id, s.kind, s.time])).toEqual([
      ['s3-0', 'start', '07:35'],
      ['s3-1', 'stop', '08:00'],
      ['s3-2', 'stop', '11:55'],
      ['s3-3', 'stay', '16:10']
    ]);
    const p = nz.places.find((x) => x.id === 's3-2')!;
    expect(d3.stops[2]).toMatchObject({ name: 'ワイトモ鍾乳洞', lat: p.lat, lng: p.lon, row: 3 });
    // the start is named for its place, not its row ('ニューリンを出発')
    expect(d3.stops[0].name).toBe('ニューリン');
    // a flight: a stop with no position
    const d1 = itinerary(nz, 'ja').days[0];
    expect(d1.stops[0]).toMatchObject({ id: 'r1-0', kind: 'flight', name: '成田 → オークランド' });
    expect(d1.stops[0].lat).toBeUndefined();
  });

  it('the legs as routed, the night’s bed and whether it is booked', () => {
    const d3 = itinerary(nz, 'ja').days[2];
    expect(d3.legs.map((l) => [l.from, l.to, l.mode, l.minutes])).toEqual([['s3-0', 's3-1', 'drive', 19], ['s3-1', 's3-2', 'drive', 151], ['s3-2', 's3-3', 'drive', 150]]);
    expect(d3.legs[1].km).toBeCloseTo(192.7);
    expect(d3.legs[1].line?.length).toBeGreaterThan(2);
    expect(d3.stay).toEqual({ id: 's3-3', name: 'ニュープリマス', booked: false });
    expect(itinerary(nz, 'ja').days[3].stay).toEqual({ id: 's4-5', name: 'ニューリン', booked: true });
    // the flight home: no bed
    expect(itinerary(nz, 'ja').days[5].stay).toBeUndefined();
  });

  it('a trip without a map: stops with ids of their rows, no positions, no legs; English only reads in Japanese too', () => {
    const d5 = itinerary(seattle, 'ja').days[4];
    expect(d5.stops.map((s) => s.id)).toEqual(['r5-1', 'r5-2']);
    expect(d5.stops.every((s) => s.lat === undefined)).toBe(true);
    expect(d5.legs).toEqual([]);
    expect(d5.stops[1].name).toBe('Reach Snow Lake');
  });

  it('every trip: a colour a day, stop ids unique', () => {
    for (const t of [nz, okinawa, seattle, zao]) {
      const it = itinerary(t, 'ja');
      expect(new Set(it.days.map((d) => d.colour)).size).toBeGreaterThan(1);
      const ids = it.days.flatMap((d) => d.stops.map((s) => s.id));
      expect(new Set(ids).size, t.id).toBe(ids.length);
    }
  });

  it('a name is the text before its 「 — 」', () => {
    expect(namePart('キングタコス金武町 — タコライス')).toBe('キングタコス金武町');
    expect(namePart('Harvold Berry Farm — raspberry U-pick')).toBe('Harvold Berry Farm');
    expect(namePart('タウンプラザかねひで大宮市場（名護市）— 食料の買い出し')).toBe('タウンプラザかねひで大宮市場（名護市）');
    expect(namePart('Farrel-McWhirter Park')).toBe('Farrel-McWhirter Park');
  });
});
