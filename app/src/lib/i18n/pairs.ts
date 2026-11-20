// An area's own string table beside its code ({ key: { ja, en } }: English Study, すごろく, speech): `s(key, params)` in
// the reader's locale with `{name}` filled in, and `jaStrings()`, the Japanese table for the house copy checks
// (i18n/linebreaks.test.ts).   export const { s, jaStrings } = pairs(S);
import { i18n } from './index.ts';

export function pairs<K extends string>(table: Record<K, { ja: string; en: string }>) {
  return {
    s: (key: K, params: Record<string, string | number> = {}): string =>
      table[key][i18n.locale === 'en' ? 'en' : 'ja'].replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? '')),
    jaStrings: (): Record<string, string> => Object.fromEntries(Object.entries<{ ja: string }>(table).map(([k, v]) => [k, v.ja]))
  };
}
