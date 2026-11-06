// The trip map's overlays and its location watch (docs/travel.md "Maps").
import { describe, expect, it, vi } from 'vitest';
import { LocWatch } from './geo.ts';
import { boundsOf, candidatesData, keepoutData, legsData, locData, stopsOf } from './overlay.ts';
import { SAMPLE_COLORS, SAMPLE_LEGS, SAMPLE_PLACES } from './sample.ts';
import { dayColor, nameOf } from './types.ts';

describe('the overlays', () => {
  it("a day's stops in order, all of them for 'all'", () => {
    expect(stopsOf(SAMPLE_PLACES, 2).map((p) => p.id)).toEqual(['churaumi', 'bise', 'motobu-port', 'minna']);
    expect(stopsOf(SAMPLE_PLACES, 'all')).toHaveLength(9);
    expect(stopsOf(SAMPLE_PLACES, 4)).toEqual([]);
  });

  it("the legs in their day's colour, only the day's", () => {
    const d1 = legsData(SAMPLE_LEGS, SAMPLE_COLORS, 1).features;
    expect(d1.map((f) => [f.properties.mode, f.properties.color])).toEqual([['drive', '#2F86BD'], ['walk', '#2F86BD']]);
    expect(legsData(SAMPLE_LEGS, SAMPLE_COLORS, 'all').features).toHaveLength(SAMPLE_LEGS.length);
    expect(dayColor(SAMPLE_COLORS, 4)).toBe('#2F86BD'); // cycled
  });

  it('the candidates of the layers that are on, the selected one marked', () => {
    expect(candidatesData(SAMPLE_PLACES, undefined, undefined).features).toEqual([]);
    const f = candidatesData(SAMPLE_PLACES, { camp: true }, 'c-nago').features;
    expect(f.map((x) => [x.properties.id, x.properties.sel])).toEqual([['c-bise', false], ['c-nago', true]]);
  });

  it("the keepout: the day's stops and the candidates shown", () => {
    expect(keepoutData(SAMPLE_PLACES, 1, { food: true }).features.map((f) => f.properties.pin)).toEqual(['stop', 'stop', 'stop', 'cand', 'cand']);
  });

  it('fits the day: its stops and legs', () => {
    expect(boundsOf(SAMPLE_PLACES, SAMPLE_LEGS, 1)).toEqual([[127.6469, 26.2058], [127.7195, 26.2178]]); // the walk's bend is the top
    expect(boundsOf([], [], 'all')).toBeNull();
  });

  it('names in the reader\'s locale, else the other', () => {
    expect([nameOf({ ja: '首里城', en: 'Shuri' }, 'en'), nameOf({ ja: '首里城' }, 'en'), nameOf({ en: 'Shuri' }, 'ja')]).toEqual(['Shuri', '首里城', 'Shuri']);
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
    expect(l.watching).toBe(false);
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
    expect([l.state, l.watching]).toEqual(['denied', false]);
    l.visible(true);
    expect(geo.watchPosition).toHaveBeenCalledTimes(1);
    const none = new LocWatch(() => {}, undefined);
    none.start();
    expect(none.state).toBe('unavailable');
  });
});
