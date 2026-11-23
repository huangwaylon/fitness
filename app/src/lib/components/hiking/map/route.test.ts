import { describe, expect, it } from 'vitest';
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import { prepare } from '#lib/hiking/track.ts';
import { progressOf, splitAt, stepAt } from './route.ts';
import { buildStyle, ROUTE } from './style.ts';

const M = 111_320;

describe("the route's walked split", () => {
  it("one line, its colour stepped at the split's share of the drawn line (Web Mercator's: over a trail, the ground's)", () => {
    // 1 km north then 1 km east at 35° N: half the line each on the map too (Mercator is conformal), not half the degrees
    const k = M * Math.cos((35 * Math.PI) / 180);
    const p = prepare({ v: 1, len: 0, pts: [[139, 35, 0], [139, 35 + 1000 / M, 0], [139 + 1000 / k, 35 + 1000 / M, 0]], wpts: [] });
    const prog = progressOf(p);
    expect(prog[0]).toBe(0);
    expect(prog[2]).toBe(1);
    expect(prog[1]).toBeCloseTo(0.5, 3);
    expect(splitAt(p, prog, p.d[1])).toBeCloseTo(prog[1], 6);
    expect(splitAt(p, prog, p.d[1] / 2)).toBeCloseTo(prog[1] / 2, 6);
    expect([splitAt(p, prog, null), splitAt(p, prog, -5), splitAt(p, prog, p.total + 10)]).toEqual([0, 0, 1]);
    expect(stepAt(0.3, 'w', 'a')).toEqual(['step', ['line-progress'], 'w', 0.3, 'a']);
    expect(stepAt(0, 'w', 'a')).toEqual(['step', ['line-progress'], 'a', 1, 'a']);
  });

  it('the trail style is valid MapLibre: the route on one line-metrics source, the stale dot by a property', () => {
    for (const region of ['jp', 'us'] as const) expect(validateStyleMin(buildStyle(region)).map((e) => e.message)).toEqual([]);
    const s = buildStyle('jp');
    expect((s.sources.track as { lineMetrics?: boolean }).lineMetrics).toBe(true);
    expect(s.layers.map((l) => l.id)).not.toContain('walked');
    expect(ROUTE.walked).toBe('rgba(173,63,43,0.4)');
    // (with the app's font: the chosen saved place's name tag, every map's)
    const fonts = { 'Zen Maru Gothic Bold': [{ url: 'https://x.test/a.woff2', 'unicode-range': ['U+3040-309F'] }] };
    const named = buildStyle('jp', 18, 35, fonts);
    named.layers.push({ id: 'tag', type: 'symbol', source: 'marks', layout: { 'text-field': 'A', 'text-font': ['Zen Maru Gothic Bold'] } });
    expect(validateStyleMin(named).map((e) => e.message)).toEqual([]);
  });
});
