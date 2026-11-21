import { beforeEach, describe, expect, it } from 'vitest';
import { Compass, coneHalf, declination, inaccurate, norm, resetSession, smooth, turn, type CompassSource, type Permission, type Reading } from './compass.ts';

describe('the compass: angles on the circle', () => {
  it('norm and the shortest turn wrap at north', () => {
    expect(norm(-10)).toBe(350);
    expect(norm(725)).toBe(5);
    expect(turn(359, 1)).toBe(2);
    expect(turn(1, 359)).toBe(-2);
    expect(turn(90, 270)).toBe(180);
    expect(turn(10, 10)).toBe(0);
  });

  it('smooths the shortest way round: 350 toward 10 passes north, never back through 180', () => {
    let s: number | null = null;
    s = smooth(s, 350);
    expect(s).toBe(350);
    const seen: number[] = [];
    for (let i = 0; i < 20; i++) seen.push((s = smooth(s, 10)));
    expect(seen.every((a) => a >= 350 || a <= 10)).toBe(true);
    expect(Math.abs(turn(s, 10))).toBeLessThan(0.1);
  });

  it('the cone widens with a worse accuracy; the hint at unreliable or past 30°', () => {
    expect(coneHalf(null)).toBe(25);
    expect(coneHalf(-1)).toBe(60);
    expect(coneHalf(5)).toBe(15);
    expect(coneHalf(45)).toBe(45);
    expect(coneHalf(200)).toBe(60);
    expect([inaccurate(null), inaccurate(10), inaccurate(31), inaccurate(-1)]).toEqual([false, false, true, true]);
  });
});

describe('declination (approximate: true = magnetic + this)', () => {
  it('Japan west, ~5° in Okinawa to ~9° in Hokkaido; Washington ~15° east; elsewhere 0', () => {
    const tokyo = declination(35.68, 139.77), kinpu = declination(35.86, 138.62), sapporo = declination(43.06, 141.35), naha = declination(26.21, 127.68);
    expect(tokyo).toBeGreaterThan(-8);
    expect(tokyo).toBeLessThan(-6.5);
    expect(kinpu).toBeGreaterThan(-8);
    expect(kinpu).toBeLessThan(-6.5);
    expect(sapporo).toBeGreaterThan(-10);
    expect(sapporo).toBeLessThan(-8.5);
    expect(naha).toBeGreaterThan(-6);
    expect(naha).toBeLessThan(-4);
    expect(sapporo).toBeLessThan(tokyo);
    expect(declination(47.6, -121.4)).toBe(15);
    expect(declination(51.5, 0)).toBe(0);
  });
});

/** A fake phone: its answer, the readings fed by hand, frames run by hand. */
function rig(answer: Permission = 'granted') {
  const asked: number[] = [];
  let cb: ((r: Reading) => void) | null = null;
  let resolve!: (p: Permission) => void;
  const source: CompassSource = {
    request: () => (asked.push(1), new Promise<Permission>((r) => (resolve = r))),
    listen: (f) => ((cb = f), () => (cb = null))
  };
  const frames: (() => void)[] = [];
  let t = 0;
  const told: (number | null)[] = [];
  const c = new Compass((x) => told.push(x.heading), { source, raf: (f) => frames.push(f), caf: () => {}, now: () => t });
  return {
    c, asked, told,
    answer: async () => (resolve(answer), await Promise.resolve(), await Promise.resolve()),
    read: (heading: number, acc: number | null = 10) => cb?.({ heading, acc }),
    listening: () => cb !== null,
    frame: (dt = 100) => ((t += dt), frames.splice(0).forEach((f) => f()))
  };
}

describe('the compass service', () => {
  beforeEach(() => resetSession());

  it('asks synchronously in the tap, once a session; granted, listens; later taps never ask again', async () => {
    const r = rig();
    expect(r.c.start()).toBeNull();
    expect(r.asked).toEqual([1]); // (before any await)
    await r.answer();
    expect(r.c.state).toBe('on');
    expect(r.listening()).toBe(true);
    r.c.stop();
    expect(r.listening()).toBe(false);
    expect(r.c.start()).toBe('granted');
    expect(r.asked).toEqual([1]);
    expect(r.listening()).toBe(true);
  });

  it('a refusal sticks for the session: no second ask, denied at once', async () => {
    const r = rig('denied');
    r.c.start();
    await r.answer();
    expect(r.c.state).toBe('denied');
    const again = rig('granted');
    expect(again.c.start()).toBe('denied');
    expect(again.asked).toEqual([]);
    expect(again.c.state).toBe('denied');
  });

  it('smooths, at most one change a frame, ~15 Hz, none under 2°; true north by the declination', async () => {
    const r = rig();
    r.c.start();
    await r.answer();
    r.c.place(35.68, 139.77); // ~7° W
    r.read(100);
    r.frame();
    expect(r.told.at(-1)).toBeCloseTo(100 + declination(35.68, 139.77), 0);
    const n = r.told.length;
    // a jitter of a degree: nothing new
    r.read(101);
    r.frame();
    r.read(99.5);
    r.frame();
    expect(r.told.length).toBe(n);
    // many readings in one frame: one change
    for (let i = 0; i < 10; i++) r.read(140);
    r.frame();
    expect(r.told.length).toBe(n + 1);
    // two frames 20 ms apart: the second waits (~15 Hz)
    r.read(200);
    r.frame(20);
    const k = r.told.length;
    r.read(200);
    r.frame(20);
    expect(r.told.length).toBe(k);
  });

  it('crosses north the short way: 355 → 5 never reads 180', async () => {
    const r = rig();
    r.c.start();
    await r.answer();
    r.read(355);
    r.frame();
    for (let i = 0; i < 15; i++) (r.read(5), r.frame());
    expect(r.told.slice(1).every((h) => h !== null && (h >= 340 || h <= 10))).toBe(true);
  });

  it('hidden: no listening (and none of the readings); shown: back', async () => {
    const r = rig();
    r.c.start();
    await r.answer();
    r.c.visible(false);
    expect(r.listening()).toBe(false);
    r.c.visible(true);
    expect(r.listening()).toBe(true);
  });
});
