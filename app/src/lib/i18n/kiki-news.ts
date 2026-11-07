// しずえの ニュース's strings (`kiki.news.*` but the mode's name, docs/curriculum-wave2.md §2.5): a catalog of their own,
// merged in when the game's pages load (components/kikimimi/news/board.ts). usage.test, linebreaks.test and fonts.test
// read them.
import ja from './kiki-news.ja.json';
import en from './kiki-news.en.json';
import { addCatalog } from './index.ts';

addCatalog({ ja, en });
