import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TRAILS } from '#lib/hiking/trails.ts';
import { nz } from '#lib/travel/trips/nz.ts';
import { okinawa } from '#lib/travel/trips/okinawa.ts';
import { OFM_MAX_BYTES, OFM_MAX_TILES, TOTAL_CAP_BYTES, overCaps, planTrail, planTrip, tileX, tileY, type Plan } from './plan.ts';

/** Every tile of every area fetched once (scripts/offline-measure.ts --full at the `probes` tag, 2026-11-07): [tiles, bytes]. A trip or a
 *  track edited since keeps within its bound by its area's DENSITY. */
const MEASURED: Record<string, [number, number]> = {
  'trip-nz': [438, 20_442_800], 'trip-okinawa': [310, 7_597_431],
  'trail-lake-22': [125, 2_206_614], 'trail-snow-lake': [134, 2_421_344], 'trail-lake-valhalla': [123, 1_998_157],
  'trail-talapus-lake': [91, 1_567_082], 'trail-mount-pilchuck': [113, 1_913_170], 'trail-bridal-veil': [139, 2_552_136],
  'trail-skyline-loop': [145, 3_141_644], 'trail-enchantments': [519, 8_767_042], 'trail-fuji-yoshida': [144, 4_410_225],
  'trail-kinpu-odarumi': [102, 3_339_914]
};

const track = (slug: string) => (JSON.parse(readFileSync(join(import.meta.dirname, '../../../static/hiking/tracks', `${slug}.json`), 'utf8')) as { pts: number[][] }).pts;
const plans: Plan[] = [planTrip(nz), planTrip(okinawa), ...TRAILS.map((t) => planTrail(t.slug, t.tiles, track(t.slug)))];
const zooms = (p: Plan) => Object.keys(p.byZoom).map(Number);

describe('saved areas: the plans', () => {
  it('every area estimates within ±20 % of its measured bytes', () => {
    for (const p of plans) {
      const [, bytes] = MEASURED[p.id];
      expect(Math.abs(p.bytes / bytes - 1), p.id).toBeLessThan(0.2);
    }
  });

  it('the raster trails within ±20 % on the means alone (no area factor)', () => {
    for (const p of plans.filter((x) => x.source !== 'ofm')) expect(Math.abs(p.bytes / MEASURED[p.id][1] - 1), p.id).toBeLessThan(0.2);
  });

  it("the trips' zooms 5–14 and the trails' 12–16, by source", () => {
    expect(plans.map((p) => p.source)).toEqual(['ofm', 'ofm', ...TRAILS.map((t) => (t.tiles === 'us' ? 'usgs' : 'gsi'))]);
    for (const p of plans) expect(zooms(p), p.id).toEqual(p.source === 'ofm' ? [5, 6, 7, 8, 9, 10, 11, 12, 13, 14] : [12, 13, 14, 15, 16]);
  });

  it('each tile once', () => {
    for (const p of plans) expect(new Set(p.tiles).size, p.id).toBe(p.tiles.length);
  });

  it("within OpenFreeMap's asks per area, and all of them within the 150 MB", () => {
    for (const p of plans) expect(overCaps(p), p.id).toBeNull();
    expect(plans.reduce((s, p) => s + p.bytes, 0)).toBeLessThan(TOTAL_CAP_BYTES);
    const big = { ...plans[0], tiles: Array.from({ length: OFM_MAX_TILES + 1 }, (_, i) => `14/${i}/0`) };
    expect(overCaps(big)).toBe('tiles');
    expect(overCaps({ ...plans[0], bytes: OFM_MAX_BYTES + 1 })).toBe('bytes');
    expect(overCaps({ ...plans[2], tiles: big.tiles })).toBeNull();
  });

  it("z13–14 only near a place, z10–12 along the legs, z5–9 over the trip's box", () => {
    const p = planTrip(okinawa);
    const has = (z: number, lon: number, lat: number) => p.tiles.includes(`${z}/${tileX(lon, z)}/${tileY(lat, z)}`);
    const stop = okinawa.places[0];
    expect(has(14, stop.lon, stop.lat)).toBe(true);
    // 5 km out to sea from the box's east edge: z9 (the box) yes if inside it, z14 no
    expect(has(14, okinawa.bbox[2] - 0.001, okinawa.bbox[1] + 0.001)).toBe(false);
    expect(has(9, okinawa.bbox[2] - 0.001, okinawa.bbox[1] + 0.001)).toBe(true);
    const leg = okinawa.legs[0].line[Math.floor(okinawa.legs[0].line.length / 2)];
    expect(has(12, leg[0], leg[1])).toBe(true);
  });

  it("a trail's tiles: within 1 km of the track at z16, not 3 km off", () => {
    const pts = track('lake-22');
    const p = planTrail('lake-22', 'us', pts);
    const [lon, lat] = pts[0];
    expect(p.tiles).toContain(`16/${tileX(lon, 16)}/${tileY(lat, 16)}`);
    const off = lat + 3 / 111; // 3 km north of the trailhead
    expect(p.tiles).not.toContain(`16/${tileX(lon, 16)}/${tileY(off, 16)}`);
    expect(p.tiles).toContain(`12/${tileX(lon, 12)}/${tileY(lat, 12)}`);
  });
});
