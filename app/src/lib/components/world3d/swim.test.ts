import { describe, expect, it } from 'vitest';
import { wetLift, type WaterAt } from './swim.ts';

// The sea (surface -0.3, seabed -7.5) for x < 0; the clifftop from x ≥ 0: ground 40, its stream's water 40.7.
const w: WaterAt = {
  waterY: (x) => (x < 0 ? -0.3 : 40.7),
  bedY: (x) => (x < 0 ? -7.5 : 40),
  heightOf: (x) => (x < 0 ? -7.5 : 40)
};
const y = (x: number, lift: number, wet?: { x: number; z: number }) => wetLift(w, x, 0, lift, wet) + w.heightOf(x, 0);

describe('wetLift', () => {
  it("a fish 2.5 under the sea, its nose (the node) over the clifftop: the sea's height, read at its middle", () => {
    expect(y(10, -2.5, { x: -14, z: 0 })).toBeCloseTo(-2.8);
    // (read at the nose: on the clifftop's stream bed, in the sky over the sea)
    expect(y(10, -2.5)).toBeGreaterThan(40);
  });
  it('the same height as its nose crosses the bank: no jump', () => {
    expect(y(-1, -2.5, { x: -20, z: 0 })).toBeCloseTo(y(1, -2.5, { x: -18, z: 0 }));
  });
  it('never under the bed (a shallow pond), never over the surface', () => {
    const pond: WaterAt = { waterY: () => 1.4, bedY: () => 0.3, heightOf: () => 0.7 };
    expect(wetLift(pond, 0, 0, -2.5) + 0.7).toBeCloseTo(0.4);
    expect(wetLift(pond, 0, 0, 0.2) + 0.7).toBeCloseTo(1.6);
  });
  it("no `wet`: the node's own water (a float)", () => {
    expect(y(-5, 0)).toBeCloseTo(-0.3);
  });
});
