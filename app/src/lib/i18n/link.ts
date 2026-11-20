// The 共有リンク visitor page's strings (`link.*`: routes/s, components/share): a catalog of their own, merged in with
// the page's chunk, so the island's first load doesn't carry them. Imported after i18n/travel.ts: on this page a
// guide's 🔒 (travel/Txt, Links) says 非公開, not the app's オンラインで表示 (the visitor never gets the trip note); its
// English after the trips' (their part's import first, so its strings land after theirs).
import '#lib/i18n/travel.ts';
import ja from './link.ja.json';
import { addStrings } from './index.ts';

const privately = (c: Record<string, string>) => ({ ...c, 'travel.locked': c['link.private'], 'travel.lockedLink': c['link.private'] });
addStrings(privately(ja), () => import('./travel.en.json').then(() => import('./link.en.json')).then((m) => ({ default: privately(m.default) })));
