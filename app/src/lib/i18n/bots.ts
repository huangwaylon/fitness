// ボット's shared strings (`bots.*`: the tabs, the one verdict word table `bots.w.*`, the page's skeleton): a catalog
// of their own, merged in when ボット's chunk loads (each bot's lib imports it), so the island's first load carries only
// the menu's 「要対応」 (bots.attention, bots.say). usage.test, linebreaks.test and fonts.test read them.
import ja from './bots.ja.json';
import { addStrings } from './index.ts';

addStrings(ja, () => import('./bots.en.json'));
