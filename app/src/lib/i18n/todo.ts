// やること's strings (`todo.*`, but the menu pill's, which is the main catalog's: panel.todo): a catalog of their own,
// merged in when the sheet's chunk loads (as 結婚式's, wedding.ts). usage.test, linebreaks.test and fonts.test read them.
import ja from './todo.ja.json';
import { addStrings } from './index.ts';

addStrings(ja, () => import('./todo.en.json'));
