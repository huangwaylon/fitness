// The procedural ambience beds (docs/design.md#ambience): each is a seamless, deterministic, bounded loop.
import { describe, expect, it } from 'vitest';
import { AMBIENT_IDS } from './ambient.ts';
import { RATE, renderBed } from './ambientSynth.ts';

describe('ambience beds', () => {
  for (const id of AMBIENT_IDS) {
    it(`${id}: a 12–40 s loop at a 0.7 peak, the same every time, with no jump where it wraps`, () => {
      const d = renderBed(id, 'spring');
      expect(d.length / RATE).toBeGreaterThanOrEqual(12);
      expect(d.length / RATE).toBeLessThanOrEqual(40);
      let peak = 0, mean = 0, finite = true;
      const steps = new Float32Array(d.length - 1);
      for (let i = 0; i < d.length; i++) {
        finite &&= Number.isFinite(d[i]);
        peak = Math.max(peak, Math.abs(d[i]));
        mean += d[i];
        if (i) steps[i - 1] = Math.abs(d[i] - d[i - 1]);
      }
      expect(finite).toBe(true);
      expect(peak).toBeCloseTo(0.7, 5);
      expect(Math.abs(mean / d.length)).toBeLessThan(1e-3);
      steps.sort();
      // the wrap is a step like any other in the bed
      expect(Math.abs(d[0] - d[d.length - 1])).toBeLessThanOrEqual(steps[Math.floor(steps.length * 0.999)]);
      expect(renderBed(id, 'spring').slice(0, 2000)).toEqual(d.slice(0, 2000));
    });
  }
  it('the birds differ by season', () => {
    expect(renderBed('birds', 'spring').slice(0, 40_000)).not.toEqual(renderBed('birds', 'winter').slice(0, 40_000));
  });
});
