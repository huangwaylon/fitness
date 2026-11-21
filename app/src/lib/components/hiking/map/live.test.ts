// The trail view's live state (live.svelte.ts) on a fake phone: the location (a hand-fed watch), the compass, the wake
// lock and the kept place (an in-memory store). The clock is vitest's.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toTrack } from '#lib/contract/hikeTrack.ts';
import { prepare, type Prepared } from '#lib/hiking/track.ts';
import type { NetFile } from '#lib/hiking/net.ts';
import { DEVICE, type KV } from '#lib/sync/storage.ts';
import { Live } from './live.svelte.ts';
import { resetSession, type CompassSource, type Permission } from './compass.ts';

const M = 111_320;
const north = (m: number, east = 0) => ({ lat: 35 + m / M, lon: 139 + east / (M * Math.cos((35 * Math.PI) / 180)) });
function outAndBack(): Prepared {
  const up = Array.from({ length: 11 }, (_, i) => [139, 35 + (i * 100) / M, 100 + i * 20] as [number, number, number]);
  return prepare({ v: 1, len: 0, pts: [...up, ...up.slice(0, -1).reverse()], wpts: [] });
}
const mem = (): KV & { m: Map<string, string> } => {
  const m = new Map<string, string>();
  return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

function phone(o: { prep?: Prepared; kv?: KV; answer?: Permission } = {}) {
  const w = { ok: null as PositionCallback | null };
  const geo = { watchPosition: (ok: PositionCallback) => ((w.ok = ok), 1), clearWatch: () => {} };
  let listening = false;
  let answer!: (p: Permission) => void;
  const compass: CompassSource = { request: () => new Promise<Permission>((r) => (answer = r)), listen: () => ((listening = true), () => (listening = false)) };
  const prep = o.prep ?? outAndBack();
  const kv = o.kv ?? mem();
  const live = new Live({ prep: () => prep, std: () => 120, slug: () => 'oab', geo, compass, wake: {}, kv });
  return {
    live, kv, prep,
    /** A fix `dt` ms after the last (the page's clock moved on). */
    at: (p: { lat: number; lon: number }, acc = 8, dt = 10_000) => (vi.advanceTimersByTime(dt), w.ok?.({ coords: { latitude: p.lat, longitude: p.lon, accuracy: acc } } as GeolocationPosition)),
    listening: () => listening,
    answer: async (p: Permission = o.answer ?? 'granted') => (answer(p), await Promise.resolve(), await Promise.resolve())
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(Date.UTC(2026, 10, 22, 0, 0));
  resetSession();
});
afterEach(() => vi.useRealTimers());

describe('the live map', () => {
  it('a screen lock: the dot stale (grey) till a fresh fix, and a stale fix moves nothing', () => {
    const p = phone();
    p.live.tap();
    p.at(north(100));
    expect(p.live.fix?.stale).toBeUndefined();
    p.live.visible(false);
    expect(p.live.fix).toMatchObject({ stale: true });
    p.live.visible(true);
    expect(p.live.fix?.stale).toBe(true);
    p.at(north(110));
    expect(p.live.fix?.stale).toBeUndefined();
  });

  it('the compass listens only in 進行方向: off back in 追従 (hike mode), on again at the next tap in without asking', async () => {
    const p = phone();
    p.live.startHike();
    p.at(north(0));
    p.live.tap(); // follow → heading
    await p.answer();
    expect([p.live.cam.c, p.listening()]).toEqual(['heading', true]);
    p.live.tap(); // heading → follow (hike mode: never off)
    expect([p.live.cam.c, p.listening(), p.live.heading]).toEqual(['follow', false, null]);
    p.live.tap();
    expect([p.live.cam.c, p.listening()]).toEqual(['heading', true]);
    // a two-finger turn or a pan leaves it too
    p.live.rotate();
    expect([p.live.cam.c, p.listening()]).toEqual(['follow', false]);
  });

  it("the compass refused after the tap: the label says 追従, not 進行方向", async () => {
    const p = phone({ answer: 'denied' });
    p.live.tap();
    p.live.tap();
    expect(p.live.toast).toBe('camHeading');
    await p.answer();
    expect([p.live.cam.c, p.live.toast, p.live.compassDenied]).toEqual(['follow', 'camFollow', true]);
  });

  it('killed mid-descent and opened again: hike mode back on, the way-down pass (the place kept, no position); 終了 forgets it', () => {
    const kv = mem();
    const p = phone({ kv });
    p.live.startHike();
    for (let y = 0; y <= 1000; y += 50) p.at(north(y, 3));
    for (let y = 950; y >= 600; y -= 50) p.at(north(y, -3));
    expect(p.live.at!.d).toBeCloseTo(1400, -1);
    p.live.visible(false);
    const kept = JSON.parse(kv.m.get(DEVICE.hikeNow)!);
    expect(Object.keys(kept).sort()).toEqual(['d', 'dir', 'slug', 't']);
    expect(kept).toMatchObject({ slug: 'oab', dir: 1 });
    // a new page (the app relaunched two minutes on), the same trail
    vi.advanceTimersByTime(120_000);
    const q = phone({ kv });
    q.live.resumeHike();
    expect(q.live.hiking).toBe(true);
    q.at(north(500, -3));
    expect(q.live.at!.d).toBeCloseTo(1500, -1);
    q.live.endHike();
    expect(kv.m.has(DEVICE.hikeNow)).toBe(false);
    const r = phone({ kv });
    r.live.resumeHike();
    expect(r.live.hiking).toBe(false);
  });

  it('a start far off (5 km): a neutral approach, never the alert, till the route is reached; off it after that, the alert', () => {
    const p = phone();
    p.live.startHike();
    for (let i = 0; i < 5; i++) p.at(north(0, 5000 - i * 10));
    expect(p.live.off).toMatchObject({ approach: true });
    expect(p.live.off!.n).toBeGreaterThan(4900);
    expect(p.live.at).toBeNull();
    p.at(north(0, 20));
    expect(p.live.off).toBeNull();
    expect(p.live.at!.d).toBeCloseTo(0, -1);
    for (let i = 0; i < 4; i++) p.at(north(100, 1500));
    expect(p.live.off).toMatchObject({ approach: false, n: 1500 });
  });

  it("a poor fix after the summit moves nothing: a cell fix there, then on the way up again", () => {
    const p = phone();
    p.live.startHike();
    for (let y = 0; y <= 200; y += 50) p.at(north(y));
    p.at(north(1000), 400);
    expect(p.live.at!.d).toBeCloseTo(200, -1);
    p.at(north(230));
    expect(p.live.at!.d).toBeCloseTo(230, -1);
  });

  it("the fork card follows the way walked, its drawing made once a fork (not per fix); turned back, the fork behind with the route's way back", () => {
    const track = toTrack(readFileSync(join(import.meta.dirname, '../../../../../e2e/fixtures/hiking/tiny.gpx'), 'utf8'));
    const net = JSON.parse(readFileSync(join(import.meta.dirname, '../../../../../e2e/fixtures/hiking/tiny-net.json'), 'utf8')) as NetFile;
    const p = phone({ prep: prepare(track) });
    p.live.setNet(net);
    expect(p.live.forksOk).toBe(true);
    p.live.startHike();
    p.at({ lat: 35.0045, lon: 139.0001 });
    const j = p.live.junction!, hl = p.live.hl;
    expect([j.fork, j.rev]).toEqual([0, false]);
    p.at({ lat: 35.0046, lon: 139.0001 });
    expect(p.live.junction!.to).toBeLessThan(j.to);
    expect(p.live.hl).toBe(hl);
    // past fork 1 toward fork 2, then back down toward fork 1: the card for fork 1 again, walked backward
    for (let lat = 35.0047; lat <= 35.0065; lat += 0.0001) p.at({ lat, lon: 139.0001 }, 8, 5_000);
    for (let lat = 35.0064; lat >= 35.0058; lat -= 0.0001) p.at({ lat, lon: 139.0001 }, 8, 5_000);
    const back = p.live.junction!;
    expect([back.fork, back.rev]).toEqual([0, true]);
    expect(back.br[0]).toMatchObject({ take: true, line: -1 });
    expect(p.live.hl).not.toBe(hl);
    // the reference layer hidden: no card, no drawing
    p.live.toggleNet();
    expect([p.live.junction, p.live.hl]).toEqual([null, null]);
  });
});
