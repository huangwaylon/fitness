// ごはん's strings (`food.*`): a catalog of their own, merged in when the meal log's chunk loads (as けんこう's,
// kenkou.ts), so the island's first load doesn't carry them. usage.test, linebreaks.test and fonts.test read them.
import ja from './food.ja.json';
import en from './food.en.json';
import { addCatalog } from './index.ts';

addCatalog({ ja, en });
