import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { BLEND_MS, EYE_MARGIN, FOV, NEAR, PITCH_LIMIT, SETTLE_MS, START_PITCH, camAz, clampEye, clampPitch, firstPerson, headAnchor, lookPerPx, wrapAngle, type Rect } from './firstPerson.ts';
import { due } from '#lib/store/frameRate.ts';

const deg = (d: number) => (d * Math.PI) / 180;
/** Steps a first person at 30 a second for `ms` toward `eye`, the frames that moved. */
function run(fp: ReturnType<typeof firstPerson>, t0: number, ms: number, eye: Vector3) {
  let moved = 0;
  for (let t = t0 + 33; t <= t0 + ms; t += 33) if (fp.step(t, 33, eye)) moved++;
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
    fp.step(0, 16, eye);
    expect(fp.pitch).toBeCloseTo(START_PITCH);
    fp.look(100, 0, 390);
    // (smoothed: not there in one frame, there within a few)
    fp.step(33, 33, eye);
    expect(fp.yaw).toBeGreaterThan(0);
    expect(fp.yaw).toBeLessThan(100 * lookPerPx(390));
    run(fp, 33, 600, eye);
    expect(fp.yaw).toBeCloseTo(100 * lookPerPx(390), 4);
    fp.look(0, 5000, 390);
    run(fp, 700, 600, eye);
    expect(fp.pitch).toBeCloseTo(PITCH_LIMIT, 4);
    fp.look(0, -50000, 390);
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
  it('a walk never turns the head: round its corners the camera keeps its yaw and pitch; a drag on the way turns it', () => {
    const fp = firstPerson(), eye = new Vector3(0, 12, 0), cam = new PerspectiveCamera(32, 0.5, 40, 2000), v = new Vector3();
    fp.set(true, 0, deg(30), true);
    // a walk east, north, then back west (its way turning 90° twice), the eye following its head a step a frame
    const legs: [number, number][] = [[1, 0], [0, 1], [-1, 0]], bad: string[] = [];
    let t = 0, n = 0;
    const walk = (want: number) => {
      for (const [dx, dz] of legs)
        for (let i = 0; i < 30; i++, n++) {
          eye.x += dx * 0.5;
          eye.z += dz * 0.5;
          fp.step((t += 33), 33, eye);
          fp.apply(cam, 32, 40, eye);
          if (Math.abs(fp.yaw - want) > 1e-12 || Math.abs(fp.pitch - START_PITCH) > 1e-12) bad.push(`${n}: yaw ${fp.yaw} pitch ${fp.pitch}`);
          if (Math.abs(camAz(cam, v) - (want - Math.PI)) > 1e-6 && Math.abs(camAz(cam, v) - (want + Math.PI)) > 1e-6) bad.push(`${n}: az ${camAz(cam, v)}`);
        }
    };
    walk(deg(30));
    expect(bad).toEqual([]);
    // a drag mid-walk: the head goes where the finger took it, and stays there for the rest of the walk
    fp.look(-90, 0, 390);
    const turned = wrapAngle(deg(30) - 90 * lookPerPx(390));
    for (let i = 0; i < 30; i++) fp.step((t += 33), 33, eye);
    expect(fp.yaw).toBeCloseTo(turned, 6);
    walk(fp.yaw);
    expect(bad).toEqual([]);
    expect(fp.busy()).toBe(false);
  });
  it('the turn scales to the canvas: a drag across it all turns the lens’s 70°', () => {
    expect(390 * lookPerPx(390)).toBeCloseTo(deg(FOV));
    expect(1200 * lookPerPx(1200)).toBeCloseTo(deg(FOV));
    // (a sliver of a canvas turns no faster than a 240 px one)
    expect(lookPerPx(10)).toBeCloseTo(lookPerPx(240));
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
    fp.step(BLEND_MS / 2, 16, eye);
    expect(fp.mix).toBeCloseTo(0.5);
    expect(fp.inside()).toBe(false);
    fp.step(BLEND_MS, 16, eye);
    expect(fp.mix).toBe(1);
    expect(fp.inside()).toBe(true);
    fp.set(false, 1000, 0);
    expect(fp.inside()).toBe(false);
    fp.step(1000 + BLEND_MS, 16, eye);
    expect(fp.mix).toBe(0);
    const s = firstPerson();
    s.set(true, 0, 0, true);
    expect(s.mix).toBe(1);
  });
  it('the eye starts at the villager’s eyes, then follows them: across closely, its walk’s bob damped', () => {
    const fp = firstPerson(), to = new Vector3(10, 12, -4);
    fp.set(true, 0, 0, true);
    fp.step(0, 16, to);
    expect(fp.eye.toArray()).toEqual([10, 12, -4]);
    // one frame's step of a walk across and a bob up: the eye keeps up across far more than it bobs
    to.set(11, 13, -4);
    fp.step(33, 33, to);
    expect(fp.eye.x - 10).toBeGreaterThan(0.5);
    expect(fp.eye.y - 12).toBeLessThan(0.3);
    run(fp, 33, 1500, to);
    expect(fp.eye.distanceTo(to)).toBeLessThan(1e-3);
  });
  it('the camera at the eyes: where the head looks, the head’s lens, the near plane in close', () => {
    const fp = firstPerson(), cam = new PerspectiveCamera(32, 0.5, 40, 2000), eye = new Vector3(3, 12, 7), v = new Vector3();
    cam.position.set(0, 300, 300);
    fp.set(true, 0, deg(90), true);
    fp.step(0, 16, eye);
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
    fp.step(BLEND_MS / 2, 16, eye);
    fp.apply(cam, 32, 40, target);
    expect(cam.position.y).toBeGreaterThan(12);
    expect(cam.position.y).toBeLessThan(200);
    expect(cam.fov).toBeGreaterThan(32);
    expect(cam.fov).toBeLessThan(FOV);
    expect(cam.near).toBeLessThan(40);
    expect(cam.near).toBeGreaterThan(NEAR);
  });
});

describe('at rest the eyes draw nothing', () => {
  /** An engine's loop on a 120 Hz screen at `fps` for `ms`: my villager walks for `walkMs`, then stands; its head, as
   *  posed, bobs and sways with its idle every drawn frame (a mixer stepped when drawn). The frames drawn each second. */
  function loop(fps: number, ms: number, walkMs: number) {
    const fp = firstPerson(), anchor = headAnchor(), head = new Vector3(), per: number[] = [];
    fp.set(true, 0, 0, true);
    let wanted = true, last = 0;
    for (let t = 8; t <= ms; t += 1000 / 120) {
      if (!wanted || !due(t, last, fps)) continue;
      const dt = last ? t - last : 16;
      last = t;
      per[Math.floor(t / 1000)] = (per[Math.floor(t / 1000)] ?? 0) + 1;
      const walking = t < walkMs, x = Math.min(t, walkMs) * 0.02;
      const at = anchor(t, walking ? null : [x, 0, 0, 0], () => head.set(x + 0.4 * Math.sin(t / 700), 12 + 0.3 * Math.sin(t / 450), 0.2 * Math.cos(t / 900)));
      wanted = fp.step(t, dt, at) || walking;
    }
    return Array.from({ length: Math.ceil(ms / 1000) }, (_, i) => per[i] ?? 0);
  }
  it('walking it draws at the cap, never above; standing, once its head settles, not one frame (the idle never moves the eye)', () => {
    const bad: string[] = [];
    for (const fps of [30, 60]) {
      const per = loop(fps, 10_000, 2000);
      if (per.some((n) => n > fps)) bad.push(`${fps}: over the cap ${per}`);
      if (per[0] < fps - 2) bad.push(`${fps}: walking under the cap ${per}`);
      // (from a second after its settle: nothing)
      const from = Math.ceil((2000 + SETTLE_MS) / 1000) + 1;
      if (per.slice(from).some((n) => n > 0)) bad.push(`${fps}: at rest ${per}`);
    }
    expect(bad).toEqual([]);
  });
  it('the anchor follows the head while it moves or settles, then holds it; any move follows it again', () => {
    const a = headAnchor(), h = new Vector3();
    expect(a(0, null, () => h.set(1, 2, 3)).toArray()).toEqual([1, 2, 3]);
    expect(a(100, [5, 5, 0], () => h.set(4, 2, 3)).toArray()).toEqual([4, 2, 3]);
    expect(a(100 + SETTLE_MS - 1, [5, 5, 0], () => h.set(4, 2.5, 3)).toArray()).toEqual([4, 2.5, 3]);
    expect(a(100 + SETTLE_MS, [5, 5, 0], () => h.set(9, 9, 9)).toArray()).toEqual([4, 2.5, 3]);
    expect(a(5000, [5, 5, 0.2], () => h.set(4, 2, 4)).toArray()).toEqual([4, 2, 4]);
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
