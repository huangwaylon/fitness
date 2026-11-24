// The maps' location watch (docs/travel.md "Maps"): asked on a tap, watched while shown, stale after a hide.
import { describe, expect, it, vi } from 'vitest';
import { LocWatch } from './geo.ts';
import { askedAgain } from './askAgain.ts';
import { DEVICE } from '#lib/sync/storage.ts';

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

  // iOS asking again (askAgain.ts): a fix once on this phone, the permission 'prompt' at a later tap: the hint after
  // that tap's fix, once per phone
  const kvOf = (v?: string) => {
    const m = new Map<string, string>(v ? [[DEVICE.geoAsked, v]] : []);
    return { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, x: string) => void m.set(k, x), removeItem: (k: string) => void m.delete(k) };
  };
  const permsOf = (state: PermissionState | 'throws') => ({
    query: vi.fn(async () => {
      if (state === 'throws') throw new TypeError('geolocation');
      return { state } as PermissionStatus;
    })
  });

  it('asked again: told once, after the fix (not under the prompt), then never on this phone', async () => {
    const { geo, fix } = fakeGeo();
    const kv = kvOf('1');
    const agains: boolean[] = [];
    const l = new LocWatch((x) => agains.push(x.again), geo, { kv, perms: permsOf('prompt') });
    l.start();
    await Promise.resolve();
    await Promise.resolve();
    expect(agains).toEqual([false]); // (asking: the prompt up, no hint yet)
    fix(35, 139, 10);
    fix(35, 139, 10);
    expect([agains, l.again, kv.m.get(DEVICE.geoAsked)]).toEqual([[false, true, false], false, '2']);
    // the next launch's tap, asked again: nothing more
    const l2 = new LocWatch((x) => agains.push(x.again), fakeGeo().geo, { kv, perms: permsOf('prompt') });
    l2.start();
    await Promise.resolve();
    expect(agains.includes(true, 2)).toBe(false);
  });

  it('read before the first ask (after one, Safari reads its real answer); two maps of one page: told once', async () => {
    const kv = kvOf('1');
    const perms = permsOf('prompt');
    const a = fakeGeo(), b = fakeGeo();
    const told: string[] = [];
    const la = new LocWatch((x) => x.again && told.push('a'), a.geo, { kv, perms });
    const lb = new LocWatch((x) => x.again && told.push('b'), b.geo, { kv, perms });
    expect([perms.query.mock.calls.length, a.geo.watchPosition.mock.calls.length]).toEqual([2, 0]);
    la.start();
    lb.start();
    await Promise.resolve();
    await Promise.resolve();
    a.fix(35, 139, 10);
    b.fix(35, 139, 10);
    expect(told).toEqual(['a']);
  });

  it('the fix before the permission read: the hint when the read comes', async () => {
    const { geo, fix } = fakeGeo();
    const agains: boolean[] = [];
    const l = new LocWatch((x) => agains.push(x.again), geo, { kv: kvOf('1'), perms: permsOf('prompt') });
    l.start();
    fix(35, 139, 10);
    expect(agains).toEqual([false, false]);
    await vi.waitFor(() => expect(agains).toEqual([false, false, true]));
  });

  it('not asked again: granted (Safari at 許可), a first time, refused, or no Permissions API', async () => {
    expect(await askedAgain(kvOf('1'), permsOf('granted'))).toBe(false);
    expect(await askedAgain(kvOf(), permsOf('prompt'))).toBe(false); // (no fix ever: the first prompt)
    expect(await askedAgain(kvOf('2'), permsOf('prompt'))).toBe(false); // (shown once)
    expect(await askedAgain(kvOf('1'), permsOf('denied'))).toBe(false);
    expect(await askedAgain(kvOf('1'), permsOf('throws'))).toBe(false);
    expect(await askedAgain(kvOf('1'), undefined)).toBe(false);
    expect(await askedAgain(null, permsOf('prompt'))).toBe(false);
    expect(await askedAgain(kvOf('1'), permsOf('prompt'))).toBe(true);
    // a first fix marks the phone; a refusal at the asked-again tap: no hint (the refused note says it)
    const kv = kvOf();
    const { geo, w, fix } = fakeGeo();
    const l = new LocWatch(() => {}, geo, { kv, perms: permsOf('prompt') });
    l.start();
    fix(35, 139, 10);
    expect(kv.m.get(DEVICE.geoAsked)).toBe('1');
    l.stop();
    const agains: boolean[] = [];
    const l2 = new LocWatch((x) => agains.push(x.again), geo, { kv, perms: permsOf('prompt') });
    l2.start();
    await vi.waitFor(() => expect(kv.m.get(DEVICE.geoAsked)).toBe('1'));
    w.err!({ code: 1 } as GeolocationPositionError);
    await Promise.resolve();
    expect([l2.state, agains.includes(true), kv.m.get(DEVICE.geoAsked)]).toEqual(['denied', false, '1']);
  });
});
