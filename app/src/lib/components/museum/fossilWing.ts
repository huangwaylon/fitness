// The fossil wing's exhibits (docs/design.md "The museum"): every fossil found (fossils.ts: its place, NH's three
// rooms' order) as NH's own model (models.json: a pack a skeleton, fetched once one of its pieces is on show), a
// skeleton's pieces in their row on their own bases (NH's: the found ones join where they stand; the whole animal once
// all are in), a standalone fossil on a marble stand. Still: nothing here moves, so it asks for no frames of its own.
import { BoxGeometry, Group, Matrix4, type BufferGeometry } from 'three';
import type { Exhibit, Kit } from './engine.ts';
import type { RoomId } from './plan.ts';
import { SET_S, SPOTS, footOf, setOf, type FossilOnShow } from './fossils.ts';
import { batcher } from './geometry.ts';
import { POOL } from './look.ts';
import M from './models.json' with { type: 'json' };

const MODELS = M.models as Record<string, { min: number[]; max: number[] }>;
/** A little fossil (under this tall) is drawn bigger on its stand, as NH's cases show them. */
const SMALL = 8, SMALL_S = 1.35;
/** How near a tap (client px) picks a fossil, at least. */
const REACH = 26;

/** A fossil's height as drawn (its model's, scaled), its middle's height over the floor. */
function heightOf(id: string): { s: number; h: number; mid: number } {
  const b = MODELS[id], s0 = SPOTS.get(id)!;
  const h0 = b ? b.max[1] - Math.max(0, b.min[1]) : 10, s = s0.s ?? (s0.stand && h0 < SMALL ? SMALL_S : setOf(id) ? SET_S : 1);
  return { s, h: h0 * s, mid: s0.stand + (h0 * s) / 2 };
}

export function buildFossils(kit: Kit, shown: readonly FossilOnShow[], room: RoomId): Exhibit {
  const group = new Group();
  const geos: BufferGeometry[] = [];
  // (the kit's materials: the museum lets go of them)
  const marble = kit.lambert({ map: kit.tex('marble', [0.5, 0.5]), color: 0xeae2d6 });
  const trim = kit.lambert({ color: 0xb48a5e });
  const batch = batcher(), at = new Matrix4();
  const ids = shown.map((f) => f.id);
  for (const id of ids) {
    const sp = SPOTS.get(id);
    if (!sp) continue;
    const { s } = heightOf(id);
    if (sp.stand) {
      // NH's display stand: a marble block on an oak plinth
      batch.add(new BoxGeometry(sp.w, sp.stand - 1, sp.w), marble, at.makeTranslation(sp.x, 1 + (sp.stand - 1) / 2, sp.z));
      batch.add(new BoxGeometry(sp.w + 1.2, 1, sp.w + 1.2), trim, at.makeTranslation(sp.x, 0.5, sp.z));
    }
    // (a skeleton's piece by NH's origin: its base's middle, so the pieces join; a standalone one by its bounds)
    kit.prop(id, sp.x, sp.z, { y: sp.stand, s, yaw: sp.yaw, parent: group, origin: !!setOf(id) });
  }
  geos.push(...batch.done(group));
  const blocks = ids.filter((id) => SPOTS.has(id)).map(footOf);
  // (a warm pool under each, a little wider than its foot: bake.ts)
  const pools = blocks.map((b) => ({ x: (b.x0 + b.x1) / 2, z: (b.z0 + b.z1) / 2, rx: ((b.x1 - b.x0) / 2) * 1.25 + 6, rz: ((b.z1 - b.z0) / 2) * 1.25 + 6, color: POOL.fossil }));
  const where = (id: string): [number, number, number] | null => {
    const sp = SPOTS.get(id);
    return sp && ids.includes(id) ? [sp.x, heightOf(id).mid, sp.z] : null;
  };
  return {
    group,
    room,
    blocks,
    pools,
    frame: () => false,
    pick(project, cx, cy) {
      let best: { id: string; d: number } | null = null;
      for (const id of ids) {
        const p = where(id);
        if (!p) continue;
        const { h } = heightOf(id);
        const c = project(p[0], p[1], p[2]), top = project(p[0], p[1] + h / 2, p[2]);
        if (!c) continue;
        const r = Math.max(REACH, top ? Math.abs(c[1] - top[1]) * 1.1 : 0), d = Math.hypot(c[0] - cx, c[1] - cy);
        if (d < r && (!best || d < best.d)) best = { id, d };
      }
      return best;
    },
    where,
    shown: () => [...ids],
    night() {},
    dispose() {
      for (const g of geos) g.dispose();
    }
  };
}
