import { describe, expect, it } from 'vitest';
import { SPEED } from '#lib/world/speed.ts';
import { PACE } from './view.ts';
import { strideOf } from '../villager3d/poses.ts';
import { VILLAGER_S } from '../villager3d/villager3d.ts';

// the user, 2026-11-04: "Increase the walk speed of players by 50%" (from the island's run 200 u/s and brisk 240, the
// rooms' 30 model units a second); the strolls stay as they were
describe("a player's walk, half as fast again", () => {
  it('on the island, in the tent and in the museum', () => {
    expect(SPEED.run).toBe(200 * 1.5);
    expect(SPEED.action).toBe(240 * 1.5);
    // (the tent's and the museum's one pace)
    expect(PACE).toBe(30 * 1.5);
    expect(SPEED.wander).toBe(90);
  });

  it('its steps reach further at the run, so the feet keep up without a frantic cadence (gait.test.ts: planted)', () => {
    expect(strideOf(SPEED.run)).toBeGreaterThan(strideOf(200));
    const cycles = SPEED.run / (strideOf(SPEED.run) * VILLAGER_S);
    expect(cycles).toBeGreaterThan(3.7);
    expect(cycles).toBeLessThan(5);
  });
});
