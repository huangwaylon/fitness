// ことば タイル's strings (`kiki.tile.*` but the hub tiles' names, docs/curriculum-wave2.md §2.1): a catalog of their own,
// merged in when the game's lane loads (games/tile/lane.ts). usage.test, linebreaks.test and fonts.test read them.
import ja from './kiki-tile.ja.json';
import en from './kiki-tile.en.json';
import { addCatalog } from './index.ts';

addCatalog({ ja, en });
