import type { Box } from './geom.ts';
import { describe, expect, it } from 'vitest';
import {
  CELEBRATE_HOUR, MAX_R, MIN_R, burstPlan, burstSpot, celebrationDue, isMidnight, nextBurstMs, showAt, volley, type Shape
} from './fireworks.ts';
import { mulberry32 } from '#lib/random.ts';

describe("NH's fireworks schedule", () => {
  it('every Sunday in August, 19:00 to midnight', () => {
    // 2026-08-02 and 08-30 are Sundays (weekday 0)
    expect(showAt(8, 2, 0, 18)).toBeNull();
    expect(showAt(8, 2, 0, 19)).toBe('show');
    expect(showAt(8, 2, 0, 23)).toBe('show');
    expect(showAt(8, 3, 1, 0)).toBeNull(); // past midnight: Monday, over
    expect(showAt(8, 1, 6, 20)).toBeNull(); // a Saturday
    expect(showAt(7, 26, 0, 20)).toBeNull(); // a July Sunday
    expect(showAt(9, 6, 0, 20)).toBeNull(); // a September Sunday
  });
  it('New Year: the countdown from 23:00, the volley at midnight, the show until 01:00', () => {
    expect(showAt(12, 31, 4, 22)).toBeNull();
    expect(showAt(12, 31, 4, 23)).toBe('countdown'); // 23:59 still the countdown
    expect(isMidnight(12, 31, 23, 59)).toBe(false);
    expect(isMidnight(1, 1, 0, 0)).toBe(true); // 00:00: the volley
    expect(isMidnight(1, 1, 0, 1)).toBe(false);
    expect(showAt(1, 1, 5, 0)).toBe('show');
    expect(showAt(1, 1, 5, 1)).toBeNull();
    expect(showAt(12, 30, 3, 23)).toBeNull();
  });
  it('the show keeps them coming, the countdown is sparser; a volley is quick', () => {
    const r = mulberry32(3);
    for (let i = 0; i < 200; i++) {
      const s = nextBurstMs('show', r), c = nextBurstMs('countdown', r);
      expect(s).toBeGreaterThanOrEqual(2000), expect(s).toBeLessThanOrEqual(4500);
      expect(c).toBeGreaterThanOrEqual(6000), expect(c).toBeLessThanOrEqual(10_000);
      const v = volley(r);
      expect(v.length).toBeGreaterThanOrEqual(3), expect(v.length).toBeLessThanOrEqual(5);
      for (let k = 1; k < v.length; k++) expect(v[k] - v[k - 1]).toBeLessThanOrEqual(1200);
    }
    expect(volley(r, 8)).toHaveLength(8);
  });
});

describe('the celebration: both of us met all four goals', () => {
  it('at once from 18:00, else waits for 18:00; once a day per phone', () => {
    expect(celebrationDue(true, null, '2026-11-04', 12)).toBe(false); // daylight: waits
    expect(celebrationDue(true, null, '2026-11-04', CELEBRATE_HOUR)).toBe(true); // the evening
    expect(celebrationDue(true, null, '2026-11-04', 22)).toBe(true); // met after dark: at once
    expect(celebrationDue(true, '2026-11-04', '2026-11-04', 22)).toBe(false); // already shown today
    expect(celebrationDue(true, '2026-11-03', '2026-11-04', 20)).toBe(true); // yesterday's doesn't count
    expect(celebrationDue(false, null, '2026-11-04', 20)).toBe(false);
  });
});

describe('bursts', () => {
  it("NH's shapes, each with a few dozen sparks at most, inside its radius", () => {
    const seen = new Set<Shape>();
    const r = mulberry32(8);
    // (failures collected, one expect)
    const fails: string[] = [];
    for (let i = 0; i < 400; i++) {
      const b = burstPlan(r);
      seen.add(b.shape);
      if (!(b.sparks.length >= 14 && b.sparks.length <= 36)) fails.push(`burst ${i} (${b.shape}): ${b.sparks.length} sparks`);
      for (const s of b.sparks) if (!(Math.hypot(s.x, s.y) <= 1.3)) fails.push(`burst ${i} (${b.shape}): a spark at ${s.x},${s.y}`);
    }
    expect(fails.slice(0, 10)).toEqual([]);
    expect(seen).toEqual(new Set(['peony', 'ring', 'willow', 'heart', 'star', 'pattern']));
  });
  const sky: Box = { x0: 0, x1: 390, y0: 0, y1: 180 };
  const ribbon: Box = { x0: 95, x1: 295, y0: 60, y1: 120 };
  const overlaps = (s: { x: number; y: number; rad: number }, b: Box) =>
    s.x - s.rad < b.x1 && b.x0 < s.x + s.rad && s.y - s.rad < b.y1 && b.y0 < s.y + s.rad + 12;
  it('opens inside the sky and never over the UI, of every size, smaller where the room is small', () => {
    const r = mulberry32(5);
    const sizes = new Set<number>();
    // (failures collected, one expect)
    const fails: string[] = [];
    for (let i = 0; i < 300; i++) {
      const s = burstSpot(sky, [ribbon], r);
      if (!s) {
        fails.push(`spot ${i}: none`);
        continue;
      }
      const at = `spot ${i} at ${s.x},${s.y} r ${s.rad}`;
      if (overlaps(s, ribbon)) fails.push(`${at}: over the ribbon`);
      if (!(s.x - s.rad >= 0 && s.x + s.rad <= 390 && s.y - s.rad >= 0 && s.y + s.rad + 12 <= 180)) fails.push(`${at}: out of the sky`);
      if (!(s.rad <= MAX_R && s.rad >= MIN_R)) fails.push(`${at}: its size`);
      sizes.add(Math.round(s.rad / 10));
    }
    expect(fails.slice(0, 10)).toEqual([]);
    expect(sizes.size).toBeGreaterThan(3);
    // a short sky beside a wide HUD: only small ones, above or below it
    const tight = burstSpot({ x0: 0, x1: 320, y0: 0, y1: 150 }, [{ x0: 10, x1: 310, y0: 50, y1: 100 }], r)!;
    expect(tight.rad).toBeLessThan(25);
  });
  it('a tap opens one where it was tapped, if there is room there', () => {
    const r = mulberry32(6);
    const s = burstSpot(sky, [ribbon], r, { x: 45, y: 60 })!;
    expect(s).toMatchObject({ x: 45, y: 60 });
    expect(s.rad).toBeGreaterThanOrEqual(MIN_R);
    expect(burstSpot(sky, [ribbon], r, { x: 195, y: 50 })).toBeNull(); // right over the ribbon: no
    expect(burstSpot({ x0: 0, x1: 40, y0: 0, y1: 40 }, [], r)).toBeNull(); // no room
  });
});
