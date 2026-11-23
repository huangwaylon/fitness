// 保存した場所's search key (docs/places.md "Search"): the food search's (food/text.ts searchKey: NFKC, lower case,
// katakana → hiragana, no punctuation, romaji folded), then the long vowels dropped and the small kana made full size,
// so らーめん, ラーメン and ﾗｰﾒﾝ meet, as do きっさ and きつさ; a Latin letter's accents dropped first (Phở → pho, café →
// cafe, Hà Nội → hanoi; on Latin letters only: a kana's dakuten stay, が ≠ か). Pure.
import { searchKey } from '../food/text.ts';

const SMALL: Record<string, string> = { ぁ: 'あ', ぃ: 'い', ぅ: 'う', ぇ: 'え', ぉ: 'お', っ: 'つ', ゃ: 'や', ゅ: 'ゆ', ょ: 'よ', ゎ: 'わ', ゕ: 'か', ゖ: 'け' };
const FOLD = /[ぁぃぅぇぉっゃゅょゎゕゖー]/g;

/** Latin letters with marks (Latin-1, Extended-A/B, Extended Additional: Vietnamese). */
const ACCENTED = /[À-ɏḀ-ỿ]/g;
const unmark = (c: string): string => (c === 'đ' || c === 'Đ' ? 'd' : c === 'ø' || c === 'Ø' ? 'o' : c === 'ß' ? 'ss' : c.normalize('NFD').replace(/\p{M}/gu, ''));

/** The key a place's text and a query are compared by. */
export const placeKey = (s: string | null | undefined): string => searchKey(s && s.replace(ACCENTED, unmark)).replace(FOLD, (c) => SMALL[c] ?? '');

/** Whether every character of `q` appears in `k` in order, within a span of at most twice `q`'s length (a fuzzy name
 *  hit: a missed or extra kana, とんかつ for とんかつ屋 is a substring already). 0: no; else the span (smaller is closer). */
export function subseq(k: string, q: string): number {
  if (q.length < 2) return 0;
  let best = 0;
  for (let s = k.indexOf(q[0]); s !== -1; s = k.indexOf(q[0], s + 1)) {
    let i = 1, j = s + 1;
    for (; i < q.length && j < k.length; j++) if (k[j] === q[i]) i++;
    if (i < q.length) break;
    const span = j - s;
    if (span <= q.length * 2 && (!best || span < best)) best = span;
  }
  return best;
}
