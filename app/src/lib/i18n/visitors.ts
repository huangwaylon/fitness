// The special visitors' lines (`chat.sp.*`: their intros, asks and thanks; `visitor.*`: their sheet, K.K.'s): a catalog of their own, merged in when
// visitor.svelte.ts's or kk.svelte.ts's chunk loads, out of the island's first load (~5 KB gz). usage.test,
// linebreaks.test and fonts.test read them with the main catalogs.
import ja from './visitors.ja.json';
import { addStrings } from './index.ts';

addStrings(ja, () => import('./visitors.en.json'));
