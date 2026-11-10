// まねっこ シャドーイング's strings (`kiki.mane.*` but its mode's name and about, docs/kikimimi-mic.md "まねっこ シャドーイング"): a catalog of
// their own, merged in when its pages load (components/kikimimi/mane/). usage.test, linebreaks.test and fonts.test read
// them.
import ja from './kiki-mane.ja.json';
import { addStrings } from './index.ts';

addStrings(ja, () => import('./kiki-mane.en.json'));
