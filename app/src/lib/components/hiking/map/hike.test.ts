import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toTrack } from '#lib/contract/hikeTrack.ts';
import { prepare, type Prepared } from '#lib/hiking/track.ts';
import { Matcher, OffRoute, climbLeft, effort, nearest, resumable, standardMin, strip } from './hike.ts';

const M = 111_320;
/** Out and back exactly: 1 km north on one line (a point every 100 m) and down the same points. */
function outAndBack(): Prepared {
  const up = Array.from({ length: 11 }, (_, i) => [139, 35 + (i * 100) / M, 100 + i * 20] as [number, number, number]);
  return prepare({ v: 1, len: 0, pts: [...up, ...up.slice(0, -1).reverse()], wpts: [] });
}
const north = (m: number, east = 0) => ({ lon: 139 + east / (M * Math.cos((35 * Math.PI) / 180)), lat: 35 + m / M });
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

  it('a fix worse than 100 m never moves progress: a cell fix at the summit, then the next good fix on the way up stays on the way up', () => {
    const pr = outAndBack(), m = new Matcher(pr);
    let t = 0;
    for (let y = 0; y <= 200; y += 50) m.fix({ ...north(y), acc: 8, t: (t += 10_000) });
    // a 400 m cell fix that happens to sit on the summit: within max(50, 2 × 400) of the route, once placed there
    expect(m.fix({ ...north(1000), acc: 400, t: (t += 10_000) }).at!.d).toBeCloseTo(200, -1);
    // the next good fix, 800 m from the summit: still the way up (never the way-down pass ahead of the summit)
    expect(m.fix({ ...north(220), acc: 8, t: (t += 10_000) }).at!.d).toBeCloseTo(220, -1);
    // never placed and the first fix poor: nothing placed till a good one
    const n = new Matcher(pr);
    expect(n.fix({ ...north(600), acc: 150, t: 0 }).at).toBeNull();
    // over 1 km off and never placed (the drive to the trailhead): none either
    expect(n.fix({ ...north(300, 1500), acc: 10, t: 2_000 }).at).toBeNull();
    expect(n.fix({ ...north(300), acc: 10, t: 5_000 }).at!.d).toBeCloseTo(300, -1);
  });

  it('off the route (beyond max(50, 2 × accuracy)): progress holds, the nearest point still told', () => {
    const pr = outAndBack(), m = new Matcher(pr);
    m.fix({ ...north(300), acc: 8, t: 0 });
    const r = m.fix({ ...north(500, 120), acc: 8, t: 10_000 });
    expect(r.at!.d).toBeCloseTo(300, -1);
    expect(r.g.dist).toBeCloseTo(120, 0);
  });

  it('after a gap, the pass a walker could have reached: turned back on the way up, 5 min later the way-up pass behind (not the way down 1.2 km ahead)', () => {
    const pr = outAndBack(), m = new Matcher(pr);
    let t = 0;
    for (let y = 0; y <= 600; y += 25) m.fix({ ...north(y), acc: 8, t: (t += 10_000) });
    for (let y = 575; y >= 450; y -= 25) m.fix({ ...north(y), acc: 8, t: (t += 10_000) });
    expect(m.dir).toBe(-1);
    expect(m.fix({ ...north(300), acc: 8, t: t + 300_000 }).at!.d).toBeCloseTo(300, -1);
  });

  it("after a gap going up, the pass nearest a walker's pace ahead: near the top, 5 min on, just over it (the way down)", () => {
    const pr = outAndBack(), m = new Matcher(pr);
    let t = 0;
    for (let y = 0; y <= 800; y += 25) m.fix({ ...north(y), acc: 8, t: (t += 10_000) });
    expect(m.dir).toBe(1);
    // y 850 is 50 m ahead (up) or 350 m ahead (over the top and back down): 5 min at a walker's pace is the latter
    expect(m.fix({ ...north(850), acc: 8, t: t + 300_000 }).at!.d).toBeCloseTo(1150, -1);
  });

  it('the direction of travel: the sign of the last 30 m along the route, kept through a short stop', () => {
    const pr = outAndBack(), m = new Matcher(pr);
    let t = 0;
    for (let y = 0; y <= 300; y += 10) m.fix({ ...north(y), acc: 8, t: (t += 5_000) });
    expect(m.dir).toBe(1);
    m.fix({ ...north(290), acc: 8, t: (t += 5_000) });
    expect(m.dir).toBe(1); // (10 m back: not yet)
    for (let y = 280; y >= 230; y -= 10) m.fix({ ...north(y), acc: 8, t: (t += 5_000) });
    expect(m.dir).toBe(-1);
  });

  it('resumed (a relaunch mid-descent: the distance and direction kept, no position): the way-down pass, not the first', () => {
    const pr = outAndBack(), m = new Matcher(pr, { d: 1300, dir: 1, t: 0 });
    expect(m.at).toBeNull();
    expect(m.dir).toBe(1);
    expect(m.fix({ ...north(650), acc: 10, t: 120_000 }).at!.d).toBeCloseTo(1350, -1);
    // resumed seconds later (within the silence): still searched whole, never a jump measured from no position
    const r = new Matcher(pr, { d: 1300, dir: 1, t: 0 });
    expect(r.fix({ ...north(690), acc: 10, t: 5_000 }).at!.d).toBeCloseTo(1310, -1);
  });

  it('a forward spike (one fix 200 m ahead) never turns the direction: the window back from it, then the true place again', () => {
    const pr = path([[0, 0], [0, 2000]]), m = new Matcher(pr);
    let t = 0;
    for (let y = 0; y <= 1000; y += 10) m.fix({ ...north(y), acc: 8, t: (t += 5_000) });
    m.fix({ ...north(1200), acc: 20, t: (t += 5_000) });
    const dirs: number[] = [];
    for (let y = 1005; y <= 1100; y += 5) dirs.push((m.fix({ ...north(y), acc: 8, t: (t += 5_000) }), m.dir));
    expect(dirs.every((d) => d === 1)).toBe(true);
  });

  it('one fix 60 m back (not a spike) turns nothing; two in a row 30 m back do', () => {
    const pr = path([[0, 0], [0, 2000]]), m = new Matcher(pr);
    let t = 0;
    for (let y = 0; y <= 500; y += 10) m.fix({ ...north(y), acc: 8, t: (t += 30_000) });
    m.fix({ ...north(440), acc: 8, t: (t += 30_000) });
    expect(m.dir).toBe(1);
    m.fix({ ...north(520), acc: 8, t: (t += 30_000) });
    m.fix({ ...north(480), acc: 8, t: (t += 30_000) });
    expect(m.dir).toBe(1);
    m.fix({ ...north(470), acc: 8, t: (t += 30_000) });
    expect(m.dir).toBe(-1);
  });

  it('switchbacks 20 m apart, a fix now and then drifting 16 m toward the next leg: the direction never turns', () => {
    const corners: [number, number][] = [];
    for (let k = 0; k < 20; k++) corners.push(k % 2 ? [100, k * 20] : [0, k * 20], k % 2 ? [0, k * 20] : [100, k * 20]);
    const pr = path(corners), m = new Matcher(pr);
    let t = 0, flips = 0, dir = m.dir;
    for (let leg = 0; leg < 20; leg++)
      for (let x = 0; x <= 100; x += 10) {
        const drift = (leg * 11 + x / 10) % 5 === 0 ? 16 : 0;
        m.fix({ ...north(leg * 20 + drift, leg % 2 ? 100 - x : x), acc: 8, t: (t += 7_000) });
        if (m.dir !== dir) ((flips += 1), (dir = m.dir));
      }
    expect(flips).toBe(0);
    expect(m.dir).toBe(1);
  });

  it('a figure 8 after a gap (a runner, 15 min): two passes at the crossing, the match unsure till the window has followed 50 m; one pass near: sure', () => {
    // north 1 km (d 0–1000), west 1.5 km, south 500 m, then east across the first leg at (0, 500): d ≈ 4500
    const pr = path([[0, 0], [0, 1000], [-1500, 1000], [-1500, 500], [1000, 500]]), m = new Matcher(pr);
    let t = 0;
    for (let y = 0; y <= 440; y += 20) m.fix({ ...north(y), acc: 8, t: (t += 5_000) });
    expect(m.sure).toBe(true);
    m.fix({ ...north(500), acc: 8, t: (t += 900_000) });
    expect(m.sure).toBe(false);
    // east along the way the runner really goes: the other pass found once the first is clearly farther, and sure
    for (let x = 20; x <= 80; x += 20) m.fix({ ...north(500, x), acc: 8, t: (t += 5_000) });
    expect(m.at!.d).toBeGreaterThan(4500);
    expect(m.sure).toBe(true);
    // an out-and-back's two legs after a gap: unsure, then sure once followed 50 m
    const o = new Matcher(outAndBack());
    o.fix({ ...north(100), acc: 8, t: 0 });
    o.fix({ ...north(300), acc: 8, t: 200_000 });
    expect(o.sure).toBe(false);
    for (let y = 320; y <= 340; y += 10) o.fix({ ...north(y), acc: 8, t: 200_000 + (y - 300) * 1_000 });
    expect(o.sure).toBe(false);
    o.fix({ ...north(360), acc: 8, t: 270_000 });
    expect(o.sure).toBe(true);
  });

  it('after a gap the passes ranked softly: one just past reach ahead beats one well within it behind', () => {
    // top at 1500 m; walking up 75 m below it, 10 min on 1,100 m below: back down the way up (6.6 km/h against the way
    // walked) or over the top and down (7.5 km/h, 50 m past reach): the latter
    const up = Array.from({ length: 16 }, (_, i) => [139, 35 + (i * 100) / M, 100] as [number, number, number]);
    const pr = prepare({ v: 1, len: 0, pts: [...up, ...up.slice(0, -1).reverse()], wpts: [] }), m = new Matcher(pr);
    let t = 0;
    for (let y = 1225; y <= 1425; y += 25) m.fix({ ...north(y), acc: 8, t: (t += 10_000) });
    expect(m.fix({ ...north(325), acc: 8, t: t + 600_000 }).at!.d).toBeGreaterThan(2600);
  });

  it("resumable: a kept place only while the time since it is within the remaining route's standard time (3 h without one)", () => {
    const pr = outAndBack(), e = effort(pr), r = { d: pr.total - 50, dir: 1 as const, t: 0 };
    // 120 min for the route: 50 m of the way down left is a minute or two
    expect(resumable(pr, r, 120, 60_000, e)).toBe(r);
    expect(resumable(pr, r, 120, 11 * 3_600_000, e)).toBeNull();
    expect(resumable(pr, { ...r, d: 100 }, 120, 3_600_000, e)).not.toBeNull();
    expect(resumable(pr, r, null, 2 * 3_600_000, e)).toBe(r);
    expect(resumable(pr, r, null, 4 * 3_600_000, e)).toBeNull();
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
