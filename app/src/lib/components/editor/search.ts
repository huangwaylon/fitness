// The palette's search (Palette.svelte): a kind found by its editor name (kanji: labels.ts), its catalogue name (kana,
// hiragana or katakana alike), its English name, or its kana name typed in romaji (Hepburn or kunrei: "ishidourou",
// "isidourou"). Pure.
import type { KindDef } from '#lib/layout/catalog.ts';
import { labelOf } from '#lib/layout/labels.ts';

/** Width, case and kana folded (katakana as hiragana), spaces, dots and long marks dropped. */
function fold(s: string): string {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[\s・ー\-'’]/g, '');
}

const MORA: Record<string, string> = {};
const ROWS: [string, string][] = [
  ['あいうえお', ''], ['かきくけこ', 'k'], ['さしすせそ', 's'], ['たちつてと', 't'], ['なにぬねの', 'n'], ['はひふへほ', 'h'], ['まみむめも', 'm'],
  ['らりるれろ', 'r'], ['がぎぐげご', 'g'], ['ざじずぜぞ', 'z'], ['だぢづでど', 'd'], ['ばびぶべぼ', 'b'], ['ぱぴぷぺぽ', 'p']
];
for (const [kana, c] of ROWS) [...kana].forEach((k, i) => (MORA[k] = c + 'aiueo'[i]));
Object.assign(MORA, { や: 'ya', ゆ: 'yu', よ: 'yo', わ: 'wa', を: 'o', ん: 'n', ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o', ゔ: 'bu', ぢ: 'zi', づ: 'zu' });
const SMALL: Record<string, string> = { ゃ: 'a', ゅ: 'u', ょ: 'o' };

/** Folded kana in kunrei romaji (し si, ち ti, つ tu, ふ hu, じ zi; しゃ sya; っ the next consonant twice); the rest kept. */
export function romaji(kana: string): string {
  let out = '';
  const s = fold(kana);
  for (let i = 0; i < s.length; i++) {
    const ch = s[i], m = MORA[ch];
    if (ch === 'っ') {
      out += MORA[s[i + 1]]?.[0] ?? '';
      continue;
    }
    if (m && SMALL[s[i + 1]] && m.length === 2) {
      out += m[0] + 'y' + SMALL[s[++i]];
      continue;
    }
    out += m ?? ch;
  }
  return out;
}

/** Romaji as typed (Hepburn, IME habits) in kunrei, as `romaji` writes it. */
export function kunrei(q: string): string {
  return fold(q)
    .replace(/sh(?=[aiueo])/g, 'sy').replace(/sy(?=i)/g, 's')
    .replace(/tch/g, 'tty').replace(/ch(?=[aiueo])/g, 'ty').replace(/ty(?=i)/g, 't')
    .replace(/tsu/g, 'tu').replace(/fu/g, 'hu').replace(/j(?=[aueo])/g, 'zy').replace(/ji/g, 'zi')
    .replace(/nn(?=[^aiueoyn]|$)/g, 'n')
    // (a word half typed: "ish", "ch", "ts", "j")
    .replace(/(sh|ch|ts)$/, (m) => (m === 'ch' ? 't' : m[0])).replace(/j$/, 'z');
}

const hay = new Map<string, string[]>();
/** Whether a kind answers a query (every word of it found in one of its names). Empty: every kind. */
export function kindMatches(d: KindDef, q: string): boolean {
  const words = q.split(/[\s　]+/).map(fold).filter(Boolean);
  if (!words.length) return true;
  let h = hay.get(d.k);
  if (!h) hay.set(d.k, (h = [fold(labelOf(d.k)), fold(d.ja), fold(d.en), romaji(d.ja)]));
  return words.every((w) => h.some((x) => x.includes(w)) || (/^[a-z']+$/.test(w) && h[3].includes(kunrei(w))));
}
