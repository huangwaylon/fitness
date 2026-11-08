// はつおん ききわけ's strings (`kiki.pair.*` but its mode's name and about, docs/kikimimi-mic.md "はつおん ききわけ"): a catalog of their
// own, merged in when its pages load (components/kikimimi/pair/). usage.test, linebreaks.test and fonts.test read them.
import ja from './kiki-pair.ja.json';
import en from './kiki-pair.en.json';
import { addCatalog } from './index.ts';

addCatalog({ ja, en });
