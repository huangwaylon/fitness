import { describe, expect, it } from 'vitest';
import { anchorsOf, shapeOf } from './seats3d.ts';
import { sitOn, type Body } from './poses.ts';

const body: Body = { thigh: 1.6, shin: 1.4, hip: 3.4 };

describe('seats3d: the seats and beds from the models', () => {
  it('has a seat for every chair the tent can hold, and the island’s seats', () => {
    for (const k of ['f4039', 'f4044', 'f4038', 'f1792']) expect(shapeOf('tent', k)?.k).toBe('s');
    for (const k of ['f4081', 'f4041', 'f1434', 'f3230', 'f1620']) expect(shapeOf('tent', k)?.k).toBe('l');
    for (const k of ['park-bench', 'log-bench', 'log-stool']) expect(shapeOf('island', k)?.k).toBe('s');
    expect(shapeOf('island', 'hammock')).toMatchObject({ k: 'l', sway: 1 });
    // the gym's: the weight bench lain on to press, the rest used in place
    expect(shapeOf('island', 'weight-bench')).toMatchObject({ k: 'l', use: 'press' });
    for (const [k, use] of [['exercise-bike', 'pedal'], ['treadmill', 'run'], ['punching-bag', 'punch'], ['exercise-ball', 'bounce'], ['pullup', 'pullup']]) expect(shapeOf('island', k), k).toMatchObject({ k: 'u', use });
  });

  it('a gym piece used in place: its spot turned with the piece, facing its own way, stood on or sat on', () => {
    const [run] = anchorsOf(shapeOf('island', 'treadmill'), { x: 0, z: 0, y: 2, yaw: 0, s: 3 });
    // on the belt, facing its console (−x), its feet's anchor
    expect(run).toMatchObject({ use: 'run', stand: true, lie: false });
    expect(run.y).toBeCloseTo(2 + 1.2 * 3);
    expect(Math.sin(run.yaw)).toBeCloseTo(-1);
    const [bike] = anchorsOf(shapeOf('island', 'exercise-bike'), { x: 0, z: 0, y: 0, yaw: Math.PI / 2, s: 3 });
    expect(bike).toMatchObject({ use: 'pedal', stand: false });
    // turned a quarter: it faces the console's way turned with it (−x → +z)
    expect(Math.cos(bike.yaw)).toBeCloseTo(1);
  });

  it('a sofa or a bench seats two side by side, a double bed sleeps two; a chair has its back, a stool none', () => {
    const at = { x: 0, z: 0, y: 0, yaw: 0, s: 1 };
    const [l, r] = anchorsOf(shapeOf('tent', 'f4044'), at);
    expect(r.x - l.x).toBeGreaterThan(5);
    expect(anchorsOf(shapeOf('tent', 'f4041'), at)).toHaveLength(2);
    expect(anchorsOf(shapeOf('tent', 'f4039'), at)[0].back).toBeGreaterThan(2);
    expect(anchorsOf(shapeOf('tent', 'f4038'), at)[0].back).toBe(0);
  });

  it('turned and scaled with its piece: the seat in front of a turned chair, the step up in front of it', () => {
    const [a] = anchorsOf(shapeOf('tent', 'f4039'), { x: 10, z: 20, y: 0, yaw: Math.PI / 2, s: 1 });
    expect(a.yaw).toBeCloseTo(Math.PI / 2);
    // facing +x: its step up is to the +x of the seat
    expect(a.from[0]).toBeGreaterThan(a.x + 3);
    expect(Math.abs(a.from[1] - a.z)).toBeLessThan(0.5);
    const [b] = anchorsOf(shapeOf('island', 'park-bench'), { x: 0, z: 0, y: 5, yaw: 0, s: 3 });
    expect(b.y).toBeCloseTo(5 + shapeOf('island', 'park-bench')!.y * 3);
  });

  it('a cot is lain along its length, its head on the pillow end', () => {
    const [a] = anchorsOf(shapeOf('tent', 'f4081'), { x: 0, z: 0, y: 0, yaw: 0, s: 1 });
    expect(a.lie).toBe(true);
    expect(a.len).toBeGreaterThan(14);
    // the head at −x, the feet toward +x
    expect(a.x).toBeLessThan(-6);
    expect(Math.sin(a.yaw)).toBeCloseTo(1);
  });

  it('sitting: feet dangle off a high seat, knees come up on a low one', () => {
    const high = sitOn(0, body, 3, true), low = sitOn(0, body, 0.6, false);
    expect(high.j.Leg_1_L![0]).toBeCloseTo(-1.5, 1);
    expect(low.j.Leg_1_L![0]).toBeLessThan(-2);
    expect(high.y).toBe(0);
  });
});
