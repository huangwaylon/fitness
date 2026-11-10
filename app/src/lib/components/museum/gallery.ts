// The art gallery's exhibits (docs/design.md "The museum"): its panels (free-standing walls in three rows a room, NH's red),
// and every genuine artwork anyone has had (art.ts: its place) as NH's own model (models.json: four packs, each fetched
// once one of its artworks is on show): the paintings hung on the walls and the panels, the statues on marble plinths,
// the wild painting's halves as a screen on a dais. Still: it asks for no frames of its own.
import { BoxGeometry, Group, Matrix4, type BufferGeometry } from 'three';
import type { Exhibit, Kit } from './engine.ts';
import { ART_SPOTS, DAIS, PANELS, PANEL_H, PANEL_T, plinthOf, type ArtOnShow } from './art.ts';
import { batcher } from './geometry.ts';
import type { Rect, RoomId } from './plan.ts';
import M from './models.json' with { type: 'json' };

const MODELS = M.models as Record<string, { min: number[]; max: number[] } | undefined>;
/** How near a tap (client px) picks an artwork, at least. */
const REACH = 24;

export { PANELS };
/** A gallery room's exhibits (its panels, its artworks on show: `shown` its own). */
export function buildGallery(kit: Kit, shown: readonly ArtOnShow[], room: RoomId = 'G1'): Exhibit {
  const panels = PANELS.filter((p) => p.room === room);
  const group = new Group();
  const geos: BufferGeometry[] = [];
  // (the kit's materials: the museum lets go of them)
  const panel = kit.lambert({ map: kit.tex('hall-red', [4, 1.4]), color: 0xd8c8c0 });
  const cap = kit.lambert({ color: 0xc9a24a });
  const marble = kit.lambert({ map: kit.tex('marble', [0.5, 0.5]), color: 0xf0e8dc });
  const wood = kit.lambert({ color: 0x5a3a27 });
  const batch = batcher(), at = new Matrix4();
  for (const r of panels) {
    const w = r.x1 - r.x0, mx = (r.x0 + r.x1) / 2, mz = (r.z0 + r.z1) / 2;
    batch.add(new BoxGeometry(w, PANEL_H, PANEL_T), panel, at.makeTranslation(mx, PANEL_H / 2, mz));
    // a gold rail along its top (a little proud, so no face shares the panel's top)
    batch.add(new BoxGeometry(w + 1, 1.2, PANEL_T + 1), cap, at.makeTranslation(mx, PANEL_H + 0.6, mz));
  }
  const ids = shown.map((a) => a.id).filter((id) => ART_SPOTS.has(id));
  const blocks: Rect[] = [...panels];
  if (ids.some((id) => id.startsWith('wild-painting'))) {
    batch.add(new BoxGeometry(DAIS.x1 - DAIS.x0, DAIS.h, DAIS.z1 - DAIS.z0), wood, at.makeTranslation((DAIS.x0 + DAIS.x1) / 2, DAIS.h / 2, (DAIS.z0 + DAIS.z1) / 2));
    blocks.push(DAIS);
  }
  for (const id of ids) {
    const sp = ART_SPOTS.get(id)!, foot = plinthOf(id);
    if (foot) {
      batch.add(new BoxGeometry(sp.plinth, sp.plinthH, sp.plinth), marble, at.makeTranslation(sp.x, sp.plinthH / 2, sp.z));
      blocks.push(foot);
    }
    kit.prop(id, sp.x, sp.z, { y: sp.y, yaw: sp.yaw, s: sp.s, parent: group, origin: true });
  }
  geos.push(...batch.done(group));
  /** An artwork's middle, and how tall it's drawn. */
  const mid = (id: string): { p: [number, number, number]; h: number } | null => {
    const sp = ART_SPOTS.get(id), b = MODELS[id];
    if (!sp || !b || !ids.includes(id)) return null;
    const h = (b.max[1] - b.min[1]) * sp.s, painting = b.min[1] < -0.5;
    return { p: [sp.x, painting ? sp.y : sp.y + h / 2, sp.z], h };
  };
  return {
    group,
    wing: 'art',
    blocks,
    frame: () => false,
    pick(project, cx, cy) {
      let best: { id: string; d: number } | null = null;
      for (const id of ids) {
        const m = mid(id), c = m && project(...m.p), top = m && project(m.p[0], m.p[1] + m.h / 2, m.p[2]);
        if (!c) continue;
        const r = Math.max(REACH, top ? Math.abs(c[1] - top[1]) : 0), d = Math.hypot(c[0] - cx, c[1] - cy);
        if (d < r && (!best || d < best.d)) best = { id, d };
      }
      return best;
    },
    where: (id) => mid(id)?.p ?? null,
    shown: () => [...ids],
    night() {},
    dispose() {
      for (const g of geos) g.dispose();
    }
  };
}
