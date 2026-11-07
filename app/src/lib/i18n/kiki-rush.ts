// すうじ ラッシュ's strings (`kiki.rush.*` but the hub tiles' names, docs/curriculum-wave2.md §2.4): a catalog of their
// own, merged in when the game's pages load (components/kikimimi/rush/board.ts). usage.test, linebreaks.test and
// fonts.test read them.
import ja from './kiki-rush.ja.json';
import en from './kiki-rush.en.json';
import { addCatalog } from './index.ts';

addCatalog({ ja, en });
