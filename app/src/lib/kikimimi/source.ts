// ききみみ クイズ: every item as authored (docs/kikimimi.md "Content"), levels 1-3 (bank1.ts), level 4 (bank4.ts, its
// dialogues: dialogues.ts), the アナウンス pack (bank5.ts) and the content sprint's sets (content/). The compiler's input
// (compile.ts → levels/), the audio scripts' and the tests': never in the app's bundle (the sheet loads the compiled
// levels a chunk at a time: pool.ts). Its order is the bank's: each level's items in it are the deck's pool in order.
import type { Item } from './bank.ts';
import { BANK1 } from './bank1.ts';
import { BANK4 } from './bank4.ts';
import { BANK5 } from './bank5.ts';
import { DIALOGUES } from './dialogues.ts';
import { CONTENT } from './content/index.ts';

/** Every item, by level and type. */
export const BANK: readonly Item[] = [...BANK1, ...BANK4, ...DIALOGUES, ...BANK5, ...CONTENT];
