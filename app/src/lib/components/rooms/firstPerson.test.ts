import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { BLEND_MS, EYE_MARGIN, FOV, LOOK_PER_PX, NEAR, PITCH_LIMIT, START_PITCH, camAz, clampEye, clampPitch, firstPerson, type Rect } from './firstPerson.ts';
import { SLOP, TAP_MS, isDrag, isTap } from './gesture.ts';

const deg = (d: number) => (d * Math.PI) / 180;
/** Steps a first person at 30 a second for `ms` toward `eye` (heading: a walk's), the frames that moved. */
function run(fp: ReturnType<typeof firstPerson>, t0: number, ms: number, eye: Vector3, heading: number | null = null) {
  let moved = 0;
  for (let t = t0 + 33; t <= t0 + ms; t += 33) if (fp.step(t, 33, eye, heading)) moved++;
  return moved;
}

describe('the head: yaw and pitch', () => {
  it('pitch is clamped at about ±60°', () => {
    expect(PITCH_LIMIT).toBeCloseTo(deg(60));
    expect(clampPitch(deg(80))).toBeCloseTo(deg(60));
    expect(clampPitch(deg(-75))).toBeCloseTo(deg(-60));
    expect(clampPitch(deg(20))).toBeCloseTo(deg(20));
  });
  it('a drag turns the head (the world follows the finger: right turns left, down looks up), smoothed, clamped', () => {
    const fp = firstPerson(), eye = new Vector3(0, 12, 0);
    fp.set(true, 0, 0, true);
    fp.step(0, 16, eye, null);
    expect(fp.pitch).toBeCloseTo(START_PITCH);
    fp.look(100, 0);
    // (smoothed: not there in one frame, there within a few)
    fp.step(33, 33, eye, null);
    expect(fp.yaw).toBeGreaterThan(0);
    expect(fp.yaw).toBeLessThan(100 * LOOK_PER_PX);
    run(fp, 33, 600, eye);
    expect(fp.yaw).toBeCloseTo(100 * LOOK_PER_PX, 4);
    fp.look(0, 5000);
    run(fp, 700, 600, eye);
    expect(fp.pitch).toBeCloseTo(PITCH_LIMIT, 4);
    fp.look(0, -50000);
    run(fp, 1400, 600, eye);
    expect(fp.pitch).toBeCloseTo(-PITCH_LIMIT, 4);
  });
  it('at rest it asks for no frames', () => {
    const fp = firstPerson(), eye = new Vector3(5, 12, 5);
    fp.set(true, 0, 1, true);
    run(fp, 0, 300, eye);
    expect(fp.busy()).toBe(false);
    expect(run(fp, 300, 300, eye)).toBe(0);
  });
  it('the view turns with a walk (toward its heading), not while a finger holds it', () => {
    const fp = firstPerson(), eye = new Vector3();
    fp.set(true, 0, 0, true);
    fp.hold(true);
    run(fp, 0, 500, eye, deg(90));
    expect(fp.yaw).toBeCloseTo(0, 4);
    fp.hold(false);
    run(fp, 500, 3000, eye, deg(90));
    expect(fp.yaw).toBeCloseTo(deg(90), 1);
    // (the shorter way round: from 170° to −170° is 20°, not 340°)
    const b = firstPerson();
    b.set(true, 0, deg(170), true);
    b.step(33, 33, eye, deg(-170));
    expect(Math.abs(b.yaw)).toBeGreaterThan(deg(170));
  });
  it('turned on, it looks where the villager faces, a little down', () => {
    const fp = firstPerson();
    fp.set(true, 0, deg(45));
    expect(fp.yaw).toBeCloseTo(deg(45));
    expect(fp.pitch).toBeCloseTo(START_PITCH);
  });
});

describe('the glide and the eye', () => {
  it('glides in over BLEND_MS (inside only at the end), out the same; snap is at once', () => {
    const fp = firstPerson(), eye = new Vector3(0, 12, 0);
    fp.set(true, 0, 0);
    expect(fp.mix).toBe(0);
    fp.step(BLEND_MS / 2, 16, eye, null);
    expect(fp.mix).toBeCloseTo(0.5);
    expect(fp.inside()).toBe(false);
    fp.step(BLEND_MS, 16, eye, null);
    expect(fp.mix).toBe(1);
    expect(fp.inside()).toBe(true);
    fp.set(false, 1000, 0);
    expect(fp.inside()).toBe(false);
    fp.step(1000 + BLEND_MS, 16, eye, null);
    expect(fp.mix).toBe(0);
    const s = firstPerson();
    s.set(true, 0, 0, true);
    expect(s.mix).toBe(1);
  });
  it('the eye starts at the villager’s eyes, then follows them: across closely, its walk’s bob damped', () => {
    const fp = firstPerson(), to = new Vector3(10, 12, -4);
    fp.set(true, 0, 0, true);
    fp.step(0, 16, to, null);
    expect(fp.eye.toArray()).toEqual([10, 12, -4]);
    // one frame's step of a walk across and a bob up: the eye keeps up across far more than it bobs
    to.set(11, 13, -4);
    fp.step(33, 33, to, null);
    expect(fp.eye.x - 10).toBeGreaterThan(0.5);
    expect(fp.eye.y - 12).toBeLessThan(0.3);
    run(fp, 33, 1500, to);
    expect(fp.eye.distanceTo(to)).toBeLessThan(1e-3);
  });
  it('the camera at the eyes: where the head looks, the head’s lens, the near plane in close', () => {
    const fp = firstPerson(), cam = new PerspectiveCamera(32, 0.5, 40, 2000), eye = new Vector3(3, 12, 7), v = new Vector3();
    cam.position.set(0, 300, 300);
    fp.set(true, 0, deg(90), true);
    fp.step(0, 16, eye, null);
    fp.apply(cam, 32, 40, new Vector3());
    expect(cam.position.toArray()).toEqual([3, 12, 7]);
    expect(cam.fov).toBe(FOV);
    expect(cam.near).toBe(NEAR);
    cam.getWorldDirection(v);
    // (yaw 90°: +x; a little down)
    expect(v.x).toBeCloseTo(Math.cos(START_PITCH), 4);
    expect(v.y).toBeCloseTo(Math.sin(START_PITCH), 4);
    expect(v.z).toBeCloseTo(0, 4);
    // the rooms' az for what turns to face the camera: it looks along −(sin az, cos az)
    expect(camAz(cam, v)).toBeCloseTo(deg(-90), 4);
  });
  it('off, the room’s camera is the room’s; halfway, between, still looking into the room', () => {
    const fp = firstPerson(), cam = new PerspectiveCamera(32, 0.5, 40, 2000), target = new Vector3(0, 0, 0), eye = new Vector3(0, 12, 30);
    cam.position.set(0, 200, 200);
    cam.lookAt(target);
    fp.apply(cam, 32, 40, target);
    expect(cam.position.toArray()).toEqual([0, 200, 200]);
    expect([cam.fov, cam.near]).toEqual([32, 40]);
    fp.set(true, 0, Math.PI);
    fp.step(BLEND_MS / 2, 16, eye, null);
    fp.apply(cam, 32, 40, target);
    expect(cam.position.y).toBeGreaterThan(12);
    expect(cam.position.y).toBeLessThan(200);
    expect(cam.fov).toBeGreaterThan(32);
    expect(cam.fov).toBeLessThan(FOV);
    expect(cam.near).toBeLessThan(40);
    expect(cam.near).toBeGreaterThan(NEAR);
  });
});

describe('the eye kept off the walls and what stands tall', () => {
  const room: Rect[] = [{ x0: -40, x1: 40, z0: -40, z1: 40 }];
  const out: [number, number] = [0, 0];
  it('inside the room, a margin off each wall (pulled in near one)', () => {
    expect(clampEye(0, 0, room, [], EYE_MARGIN, out)).toEqual([0, 0]);
    expect(clampEye(39, -39.5, room, [], EYE_MARGIN, out)).toEqual([40 - EYE_MARGIN, -40 + EYE_MARGIN]);
    expect(clampEye(80, 0, room, [], EYE_MARGIN, out)).toEqual([40 - EYE_MARGIN, 0]);
  });
  it('out of a tall piece by its nearest side, never into a wall', () => {
    const wardrobe: Rect = { x0: 0, x1: 20, z0: 0, z1: 10 };
    expect(clampEye(10, 1, room, [wardrobe], EYE_MARGIN, out)).toEqual([10, -EYE_MARGIN]);
    expect(clampEye(21, 5, room, [wardrobe], EYE_MARGIN, out)).toEqual([20 + EYE_MARGIN, 5]);
    // a piece against the wall: pushed out the room's side, not through the wall
    const byWall: Rect = { x0: 30, x1: 40, z0: -10, z1: 10 };
    const [x, z] = clampEye(39, 9, room, [byWall], EYE_MARGIN, out);
    expect(x).toBeLessThanOrEqual(40 - EYE_MARGIN);
    expect(x <= 30 - EYE_MARGIN || z >= 10 + EYE_MARGIN).toBe(true);
  });
  it('rooms joined by an opening: through it, but off its jambs', () => {
    const rooms: Rect[] = [{ x0: -60, x1: 60, z0: -50, z1: 70 }, { x0: 60, x1: 300, z0: -100, z1: 100 }, { x0: 50, x1: 70, z0: -5, z1: 25 }];
    expect(clampEye(60, 10, rooms, [], EYE_MARGIN, out)).toEqual([60, 10]);
    // in the wall beside the opening: back into the nearest room
    const [x, z] = clampEye(60, -20, rooms, [], EYE_MARGIN, out);
    expect(Math.abs(x - 60) >= EYE_MARGIN || (z >= -5 + EYE_MARGIN && z <= 25 - EYE_MARGIN)).toBe(true);
  });
});

describe('a tap or a drag', () => {
  it('a finger that stays within the slop and lifts soon is a tap; past the slop a drag', () => {
    expect(isTap(3, 4, 120)).toBe(true);
    expect(isTap(SLOP, 0, 120)).toBe(true);
    expect(isDrag(SLOP + 1, 0)).toBe(true);
    expect(isTap(SLOP + 1, 0, 120)).toBe(false);
    expect(isTap(0, 0, TAP_MS)).toBe(false);
  });
});
