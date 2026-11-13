// ジムボット's strings (`gym.*`: ボット's ジム tab, the gym bot's status): a catalog of their own, merged in
// when ボット's chunk loads, so the island's first load doesn't carry them. usage.test, linebreaks.test and fonts.test
// read them.
import ja from './gym.ja.json';
import { addStrings } from './index.ts';

addStrings(ja, () => import('./gym.en.json'));
