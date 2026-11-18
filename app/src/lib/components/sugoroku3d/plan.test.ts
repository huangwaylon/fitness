import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Quaternion, Vector3 } from 'three';
import { BOARD, FORK, GOAL, H, W, pathOf } from '#lib/sugoroku/board.ts';
import { DIE_FACES, FOV, HOP_H, ROLL_MS, TOP_RAY_MIN, bridges, cameraFor, forkAim, hopAt, hopsOf, normalOf, restOf, riverY, slotOf, stoneAt, toWorld, topFace, topOf, topRayOf, tumbleAt, visibleOf } from './plan.ts';

describe('plan → world', () => {
  it('centres the plan on x and runs the route away from the camera (−Z)', () => {
    expect(toWorld(W / 2, H / 2)).toEqual([0, 0]);
    expect(toWorld(0, 0)).toEqual([-W / 2, H / 2]);
    expect(toWorld(W, H)).toEqual([W / 2, -H / 2]);
    // ふりだし nearest the camera, あがり farthest
    expect(stoneAt(0)[1]).toBeGreaterThan(stoneAt(GOAL)[1]);
    for (const sp of BOARD) for (const j of sp.next) expect(stoneAt(j)[1]).toBeLessThan(stoneAt(BOARD.indexOf(sp))[1] + 80);
  });
  it('keeps a stone apart from every other', () => {
    for (let i = 0; i < BOARD.length; i++) for (let j = i + 1; j < BOARD.length; j++) {
      const [ax, az] = stoneAt(i), [bx, bz] = stoneAt(j);
      expect(Math.hypot(ax - bx, az - bz), `${i}–${j}`).toBeGreaterThan(30);
    }
  });
});

describe('the walk', () => {
  it('follows the fork either way, every hop along a link', () => {
    const before = FORK - 2;
    for (const branch of [0, 1]) {
      const end = BOARD.findIndex((s, i) => i > FORK && s.area === 'shop');
      const path = pathOf(before, end, branch);
      const hops = hopsOf(before, path);
      expect(hops.every((h) => h.linked)).toBe(true);
      expect(hops[0].a).toBe(before);
      expect(hops.at(-1)!.b).toBe(end);
      const areas = new Set(hops.map((h) => BOARD[h.b].area));
      expect(areas.has(branch ? 'museum' : 'river')).toBe(true);
      expect(areas.has(branch ? 'river' : 'museum')).toBe(false);
    }
    // the short way is 3 stones shorter (39 or 42 steps)
    const end = BOARD.findIndex((s, i) => i > FORK && s.area === 'shop');
    expect(hopsOf(FORK, pathOf(FORK, end, 1)).length - hopsOf(FORK, pathOf(FORK, end, 0)).length).toBe(3);
  });
  it('drops repeats and marks a jump (an event card back) as unlinked', () => {
    expect(hopsOf(3, [3, 4, 4, 5])).toEqual([{ a: 3, b: 4, linked: true }, { a: 4, b: 5, linked: true }]);
    expect(hopsOf(8, [6])).toEqual([{ a: 8, b: 6, linked: false }]);
    expect(hopsOf(0, [])).toEqual([]);
  });
  it('hops from stone top to stone top in an arc, facing the way it goes', () => {
    const [ax, az] = stoneAt(1), [bx, bz] = stoneAt(2);
    const p0 = hopAt(1, 2, 0), p1 = hopAt(1, 2, 1), mid = hopAt(1, 2, 0.5);
    expect([p0.x, p0.z, p0.y]).toEqual([ax, az, topOf(1)]);
    expect(p1.x).toBeCloseTo(bx);
    expect(p1.z).toBeCloseTo(bz);
    expect(mid.y).toBeCloseTo((topOf(1) + topOf(2)) / 2 + HOP_H);
    // row 1 runs left to right: facing +X
    expect(mid.yaw).toBeCloseTo(Math.atan2(bx - ax, bz - az));
    expect(Math.sin(mid.yaw)).toBeGreaterThan(0.9);
  });
  it('stands people sharing a stone side by side', () => {
    expect(slotOf(0, 1)).toEqual([0, 0]);
    const three = [0, 1, 2].map((n) => slotOf(n, 3));
    expect(new Set(three.map(([x]) => x)).size).toBe(3);
    expect(three[0][0] + three[2][0]).toBeCloseTo(0);
  });
});

describe('the river', () => {
  it('runs between the plaza and the river rows, and the route crosses it on bridges', () => {
    for (let x = 0; x <= W; x += 20) {
      expect(riverY(x)).toBeGreaterThan(200);
      expect(riverY(x)).toBeLessThan(250);
    }
    const b = bridges();
    expect(b.length).toBeGreaterThanOrEqual(2);
    for (const br of b) expect(Math.abs(br.y - riverY(br.x))).toBeLessThan(0.5);
  });
});

describe('the die', () => {
  it('has opposite faces adding to 7', () => {
    for (let n = 1; n <= 6; n++) expect(normalOf(n).add(normalOf(7 - n)).length()).toBeCloseTo(0);
    expect([...DIE_FACES].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    expect(() => normalOf(7)).toThrow();
  });
  it('rests with the asked face up, whatever its turn', () => {
    for (let n = 1; n <= 6; n++) for (const yaw of [0, 1, 2.5, -2]) {
      const q = restOf(n, yaw);
      const up = normalOf(n).applyQuaternion(q);
      expect(up.y).toBeCloseTo(1);
      expect(topFace(q)).toBe(n);
    }
  });
  it('tumbles from a height, lands on its rest, and settles on the asked face', () => {
    const rest = restOf(4, 0.7), axis = new Vector3(0.3, 0, -1).normalize();
    const start = tumbleAt(0, rest, axis);
    expect(start.h).toBeGreaterThan(30);
    expect(start.d).toBe(0);
    const end = tumbleAt(1, rest, axis, new Quaternion());
    expect(end.h).toBe(0);
    expect(end.d).toBe(1);
    expect(end.q.angleTo(rest)).toBeLessThan(1e-6);
    expect(topFace(end.q)).toBe(4);
    // never under the ground on the way
    for (let u = 0; u <= 1; u += 0.01) expect(tumbleAt(u, rest, axis).h).toBeGreaterThanOrEqual(0);
    expect(ROLL_MS).toBeGreaterThanOrEqual(800);
  });
});

describe('the camera', () => {
  it('stands behind and above the focus, looking down the route, further back on a narrow screen', () => {
    const [x, z] = stoneAt(10);
    const phone = cameraFor(x, z, 390 / 844), wide = cameraFor(x, z, 16 / 9);
    expect(phone.pos[1]).toBeGreaterThan(0);
    expect(phone.pos[2]).toBeGreaterThan(phone.at[2]);
    const dist = (c: typeof phone) => Math.hypot(c.pos[0] - c.at[0], c.pos[1] - c.at[1], c.pos[2] - c.at[2]);
    expect(dist(phone)).toBeGreaterThan(dist(wide));
    // x follows part way: the board stays in view
    expect(Math.abs(phone.at[0])).toBeLessThan(Math.abs(x) + 1e-9);
  });
  /** Where world point [x, 0, z] lands on the visible part (NDC: −1 bottom … 1 top) for camera `c` of aspect `a`. */
  function ndc(c: ReturnType<typeof cameraFor>, a: number, x: number, z: number) {
    const cam = new PerspectiveCamera(FOV, a, 1, 5000);
    cam.position.set(...c.pos);
    cam.lookAt(...c.at);
    cam.updateMatrixWorld();
    return new Vector3(x, 0, z).project(cam);
  }
  it('keeps whose turn it is in the lower part of the visible view, the stones ahead above them, at every phase\'s size', () => {
    // (iPhone 15's 393 wide: the roll's, the word's, the sentence's visible heights)
    for (const hv of [430, 339, 240]) {
      const a = 393 / hv;
      for (let i = 0; i < GOAL - 4; i++) {
        const [x, z] = stoneAt(i), c = cameraFor(x, z, a), p = ndc(c, a, x, z);
        // (near あがり the look ahead stops short of the sea: the player rises up the view there)
        if (c.at[2] <= stoneAt(GOAL)[1] + 25 + 1e-6) continue;
        expect(p.y, `stone ${i} at hv ${hv}`).toBeLessThan(-0.15);
        expect(p.y).toBeGreaterThan(-0.85);
        expect(Math.abs(p.x)).toBeLessThan(1);
        // (3 stones ahead in view)
        const [ax, az] = stoneAt(i + 3), q = ndc(c, a, ax, az);
        expect(q.y, `stone ${i + 3} from ${i}`).toBeLessThan(1);
      }
    }
  });
  it('keeps to the land at the sides (at most a strip of beach past it beside an edge stone, never open sea)', () => {
    const half = Math.tan((FOV / 2) * Math.PI / 180);
    for (const a of [393 / 515, 393 / 339, 393 / 240, 16 / 9]) for (let i = 0; i < BOARD.length; i++) {
      const [x, z] = stoneAt(i), c = cameraFor(x, z, a);
      const dist = Math.hypot(c.pos[0] - c.at[0], c.pos[1] - c.at[1], c.pos[2] - c.at[2]);
      // (the land's edge at ±180; the view's sides at the look-at point)
      expect(Math.abs(c.at[0]) + dist * half * a, `stone ${i}`).toBeLessThanOrEqual(200);
      expect(Math.abs(ndc(c, a, x, z).x), `stone ${i} in view`).toBeLessThan(0.8);
    }
    // a middle stone: the view inside the land
    const c = cameraFor(0, 0, 393 / 339), dist = Math.hypot(c.pos[0] - c.at[0], c.pos[1] - c.at[1], c.pos[2] - c.at[2]);
    expect(Math.abs(c.at[0]) + dist * half * (393 / 339)).toBeLessThanOrEqual(170 + 1e-6);
  });
  it('frames the visible part between the overlays, giving the bottom inset back before the horizon could show', () => {
    expect(visibleOf(659, 88, 232)).toEqual({ top: 88, hv: 339 });
    for (const bottom of [56, 140, 232, 330, 411, 600]) {
      const v = visibleOf(659, 88, bottom);
      expect(topRayOf(v.top, v.hv), `sheet ${bottom}`).toBeGreaterThanOrEqual(TOP_RAY_MIN - 1e-6);
    }
    // a fork's choice: both ways' first stones in view, wider
    const f = forkAim(), c = cameraFor(f.x, f.z, 393 / 435, f.wide);
    for (const j of [FORK, ...BOARD[FORK].next]) {
      const [x, z] = stoneAt(j), p = ndc(c, 393 / 435, x, z);
      // (inside, with a person's margin)
      expect(Math.abs(p.x), `stone ${j}`).toBeLessThan(0.8);
      expect(Math.abs(p.y), `stone ${j}`).toBeLessThan(0.85);
    }
  });
});
