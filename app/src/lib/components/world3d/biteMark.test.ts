import { describe, expect, it } from 'vitest';
import { Object3D, PerspectiveCamera, Vector3 } from 'three';
import { bendPoint } from './bend.ts';
import { MARK_PX, MARK_U, OVER_U, markCorners, markSize, overHead, popIn } from './biteMark.ts';

// the island's camera as engine.ts aims it (FOV 30, VIEW_W 420 across at the pivot at zoom 1, the pitch by the zoom,
// the pivot a little below the middle), on an iPhone 15's 393 × 852
const W = 393, H = 852, FOV = 30, R = 1300;
const focal = H / 2 / Math.tan(((FOV / 2) * Math.PI) / 180);
const pitchAt = (k: number) => ((k >= 1 ? 58 + (40 - 58) * ((k - 1) / 2.2) : 58) * Math.PI) / 180;
function camAt(camZ: number, k: number, camX = 0): PerspectiveCamera {
  const c = new PerspectiveCamera(FOV, W / H, 20, 6000), D = 420 / (2 * Math.tan(((FOV / 2) * Math.PI) / 180) * c.aspect) / k, p = pitchAt(k);
  c.position.set(camX, D * Math.sin(p), -camZ + D * Math.cos(p));
  c.lookAt(camX, 0, -camZ);
  c.setViewOffset(W, H, 0, -0.12 * H, W, H);
  c.updateProjectionMatrix();
  c.updateMatrixWorld();
  return c;
}
/** A three-space point (bent) → canvas px. */
const px = (v: Vector3, c: PerspectiveCamera) => {
  const p = v.clone().applyMatrix4(c.matrixWorldInverse).applyMatrix4(c.projectionMatrix);
  return [((p.x + 1) / 2) * W, ((1 - p.y) / 2) * H];
};
const bent = (v: Vector3, camZ: number) => new Vector3(...bendPoint(v.x, v.y, v.z, -camZ, R));
const six = () => Array.from({ length: 6 }, () => new Vector3());

describe('biteMark.ts: the bite’s 「！」 over the head', () => {
  it('sits over the head’s top standing, lower seated, over the head lying (the head bone carries its top)', () => {
    const bad: string[] = [];
    // a villager's head bone (the head's base) and its top 34u over it at rest, its body turned as each pose has it
    const body = new Object3D(), head = new Object3D(), crown = new Vector3(0, 34, 0);
    body.add(head);
    const at = (pose: { y: number; tilt: number; x?: number }) => {
      body.position.set(pose.x ?? 0, pose.y, -50);
      body.rotation.set(0, 0.6, pose.tilt);
      body.updateMatrixWorld(true);
      const h = head.getWorldPosition(new Vector3()), top = head.localToWorld(crown.clone());
      return { h, top, a: overHead(h, top, new Vector3()) };
    };
    const stand = at({ y: 44, tilt: 0 }), sit = at({ y: 31, tilt: 0.12 }), lie = at({ y: 14, tilt: Math.PI / 2 }), nod = at({ y: 44, tilt: -0.5 });
    // standing: OVER_U over its top, straight over it
    if (stand.a.distanceTo(stand.top.clone().setY(stand.top.y + OVER_U)) > 1e-9) bad.push(`standing ${stand.a.toArray()}`);
    // seated: over its own head, lower than standing
    if (!(sit.a.y < stand.a.y - 10) || Math.hypot(sit.a.x - (sit.h.x + sit.top.x) / 2, sit.a.z - (sit.h.z + sit.top.z) / 2) > 1e-9) bad.push(`seated ${sit.a.toArray()}`);
    // lying (the head along the ground): over the head's middle, OVER_U over its highest point (its radius over its
    // middle), not out past its crown nor up where a standing head would be
    const mid = lie.h.clone().add(lie.top).multiplyScalar(0.5);
    if (Math.hypot(lie.a.x - mid.x, lie.a.z - mid.z) > 1e-9 || Math.abs(lie.a.y - (mid.y + 17 + OVER_U)) > 1e-9 || lie.a.y > stand.a.y - 30) bad.push(`lying ${lie.a.toArray()}`);
    // every pose: over both the bone and the top
    for (const [n, p] of Object.entries({ stand, sit, lie, nod })) if (!(p.a.y > p.h.y && p.a.y > p.top.y)) bad.push(`${n}: not over the head`);
    expect(bad).toEqual([]);
  });

  it('is NH’s size in the world, held to MARK_PX on screen at every zoom', () => {
    const got: Record<string, number> = {};
    for (const k of [1, 2, 3.2]) {
      const c = camAt(300, k), a = new Vector3(0, 90, -300), d = -bent(a, 300).applyMatrix4(c.matrixWorldInverse).z;
      got[k] = (markSize(d, focal) * focal) / d;
    }
    // the widest zoom: up to its least (19 px in the world's size); zoom 2: the world's (it grows with the head);
    // fully in: down to its most
    expect(got[1]).toBeCloseTo(MARK_PX.min, 6);
    expect(got[2]).toBeGreaterThan(MARK_PX.min);
    expect(got[2]).toBeLessThan(MARK_PX.max);
    expect(got[3.2]).toBeCloseTo(MARK_PX.max, 6);
    expect(markSize(NaN, focal)).toBe(MARK_U);
  });

  it('is bent with the island at its anchor, upright and square on to the camera, at every zoom, pan and pitch', () => {
    const bad: string[] = [];
    const out = six();
    for (const k of [1, 2, 3.2]) for (const [camZ, camX] of [[300, 0], [140, 20], [520, -24]]) {
      const c = camAt(camZ, k, camX), a = new Vector3(14, 92, -300), b = bent(a, camZ), s = markSize(-b.clone().applyMatrix4(c.matrixWorldInverse).z, focal);
      markCorners(b, s, c, out);
      const tag = `zoom ${k} camZ ${camZ} x ${camX}`;
      const [bl, br, tr, tl, bm, tm] = out.map((v) => [((v.x + 1) / 2) * W, ((1 - v.y) / 2) * H]);
      // its bottom's middle where the bent anchor is on screen (the bend's drop: the unbent point is elsewhere off the pivot)
      const want = px(b, c);
      if (Math.hypot(bm[0] - want[0], bm[1] - want[1]) > 1e-6) bad.push(`${tag}: off its anchor`);
      if (Math.abs(camZ - 300) > 200 && Math.abs(px(a, c)[1] - want[1]) < 2) bad.push(`${tag}: the bend made no difference`);
      // upright: its top straight over its bottom, its sides plumb, its top and bottom level
      if (Math.abs(tm[0] - bm[0]) > 1e-6 || !(tm[1] < bm[1])) bad.push(`${tag}: not upright`);
      if (Math.abs(bl[0] - tl[0]) > 1e-6 || Math.abs(br[0] - tr[0]) > 1e-6 || Math.abs(bl[1] - br[1]) > 1e-6 || Math.abs(tl[1] - tr[1]) > 1e-6) bad.push(`${tag}: tilted`);
      // square on: its four corners at one depth (the camera's plane), as wide as tall on screen (never squashed by the pitch)
      if (new Set(out.slice(0, 4).map((v) => v.z.toFixed(9))).size !== 1) bad.push(`${tag}: not in the camera's plane`);
      if (Math.abs((br[0] - bl[0]) - (bl[1] - tl[1])) > 1e-6) bad.push(`${tag}: squashed ${br[0] - bl[0]} × ${bl[1] - tl[1]}`);
      // and its size on screen within its clamp
      const h = bm[1] - tm[1];
      if (h < MARK_PX.min - 1e-6 || h > MARK_PX.max + 1e-6) bad.push(`${tag}: ${h} px`);
    }
    expect(bad).toEqual([]);
  });

  it('pops in past its size and back (NH’s overshoot), from nothing', () => {
    expect(popIn(0)).toBe(0);
    expect(popIn(-1)).toBe(0);
    expect(Math.max(...Array.from({ length: 50 }, (_, i) => popIn(i / 50)))).toBeGreaterThan(1.1);
    expect(popIn(1)).toBe(1);
  });
});
