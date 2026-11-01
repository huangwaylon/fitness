// The balloon catalogue's names (`item.name.*`, `recipe.name.*`: ~2,000 items and recipes, official ja/en from
// scripts/catalog.ts): a catalog of their own per language, merged in when it first matters (a present opened, the
// ずかん's カタログ or レシピ page), only the language on screen.
import { addCatalog, type Locale } from './index.ts';

const loading: Partial<Record<Locale, Promise<void>>> = {};

function load(locale: Locale): Promise<void> {
  return (loading[locale] ??= (locale === 'ja' ? import('./catalog.ja.json') : import('./catalog.en.json')).then(
    (m) => addCatalog(locale === 'ja' ? { ja: m.default, en: {} } : { ja: {}, en: m.default }),
    (e: unknown) => {
      delete loading[locale];
      throw e;
    }
  ));
}

/** Load the catalogue's names for `locale` (once). */
export const loadCatalogNames = (locale: Locale): Promise<void> => load(locale);
