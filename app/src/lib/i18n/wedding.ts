// けっこんしき's strings (`wed.*`, but the menu pill's, which is the main catalog's: panel.wedding): a catalog of their
// own, merged in when the board's sheet's chunk loads (as ききみみ's, kikimimi.ts), so the island's first load doesn't
// carry them. usage.test, linebreaks.test and fonts.test read them.
import ja from './wedding.ja.json';
import { addStrings } from './index.ts';

addStrings(ja, () => import('./wedding.en.json'));
