// A catch's plate (Plate.svelte, in the bottom stack: catchStack.svelte.ts), shared by the critters, the beach finds, a
// shaken tree's bugs and the partner's news (docs/design.md "Critters", "Beach finds").
import { t } from '#lib/i18n/index.ts';
import { pushCard, type CatchWho } from './catchStack.svelte.ts';

/** The plate for a catch from (x, y) stage units (its icon pops up from there): its line, a second page when it's a
 *  first find (`added`), and whose it is (`who`: the partner's or the guest's, their catch shown here). */
export function showCatch(x: number, y: number, art: string, text: string, added = false, who: CatchWho = 'mine') {
  pushCard({ x, y, art, parts: added ? [text, t('zukan.added')] : [text], ...(who !== 'mine' ? { who } : {}) });
}
