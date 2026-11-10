// しずえの ニュース's strings (`kiki.news.*` but the mode's name, docs/kikimimi-engine.md "しずえの ニュース"): a catalog of their own,
// merged in when the game's pages load (components/kikimimi/news/board.ts). usage.test, linebreaks.test and fonts.test
// read them.
import ja from './kiki-news.ja.json';
import { addStrings } from './index.ts';

addStrings(ja, () => import('./kiki-news.en.json'));
