import type { Box } from './geom.ts';
import { describe, expect, it } from 'vitest';
import {
  BIG_ODDS, MAX_FRAGMENTS, STREAK_MS, WISH_MS, addWish, fragmentsDue, wishDays, inStarHours, nextShowerMs, showerPlan,
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
    // (failures collected, one expect: an expect a sample is ~28k calls)
    const fails: string[] = [];
    for (let i = 0; i < N; i++) {
      const p = showerPlan(r);
      if (p[0] !== 0) fails.push(`plan ${i}: starts at ${p[0]}`);
      if (!(p.length >= 1 && p.length <= 8)) fails.push(`plan ${i}: ${p.length} streaks`);
      if (p.length >= 5) big++;
      // one streak at a time
      for (let k = 1; k < p.length; k++) if (!(p[k] - p[k - 1] >= STREAK_MS)) fails.push(`plan ${i}: streak ${k} ${p[k] - p[k - 1]} ms after the last`);
    }
    expect(fails.slice(0, 10)).toEqual([]);
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
    // (failures collected, one expect: an expect a point is ~180k calls)
    const fails: string[] = [];
    for (let i = 0; i < 500; i++) {
      const s = streakPath(sky, [ribbon], r);
      if (!s) continue;
      n++;
      for (let d = 0; d <= s.len; d += 2) {
        const p = along(s, d), at = `streak ${i} at ${d}: (${p.x.toFixed(2)}, ${p.y.toFixed(2)})`;
        if (!(p.x >= sky.x0 - 0.01 && p.x <= sky.x1 + 0.01 && p.y >= sky.y0 - 0.01 && p.y <= sky.y1 + 0.01)) fails.push(`${at} out of the sky`);
        if (p.x > ribbon.x0 && p.x < ribbon.x1 && p.y > ribbon.y0 && p.y < ribbon.y1) fails.push(`${at} across the ribbon`);
      }
      if (!(s.angle > 90 && s.angle < 180)) fails.push(`streak ${i}: angle ${s.angle}`); // falling to the lower left
    }
    expect(fails.slice(0, 10)).toEqual([]);
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
    const at = (s: string) => wishDays(Date.parse(`${s}+09:00`), next);
    expect(at('2026-11-04T21:00')).toEqual({ day: '2026-11-04', morning: '2026-11-05' });
    expect(at('2026-11-04T23:00').morning).toBe('2026-11-05');
    expect(at('2026-11-05T02:00')).toEqual({ day: '2026-11-05', morning: '2026-11-05' });
    expect(at('2026-12-31T23:00').morning).toBe('2027-01-01');
  });
  it('a wish just after midnight is that night’s: its day and hour from the one instant', () => {
    expect(wishDays(Date.parse('2026-11-05T00:00:00.010+09:00'), next)).toEqual({ day: '2026-11-05', morning: '2026-11-05' });
    expect(wishDays(Date.parse('2026-11-05T04:59:59.999+09:00'), next).morning).toBe('2026-11-05');
    expect(wishDays(Date.parse('2026-11-05T05:00:00+09:00'), next).morning).toBe('2026-11-06');
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
