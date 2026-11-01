import type { Box } from './geom.ts';
import { describe, expect, it } from 'vitest';
import {
  BIG_ODDS, MAX_FRAGMENTS, STREAK_MS, WISH_MS, addWish, fragmentDay, fragmentsDue, inStarHours, nextShowerMs, showerPlan,
  streakPath, type Streak
} from './stars.ts';
import { addDays } from '#lib/time/dates.ts';
import { mulberry32 } from '#lib/random.ts';

const next = (d: string) => addDays(d, 1);

describe('showers of shooting stars (NH: clear nights, 7 pm – 4 am)', () => {
  it('only in the star hours', () => {
    expect(inStarHours(18)).toBe(false);
    expect(inStarHours(19)).toBe(true);
    expect(inStarHours(0)).toBe(true);
    expect(inStarHours(3)).toBe(true);
    expect(inStarHours(4)).toBe(false);
    expect(inStarHours(12)).toBe(false);
  });
  it('a shower every 3–8 minutes, the first within 30–90 s of the night sky', () => {
    const r = mulberry32(4);
    for (let i = 0; i < 200; i++) {
      const g = nextShowerMs(r), f = nextShowerMs(r, true);
      expect(g).toBeGreaterThanOrEqual(180_000), expect(g).toBeLessThanOrEqual(480_000);
      expect(f).toBeGreaterThanOrEqual(30_000), expect(f).toBeLessThanOrEqual(90_000);
    }
  });
  it('1–3 streaks a shower, a second or three apart; 1 in 6 a big one of 5–8 in quick succession', () => {
    const r = mulberry32(9);
    let big = 0;
    const N = 6000;
    for (let i = 0; i < N; i++) {
      const p = showerPlan(r);
      expect(p[0]).toBe(0);
      expect(p.length).toBeGreaterThanOrEqual(1), expect(p.length).toBeLessThanOrEqual(8);
      if (p.length >= 5) big++;
      for (let k = 1; k < p.length; k++) expect(p[k] - p[k - 1]).toBeGreaterThanOrEqual(STREAK_MS); // one streak at a time
    }
    expect(big / N).toBeGreaterThan(1 / BIG_ODDS - 0.03);
    expect(big / N).toBeLessThan(1 / BIG_ODDS + 0.03);
    expect(WISH_MS).toBeGreaterThan(STREAK_MS);
  });
});

describe('a streak keeps to the sky and off the UI', () => {
  const sky: Box = { x0: 8, x1: 382, y0: -200, y1: -14 };
  const ribbon: Box = { x0: 100, x1: 290, y0: -130, y1: -70 };
  const along = (s: Streak, d: number) => ({ x: s.x + Math.cos((s.angle * Math.PI) / 180) * d, y: s.y + Math.sin((s.angle * Math.PI) / 180) * d });
  it('its whole path inside the sky, never across the ribbon', () => {
    const r = mulberry32(1);
    let n = 0;
    for (let i = 0; i < 500; i++) {
      const s = streakPath(sky, [ribbon], r);
      if (!s) continue;
      n++;
      for (let d = 0; d <= s.len; d += 2) {
        const p = along(s, d);
        expect(p.x).toBeGreaterThanOrEqual(sky.x0 - 0.01), expect(p.x).toBeLessThanOrEqual(sky.x1 + 0.01);
        expect(p.y).toBeGreaterThanOrEqual(sky.y0 - 0.01), expect(p.y).toBeLessThanOrEqual(sky.y1 + 0.01);
        expect(p.x > ribbon.x0 && p.x < ribbon.x1 && p.y > ribbon.y0 && p.y < ribbon.y1).toBe(false);
      }
      expect(s.angle).toBeGreaterThan(90), expect(s.angle).toBeLessThan(180); // falling to the lower left
    }
    expect(n).toBeGreaterThan(400); // there's usually room
  });
  it('a short sky beside a wide HUD: a shorter, flatter streak in the lane above or below it', () => {
    const r = mulberry32(3);
    const short: Box = { x0: 0, x1: 390, y0: 6, y1: 170 }, hud: Box = { x0: 36, x1: 370, y0: 70, y1: 154 };
    let n = 0;
    for (let i = 0; i < 200; i++) {
      const s = streakPath(short, [hud], r);
      if (!s) continue;
      n++;
      expect(s.len).toBeGreaterThanOrEqual(150 * 0.6 - 0.01);
    }
    expect(n).toBeGreaterThan(150);
  });
  it('no room, no streak', () => {
    expect(streakPath(sky, [{ x0: -1000, x1: 1000, y0: -1000, y1: 1000 }], mulberry32(2))).toBeNull();
  });
});

describe('wishes → star fragments, across the day boundary', () => {
  it('a wish after dusk brings its fragment the next morning, one before dawn that morning', () => {
    expect(fragmentDay('2026-11-04', 21, next)).toBe('2026-11-05');
    expect(fragmentDay('2026-11-04', 23, next)).toBe('2026-11-05');
    expect(fragmentDay('2026-11-05', 2, next)).toBe('2026-11-05');
    expect(fragmentDay('2026-12-31', 23, next)).toBe('2027-01-01');
  });
  it('one fragment per wish, from 5:00 that morning only, capped at the beach’s room', () => {
    let w = addWish({}, '2026-11-05', '2026-11-04'); // 21:00 on the 4th
    w = addWish(w, '2026-11-05', '2026-11-04'); // 23:30
    w = addWish(w, '2026-11-05', '2026-11-05'); // 01:10 on the 5th: the same night, the same morning
    expect(w).toEqual({ '2026-11-05': 3 });
    expect(fragmentsDue(w, '2026-11-04', 23)).toBe(0); // not the night of the wish
    expect(fragmentsDue(w, '2026-11-05', 4)).toBe(0); // not before dawn
    expect(fragmentsDue(w, '2026-11-05', 5)).toBe(3);
    expect(fragmentsDue(w, '2026-11-05', 22)).toBe(3); // all day
    expect(fragmentsDue(w, '2026-11-06', 9)).toBe(0); // gone the next day
    let many = {};
    for (let i = 0; i < 20; i++) many = addWish(many, '2026-11-05', '2026-11-04');
    expect(fragmentsDue(many, '2026-11-05', 9)).toBe(MAX_FRAGMENTS);
  });
  it("tonight's wishes don't sweep this morning's fragments away; older mornings are dropped", () => {
    let w = addWish({}, '2026-11-05', '2026-11-04');
    w = addWish(w, '2026-11-06', '2026-11-05'); // the next night
    expect(w).toEqual({ '2026-11-05': 1, '2026-11-06': 1 });
    expect(fragmentsDue(w, '2026-11-05', 20)).toBe(1);
    w = addWish(w, '2026-11-08', '2026-11-07');
    expect(w).toEqual({ '2026-11-08': 1 });
  });
});
