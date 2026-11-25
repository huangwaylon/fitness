// A prod-shaped island with many tiers (islandCam.test.ts's and e2e/world3d-backscroll.spec.ts's): the record's land
// (cols 2–17, 480 u), the default's front to row 52, then a cliff a tier up every few rows to the highest (tier 3,
// 120 u) at the back (row 77), a cedar on every other tile of its last two rows. The user, 2026-11-25: "with so many
// tiered slopes, if I zoom in, I can't scroll to the very back of the island to see the trees".
import { codeOf, TIERS } from '#lib/layout/grid.ts';
import { defaultLayout, opsBetween, withChanges, type Layout, type Obj } from '#lib/layout/model.ts';
import type { LayoutEntry } from '#lib/contract/layout.ts';

/** The tiers' first rows (each a cliff up from the one before) and the last land row; the record's own, one tier. */
const TIER_ROWS = [53, 60, 67] as const, LAST_ROW = 77;
export const RECORD_ROWS = [53] as const;
export const BACK_TREES = 'back-cedar-';

export function tieredLayout(tierRows: readonly number[] = TIER_ROWS): Layout {
  const base = defaultLayout(), tiles: [number, number, number][] = [];
  for (let r = 53; r < 100; r++)
    for (let c = 0; c < 20; c++) {
      const tier = tierRows.filter((t) => r >= t).length;
      const land = r <= LAST_ROW && c >= 2 && c <= 17;
      tiles.push([c, r, land ? codeOf('grass', Math.min(TIERS - 1, tier)) : 0]);
    }
  // (the front's rows widened to the record's 16 tiles: its edge columns as their neighbours)
  for (let r = 0; r < 53; r++) tiles.push([17, r, base.codes[r * 20 + 16]]);
  // (what stood on the default's back gone, ウェイ's home up on the second tier)
  const gone = [...base.objects.values()].filter((o) => o.z >= 50 && o.id !== 'home-A').map((o) => o.id);
  const trees: Obj[] = [{ ...base.objects.get('home-A')!, x: 9, z: 63 }];
  for (const r of [LAST_ROW - 1, LAST_ROW]) for (let c = 3; c <= 16; c += 2) trees.push({ id: `${BACK_TREES}${c}-${r}`, k: 'cedar', x: c + (r & 1), z: r, f: 0 });
  return withChanges(base, { tiles, remove: gone, set: trees });
}

/** The layout as the phone keeps it (localStorage's `island-demo.layout`): ウェイ's ops over the default. */
export const tieredOps = (at = 1.79e12): LayoutEntry[] => opsBetween(defaultLayout(), tieredLayout(), at).map((o) => ({ ...o, who: 'A' }) as LayoutEntry);
