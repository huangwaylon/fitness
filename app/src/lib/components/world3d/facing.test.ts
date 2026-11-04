import { describe, expect, it } from 'vitest';
import { faceFloat, FACE_FLOAT_K, rodTarget, turn } from './facing.ts';

const deg = (r: number) => (r * 180) / Math.PI;
/** The heading in plan (world x/z) from a to b. */
const head = (ax: number, az: number, bx: number, bz: number) => Math.atan2(bx - ax, -(bz - az));
const off = (a: number, b: number) => Math.abs(deg(Math.atan2(Math.sin(a - b), Math.cos(a - b))));

describe('facing.ts: which way an angler faces and where its rod points', () => {
  it('standing, it faces its float square on from its rod hand', () => {
    for (const [fx, fz] of [[0, -120], [90, -40], [-150, 30], [10, 200]]) {
      const lx = -6, lz = 4, yaw = faceFloat(0, 0, fx, fz, lx, lz);
      // its hand at that heading (the body's frame turned by it), then the hand's heading to the float is the body's
      const c = Math.cos(yaw), s = Math.sin(yaw), hx = lx * c + lz * s, hz = -(-lx * s + lz * c);
      expect(off(head(hx, hz, fx, fz), yaw)).toBeLessThan(0.5);
    }
    // no hand offset: straight at it
    expect(off(faceFloat(10, 10, 10, -90), 0)).toBeLessThan(1e-9);
  });

  it('standing, its rod points at the float (three space: z the world’s −z)', () => {
    expect(rodTarget(false, 1, { x: 0, z: 0 }, { x: 30, z: -80 })).toEqual({ x: 30, z: 80 });
  });

  it('seated or lying, its rod points the way it faces, wherever the float is', () => {
    for (const yaw of [0, 0.7, -2]) for (const float of [{ x: 300, z: 0 }, { x: -50, z: -200 }]) {
      const hand = { x: 12, z: -7 }, at = rodTarget(true, yaw, hand, float);
      // three's: rotation.y = yaw faces (sin yaw, cos yaw)
      expect(off(Math.atan2(at.x - hand.x, at.z - hand.z), yaw)).toBeLessThan(1e-9);
    }
  });

  it('the turn to the float is smooth: partway after a frame, there in a moment, the short way round', () => {
    const one = turn(0, 2, 16, FACE_FLOAT_K);
    expect(one).toBeGreaterThan(0.1);
    expect(one).toBeLessThan(1);
    let y = 0;
    for (let t = 0; t < 400; t += 16) y = turn(y, 2, 16, FACE_FLOAT_K);
    expect(off(y, 2)).toBeLessThan(1);
    // from just under π to just over −π: the short way, past π
    expect(turn(3, -3, 16, FACE_FLOAT_K)).toBeGreaterThan(3);
  });
});
