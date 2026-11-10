// すうじ ラッシュ's strings (`kiki.rush.*` but the hub tiles' names, docs/kikimimi-engine.md "すうじ ラッシュ"): a catalog of their
// own, merged in when the game's pages load (components/kikimimi/rush/board.ts). usage.test, linebreaks.test and
// fonts.test read them.
import ja from './kiki-rush.ja.json';
import { addStrings } from './index.ts';

addStrings(ja, () => import('./kiki-rush.en.json'));
