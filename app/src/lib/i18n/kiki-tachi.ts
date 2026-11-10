// たちぎき's strings (`kiki.tachi.*` but the hub tiles' names, docs/kikimimi-engine.md "たちぎき"): a catalog of their own,
// merged in when the game's pages load (components/kikimimi/tachi/board.ts). usage.test, linebreaks.test and fonts.test
// read them.
import ja from './kiki-tachi.ja.json';
import { addStrings } from './index.ts';

addStrings(ja, () => import('./kiki-tachi.en.json'));
