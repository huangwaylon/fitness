// The island's decorations (docs/design.md "Decorating"): the もようがえ's furniture with a decoration's model (the ten
// garden pieces, the gym's), their art and heights in their four facings (Decor.svelte draws their tap areas; their
// spots are the layout's: layout/catalog.ts).
import { KIND_LIST, kindDef } from '#lib/layout/catalog.ts';
import { DECOR_U } from './world.ts';
import PLACES from './models.json';

export type Facing = 0 | 1 | 2 | 3;
/** The decorations' kinds: the layout's kinds with a decoration's model, `decor/<kind>-0` (the garden pieces and the
 *  gym's: their icon its render, scripts/world3d-assets.ts DECOR; a pack's, catalog.ts `packed`: the camp goods', the
 *  food's and the rest of the gym's). (Not read off world3d/assets.json: the island's first load holds this.) */
export const DECOR_KINDS: readonly string[] = KIND_LIST.filter((d) => d.icon.startsWith('decor/') || d.packed).map((d) => d.k);

/** A kind's sprite in a facing (scripts/models.ts renders all four; a pack's kinds have none: their icon is the ずかん's). */
export const decorArt = (kind: string, f: Facing): string => `decor/${kind}-${f}`;
/** Every decoration sprite (usage.test): the kinds scripts/models.ts renders. */
export const DECOR_ART: readonly string[] = DECOR_KINDS.filter((k) => `decor/${k}-0` in PLACES).flatMap((i) => ([0, 1, 2, 3] as const).map((f) => decorArt(i, f)));

const P = PLACES as unknown as Record<string, { ax: number; ay: number; mu: [number, number] }>;
/** Where a facing's look stands (its feet point, a share of its width and height) and its size in model units: the
 *  render's (models.json), else (a pack's kind: no 2D render) its catalog box and height. */
export function decorPlace(kind: string, f: Facing): { ax: number; ay: number; mu: [number, number] } | null {
  const p = P[decorArt(kind, f)];
  if (p) return p;
  const d = kindDef(kind);
  if (!d?.packed) return null;
  // (its block box across, its drawn height: in model units at DECOR_U)
  const [w, h] = d.foot ?? [24, 24];
  return { ax: 0.5, ay: 1, mu: [(f % 2 ? h : w) / DECOR_U, d.h / DECOR_U] };
}
/** Its drawn height (u): the render's model units at DECOR_U, so every facing stands the same size. */
export const decorH = (kind: string, f: Facing): number => Math.round((decorPlace(kind, f)?.mu[1] ?? 12) * DECOR_U * 10) / 10;
