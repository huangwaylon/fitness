// The tree popup's ごはん button → けんこう and ごはん's sheet on ごはん, today, on the tree's owner's day (docs/design.md
// "Trees"). The tree asks here; the HUD opens the sheet (it pauses the island as the dumbbell's opening does) and the
// sheet shows ごはん with that person picked (HealthSheet). Kept apart so the island's chunk never loads the sheet's.
import type { Who } from '#lib/types.ts';

/** Each ask bumps `n`; `who` is whose day to show. */
export const kenkouAsk = $state<{ n: number; who: Who | null }>({ n: 0, who: null });

/** The last ask the sheet has shown (HealthSheet: it may mount after the ask that mounts it). */
export const shown = { n: 0 };

export function askFood(who: Who): void {
  kenkouAsk.who = who;
  kenkouAsk.n++;
}
