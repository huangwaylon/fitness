import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { hav, parseGpx, pointAt, prepare, profilePaths, profileY, PROF, scrubDistance, simplify, smooth, toTrack } from './track.ts';

const tiny = readFileSync(join(import.meta.dirname, '../../../e2e/fixtures/hiking/tiny.gpx'), 'utf8');

describe('parseGpx', () => {
  it('reads every track point (lat, lon, ele) and the waypoints, their names out of CDATA and trimmed', () => {
    const g = parseGpx(tiny);
    expect(g.pts).toHaveLength(41);
    expect(g.pts[0]).toEqual({ lat: 35, lon: 139, ele: 98.5 });
    expect(g.wpts).toEqual([{ lat: 35.005, lon: 139.0001, name: 'Bridge' }]);
  });
  it('takes a self-closed point (no elevation: 0 m) and fails on a broken number', () => {
    expect(parseGpx('<trkpt lon="1" lat="2"/>').pts).toEqual([{ lat: 2, lon: 1, ele: 0 }]);
    expect(() => parseGpx('<trkpt lat="x" lon="1"></trkpt>')).toThrow();
  });
});

describe('smooth', () => {
  it("is the hiking app's 15-point centred mean, narrower at the ends", () => {
    const v = Array.from({ length: 30 }, (_, i) => (i % 2 ? 10 : 0));
    const s = smooth(v);
    expect(s[0]).toBeCloseTo((0 + 10 + 0 + 10 + 0 + 10 + 0 + 10) / 8);
    expect(s[15]).toBeCloseTo(70 / 15); // 7 tens of 15 (index 15 is odd: 8 odds would be 80; the window 8..22 holds 7)
    expect(smooth([1, 2, 3], 1)).toEqual([1, 2, 3]);
  });
});

describe('simplify (Douglas–Peucker)', () => {
  const line = (n: number, wiggle: number) => Array.from({ length: n }, (_, i) => ({ lat: 35 + i * 1e-4, lon: 139 + (i % 2 ? wiggle : 0) }));
  it('keeps both ends and drops what strays under the tolerance', () => {
    // 1e-5° of longitude at 35° ≈ 0.9 m: all gone at 5 m
    expect(simplify(line(50, 1e-5), 5)).toEqual([0, 49]);
  });
  it('keeps a corner past it', () => {
    const pts = [{ lat: 0, lon: 0 }, { lat: 0.0005, lon: 0.0005 }, { lat: 0, lon: 0.001 }];
    expect(simplify(pts, 5)).toEqual([0, 1, 2]);
    expect(simplify(pts.slice(0, 2))).toEqual([0, 1]);
  });
});

describe('toTrack (the converter)', () => {
  const t = toTrack(tiny);
  it('writes [lon, lat, ele] with the smoothed elevations, the raw length, the waypoints', () => {
    expect(t.v).toBe(1);
    expect(t.pts.length).toBeLessThan(41);
    expect(t.pts[0][0]).toBe(139);
    expect(t.pts[0][1]).toBe(35);
    // the first point's smoothed elevation: the mean of the first 8 raw ones
    const raw = parseGpx(tiny).pts.slice(0, 8).map((p) => p.ele);
    expect(t.pts[0][2]).toBeCloseTo(raw.reduce((a, b) => a + b) / 8, 1);
    expect(t.len).toBeGreaterThan(2000);
    expect(t.wpts).toEqual([{ lon: 139.0001, lat: 35.005, name: 'Bridge' }]);
  });
  it('fails on a GPX with fewer than two points', () => expect(() => toTrack('<gpx></gpx>')).toThrow());
});

describe('prepare and the scrub', () => {
  const p = prepare(toTrack(tiny));
  it("stretches the simplified line's distances to the raw length; the range is the smoothed one's; the ends meet", () => {
    expect(p.total).toBeCloseTo(toTrack(tiny).len, 0);
    expect(p.lo).toBeGreaterThan(98);
    expect(p.hi).toBeLessThan(302);
    expect(p.closed).toBe(true);
    expect(p.wpts[0].d).toBeGreaterThan(0);
  });
  it('pointAt: the ends, the middle (the far end, highest), clamped past them', () => {
    expect(pointAt(p, -5)).toMatchObject({ lon: 139, lat: 35, d: 0 });
    expect(pointAt(p, p.total * 2).d).toBe(p.total);
    const mid = pointAt(p, p.total / 2);
    expect(mid.lat).toBeCloseTo(35.01, 3);
    expect(mid.ele).toBeGreaterThan(250);
  });
  it('scrubDistance: the finger across the chart is the distance along, clamped to the chart', () => {
    expect(scrubDistance(110, 10, 200, 5000)).toBe(2500);
    expect(scrubDistance(0, 10, 200, 5000)).toBe(0);
    expect(scrubDistance(999, 10, 200, 5000)).toBe(5000);
    expect(scrubDistance(50, 10, 0, 5000)).toBe(0);
  });
  it('the profile: its lowest point on the band\'s floor, its highest on its ceiling, the area closed to the bottom', () => {
    expect(profileY(p, p.lo)).toBe(PROF.h - PROF.padB);
    expect(profileY(p, p.hi)).toBe(PROF.padT);
    const { area, line } = profilePaths(p, 300);
    expect(area.startsWith(`M0,${PROF.h} L0.0,`)).toBe(true);
    expect(area.endsWith(`L300,${PROF.h}Z`)).toBe(true);
    expect(line.split(' L')).toHaveLength(p.pts.length);
  });
});

describe('hav', () => {
  it('a degree of latitude is ~111 km', () => expect(hav(0, 0, 1, 0)).toBeCloseTo(111195, -1));
});
