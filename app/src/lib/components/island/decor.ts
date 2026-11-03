// The island's decorations (docs/design.md "Decorating"): the ten items' art and heights in their four facings
// (Decor.svelte draws them; their spots are the layout's: layout/catalog.ts).
import { DECOR_ITEMS } from '#lib/contract/decor.ts';
import { DECOR_U } from './world.ts';
import PLACES from './models.json';

export type DecorItem = (typeof DECOR_ITEMS)[number];
export type Facing = 0 | 1 | 2 | 3;
export { DECOR_ITEMS };

/** An item's sprite in a facing (scripts/models.ts renders all four). */
export const decorArt = (item: DecorItem, f: Facing): string => `decor/${item}-${f}`;
/** Every decoration sprite (usage.test). */
export const DECOR_ART: readonly string[] = DECOR_ITEMS.flatMap((i) => ([0, 1, 2, 3] as const).map((f) => decorArt(i, f)));

const P = PLACES as unknown as Record<string, { ax: number; ay: number; mu: [number, number] }>;
/** Its drawn height (u): the render's model units at DECOR_U, so every facing stands the same size. */
export const decorH = (item: DecorItem, f: Facing): number => Math.round((P[decorArt(item, f)]?.mu[1] ?? 12) * DECOR_U * 10) / 10;
