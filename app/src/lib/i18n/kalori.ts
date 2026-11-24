// The Kalori scraper's strings (`kalori.*`: ボット → Jobs' Menu update row): English only, as the Jobs page is
// (i18n/jobs.ts), the one catalog in both languages' place; merged in when ボット's chunk loads, so the island's first
// load doesn't carry them. usage.test and fonts.test read them.
import en from './kalori.en.json';
import { addCatalog } from './index.ts';

addCatalog({ ja: en, en });
