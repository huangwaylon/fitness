// ようじ でんわ's strings (`kiki.call.*` but the hub tiles' names, docs/kikimimi-engine.md "ようじ でんわ"): a catalog of their own,
// merged in when the game's pages load (components/kikimimi/call/board.ts). usage.test, linebreaks.test and fonts.test
// read them.
import ja from './kiki-call.ja.json';
import { addStrings } from './index.ts';

addStrings(ja, () => import('./kiki-call.en.json'));
