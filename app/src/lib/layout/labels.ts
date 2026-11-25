// The editor's names for the kinds (docs/island-layout.md "The editor"; the user, 2026-11-25): normal kanji Japanese
// where the catalogue's name (`ja`: NH's, the island world's spaced-kana copy) is a kana spelling of a kanji word
// (いしどうろう → 石灯籠), else that name as it is (katakana and words written in kana stay: ランタン, やかん, かかし);
// a home by its owner (ウェイの家). The kanji names are the editor's (components/editor/kanjiNames.ts adds them as it
// loads: never in the island's first load): its palette, its inspector, its checks' texts (validate.ts); the island
// world keeps `ja`.
import { kindDef } from './catalog.ts';
import { WHO_OF_HOME } from './homes.ts';

export const OWNER_NAME: Readonly<Record<'A' | 'B' | 'G', string>> = { A: 'ウェイ', B: 'うめ', G: 'ゲスト' };

const KANJI: Record<string, string> = {};
/** The editor's kanji names in (`kind` → name). */
export const addLabels = (names: Readonly<Record<string, string>>): void => void Object.assign(KANJI, names);

/** A kind's name in the editor (a home's, its id given: its owner's); an unknown kind its key. */
export function labelOf(k: string, id?: string): string {
  const who = k === 'home' && id ? WHO_OF_HOME[id] : undefined;
  if (who) return `${OWNER_NAME[who]}の家`;
  return KANJI[k] ?? kindDef(k)?.ja ?? k;
}
