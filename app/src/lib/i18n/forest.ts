// くまのもり's strings (`forest.*`): a catalog of their own per language, merged in when the forest first opens, only
// the language on screen.
import { addCatalog, type Locale } from './index.ts';

const loading: Partial<Record<Locale, Promise<void>>> = {};

/** Load the forest's strings for `locale` (once). */
export function loadForestStrings(locale: Locale): Promise<void> {
  return (loading[locale] ??= (locale === 'ja' ? import('./forest.ja.json') : import('./forest.en.json')).then(
    (m) => addCatalog(locale === 'ja' ? { ja: m.default, en: {} } : { ja: {}, en: m.default }),
    (e: unknown) => {
      delete loading[locale];
      throw e;
    }
  ));
}
