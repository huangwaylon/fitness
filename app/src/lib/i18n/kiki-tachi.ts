// たちぎき's strings (`kiki.tachi.*` but the hub tiles' names, docs/curriculum-wave2.md §2.2): a catalog of their own,
// merged in when the game's pages load (components/kikimimi/tachi/board.ts). usage.test, linebreaks.test and fonts.test
// read them.
import ja from './kiki-tachi.ja.json';
import en from './kiki-tachi.en.json';
import { addCatalog } from './index.ts';

addCatalog({ ja, en });
