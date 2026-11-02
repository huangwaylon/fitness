// The phones' old decorations into the layout (docs/island-layout.md "Phone editing"), pure: each decoration placed
// with the old もようがえ (contract/decor.ts, world.ts's island) becomes a layout object, once: its id `m-<its id>`, its
// kind the same, its spot the same on the long island (おく's z moved back as the default's was) on its nearest tile,
// its facing kept. Each member's phone moves its own (the decoration's last placer: the op is theirs, so the record's
// rows keep who placed it); a decoration already moved over (any op of its id, a removal too) is never again.
import type { LayoutEntry, LayoutOp } from '#lib/contract/layout.ts';
import { resetAt } from '#lib/contract/layout.ts';
import { footprintOf, kindDef } from './catalog.ts';
import { GRID, TILE } from './grid.ts';

/** world.ts's island on the long one (scripts/layout-default.ts: おく moved 1380u back past the new middle). */
export const LONG_SPLIT = 680;
export const LONG_GROW = 1380;
const zOf = (z: number) => (z < LONG_SPLIT ? z : z + LONG_GROW);

interface Placed {
  id: string;
  item: string;
  x: number;
  z: number;
  f: 0 | 1 | 2 | 3;
  at: number;
  who: 'A' | 'B' | 'G';
}

/** The layout's id for an old decoration. */
export const migratedId = (id: string): string => `m-${id}`;

/** The ops that move `me`'s old decorations into the layout (none already there). */
export function migrationOps(merged: ReadonlyMap<string, LayoutEntry>, placed: readonly Placed[], me: 'A' | 'B' | 'G'): LayoutOp[] {
  if (me === 'G') return [];
  const reset = resetAt(merged);
  const out: LayoutOp[] = [];
  for (const p of placed) {
    if (p.who !== me) continue;
    const def = kindDef(p.item);
    const id = migratedId(p.id);
    if (!def || merged.has(`o|${id}`)) continue;
    const [w, d] = footprintOf(def, p.f);
    const x = Math.round((p.x - GRID.x0) / TILE - w / 2), z = Math.round((zOf(p.z) - GRID.z0) / TILE - d / 2);
    if (x < 0 || z < 0 || x + w > GRID.cols || z + d > GRID.rows) continue;
    out.push({ sc: 'o', id, at: Math.max(p.at, reset + 1), k: p.item, x, z, f: p.f });
  }
  return out;
}
