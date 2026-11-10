// ききみみ クイズ's strings (`kiki.*`, but the invite banner's and せってい's row, which are the main catalog's): a catalog
// of their own, merged in when the game's sheet's chunk loads (as ごはん's, food.ts), so the island's first load doesn't
// carry them. usage.test, linebreaks.test and fonts.test read them.
import ja from './kikimimi.ja.json';
import { addStrings } from './index.ts';

addStrings(ja, () => import('./kikimimi.en.json'));
