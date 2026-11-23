// The trip map's overlays (docs/travel.md "Maps").
import { describe, expect, it } from 'vitest';
import { boundsOf, candidatesData, dayPath, farFrom, keepoutData, legsData, pinLabel, pinsOf, stopsOf } from './overlay.ts';
import { SAMPLE_COLORS, SAMPLE_LEGS, SAMPLE_PLACES } from './sample.ts';
import { dayColor } from './types.ts';

describe('the overlays', () => {
  it("a day's stops in order", () => {
    expect(stopsOf(SAMPLE_PLACES, 2).map((p) => p.id)).toEqual(['churaumi', 'bise', 'motobu-port', 'minna']);
    expect(stopsOf(SAMPLE_PLACES, 4)).toEqual([]);
  });

  it("a day's pins numbered as its rows, one spot's stops one pin ('2·3') that selects the first", () => {
    expect(pinsOf(SAMPLE_PLACES, 1).map((p) => p.n)).toEqual(['1', '2', '3']);
    const d3 = pinsOf(SAMPLE_PLACES, 3);
    expect(d3.map((p) => [p.id, p.ids, p.n])).toEqual([['manzamo', ['manzamo'], '1'], ['mihama', ['mihama', 'mihama-2'], '2·3']]);
    expect([pinLabel(d3[1], 'ja'), pinLabel(d3[1], 'en')]).toEqual(['2·3 アメリカンビレッジ', '2·3 American Village']);
  });

  it("the legs in their day's colour, only the day's", () => {
    const d1 = legsData(SAMPLE_LEGS, SAMPLE_COLORS, 1).features;
    expect(d1.map((f) => [f.properties.mode, f.properties.color])).toEqual([['drive', '#2F86BD'], ['walk', '#2F86BD']]);
    expect([dayColor(SAMPLE_COLORS, 2), dayColor(SAMPLE_COLORS, 4)]).toEqual(['#D2701F', '#2F86BD']);
  });

  it('the candidates of the layers that are on, the selected one marked', () => {
    expect(candidatesData(SAMPLE_PLACES, undefined, undefined).features).toEqual([]);
    const f = candidatesData(SAMPLE_PLACES, { camp: true }, 'c-nago').features;
    expect(f.map((x) => [x.properties.id, x.properties.sel])).toEqual([['c-bise', false], ['c-nago', true]]);
  });

  it("the keepout: the day's pins and the candidates shown", () => {
    const food = SAMPLE_PLACES.filter((p) => p.kind === 'food');
    expect(keepoutData(pinsOf(SAMPLE_PLACES, 3), food).features.map((f) => f.properties.pin)).toEqual(['stop', 'stop', 'cand', 'cand']);
  });

  it("the day's path: each stop after the legs that reach it (the saved places' near it)", () => {
    const p = dayPath(SAMPLE_PLACES, SAMPLE_LEGS, 1);
    const shuri = SAMPLE_PLACES.find((x) => x.id === 'shuri')!;
    expect(p).toHaveLength(3 + 4 + 4);
    expect([p[1], p.at(-1)]).toEqual([[127.6469, 26.2058], [shuri.lon, shuri.lat]]);
    expect(dayPath(SAMPLE_PLACES, [], 2)).toHaveLength(4);
    expect(dayPath(SAMPLE_PLACES, SAMPLE_LEGS, 4)).toEqual([]);
  });

  it('fits the day: its stops and legs', () => {
    expect(boundsOf(SAMPLE_PLACES, SAMPLE_LEGS, 1)).toEqual([[127.6469, 26.2058], [127.7195, 26.2178]]); // the walk's bend is the top
    expect(boundsOf([], [], 1)).toBeNull();
  });

  it('a fix 50 km from every stop is far (Tokyo); on the trip it is not', () => {
    expect(farFrom(SAMPLE_PLACES, { lat: 35.68, lon: 139.77, acc: 20 })).toBe(true);
    expect(farFrom(SAMPLE_PLACES, { lat: 26.6944, lon: 127.8779, acc: 20 })).toBe(false);
  });
});
