// The trip map's overlays and its location watch (docs/travel.md "Maps").
import { describe, expect, it, vi } from 'vitest';
import { LocWatch } from './geo.ts';
import { boundsOf, candidatesData, farFrom, keepoutData, legsData, locData, pinLabel, pinsOf, stopsOf } from './overlay.ts';
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

  it('fits the day: its stops and legs', () => {
    expect(boundsOf(SAMPLE_PLACES, SAMPLE_LEGS, 1)).toEqual([[127.6469, 26.2058], [127.7195, 26.2178]]); // the walk's bend is the top
    expect(boundsOf([], [], 1)).toBeNull();
  });

  it('a fix 50 km from every stop is far (Tokyo); on the trip it is not', () => {
    expect(farFrom(SAMPLE_PLACES, { lat: 35.68, lon: 139.77, acc: 20 })).toBe(true);
    expect(farFrom(SAMPLE_PLACES, { lat: 26.6944, lon: 127.8779, acc: 20 })).toBe(false);
    expect(locData(null).features).toEqual([]);
  });
});

describe('the location watch', () => {
  const fakeGeo = () => {
    const w = { ok: null as PositionCallback | null, err: null as PositionErrorCallback | null };
    const geo = {
      watchPosition: vi.fn((ok: PositionCallback, err?: PositionErrorCallback | null) => ((w.ok = ok), (w.err = err ?? null), 7)),
      clearWatch: vi.fn()
    };
    const fix = (lat: number, lon: number, acc: number) => w.ok!({ coords: { latitude: lat, longitude: lon, accuracy: acc } } as GeolocationPosition);
    return { geo, w, fix };
  };

  it('asks only when the button is tapped, watches only while the map is shown', () => {
    const { geo, fix } = fakeGeo();
    const seen: [string, boolean][] = [];
    const l = new LocWatch((x, first) => seen.push([x.state, first]), geo);
    l.visible(true);
    expect(geo.watchPosition).not.toHaveBeenCalled();
    l.start();
    expect(geo.watchPosition).toHaveBeenCalledTimes(1);
    fix(26.69, 127.88, 30);
    fix(26.69, 127.88, 20);
    expect(seen).toEqual([['asking', false], ['on', true], ['on', false]]);
    expect(l.fix).toEqual({ lat: 26.69, lon: 127.88, acc: 20 });
    // hidden: the watch stops; shown again: it resumes
    l.visible(false);
    expect(geo.clearWatch).toHaveBeenCalledWith(7);
    l.visible(true);
    expect(geo.watchPosition).toHaveBeenCalledTimes(2);
    l.stop();
    l.visible(true);
    expect(geo.watchPosition).toHaveBeenCalledTimes(2);
  });

  it('a refusal stops asking until the next tap; no API is unavailable', () => {
    const { geo, w } = fakeGeo();
    const l = new LocWatch(() => {}, geo);
    l.start();
    w.err!({ code: 1 } as GeolocationPositionError);
    expect(l.state).toBe('denied');
    expect(geo.clearWatch).toHaveBeenCalledWith(7);
    l.visible(true);
    expect(geo.watchPosition).toHaveBeenCalledTimes(1);
    const none = new LocWatch(() => {}, undefined);
    none.start();
    expect(none.state).toBe('unavailable');
  });
});
