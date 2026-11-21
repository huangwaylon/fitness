import { describe, expect, it } from 'vitest';
import { angle, buildNet, keptOf, type Overpass, type OsmNode, type OsmWay } from './netBuild.ts';
import { trackHash, parseNet, type NetFile } from './net.ts';
import type { TrackFile } from './types.ts';

// An invented plane at 35° N, 139° E, in metres: x east, y north.
const LAT0 = 35, LON0 = 139, KY = 111_320, KX = KY * Math.cos((LAT0 * Math.PI) / 180);
type XY = [number, number];
const ll = ([x, y]: XY) => ({ lon: LON0 + x / KX, lat: LAT0 + y / KY });
const xyOf = ([lon, lat]: number[]): XY => [(lon - LON0) * KX, (lat - LAT0) * KY];

/** Overpass's answer from ways drawn in metres (a point shared by two ways is one node) and POIs. */
function osm(ways: { p: XY[]; tags: Record<string, string> }[], pois: { p: XY; tags: Record<string, string> }[] = []): Overpass {
  const ids = new Map<string, number>();
  const id = (p: XY) => {
    const k = `${Math.round(p[0] * 10)},${Math.round(p[1] * 10)}`;
    if (!ids.has(k)) ids.set(k, ids.size + 1);
    return ids.get(k)!;
  };
  const w: OsmWay[] = ways.map((x, i) => ({ type: 'way', id: 1000 + i, nodes: x.p.map(id), geometry: x.p.map(ll), tags: x.tags }));
  const n: OsmNode[] = pois.map((x, i) => ({ type: 'node', id: 5000 + i, ...ll(x.p), tags: x.tags }));
  return { elements: [...w, ...n] };
}
/** A track along points in metres, densified every 25 m (a GPS track's spacing). */
function track(p: XY[]): TrackFile {
  const pts: [number, number, number][] = [];
  let len = 0;
  for (let i = 0; i < p.length; i++) {
    if (i) {
      const [a, b] = [p[i - 1], p[i]], d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(d / 25));
      len += d;
      for (let k = 1; k < n; k++) pts.push([...lonLat([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]), 100]);
    }
    pts.push([...lonLat(p[i]), 100]);
  }
  return { v: 1, len: Math.round(len), pts, wpts: [] };
}
const lonLat = (p: XY): [number, number] => {
  const { lon, lat } = ll(p);
  return [Math.round(lon * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5];
};
const path = (p: XY[], tags: Record<string, string> = {}) => ({ p, tags: { highway: 'path', ...tags } });
const build = (o: Overpass, t: TrackFile): NetFile => {
  const n = buildNet(o, t, '2026-11-21');
  expect(parseNet(n)).not.toBeNull();
  return n;
};
/** The lines' points in metres. */
const linesXY = (n: NetFile) => n.lines.map((l) => l.c.map(xyOf));
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;

describe('reference trails: the build', () => {
  it('the route entirely on OSM, out and back: only the side path is drawn; its fork passed twice, each pass its bearing in and the branch it takes; labels from the next peak', () => {
    const t = track([[0, 0], [1000, 0], [0, 0]]);
    const o = osm(
      [path([[0, 1], [500, 1], [1000, 1]]), path([[500, 1], [500, 200], [480, 400]])],
      [{ p: [480, 400], tags: { natural: 'peak', name: '北峰' } }, { p: [1000, 3], tags: { natural: 'peak', name: '東峰' } }]
    );
    const n = build(o, t);
    expect(n.trk).toBe(trackHash(t.pts));
    expect(n.lines).toHaveLength(1);
    expect(linesXY(n)[0].every(([x, y]) => near(x, 500, 25) && y >= 0)).toBe(true);
    expect(n.forks).toHaveLength(1);
    const [f] = n.forks;
    const east = f.br.findIndex((b) => b.line === -1 && near(b.deg, 90, 3)), west = f.br.findIndex((b) => b.line === -1 && near(b.deg, 270, 3));
    const side = f.br.findIndex((b) => b.line === 0);
    expect([east, west, side].every((i) => i >= 0)).toBe(true);
    expect(f.br).toHaveLength(3);
    expect(f.br[side]).toMatchObject({ n: '北峰', deg: 0 });
    expect(f.br[east].n).toBe('東峰');
    expect(f.br[west].n).toBeUndefined();
    expect(f.pass.map((p) => p.at)).toEqual([500, 1500].map((x) => expect.closeTo(x, -1)));
    expect(f.pass.map((p) => [p.inDeg, p.take])).toEqual([[90, east], [270, west]]);
    expect(xyOf(f.p).map(Math.round)).toEqual([500, 1]);
  });

  it('a parallel path 10 m beside the route stays (the route has its own edge); the route on OSM goes', () => {
    const t = track([[0, 0], [1000, 0]]);
    const o = osm([path([[0, 1], [200, 1], [800, 1], [1000, 1]]), path([[200, 1], [230, 10], [770, 10], [800, 1]], { name: '巻き道' })]);
    const n = build(o, t);
    expect(n.lines).toHaveLength(1);
    expect(n.lines[0].n).toBe('巻き道');
    const xs = linesXY(n)[0].map((p) => p[0]);
    expect(Math.min(...xs)).toBeLessThan(215);
    expect(Math.max(...xs)).toBeGreaterThan(785);
    // two forks, each with the parallel path as a named branch (it leaves at a slant: < 45° from the route's way)
    expect(n.forks.map((f) => f.pass.map((p) => Math.round(p.at / 10) * 10))).toEqual([[200], [800]]);
    for (const f of n.forks) {
      const b = f.br.find((x) => x.line === 0)!;
      expect(b.n).toBe('巻き道');
      expect(Math.min(...f.br.filter((x) => x.line === -1).map((x) => angle(x.deg, b.deg)))).toBeLessThan(45);
    }
  });

  it('the GPS line 10 m off its path (no other edge there): the path is the route, nothing drawn', () => {
    const n = build(osm([path([[0, 10], [1000, 10]])]), track([[0, 0], [1000, 0]]));
    expect(n.lines).toEqual([]);
    expect(n.forks).toEqual([]);
  });

  it('adjacent switchbacks 15 m apart: each leg is its own leg\'s, none drawn; a fork on one leg passed once (the leg beside goes by)', () => {
    const legs: XY[] = [[0, 0], [200, 0], [200, 15], [0, 15], [0, 30], [200, 30]];
    const t = track(legs);
    const way: XY[] = legs.map(([x, y]) => [x, y + 1]);
    way.splice(5, 0, [100, 31]);
    const o = osm([path(way), path([[100, 31], [100, 200], [120, 400]])]);
    const n = build(o, t);
    expect(n.lines).toHaveLength(1);
    expect(linesXY(n)[0].every(([x, y]) => near(x, 110, 15) && y > 25)).toBe(true);
    expect(n.forks).toHaveLength(1);
    expect(n.forks[0].pass).toHaveLength(1);
    expect(n.forks[0].pass[0].at).toBeCloseTo(200 + 15 + 200 + 15 + 100, -1);
  });

  it('a road crossing is drawn, near the track only, and makes no fork; a crossing path makes one of four branches', () => {
    const t = track([[0, 0], [1000, 0]]);
    const o = osm([
      path([[0, 1], [300, 1], [700, 1], [1000, 1]]),
      { p: [[300, -600], [300, 1], [300, 600]], tags: { highway: 'unclassified', name: '林道' } },
      path([[700, -300], [700, 1], [700, 300]])
    ]);
    const n = build(o, t);
    const road = n.lines.filter((l) => l.h === 'unclassified');
    expect(road.length).toBeGreaterThan(0);
    for (const p of road.flatMap((l) => l.c.map(xyOf))) expect(Math.abs(p[1])).toBeLessThan(165);
    expect(n.forks).toHaveLength(1);
    expect(n.forks[0].br.map((b) => b.deg).sort((a, b) => a - b)).toEqual([0, 90, 180, 270]);
    expect(n.forks[0].pass[0]).toMatchObject({ inDeg: 90 });
  });

  it("labels: the way's name first, else a guidepost's destination along it (not one at the fork, not a numbered post's code)", () => {
    const t = track([[0, 0], [1000, 0]]);
    const o = osm(
      [path([[0, 1], [400, 1], [600, 1], [1000, 1]]), path([[400, 1], [400, 300]], { name: '北尾根' }), path([[600, 1], [600, -300]])],
      [
        { p: [600, 5], tags: { information: 'guidepost', name: '分岐' } },
        { p: [600, -100], tags: { information: 'guidepost', name: '151-750', ref: '151-750', destination: '南峰;西峰' } }
      ]
    );
    const n = build(o, t);
    expect(n.forks.map((f) => f.br.filter((b) => b.line >= 0).map((b) => b.n))).toEqual([['北尾根'], ['南峰']]);
  });

  it("a hut's door (a dead end under 80 m) makes no fork but is drawn; the trailhead's junction no pass", () => {
    const t = track([[0, 0], [1000, 0]]);
    const o = osm([path([[0, 1], [500, 1], [1000, 1]]), path([[500, 1], [500, 40]]), path([[0, 1], [-300, 1]]), path([[0, 1], [0, 300]])]);
    const n = build(o, t);
    expect(n.forks).toEqual([]);
    expect(n.lines.length).toBeGreaterThanOrEqual(2);
  });

  it('Douglas–Peucker at 5 m and 5 decimals', () => {
    const wiggle: XY[] = Array.from({ length: 41 }, (_, i) => [500 + (i % 2) * 2, 30 + i * 10]);
    const n = build(osm([path([[0, 1], [500, 1], [1000, 1]]), path([[500, 1], ...wiggle])]), track([[0, 0], [1000, 0]]));
    const [line] = n.lines;
    expect(line.c.length).toBeLessThan(5);
    for (const [lon, lat] of line.c) expect([lon, lat].every((v) => Math.round(v * 1e5) / 1e5 === v)).toBe(true);
  });

  it('keptOf: claims cut out, claimed ends taken to the end, stubs beside a claim dropped', () => {
    expect(keptOf(100, [])).toEqual([[0, 100]]);
    expect(keptOf(100, [50])).toEqual([[0, 40], [60, 100]]);
    expect(keptOf(100, [5, 95])).toEqual([[15, 85]]);
    expect(keptOf(100, [20, 52])).toEqual([[62, 100]]); // 0–10: a stub
    expect(keptOf(100, [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100])).toEqual([]);
  });
});
