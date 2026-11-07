// ようじ でんわ's strings (`kiki.call.*` but the hub tiles' names, docs/curriculum-wave2.md §2.3): a catalog of their own,
// merged in when the game's pages load (components/kikimimi/call/board.ts). usage.test, linebreaks.test and fonts.test
// read them.
import ja from './kiki-call.ja.json';
import en from './kiki-call.en.json';
import { addCatalog } from './index.ts';

addCatalog({ ja, en });
