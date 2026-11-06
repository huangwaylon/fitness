// りょこう's packing list's strings (`travel.pack.*`): a catalog of their own, merged in when the list's chunk loads
// (components/travel/PackList.svelte, as ききみみ's kikimimi.ts), so the island's first load doesn't carry them.
// usage.test, linebreaks.test and fonts.test read them.
import ja from './travelPack.ja.json';
import en from './travelPack.en.json';
import { addCatalog } from './index.ts';

addCatalog({ ja, en });
