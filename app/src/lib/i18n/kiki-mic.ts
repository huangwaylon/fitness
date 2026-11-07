// ききみみ's mic strings (`kiki.mic.*`, docs/kikimimi-mic.md): a catalog of their own, merged in when the probe's chunk
// loads. usage.test, linebreaks.test and fonts.test read them.
import ja from './kiki-mic.ja.json';
import en from './kiki-mic.en.json';
import { addCatalog } from './index.ts';

addCatalog({ ja, en });
