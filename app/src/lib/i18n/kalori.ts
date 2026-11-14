// The Kalori scraper's strings (`kalori.*`: ボット's メニュー tab): a catalog of their own, merged in when ボット's chunk
// loads, so the island's first load doesn't carry them. usage.test, linebreaks.test and fonts.test read them.
import ja from './kalori.ja.json';
import { addStrings } from './index.ts';

addStrings(ja, () => import('./kalori.en.json'));
