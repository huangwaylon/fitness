// ききみみ クイズ: every item as authored (docs/kikimimi-engine.md "Content"), levels 1-3 (bank1.ts), level 4 (bank4.ts, its
// dialogues: dialogues.ts), the アナウンス pack (bank5.ts) and the content sprint's sets (content/). The compiler's input
// (compile.ts → levels/), the audio scripts' and the tests': never in the app's bundle (the sheet loads the compiled
// levels a chunk at a time: pool.ts). Its order is the bank's: each level's items in it are the deck's pool in order.
//   A set that waits for its voices (content/index.ts WAITING: written after its levels were offered) joins the bank an
// item at a time, as each item's clips are made: a level that took an item without its clip would hide whole
// (compile.ts playable). The audio scripts and the content tests read AUTHORED, everything as written.
import { accentOf, type Item } from './bank.ts';
import { BANK1 } from './bank1.ts';
import { BANK4 } from './bank4.ts';
import { EXPOSURE } from './cast.ts';
import { BANK5 } from './bank5.ts';
import { DIALOGUES } from './dialogues.ts';
import { CONTENT, WAITING } from './content/index.ts';
import { voiced } from './clips.ts';
import clipsJson from './clips.json' with { type: 'json' };

/** An item tagged `accent-exposure` (やま, ほし: docs/curriculum.md "American English first") spoken in its speakers' UK
 *  or AU voices (cast.ts EXPOSURE), a dialogue's other speaker keeping their US one; any other item as authored. */
function exposed(it: Item): Item {
  if (!it.tags?.features?.includes('accent-exposure')) return it;
  const lines = it.lines?.map((l) => ({ ...l, cast: EXPOSURE[l.who] ?? l.cast }));
  const cast = lines ? lines[0].cast : EXPOSURE[it.speaker] ?? it.cast;
  return cast ? { ...it, cast, voice: accentOf(cast), ...(lines && { lines }) } : it;
}

/** Every item as written, by level and type. */
export const AUTHORED: readonly Item[] = [...BANK1, ...BANK4, ...DIALOGUES, ...BANK5, ...CONTENT].map(exposed);

/** The bank for these clips: every item, but a waiting set's only once voiced. */
export const joined = (clips: Readonly<Record<string, unknown>>): readonly Item[] => AUTHORED.filter((it) => !WAITING.has(it.id) || voiced(it, clips));

/** Every item in play (clips.json's), by level and type. */
export const BANK: readonly Item[] = joined(clipsJson);
