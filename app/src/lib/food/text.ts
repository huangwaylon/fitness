// Japanese-aware search keys for the meal log's food search (ported from the calorie PoC's core/text.js).

/** Spaces and common punctuation, ASCII and full width (｛｝＃ escaped: no copy shows them, so the trimmed font
 *  needn't, styles/fonts.test.ts). */
const PUNCT = /[\s　・･·、。，．,.\-‐－_/／()（）［］[\]\uff5b\uff5d{}「」『』【】〈〉《》<>"'’‘“”`!！?？:：;；~〜～&＆+＋*＊#\uff03]/g;
/** Romaji spelling variants folded to one form (Hepburn → Kunrei-ish), then the long vowels collapsed. */
const ROMAJI: readonly [RegExp, string][] = [
  [/shi/g, 'si'], [/chi/g, 'ti'], [/tsu/g, 'tu'], [/fu/g, 'hu'], [/ji/g, 'zi'], [/ou|oo/g, 'o'], [/uu/g, 'u'], [/aa/g, 'a'], [/ii/g, 'i'], [/ee/g, 'e']
];

/** The key both the indexed text and a query are compared by: NFKC, lower case, katakana → hiragana, no punctuation,
 *  long vowels folded (らーめん = らめん, nattou = natto). */
export function searchKey(s: string | null | undefined): string {
  if (!s) return '';
  let k = s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶヽヾ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .replace(PUNCT, '')
    .replace(/ー/g, '');
  if (/[a-z]/.test(k)) for (const [re, to] of ROMAJI) k = k.replace(re, to);
  return k;
}
