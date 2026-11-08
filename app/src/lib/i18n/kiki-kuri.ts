// くりかえし チャレンジ's strings (`kiki.kuri.*` but the hub tile's name, docs/kikimimi-mic.md "くりかえし チャレンジ"): a catalog of their
// own, merged in when the game's pages load (components/kikimimi/kuri/board.ts). usage.test, linebreaks.test and
// fonts.test read them.
import ja from './kiki-kuri.ja.json';
import en from './kiki-kuri.en.json';
import { addCatalog } from './index.ts';

addCatalog({ ja, en });
