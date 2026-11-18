import { describe, expect, it } from 'vitest';
import { Quaternion, Vector3 } from 'three';
import { BOARD, FORK, GOAL, H, W, pathOf } from '#lib/sugoroku/board.ts';
import { DIE_FACES, HOP_H, ROLL_MS, bridges, cameraFor, hopAt, hopsOf, normalOf, restOf, riverY, slotOf, stoneAt, toWorld, topFace, topOf, tumbleAt } from './plan.ts';

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
});
