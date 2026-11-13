// The critters' shapes and their 3D moves (critterTypes.ts, critterMotion3d.ts: out of Critters.svelte).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bugLoc, fishLoc, loc, poolOf, seaPool, type Bug, type Fish } from './critterTypes.ts';
import { critterMotion3d } from './critterMotion3d.ts';
import { shadowLen } from '../../world/critters.ts';
import type { Line as MyLine } from '../../world/fishing.ts';

const fish = (o: Partial<Fish> = {}): Fish => ({
  n: 1, item: 'sea-bass', water: 'sea', pool: 'sea', size: 3, x: 100, z: 50, ms: 0, ax: 100, az: 50, flip: false, rot: 0,
  area: {} as Fish['area'], gone: false, dash: false, ...o
}) as Fish;
const bug = (o: Partial<Bug> = {}): Bug => ({
  n: 7, id: 'common-butterfly', flight: 'flutter', place: 'flower', x: 20, z: 30, lift: 10, ax: 20, az: 30, g: 0.5, ms: 0,
  flip: false, gone: false, sat: false, ...o
}) as Bug;

describe('the pools and the nodes’ offsets', () => {
  it('a sea shadow by its stretch of coast, a fresh water by its own name', () => {
    expect([seaPool(), seaPool(0), seaPool(2)]).toEqual(['sea', 'sea', 'sea2']);
    expect([poolOf('sea'), poolOf('sea', 3), poolOf('pond', 3), poolOf('river')]).toEqual(['sea', 'sea3', 'pond', 'river']);
  });
  it('offsets in local units: a flat node’s y is −z, an upright one’s −z × the ground − the lift', () => {
    expect(loc(1.234, -5)).toBe('calc(1.23 * var(--u)) calc(-5.00 * var(--u))');
    expect(fishLoc(fish({ x: 110, z: 60 }))).toBe(loc(10, -10));
    expect(bugLoc(bug({ x: 24, z: 34 }))).toBe(loc(4, -12));
  });
});

describe('the 3D moves', () => {
  afterEach(() => vi.restoreAllMocks());
  const motion = (line: MyLine | null = null) =>
    critterMotion3d({ line: () => line, nose: () => null, lineN: () => 0, relayNow: () => 0, snapshot: (v) => v });

  it('names each critter’s model, and a shadow’s 3D length is its size’s (a fin’s the model’s own)', () => {
    const m = motion();
    expect([m.fishId(fish({ water: 'pond', n: 4 })), m.bugId(bug())]).toEqual(['fish-pond-4', 'bug-7']);
    expect(m.len3(fish({ size: 3 }))).toBe(shadowLen(3, undefined));
    expect(m.len3(fish({ shape: 'fin' }))).toBe(64);
  });

  it('a still shadow’s nose half a body ahead of its middle, at the water’s depth; it holds its heading', () => {
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    const m = motion(), f = fish(), half = m.len3(f) / 2;
    const [x, z, lift] = [...m.fish3(f)];
    expect(lift).toBe(-2.5);
    // (heading left, unmirrored: yawOf(−1, 0))
    expect(Math.hypot(x - f.x, z - f.z)).toBeCloseTo(half, 0);
    const yaw = m.fishYaw(f);
    expect(m.fish3(f)[0]).toBeCloseTo(x, 5);
    expect(Math.abs(m.fishYaw(f) - yaw)).toBeLessThan(0.1); // (its slow wag only)
  });

  it('a bug glides from where it is to where it goes, and fades once it’s leaving, over its leave’s last 600 ms', () => {
    let t = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => t);
    const m = motion(), b = bug();
    expect([...m.bug3(b)]).toEqual([20, 30, 10]);
    m.mirrorBug(Object.assign(b, { x: 60, ms: 1000 }))();
    expect(m.bug3(b)[0]).toBe(20); // (the move starts from where it is, this frame)
    t = 1500;
    const mid = m.bug3(b)[0];
    expect(mid).toBeGreaterThan(20);
    expect(mid).toBeLessThan(60);
    t = 2000;
    expect(m.bug3(b)[0]).toBeCloseTo(60, 5);
    expect(m.bugOff(b)).toBe(false);
    m.mirrorBug(Object.assign(b, { gone: true, goneAt: 2100, ms: 1000 }))();
    t = 2400;
    expect(m.bugOff(b)).toBe(false);
    t = 2600;
    expect(m.bugOff(b)).toBe(true);
  });

  it('a netted bug holds still where it was seen', () => {
    let t = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => t);
    const m = motion(), b = bug();
    const at = [...m.bug3(b)];
    m.mirrorBug(Object.assign(b, { held: true, x: 90, ms: 300 }))();
    t = 2000;
    expect([...m.bug3(b)]).toEqual(at);
  });
});
