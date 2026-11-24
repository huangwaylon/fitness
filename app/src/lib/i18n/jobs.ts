// ボット → Jobs' strings (`jobs.*`): English only, by design (the user's ask, 2026-11-24: the page reads English
// whatever the app's language), the one catalog in both languages' place; merged in when ボット's chunk loads (lib/jobs
// imports it), so the island's first load doesn't carry them. The page's shared parts (bots.*, the dates) are English
// there too (JobsPage pins it: index.ts pinLocale), and the tab's name in the bar (BotsSheet), so English's catalog
// loads with them. usage.test and fonts.test read them.
import en from './jobs.en.json';
import { addCatalog, loadEnglish } from './index.ts';
import { swallowed } from '#lib/quiet.ts';

addCatalog({ ja: en, en });
void loadEnglish().catch(() => swallowed('i18n.en'));
