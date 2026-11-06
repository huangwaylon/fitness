// ききみみ クイズ: every item as authored (docs/kikimimi.md "Content"), levels 1-3 (bank1.ts), level 4 (bank4.ts, its
// dialogues: dialogues.ts), the アナウンス pack (bank5.ts) and the content sprint's sets (content/). The compiler's input
// (compile.ts → levels/), the audio scripts' and the tests': never in the app's bundle (the sheet loads the compiled
// levels a chunk at a time: pool.ts). Its order is the bank's: each level's items in it are the deck's pool in order.
import type { Accent, Item } from './bank.ts';
import { BANK1 } from './bank1.ts';
import { BANK4, EXPOSURE } from './bank4.ts';
import { BANK5 } from './bank5.ts';
import { DIALOGUES } from './dialogues.ts';
import { CONTENT } from './content/index.ts';

/** An item tagged `accent-exposure` (やま, ほし: docs/curriculum.md "American English first") spoken in its speakers' UK
 *  or AU voices (bank4.ts EXPOSURE), a dialogue's other speaker keeping their US one; any other item as authored. */
function exposed(it: Item): Item {
  if (!it.tags?.features?.includes('accent-exposure')) return it;
  const lines = it.lines?.map((l) => ({ ...l, cast: EXPOSURE[l.who] ?? l.cast }));
  const cast = lines ? lines[0].cast : EXPOSURE[it.speaker] ?? it.cast;
  return cast ? { ...it, cast, voice: cast.slice(0, 2) as Accent, ...(lines && { lines }) } : it;
}

/** Every item, by level and type. */
export const BANK: readonly Item[] = [...BANK1, ...BANK4, ...DIALOGUES, ...BANK5, ...CONTENT].map(exposed);
