// The weight bench's barbell in the presser's hands (docs/design.md "The gym"): the bench's model has its bar as a part
// of its own (scripts/world3d-models.ts `split`: its GLB's `bar` node, where it rests on the rack in its extras), so
// while a villager or a player lies on it pressing (poses.ts `press`), the bar leaves the rack for its hands once it's
// lain down (GRAB_MS), rides them up and down, its middle between the two hand bones and its length along them, and
// goes back onto the rack as it gets up (RACK_MS). Nothing goes over the relay: the use is the seat's, which every
// phone draws the same, and the bar follows from it. Pure (three's maths only, no allocation per call): unit-tested.
import { Matrix4, Quaternion, Vector3 } from 'three';

/** Off the rack into the hands (ms), once it's lain down; back onto it as it gets up. */
export const GRAB_MS = 520, RACK_MS = 420;

const ease = (v: number) => {
  const t = Math.max(0, Math.min(1, v));
  return t * t * (3 - 2 * t);
};

/** How far off the rack (0 on it … 1 in the hands) at t: `t0` when it starts for the hands, `off` when it was let go of
 *  (null: held) and how far off it was then (`kOff`). */
export function barK(t: number, t0: number, off: number | null, kOff: number): number {
  if (off === null) return ease((t - t0) / GRAB_MS);
  return kOff * (1 - ease((t - off) / RACK_MS));
}

const AXIS: Record<'x' | 'y' | 'z', Vector3> = { x: new Vector3(1, 0, 0), y: new Vector3(0, 1, 0), z: new Vector3(0, 0, 1) };
const rp = new Vector3(), rq = new Quaternion(), rs = new Vector3(), hp = new Vector3(), hq = new Quaternion(), along = new Vector3(), dir = new Vector3();

/** The bar's frame (three's space) into `out`: from where it rests (`rest`, the bench's part frame as placed: things.ts
 *  rest) toward the hands' (`l`, `r`: its middle at theirs, its long `axis` along them, its roll kept) by k (0 … 1). */
export function barAt(out: Matrix4, rest: Matrix4, axis: 'x' | 'y' | 'z', l: Vector3, r: Vector3, k: number): Matrix4 {
  rest.decompose(rp, rq, rs);
  if (k <= 0) return out.copy(rest);
  hp.addVectors(l, r).multiplyScalar(0.5);
  along.copy(AXIS[axis]).applyQuaternion(rq);
  dir.subVectors(l, r);
  // (its turn the least from the rack's: the bar's ends are alike)
  if (dir.lengthSq() < 1e-8) dir.copy(along);
  else if (dir.normalize().dot(along) < 0) dir.negate();
  hq.setFromUnitVectors(along, dir).multiply(rq);
  // (on the way: k of the way from the rack)
  if (k < 1) {
    hp.lerp(rp, 1 - k);
    hq.slerp(rq, 1 - k);
  }
  return out.compose(hp, hq, rs);
}
