// The maps' own chrome strings (docs/design.md "Maps"): pairs, both sides always, in normal Japanese with kanji (a
// sheet's, not the island's spaced kana). One spelling each for every map.
import type { Locale } from '#lib/i18n/index.ts';

type Pair = Record<Locale, string>;

export const MS = {
  /** The layers button and its panel (MapLayers). */
  layers: { ja: '表示', en: 'Show' },
  /** The location refused (a map's note, NOTE_MS): what it is, and where to turn it on (Settings' Safari, under アプリ
   *  since iOS 18: the path past it not confirmed for iOS 27, so named from Safari). */
  refused: { ja: '位置情報がオフです\n設定の Safari › 位置情報', en: 'Location is off\nSettings: Safari › Location' },
  /** iOS asking again (askAgain.ts: once per phone): the same place, its 許可 to keep the answer. */
  again: { ja: '毎回たずねられる場合は\n設定の Safari › 位置情報 を「許可」に', en: 'Asked every time?\nSettings: Safari › Location › Allow' }
} as const satisfies Record<string, Pair>;
