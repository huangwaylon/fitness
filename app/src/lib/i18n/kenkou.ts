// けんこう's strings (`health.*`): a catalog of their own, merged in when the tab's chunk loads, so the island's first
// load doesn't carry them. usage.test, linebreaks.test and fonts.test read them with the main catalogs.
import ja from './kenkou.ja.json';
import en from './kenkou.en.json';
import { addCatalog } from './index.ts';

addCatalog({ ja, en });
