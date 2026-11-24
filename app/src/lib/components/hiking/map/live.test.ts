// The trail view's live state (live.svelte.ts) on a fake phone: the location (a hand-fed watch), the compass, the wake
// lock and the kept place (an in-memory store). The clock is vitest's.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toTrack } from '#lib/contract/hikeTrack.ts';
import { prepare, type Prepared } from '#lib/hiking/track.ts';
import { trackHash, type NetFile } from '#lib/hiking/net.ts';
import { DEVICE, type KV } from '#lib/sync/storage.ts';
import { Live } from './live.svelte.ts';
import { resetSession, type CompassSource, type Permission } from './compass.ts';
import type { WakeNav } from './wake.ts';

const M = 111_320;
const north = (m: number, east = 0) => ({ lat: 35 + m / M, lon: 139 + east / (M * Math.cos((35 * Math.PI) / 180)) });
function outAndBack(): Prepared {
  const up = Array.from({ length: 11 }, (_, i) => [139, 35 + (i * 100) / M, 100 + i * 20] as [number, number, number]);
  return prepare({ v: 1, len: 0, pts: [...up, ...up.slice(0, -1).reverse()], wpts: [] });
}
/** A route through these [east, north] corners (m), a point every 10 m. */
function path(corners: [number, number][]): Prepared {
  const pts: [number, number, number][] = [];
  for (let i = 1; i < corners.length; i++) {
    const [ax, ay] = corners[i - 1], [bx, by] = corners[i], n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / 10));
    for (let k = i === 1 ? 0 : 1; k <= n; k++) {
      const q = north(ay + ((by - ay) * k) / n, ax + ((bx - ax) * k) / n);
      pts.push([q.lon, q.lat, 100]);
    }
  }
  return prepare({ v: 1, len: 0, pts, wpts: [] });
}
const mem = (): KV & { m: Map<string, string> } => {
  const m = new Map<string, string>();
  return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

function phone(o: { prep?: Prepared; kv?: KV; answer?: Permission; wake?: WakeNav; start?: () => number | null; perm?: PermissionState; note?: ConstructorParameters<typeof Live>[0]['note'] } = {}) {
  const w = { ok: null as PositionCallback | null, err: null as PositionErrorCallback | null, n: 0 };
  const geo = { watchPosition: (ok: PositionCallback, err?: PositionErrorCallback | null) => ((w.ok = ok), (w.err = err ?? null), ++w.n, 1), clearWatch: () => void w.n-- };
  let listening = false;
  let answer!: (p: Permission) => void;
  const compass: CompassSource = { request: () => new Promise<Permission>((r) => (answer = r)), listen: () => ((listening = true), () => (listening = false)) };
  const prep = o.prep ?? outAndBack();
  const kv = o.kv ?? mem();
  const perms = { query: async () => ({ state: o.perm ?? 'granted' }) as PermissionStatus };
  const live = new Live({ prep: () => prep, std: () => 120, ...(o.start ? { start: o.start } : {}), slug: () => 'oab', name: () => 'オーアンドビー', geo, ask: { kv, perms }, compass, wake: o.wake ?? {}, kv, ...(o.note && { note: o.note }) });
  return {
    live, kv, prep,
    /** A fix `dt` ms after the last (the page's clock moved on). */
    at: (p: { lat: number; lon: number }, acc = 8, dt = 10_000) => (vi.advanceTimersByTime(dt), w.ok?.({ coords: { latitude: p.lat, longitude: p.lon, accuracy: acc } } as GeolocationPosition)),
    /** The location refused (the prompt, or Settings). */
    refuse: () => w.err?.({ code: 1 } as GeolocationPositionError),
    listening: () => listening,
    /** Location watches open. */
    watching: () => w.n,
    answer: async (p: Permission = o.answer ?? 'granted') => (answer(p), await Promise.resolve(), await Promise.resolve())
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(Date.UTC(2026, 10, 22, 0, 0));
  resetSession();
});
afterEach(() => (vi.useRealTimers(), vi.unstubAllGlobals()));

describe('the live map', () => {
  it('the location refused: the camera off, so the next tap asks again (not 現在地オフ); in hike mode it stays following', () => {
    const p = phone();
    p.live.tap();
    expect(p.live.cam).toBe('follow');
    p.refuse();
    expect([p.live.locDenied, p.live.cam]).toEqual([true, 'off']);
    p.live.tap();
    expect([p.live.cam, p.watching()]).toEqual(['follow', 1]);
    p.live.startHike();
    p.refuse();
    expect([p.live.locDenied, p.live.cam]).toEqual([true, 'follow']);
  });

  it('iOS asking again (map/askAgain.ts): after the fix, the top slot says where to make it stick, a while, once', async () => {
    const kv = mem();
    kv.setItem(DEVICE.geoAsked, '1');
    const p = phone({ kv, perm: 'prompt' });
    p.live.tap();
    await Promise.resolve();
    await Promise.resolve();
    expect(p.live.slot).toBe(null); // (the prompt up)
    p.at(north(0));
    expect([p.live.slot, kv.getItem(DEVICE.geoAsked)]).toEqual(['again', '2']);
    vi.advanceTimersByTime(8000);
    expect(p.live.slot).toBe(null);
  });

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

  it('the compass is asked on the tap into 追従 and runs while the location does: off with it, never turning the camera', async () => {
    const p = phone();
    p.live.tap(); // off → follow: asked in the tap
    await p.answer();
    expect([p.live.cam, p.listening()]).toEqual(['follow', true]);
    p.live.pan();
    expect([p.live.cam, p.listening()]).toEqual(['free', true]);
    p.live.tap(); // free → follow
    expect([p.live.cam, p.listening()]).toEqual(['follow', true]);
    p.live.tap(); // follow → off: the location and the compass stop together
    expect([p.live.cam, p.listening(), p.live.heading, p.live.fix]).toEqual(['off', false, null, null]);
    p.live.tap(); // on again without asking (the session's answer)
    expect([p.live.cam, p.listening()]).toEqual(['follow', true]);
    p.live.visible(false);
    expect(p.listening()).toBe(false);
    p.live.visible(true);
    expect(p.listening()).toBe(true);
  });

  it('hike mode: 歩きはじめる asks the compass first; a tap while following stays 追従 (re-centres), never off', async () => {
    const p = phone();
    p.live.startHike();
    await p.answer();
    expect([p.live.cam, p.listening()]).toEqual(['follow', true]);
    p.live.tap();
    expect([p.live.cam, p.live.toast, p.listening()]).toEqual(['follow', 'camFollow', true]);
    p.live.pan();
    p.live.tap();
    expect(p.live.cam).toBe('follow');
  });

  it('the arrival counted from the start (hike_start) while it is still ahead, from now once it is past', async () => {
    let start: number | null = Date.now() + 60 * 60_000;
    const p = phone({ start: () => start });
    p.live.startHike();
    await p.answer();
    p.at(north(0));
    const s0 = p.live.strip!;
    // the same way to go as from now, an hour later
    start = null;
    const free = p.live.strip!.eta!;
    expect(s0.eta! - free).toBe(60 * 60_000 - 10_000);
    start = Date.now() - 60_000;
    expect(p.live.strip!.eta).toBe(free);
  });

  it('the calibration hint shows while the cone does and the reading is poor', async () => {
    vi.stubGlobal('requestAnimationFrame', (cb: () => void) => setTimeout(cb, 16));
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
    const p = phone();
    p.live.tap();
    await p.answer();
    p.at(north(0));
    const c = (p.live as unknown as { compass: { read(r: { heading: number; acc: number | null }): void } }).compass;
    c.read({ heading: 90, acc: -1 });
    await vi.advanceTimersByTimeAsync(100);
    expect(p.live.heading).not.toBeNull();
    expect(p.live.slot).toBe('calib');
    c.read({ heading: 90, acc: 10 });
    await vi.advanceTimersByTimeAsync(100);
    expect(p.live.slot).toBeNull();
  });

  it('the compass refused: following goes on with no cone, the copy shown once, never asked again', async () => {
    const p = phone({ answer: 'denied' });
    p.live.tap();
    await p.answer();
    expect([p.live.cam, p.live.toast, p.live.compassDenied, p.live.slot]).toEqual(['follow', 'camFollow', true, 'compass']);
    vi.advanceTimersByTime(6000);
    expect(p.live.slot).toBeNull();
    p.live.tap();
    p.live.tap();
    expect([p.live.cam, p.live.slot, p.live.heading]).toEqual(['follow', null, null]);
  });

  it("終了's undo: hike mode back, from the place it was matched", () => {
    const kv = mem();
    const p = phone({ kv });
    p.live.startHike();
    for (let y = 0; y <= 500; y += 50) p.at(north(y));
    const d = p.live.at!.d;
    const undo = p.live.endHike();
    expect([p.live.hiking, p.live.at, kv.m.has(DEVICE.hikeNow)]).toEqual([false, null, false]);
    undo();
    expect([p.live.hiking, p.live.cam, p.live.at?.d]).toEqual([true, 'follow', d]);
    expect(JSON.parse(kv.m.get(DEVICE.hikeNow)!)).toMatchObject({ slug: 'oab', d: Math.round(d) });
    p.at(north(550));
    expect(p.live.at!.d).toBeCloseTo(550, -1);
  });

  it("終了's undo puts the wake switch back as it was; after the view has left (stop), the undo does nothing (no watch leaks)", async () => {
    const held: { released: boolean }[] = [];
    const wake: WakeNav = { wakeLock: { request: async () => { const l = { released: false, release: async () => void (l.released = true), addEventListener: () => {} }; held.push(l); return l; } } };
    const p = phone({ wake });
    p.live.startHike();
    p.live.setWake(true);
    await Promise.resolve();
    p.at(north(100));
    expect([p.live.wake, p.watching()]).toEqual([true, 1]);
    let undo = p.live.endHike();
    expect(p.live.wake).toBe(false);
    undo();
    await Promise.resolve();
    expect([p.live.hiking, p.live.wake]).toEqual([true, true]);
    // ended, the view left, then 取り消す
    undo = p.live.endHike();
    p.live.stop();
    expect(p.watching()).toBe(0);
    undo();
    expect([p.live.hiking, p.live.wake, p.watching()]).toEqual([false, false, 0]);
    expect(held.filter((l) => !l.released).length).toBe(0);
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
    expect(Object.keys(kept).sort()).toEqual(['d', 'dir', 's', 'slug', 't']);
    expect(kept).toMatchObject({ slug: 'oab', dir: 1, s: Date.UTC(2026, 10, 22, 0, 0) });
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

  it('the notification: 歩きはじめる asks (the tap), a relaunch resumes it with its start, 終了 closes it, 取り消す shows it again; the Home Screen line', () => {
    const kv = mem();
    const calls: string[] = [];
    let hint = false;
    const note = { start: vi.fn((h: { slug: string; name: string; at?: number }, how: string) => (calls.push(`${how}:${h.slug}:${h.name}:${h.at}`), hint)), end: vi.fn(() => void calls.push('end')) };
    const t0 = Date.now();
    const p = phone({ kv, note });
    p.live.startHike();
    p.live.startHike();   // (already on: nothing)
    vi.advanceTimersByTime(60_000);
    const q = phone({ kv, note });
    q.live.resumeHike();
    const undo = q.live.endHike();
    undo();
    expect(calls).toEqual([`tap:oab:オーアンドビー:${t0}`, `resume:oab:オーアンドビー:${t0}`, 'end', `undo:oab:オーアンドビー:${t0}`]);
    // an iPhone's Safari tab: the line in the top slot, a while
    hint = true;
    const r = phone({ note });
    r.live.startHike();
    expect(r.live.slot).toBe('notify');
    vi.advanceTimersByTime(10_000);
    expect(r.live.slot).toBeNull();
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

  it('a figure 8 after a gap: the match unsure at the crossing, so the card gives no way (ルートは地図の太線, no names) and draws no branch', () => {
    const prep = path([[0, 0], [0, 1000], [-1500, 1000], [-1500, 500], [1000, 500]]);
    const c = north(500);
    const net: NetFile = {
      v: 1, src: 'osm', at: '2026-11-22', trk: trackHash(prep.pts), north: 'true',
      lines: [{ c: [[c.lon, c.lat], [c.lon + 0.001, c.lat + 0.001]], h: 'path', n: '沢' }],
      forks: [{ p: [c.lon, c.lat], pass: [{ at: 500, inDeg: 0, take: 1 }, { at: 4500, inDeg: 90, take: 3 }], br: [{ deg: 180, line: -1 }, { deg: 0, line: -1 }, { deg: 270, line: -1 }, { deg: 90, line: -1 }, { deg: 40, line: 0 }] }]
    };
    const p = phone({ prep });
    p.live.setNet(net);
    p.live.startHike();
    for (let y = 0; y <= 440; y += 20) p.at(north(y), 8, 5_000);
    expect(p.live.junction!.br.length).toBeGreaterThan(0);
    expect(p.live.hl).not.toBeNull();
    p.at(north(500), 8, 900_000);
    expect(p.live.junction).toMatchObject({ dir: null, br: [] });
    expect(p.live.hl).toBeNull();
  });

  it("resumed 11 h on at a lollipop's trailhead (the last hike never ended, kept 50 m from the end): placed at the start, not the end", () => {
    // up a 500 m stick, round a 500 m square, down the stick: the trailhead is d 0 and d 3000
    const prep = path([[0, 0], [0, 500], [500, 500], [500, 1000], [0, 1000], [0, 500], [0, 0]]);
    const kv = mem();
    kv.setItem(DEVICE.hikeNow, JSON.stringify({ slug: 'oab', d: Math.round(prep.total - 50), dir: 1, t: Date.now() - 11 * 3_600_000 }));
    const p = phone({ prep, kv });
    p.live.resumeHike();
    expect(p.live.hiking).toBe(true);
    for (let y = 0; y <= 100; y += 20) p.at(north(y), 8, 10_000);
    expect(p.live.at!.d).toBeLessThan(150);
    // kept a minute ago: the end of the route, as kept
    const q = phone({ prep, kv: (kv.setItem(DEVICE.hikeNow, JSON.stringify({ slug: 'oab', d: Math.round(prep.total - 50), dir: 1, t: Date.now() - 60_000 })), kv) });
    q.live.resumeHike();
    q.at(north(20), 8, 10_000);
    expect(q.live.at!.d).toBeGreaterThan(prep.total - 100);
  });
});
