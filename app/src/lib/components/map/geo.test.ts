// The maps' location watch (docs/travel.md "Maps"): asked on a tap, watched while shown, stale after a hide.
import { describe, expect, it, vi } from 'vitest';
import { LocWatch } from './geo.ts';

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

  it('a fix from before the page hid (a screen lock) is stale, told once, till a fresh one comes', () => {
    const { geo, fix } = fakeGeo();
    const seen: boolean[] = [];
    const l = new LocWatch((x) => seen.push(x.stale), geo);
    l.start();
    l.visible(false); // (no fix yet: nothing to grey)
    expect(seen).toEqual([false]);
    l.visible(true);
    fix(35.0, 139.0, 10);
    l.visible(false);
    l.visible(false);
    expect([l.stale, seen]).toEqual([true, [false, false, true]]);
    l.visible(true);
    expect(l.stale).toBe(true);
    fix(35.0, 139.0, 10);
    expect([l.stale, seen.at(-1)]).toEqual([false, false]);
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
