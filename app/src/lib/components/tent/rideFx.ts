// A room's pieces ridden (docs/design.md "The gym"; seats3d.ts `u`, poses-ride.ts the motion and the poses): what the piece
// does while someone's on it and where it carries them: the teacup and the carousel turn and the train chugs (their
// riders round with them), the swivel chairs swivel, a massage chair shakes, a vehicle rumbles, a cart rocks with its
// pusher's steps, a board rolls under its rider (the surfboard laid down off its rack), the tire toy squashes, the saucer
// hums; the elephant slide's rider goes up, down and round it; whoever boards a rocket, the shuttle or the saucer, or
// drives a closed cab, is hidden once in. All off the loops' shared clock (villager3d/loopClock.ts): two phones show the same turn. Nothing goes
// over the relay, and nothing redraws the shadows (a turning piece keeps its resting shadow). The spinning ones count
// toward the moving pieces' limit (toggles.ts ACTIVE_MAX, with the switched ones already moving).
import { Euler, Matrix4, Quaternion, Vector3, type Object3D } from 'three';
import { smooth01 } from '#lib/math.ts';
import type { Villager3D } from '../villager3d/villager3d.ts';
import { loopNow } from '../villager3d/loopClock.ts';
import { BOARD_HIDE_MS, hidesIn, motionOf, restOf, RIDE_MOVES, slideAt, SPIN, type Motion } from '../villager3d/poses-ride.ts';
import { ACTIVE_MAX } from './toggles.ts';

/** A spinning piece let go of comes round to rest over this (ms). */
const SETTLE_MS = 700;

interface Rider {
  key: string;
  v: Villager3D | null;
  id: string;
  use?: string;
}
interface Drawn {
  item: string;
  root: Object3D;
  body: Object3D | null;
}
export interface RideFx {
  /** One frame: who rides what, the pieces as drawn, the clock; the boarded hidden into `hidden`. `busy`: the moving
   *  pieces already animated (the switched ones). True while something is on its way at the full rate (a rider boarding). */
  step(on: readonly Rider[], piece: (id: string) => Drawn | null, t: number, hidden: Set<string>, busy: number): boolean;
  /** The e2e's: a piece's turn (ry), lift and squash as drawn, at wall time `w`; null when it's at rest. */
  state(id: string): { ry: number; y: number; sy: number; w: number } | null;
  dispose(): void;
}

export function createRideFx(): RideFx {
  /** The pieces moved off their rest: their drawing, the motion last put on them, and (let go of) the settle. */
  const moved = new Map<string, { d: Drawn; m: Motion; w: number; off?: { t0: number; ry0: number; to: number } }>();
  /** When each rider boarded (hidden BOARD_HIDE_MS on). */
  const inAt = new Map<string, number>();
  /** Each carried rider's frame as its seat put it (base) and as carried (out): the seat puts it back each frame it's
   *  posed; a frame it isn't, it's carried from its base again, not twice. */
  const carried = new Map<string, { base: Matrix4; out: Matrix4 }>();
  const M = new Matrix4(), D = new Matrix4(), G = new Matrix4(), inv = new Matrix4(), q = new Quaternion(), e = new Euler(), v3 = new Vector3(), one = new Vector3(1, 1, 1);

  const put = (body: Object3D, m: Motion) => {
    body.position.set(m.x, m.y, m.z);
    body.rotation.set(m.rx, m.ry, m.rz);
    body.scale.y *= m.sy;
  };
  const still = (body: Object3D) => {
    body.position.set(0, 0, 0);
    body.rotation.set(0, 0, 0);
  };
  /** The rider's group moved by D (its parent's space) from its seat's frame. */
  function carry(key: string, v: Villager3D, d: Matrix4) {
    const g = v.group;
    g.updateMatrix();
    const c = carried.get(key) ?? { base: new Matrix4(), out: new Matrix4() };
    if (!carried.has(key) || !g.matrix.equals(c.out)) c.base.copy(g.matrix);
    G.multiplyMatrices(d, c.base);
    G.decompose(g.position, g.quaternion, g.scale);
    g.updateMatrix();
    c.out.copy(g.matrix);
    carried.set(key, c);
  }

  return {
    step(on, piece, t, hidden, busy) {
      const w = loopNow();
      let moving = false;
      const seen = new Set<string>(), riding = new Set<string>();
      // (the spinning ones beyond the limit stay still: the switched ones moving first, then by id, as on every phone)
      const spinning = [...new Set(on.filter((o) => SPIN[piece(o.id)?.item ?? ''] && (o.use === 'ride' || o.use === 'carousel')).map((o) => o.id))].sort();
      const allowed = new Set(spinning.slice(0, Math.max(0, ACTIVE_MAX - busy)));
      for (const o of on) {
        if (!o.use || !RIDE_MOVES.has(o.use)) continue;
        riding.add(o.key);
        const d = piece(o.id), a = o.v?.seat();
        if (hidesIn(o.use, d?.item ?? '')) {
          if (!inAt.has(o.key)) inAt.set(o.key, t);
          if (t - inAt.get(o.key)! >= BOARD_HIDE_MS) hidden.add(o.key);
          else moving = true;
        }
        if (!d?.body || (spinning.includes(o.id) && !allowed.has(o.id))) continue;
        if (o.use === 'slide') {
          // carried round the slide's way: in the anchor's frame, in its tops
          if (!o.v || !a?.top) continue;
          const s = slideAt(w), H = a.top;
          v3.set(a.x, a.y, a.z);
          D.makeTranslation(v3).multiply(M.makeRotationY(a.yaw)).multiply(M.makeTranslation(s.x * H, s.y * H, s.z * H)).multiply(M.makeRotationY(s.yaw))
            .multiply(M.makeRotationY(-a.yaw)).multiply(M.makeTranslation(v3.negate()));
          carry(o.key, o.v, D);
          continue;
        }
        let mv = moved.get(o.id);
        if (!seen.has(o.id)) {
          const m = motionOf(o.use, d.item, w, (a?.yaw ?? d.root.rotation.y) - d.root.rotation.y);
          if (!m) continue;
          seen.add(o.id);
          put(d.body, m);
          mv = { d, m, w };
          moved.set(o.id, mv);
        }
        if (mv?.m.carry && o.v) {
          // the rider goes round with it: D = the piece's frame · its motion · back
          d.root.updateMatrixWorld();
          e.set(mv.m.rx, mv.m.ry, mv.m.rz);
          M.compose(v3.set(mv.m.x, mv.m.y, mv.m.z), q.setFromEuler(e), one);
          inv.copy(d.root.matrixWorld).invert();
          D.multiplyMatrices(d.root.matrixWorld, M).multiply(inv);
          if (o.v.group.parent) {
            // (into the group's parent's space)
            o.v.group.parent.updateMatrixWorld();
            G.copy(o.v.group.parent.matrixWorld).invert();
            D.premultiply(G).multiply(o.v.group.parent.matrixWorld);
          }
          carry(o.key, o.v, D);
        }
      }
      for (const key of [...inAt.keys()]) if (!on.some((o) => o.key === key && hidesIn(o.use, piece(o.id)?.item ?? ''))) inAt.delete(key);
      for (const key of [...carried.keys()]) if (!riding.has(key)) carried.delete(key);
      // let go of: back to rest (a spinning one coming round to its nearest look-alike turn first)
      for (const [id, mv] of moved) {
        if (seen.has(id)) continue;
        const body = mv.d.body;
        if (!body) {
          moved.delete(id);
          continue;
        }
        if (SPIN[mv.d.item] && SPIN[mv.d.item] !== 'chug') {
          mv.off ??= { t0: t, ry0: mv.m.ry, to: restOf(mv.d.item, mv.m.ry) };
          const k = smooth01((t - mv.off.t0) / SETTLE_MS);
          if (k < 1) {
            still(body);
            body.rotation.y = mv.off.ry0 + (mv.off.to - mv.off.ry0) * k;
            moving = true;
            continue;
          }
        }
        still(body);
        moved.delete(id);
      }
      return moving;
    },
    state(id) {
      const mv = moved.get(id);
      return mv?.d.body ? { ry: mv.d.body.rotation.y, y: mv.d.body.position.y, sy: mv.m.sy, w: mv.w } : null;
    },
    dispose() {
      for (const mv of moved.values()) if (mv.d.body) still(mv.d.body);
      moved.clear();
      carried.clear();
      inAt.clear();
    }
  };
}
