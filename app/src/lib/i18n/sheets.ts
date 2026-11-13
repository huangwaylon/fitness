// The lazy sheets' and rooms' strings (`goal.*` けんこう's goals, `museum.*`, `harvest.*`,
// `offline.*` the saved map areas, `homes.*` the editor's houses, `pair.*` the pairing page): a catalog of their own,
// merged in when the first module naming them loads (each imports this), so the island's first load doesn't carry
// them. usage.test, linebreaks.test and fonts.test read them with the main catalogs.
import ja from './sheets.ja.json';
import { addStrings } from './index.ts';

addStrings(ja, () => import('./sheets.en.json'));
