// 保養所ボット's strings (`its.*`: ボット's 保養所 tab, the ITS booker's settings and status): a catalog of
// their own, merged in when ボット's chunk loads, so the island's first load doesn't carry them. usage.test,
// linebreaks.test and fonts.test read them.
import ja from './its.ja.json';
import { addStrings } from './index.ts';

addStrings(ja, () => import('./its.en.json'));
