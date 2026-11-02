// The tent's names (`tent.item.*`, `tent.wall.*`, `tent.floor.*`: NH's own ja/en from scripts/room-models.ts): a
// catalog of their own per language, merged in when the tent first opens, only the language on screen.
import { addCatalog, type Locale } from './index.ts';

const loading: Partial<Record<Locale, Promise<void>>> = {};

/** Load the tent's names for `locale` (once). */
export function loadTentNames(locale: Locale): Promise<void> {
  return (loading[locale] ??= (locale === 'ja' ? import('./tent.ja.json') : import('./tent.en.json')).then(
    (m) => addCatalog(locale === 'ja' ? { ja: m.default, en: {} } : { ja: {}, en: m.default }),
    (e: unknown) => {
      delete loading[locale];
      throw e;
    }
  ));
}
