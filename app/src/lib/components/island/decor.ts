// The island's decorations (docs/design.md "Decorating"): the もようがえ's furniture with a decoration's model (the ten
// garden pieces, the gym's), their art and heights in their four facings (Decor.svelte draws their tap areas; their
// spots are the layout's: layout/catalog.ts).
import { KIND_LIST } from '#lib/layout/catalog.ts';
import { DECOR_U } from './world.ts';
import PLACES from './models.json';
import { ASSET_KEYS, ASSET_MODELS } from '../world3d/assets.ts';

export type Facing = 0 | 1 | 2 | 3;
/** The decorations' kinds: the layout's kinds with a decoration's model (`decor/<kind>-0` in world3d/assets.json: the
 *  garden pieces and the gym's, scripts/world3d-assets.ts DECOR; the camp goods', the food's and the rest of the gym's,
 *  its PACKS). */
export const DECOR_KINDS: readonly string[] = KIND_LIST.filter((d) => ASSET_KEYS[`decor/${d.k}-0`]).map((d) => d.k);

/** A kind's sprite in a facing (scripts/models.ts renders all four; a pack's kinds have none: their icon is the ずかん's). */
export const decorArt = (kind: string, f: Facing): string => `decor/${kind}-${f}`;
/** Every decoration sprite (usage.test): the kinds scripts/models.ts renders. */
export const DECOR_ART: readonly string[] = DECOR_KINDS.filter((k) => `decor/${k}-0` in PLACES).flatMap((i) => ([0, 1, 2, 3] as const).map((f) => decorArt(i, f)));

const P = PLACES as unknown as Record<string, { ax: number; ay: number; mu: [number, number] }>;
/** Where a facing's look stands (its feet point, a share of its width and height) and its size in model units: the
 *  render's (models.json), else its 3D model's box seen from the front (a pack's kind: no 2D render). */
export function decorPlace(kind: string, f: Facing): { ax: number; ay: number; mu: [number, number] } | null {
  const p = P[decorArt(kind, f)];
  if (p) return p;
  const m = ASSET_MODELS[ASSET_KEYS[`decor/${kind}-0`]?.m ?? ''];
  if (!m) return null;
  const across = f % 2 ? m.max[2] - m.min[2] : m.max[0] - m.min[0];
  return { ax: 0.5, ay: 1, mu: [across, m.max[1] - Math.min(0, m.min[1])] };
}
/** Its drawn height (u): the render's model units at DECOR_U, so every facing stands the same size. */
export const decorH = (kind: string, f: Facing): number => Math.round((decorPlace(kind, f)?.mu[1] ?? 12) * DECOR_U * 10) / 10;
