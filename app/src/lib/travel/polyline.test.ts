import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { decodeLine, encodeLine } from './polyline.ts';
import { loadTrip } from './trips/index.ts';

describe('polyline', () => {
  it('encodes Google’s way and back to the same numbers', () => {
    // Google's own example (lat, lng order inside the string: [lon, lat] here)
    const line: [number, number][] = [[-120.2, 38.5], [-120.95, 40.7], [-126.453, 43.252]];
    expect(encodeLine(line)).toBe('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    expect(decodeLine(encodeLine(line))).toEqual(line);
    expect(decodeLine('')).toEqual([]);
  });

  it('refuses a point finer than five decimals', () => {
    expect(() => encodeLine([[127.123456, 26.1]])).toThrow(/finer than five decimals/);
  });

  it('a guide’s legs load as the source wrote them (vite.config.ts trip-lines)', async () => {
    const src = readFileSync(join(import.meta.dirname, 'trips/okinawa.ts'), 'utf8');
    const lines = [...src.matchAll(/\bline: (\[\[[-\d.,[\]]*\]\])/g)].map((m) => JSON.parse(m[1]) as [number, number][]);
    const trip = await loadTrip('okinawa');
    expect(lines.length).toBeGreaterThan(10);
    expect(trip.legs.map((l) => l.line)).toEqual(lines);
  });
});
