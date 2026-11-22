// The shared track code (contract/hikeTrack.ts): the baked trails' output kept exactly (a golden of the build script's
// track for the e2e fixture, as scripts/hiking-tracks.ts made it with lib/hiking/track.ts), the fit to a `hike_trk`'s
// cap, and the cost on a long track (the relay runs it per import).
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fitTrack, HIKE_TRK_CHARS, parseGpx, simplify, smooth, toTrack, trackOf, type TrackPt } from './hikeTrack.ts';

const TINY = readFileSync(join(import.meta.dirname, '../../../e2e/fixtures/hiking/tiny.gpx'), 'utf8');

/** scripts/hiking-tracks.ts's track for tiny.gpx (lib/hiking/track.ts toTrack, run 2026-11-20). */
const TINY_TRACK = {
  v: 1, len: 2288,
  pts: [[139, 35, 135], [139.0002, 35.0005, 139.8], [139, 35.001, 145], [139.0002, 35.0015, 149.9], [139, 35.002, 155], [139.0002, 35.0025, 159.9], [139, 35.003, 165], [139.0002, 35.0035, 169.9], [139, 35.004, 180.1], [139.0002, 35.0045, 189.9], [139, 35.005, 200.1], [139.0002, 35.0055, 209.9], [139, 35.006, 220.1], [139.0002, 35.0065, 229.9], [139, 35.007, 238.8], [139.0002, 35.0075, 245.9], [139, 35.008, 252.1], [139.0002, 35.0085, 256.6], [139, 35.009, 260.1], [139.0002, 35.0095, 261.9], [139, 35.01, 262.8], [139.0003, 35.0095, 261.9], [139.0003, 35, 135]],
  wpts: [{ lon: 139.0001, lat: 35.005, name: 'Bridge' }]
};

/** An invented zig-zag climb of `n` points (~2 m apart, with GPS-like jitter): no real place. */
function longTrack(n: number): TrackPt[] {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) - 0.5;
  return Array.from({ length: n }, (_, i) => ({ lat: 20 + i * 2e-5 + rnd() * 2e-5, lon: 150 + Math.sin(i / 200) * 0.01 + rnd() * 2e-5, ele: 100 + i * 0.1 + rnd() * 6 }));
}

describe('the track', () => {
  it('gives the build script’s track exactly (golden: tiny.gpx)', () => {
    expect(toTrack(TINY)).toEqual(TINY_TRACK);
    const { pts, wpts } = parseGpx(TINY);
    expect(trackOf(pts, wpts)).toEqual(TINY_TRACK);
  });

  it('smooths over a centred window, keeps the ends and refuses a line of one point', () => {
    expect(smooth([0, 0, 30, 0, 0], 3)).toEqual([0, 10, 10, 10, 0]);
    expect(simplify([{ lat: 0, lon: 0 }, { lat: 0, lon: 1e-6 }, { lat: 0, lon: 2e-6 }])).toEqual([0, 2]);
    expect(() => trackOf([{ lat: 0, lon: 0, ele: 0 }], [])).toThrow();
    expect(() => parseGpx('<trkpt lat="x" lon="1"/>')).toThrow();
    expect(fitTrack([{ lat: 0, lon: 0, ele: 0 }], [])).toBeNull();
  });

  it("reads single-quoted attributes, a route-only GPX's <rtept>s, and sums each segment on its own (a gap is no walk)", () => {
    const pt = (lat: number, q = '"') => `<trkpt lat=${q}${lat}${q} lon=${q}139${q}><ele>10</ele></trkpt>`;
    expect(parseGpx(`<gpx><trk><trkseg>${pt(35, "'")}${pt(35.001, "'")}</trkseg></trk></gpx>`).pts).toEqual([{ lat: 35, lon: 139, ele: 10 }, { lat: 35.001, lon: 139, ele: 10 }]);
    const rte = parseGpx(`<gpx><rte><name>plan</name><rtept lat="35" lon="139"/><rtept lat='35.01' lon='139'/></rte></gpx>`);
    expect(rte.pts.map((p) => p.lat)).toEqual([35, 35.01]);
    // two segments 1 km apart: 111 m + 111 m walked, not the 1 km between
    const two = parseGpx(`<gpx><trk><trkseg>${pt(35)}${pt(35.001)}</trkseg><trkseg>${pt(35.01)}${pt(35.011)}</trkseg></trk></gpx>`);
    expect(two.pts.map((p) => !!p.brk)).toEqual([false, false, true, false]);
    expect(trackOf(two.pts, []).len).toBe(222);
  });

  it('fits a long track under the cap by simplifying more; none at all when it never does', () => {
    const pts = longTrack(10_000);
    const t = fitTrack(pts, [])!;
    expect(JSON.stringify(t).length).toBeLessThanOrEqual(HIKE_TRK_CHARS);
    expect(t.pts.length).toBeLessThan(pts.length);
    // a long day's track (~40 km): fitted, at a coarser tolerance
    const day = Array.from({ length: 20_000 }, (_, i) => ({ lat: 35 + i * 1.8e-5, lon: 139 + Math.sin(i / 2) * 3e-4, ele: 500 + Math.sin(i / 300) * 300 }));
    expect(JSON.stringify(trackOf(day, [], 20)).length).toBeGreaterThan(HIKE_TRK_CHARS);
    expect(fitTrack(day, [])).not.toBeNull();
    // a jagged line no 80 m tolerance tames: every point a 100 m spike
    const spikes = Array.from({ length: 6000 }, (_, i) => ({ lat: i * 1e-4, lon: (i % 2) * 1e-3, ele: 0 }));
    expect(fitTrack(spikes, [])).toBeNull();
  });

  it('runs a 10,000-point track in a few ms (the relay’s budget)', () => {
    const pts = longTrack(10_000);
    trackOf(pts, []);
    const t0 = performance.now();
    for (let i = 0; i < 5; i++) fitTrack(pts, []);
    const ms = (performance.now() - t0) / 5;
    console.log(`fitTrack on 10k points: ${ms.toFixed(1)} ms`);
    expect(ms).toBeLessThan(200);
  });
});
