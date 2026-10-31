import { describe, expect, it } from 'vitest';
import { HYBRIDS, HYBRID_ODDS, MAX_WEEDS, hybridFor, rockTap, weedsAt } from './care.ts';
import { DIG_SPOTS, LAWN } from './beach.ts';
import { mulberry32 } from '#lib/random.ts';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const H = 3_600_000;

describe('weeds', () => {
  it('sprout every 30–60 minutes; the lawn holds the newest three, each on its own lawn spot', () => {
    expect(weedsAt('2026-11-04', 10 * 60_000)).toHaveLength(0); // just after midnight
    for (let d = 1; d <= 20; d++) {
      const w = weedsAt(`2026-06-${String(d).padStart(2, '0')}`, 14 * H);
      expect(w).toHaveLength(MAX_WEEDS);
      expect(new Set(w.map((x) => `${x.x},${x.y}`)).size).toBe(w.length);
      for (const x of w) expect(LAWN.some(([lx, ly]) => lx === x.x && ly === x.y)).toBe(true);
      const gaps = w.slice(1).map((x, i) => x.at - w[i].at);
      for (const g of gaps) expect(g).toBeGreaterThanOrEqual(30 * 60_000), expect(g).toBeLessThanOrEqual(60 * 60_000);
    }
    expect(weedsAt('2026-11-04', 14 * H)).toEqual(weedsAt('2026-11-04', 14 * H)); // both phones
  });
  it('never sprout on a dig spot that’s showing', () => {
    const taken = new Set(DIG_SPOTS.slice(0, 2).map(([x, y]) => `${x},${y}`));
    for (let h = 2; h < 24; h++) for (const w of weedsAt('2026-11-04', h * H, undefined, taken)) expect(taken.has(`${w.x},${w.y}`)).toBe(false);
  });
});

describe('hybrids', () => {
  const row = () => 'red-roses' as const;
  it('rarely (1 in 4) a watered cell shows a hybrid of its flower the next day; nothing without watering', () => {
    let n = 0;
    for (let d = 0; d < 400; d++) {
      const date = new Date(Date.UTC(2026, 0, 1) + d * 86_400_000).toISOString().slice(0, 10);
      expect(hybridFor(date, [], row)).toBeNull();
      const h = hybridFor(date, ['0-1', '1-2'], row);
      if (!h) continue;
      n++;
      expect(['0-1', '1-2']).toContain(h.cell);
      expect(HYBRIDS['red-roses']).toContain(h.flower);
    }
    expect(n / 400).toBeGreaterThan(HYBRID_ODDS - 0.07);
    expect(n / 400).toBeLessThan(HYBRID_ODDS + 0.07);
  });
  it('every hybrid has its official art', () => {
    for (const f of new Set(Object.values(HYBRIDS).flat()))
      expect(existsSync(join(import.meta.dirname, '../../../../static/art/flowers', `${f}.webp`)), f).toBe(true);
  });
});

describe('the rock', () => {
  it('a clonk; 1 in 4 a sparkle; 1 in 8 a bug crawls out', () => {
    const r = mulberry32(3);
    const n = { clonk: 0, sparkle: 0, bug: 0 };
    for (let i = 0; i < 8000; i++) n[rockTap(r)]++;
    expect(n.sparkle / 8000).toBeCloseTo(0.25, 1);
    expect(n.bug / 8000).toBeCloseTo(0.125, 1);
    expect(n.clonk).toBeGreaterThan(n.sparkle);
  });
});
