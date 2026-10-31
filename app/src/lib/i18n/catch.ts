// The names of everything the island lets us catch, dig up or pick up (`critter.name.*`, `sea.name.*`, `beach.name.*`,
// `fossil.set.*`): a catalog of their own, merged in when it first matters (the first critter's catch lines, a beach
// find's plate, the ずかん in the panel), so the island's first load doesn't carry them. usage.test, linebreaks.test and
// fonts.test read them with the main catalogs.
import ja from './catch.ja.json';
import en from './catch.en.json';
import { addCatalog } from './index.ts';

addCatalog({ ja, en });
