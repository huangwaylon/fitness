// The island's decorations (docs/design.md "Decorating"): the もようがえ's furniture with a decoration's model (the ten
// garden pieces, the gym's), their art and heights in their four facings (Decor.svelte draws their tap areas; their
// spots are the layout's: layout/catalog.ts).
import { KIND_LIST } from '#lib/layout/catalog.ts';
import { DECOR_U } from './world.ts';
import PLACES from './models.json';

export type Facing = 0 | 1 | 2 | 3;
/** The decorations' kinds: the layout's kinds whose icon is a decoration's render (`decor/<kind>-0`; scripts/models.ts
 *  and scripts/world3d-assets.ts DECOR). */
export const DECOR_KINDS: readonly string[] = KIND_LIST.filter((d) => d.icon.startsWith('decor/')).map((d) => d.k);

/** A kind's sprite in a facing (scripts/models.ts renders all four). */
export const decorArt = (kind: string, f: Facing): string => `decor/${kind}-${f}`;
/** Every decoration sprite (usage.test). */
export const DECOR_ART: readonly string[] = DECOR_KINDS.flatMap((i) => ([0, 1, 2, 3] as const).map((f) => decorArt(i, f)));

const P = PLACES as unknown as Record<string, { ax: number; ay: number; mu: [number, number] }>;
/** Its drawn height (u): the render's model units at DECOR_U, so every facing stands the same size. */
export const decorH = (kind: string, f: Facing): number => Math.round((P[decorArt(kind, f)]?.mu[1] ?? 12) * DECOR_U * 10) / 10;
