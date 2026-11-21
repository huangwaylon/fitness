import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toTrack } from '#lib/contract/hikeTrack.ts';
import { prepare, type Prepared } from '#lib/hiking/track.ts';
import { Matcher, OffRoute, climbLeft, nearest, standardMin, strip } from './hike.ts';

const M = 111_320;
/** Out and back exactly: 1 km north on one line (a point every 100 m) and down the same points. */
function outAndBack(): Prepared {
  const up = Array.from({ length: 11 }, (_, i) => [139, 35 + (i * 100) / M, 100 + i * 20] as [number, number, number]);
  return prepare({ v: 1, len: 0, pts: [...up, ...up.slice(0, -1).reverse()], wpts: [] });
}
const north = (m: number, east = 0) => ({ lon: 139 + east / (M * Math.cos((35 * Math.PI) / 180)), lat: 35 + m / M });

describe('matching: walked vs ahead', () => {
  it('out and back: the way down never snaps to the way up (the window moves on)', () => {
    const pr = outAndBack(), m = new Matcher(pr);
    let t = 0;
    const ds: number[] = [];
    for (let y = 0; y <= 1000; y += 50) ds.push(m.match({ ...north(y, 3), t: (t += 10_000) }).d);
    for (let y = 950; y >= 0; y -= 50) ds.push(m.match({ ...north(y, -3), t: (t += 10_000) }).d);
    // always forward, and the last fix at the trailhead is the route's end, not its start
    for (let i = 1; i < ds.length; i++) expect(ds[i]).toBeGreaterThanOrEqual(ds[i - 1] - 5);
    expect(ds.at(-1)!).toBeGreaterThan(pr.total - 20);
  });

  it('after a gap (> 60 s) the whole route is searched first: on the way down, the way-down pass (out-and-back safe)', () => {
    const pr = outAndBack(), m = new Matcher(pr);
    m.match({ ...north(0), t: 0 });
    for (let y = 100, t = 10_000; y <= 1000; y += 100, t += 10_000) m.match({ ...north(y), t });
    // five minutes later, 300 m down from the top
    const d = m.match({ ...north(700), t: 400_000 }).d;
    expect(d).toBeGreaterThan(1250);
    expect(d).toBeLessThan(1350);
  });

  it('after a gap on the way up, the way-up pass; never placed before: the first pass', () => {
    const pr = outAndBack();
    const m = new Matcher(pr);
    m.match({ ...north(100), t: 0 });
    expect(m.match({ ...north(400), t: 200_000 }).d).toBeCloseTo(400, -1);
    expect(new Matcher(pr).match({ ...north(600), t: 0 }).d).toBeCloseTo(600, -1);
  });

  it('a jump (> 300 m between fixes, no silence) searches the whole route too', () => {
    const pr = outAndBack(), m = new Matcher(pr);
    m.match({ ...north(100), t: 0 });
    expect(m.match({ ...north(800), t: 5_000 }).d).toBeCloseTo(800, -1);
  });

  it("tiny.gpx (the e2e's: up a zigzag, down 25 m east of it): placed on each leg as walked", () => {
    const track = toTrack(readFileSync(join(import.meta.dirname, '../../../../../e2e/fixtures/hiking/tiny.gpx'), 'utf8'));
    const pr = prepare(track), m = new Matcher(pr);
    let t = 0;
    const up = m.match({ lon: 139.0001, lat: 35.004, t: (t += 10_000) }).d;
    for (let lat = 35.0045; lat <= 35.01; lat += 0.0005) m.match({ lon: 139.0001, lat, t: (t += 10_000) });
    let down = 0;
    for (let lat = 35.0095; lat >= 35.004; lat -= 0.0005) down = m.match({ lon: 139.0003, lat, t: (t += 10_000) }).d;
    expect(up).toBeLessThan(pr.total / 2);
    expect(down).toBeGreaterThan(pr.total / 2);
  });

  it('nearest: the distance off the route and its foot', () => {
    const pr = outAndBack();
    const g = nearest(pr, north(500, 80));
    expect(g.dist).toBeCloseTo(80, 0);
    expect(g.lon).toBeCloseTo(139, 6);
  });
});

describe('off the route (R4): > max(50 m, 2 × accuracy) for ≥ 3 fixes and ≥ 20 s; back under 30 m', () => {
  it('three fixes in 10 s are not enough; at 20 s it is off; under 30 m it is back', () => {
    const o = new OffRoute();
    expect([o.update(60, 10, 0), o.update(62, 10, 5_000), o.update(65, 10, 10_000)]).toEqual([null, null, null]);
    expect(o.off).toBe(false);
    expect(o.update(65, 10, 20_000)).toBe('off');
    expect(o.off).toBe(true);
    expect(o.update(40, 10, 25_000)).toBeNull(); // (between 30 and the threshold: still off)
    expect(o.update(29, 10, 30_000)).toBe('back');
    expect(o.off).toBe(false);
  });

  it('a poor accuracy raises the bar (2 × 40 m = 80 m); a fix back on the route restarts the count', () => {
    const o = new OffRoute();
    for (let t = 0; t <= 60_000; t += 10_000) expect(o.update(70, 40, t)).toBeNull();
    const p = new OffRoute();
    p.update(60, 10, 0);
    p.update(60, 10, 10_000);
    p.update(20, 10, 15_000);
    expect(p.update(60, 10, 25_000)).toBeNull();
    expect(p.update(60, 10, 30_000)).toBeNull();
    expect(p.update(60, 10, 45_000)).toBe('off');
  });

  it('a fix worse than 100 m counts neither way', () => {
    const o = new OffRoute();
    o.update(60, 10, 0);
    o.update(60, 10, 10_000);
    expect(o.update(5, 150, 15_000)).toBeNull();
    expect(o.update(60, 10, 20_000)).toBe('off');
    expect(o.update(5, 150, 25_000)).toBeNull();
    expect(o.off).toBe(true);
  });
});

describe('the strip: standard time, climb left, the ETA', () => {
  it("standardMin: a walked record's 標準タイム, else the trail's time (a range's longer end)", () => {
    expect(standardMin({ time: '3 h 17 min' })).toBe(197);
    expect(standardMin({ time: '~3 h 30 min' })).toBe(210);
    expect(standardMin({ time: '10 – 13 h' })).toBe(780);
    expect(standardMin({ time: '45 min' })).toBe(45);
    expect(standardMin({ time: '5 h', walked: { dateISO: '2026-11-07', downM: 569, standard: '3:37', constant: 12 } })).toBe(217);
    expect(standardMin({ time: '' })).toBeNull();
  });

  it('out and back: 山頂 ahead until the top, then ゴール; the climb left; the time scaled by the effort left (a climb weighs more)', () => {
    const pr = outAndBack(), now = Date.UTC(2026, 10, 21, 0, 0);
    const s0 = strip(pr, 0, 120, now);
    expect(s0.goal).toBe('summit');
    expect(s0.up).toBeCloseTo(200, 0);
    expect(s0.left).toBeCloseTo(pr.total, 0);
    // to the summit: the climbing half of the effort is more than half of the 2 h
    const toTop = (s0.eta! - now) / 60_000;
    expect(toTop).toBeGreaterThan(60);
    expect(toTop).toBeLessThan(120);
    const s1 = strip(pr, 1100, 120, now);
    expect(s1.goal).toBe('goal');
    expect(s1.up).toBe(0);
    expect((s1.eta! - now) / 60_000).toBeLessThan(120 - toTop);
    expect(strip(pr, pr.total, 120, now).eta).toBe(now);
    expect(strip(pr, 0, null, now).eta).toBeNull();
    expect(climbLeft(pr, 500)).toBeCloseTo(100, 0);
  });
});
