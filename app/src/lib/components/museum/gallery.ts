// The art gallery's exhibits (docs/design.md "The museum"): its panels (free-standing walls in three rows a room, NH's red),
// and every genuine artwork anyone has had (art.ts: its place) as NH's own model (models.json: four packs, each fetched
// once one of its artworks is on show): the paintings hung on the walls and the panels, the statues on marble plinths,
// the wild painting's halves as a screen on a dais. Still: it asks for no frames of its own.
import { BoxGeometry, Group, Matrix4, Mesh, type BufferGeometry, type Material, type Object3D } from 'three';
import type { Exhibit, Kit, Screen } from './engine.ts';
import { ART_SPOTS, DAIS, PANELS, PANEL_H, PANEL_T, plinthOf, type ArtOnShow } from './art.ts';
import { batcher } from './geometry.ts';
import type { Card, Pool } from './bake.ts';
import { GAIN, POOL, TINT, lookAt } from './look.ts';
import type { Rect, RoomId } from './plan.ts';
import M from './models.json' with { type: 'json' };

const MODELS = M.models as Record<string, { min: number[]; max: number[] } | undefined>;
/** How near a tap (client px) picks an artwork, at least. */
const REACH = 24;
/** A faded panel's foot (u high). */
const KICK = 2.5;

export { PANELS };
/** A gallery room's exhibits (its panels, its artworks on show: `shown` its own). */
export function buildGallery(kit: Kit, shown: readonly ArtOnShow[], room: RoomId = 'G1'): Exhibit {
  const panels = PANELS.filter((p) => p.room === room);
  const group = new Group();
  const geos: BufferGeometry[] = [];
  // (the kit's materials: the museum lets go of them)
  // (NH's damask red, as bright as the walls: look.ts GAIN; each panel its own, to fade alone)
  const red = () => {
    const m = kit.lambert({ map: kit.tex('hall-red', [4, 1.4]) });
    m.color.set(TINT.art.wall).multiplyScalar(GAIN.art.wall);
    return m;
  };
  const capLook = { color: 0xc9a24a };
  const foot = red();
  const marble = kit.lambert({ map: kit.tex('marble', [0.5, 0.5]), color: 0xf0e8dc });
  const wood = kit.lambert({ color: 0x5a3a27 });
  const batch = batcher(), at = new Matrix4();
  // each panel its own (its materials too): one hiding my villager fades out with its paintings (engine.ts screens)
  const screens: (Screen & { objs: Object3D[] })[] = panels.map((r) => {
    const w = r.x1 - r.x0, mx = (r.x0 + r.x1) / 2, mz = (r.z0 + r.z1) / 2;
    const body = new Mesh(new BoxGeometry(w, PANEL_H, PANEL_T), red());
    body.position.set(mx, PANEL_H / 2, mz);
    // a gold rail along its top (a little proud, so no face shares the panel's top)
    const rail = new Mesh(new BoxGeometry(w + 1, 1.2, PANEL_T + 1), kit.lambert(capLook));
    rail.position.set(mx, PANEL_H + 0.6, mz);
    body.userData.ownFade = rail.userData.ownFade = true;
    // (its foot, while it's faded out)
    const kick = new Mesh(new BoxGeometry(w - 0.4, KICK, PANEL_T + 0.4), foot);
    kick.position.set(mx, KICK / 2, mz);
    kick.visible = false;
    group.add(body, rail, kick);
    geos.push(body.geometry, rail.geometry, kick.geometry);
    return { rect: r, h: PANEL_H + 1.2, objs: [body, rail], foot: kick };
  });
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
    const held = kit.prop(id, sp.x, sp.z, { y: sp.y, yaw: sp.yaw, s: sp.s, parent: group, origin: true });
    // (a painting on a panel's face fades with it)
    screens.find(({ rect: r }) => sp.x > r.x0 && sp.x < r.x1 && Math.abs(sp.z - r.z1) < 1)?.objs.push(held);
  }
  geos.push(...batch.done(group));
  // a wash of light on the wall over each painting (one mesh: bake.ts cards) and a pool on the floor before it; a pool
  // round each statue
  const washes: Card[] = [], pools: Pool[] = [];
  for (const id of ids) {
    const sp = ART_SPOTS.get(id)!, b = MODELS[id];
    if (!b) continue;
    const w = (b.max[0] - b.min[0]) * sp.s, h = (b.max[1] - b.min[1]) * sp.s;
    if (sp.plinth) pools.push({ x: sp.x, z: sp.z, rx: sp.plinth / 2 + 9, color: POOL.art, at: 0.8 });
    else if (b.min[1] < -0.5 && !id.startsWith('wild-painting')) {
      washes.push({ x: sp.x, y: sp.y + 0.2 * h, z: sp.z + 0.1, w: w * 1.4, h: h * 1.25, yaw: sp.yaw });
      pools.push({ x: sp.x, z: sp.z + 10, rx: w * 0.6 + 4, rz: 9, color: POOL.art, at: 0.7 });
    }
  }
  const wash = washes.length ? kit.cards('wash', washes) : null;
  if (wash) group.add(wash.mesh);
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
    pools,
    screens,
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
    night(n) {
      wash?.cards(lookAt('art', n).cards);
    },
    dispose() {
      for (const g of geos) g.dispose();
      if (wash) (wash.mesh.geometry.dispose(), (wash.mesh.material as Material).dispose());
    }
  };
}
