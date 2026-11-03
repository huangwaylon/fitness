// A catch's plate (Plate.svelte, in the bottom stack: catchStack.svelte.ts) and the hold-up that goes with it, shared by
// the critters, the beach finds, a shaken tree's bugs and the partner's news (docs/design.md "Critters", "Beach finds"):
// my villager holds the catch up while the plate reads.
import { t } from '#lib/i18n/index.ts';
import { HOLD_MS, holdUp } from '../motion/director.svelte.ts';
import { pushCard, type CatchWho } from './catchStack.svelte.ts';

/** The plate for a catch from (x, y) stage units (its icon pops up from there): its line, a second page when it's a
 *  first find (`added`), and my villager (or `who`: the partner's, their catch shown here) holding the item up (`hold`). */
export function showCatch(x: number, y: number, art: string, text: string, added = false, hold = true, who: CatchWho = 'mine') {
  if (hold) holdUp(who, art, HOLD_MS);
  pushCard({ x, y, art, parts: added ? [text, t('zukan.added')] : [text], ...(who !== 'mine' ? { who } : {}) });
}
