// A catch's plate (Plate.svelte) and the hold-up that goes with it, shared by the critters, the beach finds and a
// shaken tree's bugs (docs/design.md "Critters", "Beach finds"): my villager holds the catch up while the plate reads.
import { t } from '#lib/i18n/index.ts';
import { HOLD_MS, holdUp } from '../motion/director.svelte.ts';

export interface CatchCard { n: number; x: number; y: number; art: string; parts: string[]; who?: 'mine' | 'partner' }

/** The plate for catch `n` at (x, y) stage units: its line, a second page when it's a first find (`added`), and my
 *  villager (or `who`: the partner's, their catch shown here) holding the item up (`hold`). */
export function cardFor(n: number, x: number, y: number, art: string, text: string, added = false, hold = true, who: 'mine' | 'partner' = 'mine'): CatchCard {
  if (hold) holdUp(who, art, HOLD_MS);
  return { n, x, y, art, parts: added ? [text, t('zukan.added')] : [text], ...(who === 'partner' ? { who } : {}) };
}
