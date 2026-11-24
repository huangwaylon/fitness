// ボット → 定期処理's strings (`jobs.*`): a catalog of their own, merged in when ボット's chunk loads (lib/jobs imports
// it), so the island's first load doesn't carry them. usage.test, linebreaks.test and fonts.test read them.
import ja from './jobs.ja.json';
import { addStrings } from './index.ts';

addStrings(ja, () => import('./jobs.en.json'));
