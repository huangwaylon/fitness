// The weight bench's barbell in the presser's hands (docs/design.md "The gym"): the bench's model has its bar as a part
// of its own (scripts/world3d-models.ts `split`: its GLB's `bar` node, where it rests on the rack in its extras), so
// while a villager or a player lies on it pressing (poses.ts `press`), the bar leaves the rack for its hands once it's
// lain down (GRAB_MS), rides them up and down, its middle between the two hand bones and its length along them, and
// goes back onto the rack as it gets up (RACK_MS). What's pressed is the gym's own barbell (HELD: NH's, the catalogue's
// `barbell`), not the bench's small baked bar: as it lies down the small bar leaves the rack and the barbell is on the
// rack in its place (its middle the small bar's, along it), lifted from there and put back there, and once it's up the
// small bar is back. Nothing goes over the relay: the use is the seat's, which every phone draws the same, and the bar
// follows from it. Pure (three's maths only, no allocation per call): unit-tested.
import { Matrix4, Quaternion, Vector3 } from 'three';

/** Off the rack into the hands (ms), once it's lain down; back onto it as it gets up. */
export const GRAB_MS = 520, RACK_MS = 420;

/** The barbell pressed (its model: the gym's standalone one) and its size over its own as the bench's scale has it.
 *  Both are drawn at the island's scale 3; at NH's own size its grip (between the inner plates: 12 of its 19.2 model
 *  units) is 36 u, which a villager's hands fit (23-28 u apart pressing, the hand bones') but a human player's don't
 *  (32-39 u: they'd be in the plates). So one size for every presser, 1.25: a 45 u grip, the player's hands ~3 u clear
 *  of the plates, a villager's ~9 u (a wide grip: a real bar is long against the shoulders); 72 u long, its plates
 *  (13 u round) outside the rack's uprights (24.5 u apart) and well off the ground there. */
export const HELD = 'decor/barbell', HELD_SCALE = 1.25;

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

const hc = new Vector3(), hx = new Quaternion(), hs = new Vector3(), long = new Vector3(), ht = new Matrix4();
/** The held model in the bar's frame (`out`: its own space into the frame barAt places): its middle (of its bounds
 *  `min`, `max`) at the frame's, its longest side along the bar's `axis` (a turn about the up when both lie flat), its
 *  size `scale` of its own. Once a model. */
export function heldIn(out: Matrix4, axis: 'x' | 'y' | 'z', min: readonly number[], max: readonly number[], scale = 1): Matrix4 {
  const d = [max[0] - min[0], max[1] - min[1], max[2] - min[2]], i = d.indexOf(Math.max(...d));
  long.set(i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0);
  hx.setFromUnitVectors(long, AXIS[axis]);
  out.compose(hc.set(0, 0, 0), hx, hs.setScalar(scale));
  return out.multiply(ht.makeTranslation(-(min[0] + max[0]) / 2, -(min[1] + max[1]) / 2, -(min[2] + max[2]) / 2));
}
