// 音の へんしん's strings (`kiki.henshin.*` but the hub tile's name, docs/kikimimi.md "音の へんしん"): a catalog of their own,
// merged in when the drill's pages load. usage.test, linebreaks.test and fonts.test read them.
import ja from './kiki-henshin.ja.json';
import en from './kiki-henshin.en.json';
import { addCatalog } from './index.ts';

addCatalog({ ja, en });
