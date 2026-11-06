// りょこう's strings (`travel.*`, but the menu pill's, which is the main catalog's): a catalog of their own, merged in
// when the trips' sheet's chunk loads (as ききみみ's, kikimimi.ts), so the island's first load doesn't carry them.
// usage.test, linebreaks.test and fonts.test read them. The guides' own text is in their data (lib/travel/trips).
import ja from './travel.ja.json';
import en from './travel.en.json';
import { addCatalog } from './index.ts';

addCatalog({ ja, en });
