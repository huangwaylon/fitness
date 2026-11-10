// まるごと 聞く's strings (`kiki.long.*` but the mode's name, docs/kikimimi.md "まるごと 聞く"): a catalog of their own,
// merged in when the game's pages load (components/kikimimi/long/board.ts). usage.test and linebreaks.test read them.
import ja from './kiki-long.ja.json';
import { addStrings } from './index.ts';

addStrings(ja, () => import('./kiki-long.en.json'));
