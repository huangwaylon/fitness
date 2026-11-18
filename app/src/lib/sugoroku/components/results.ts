// 英語すごろく's results (docs/sugoroku.md "Rules"): a team game, so no ranking: each player's one good thing and
// ふりかえり's pairs. Pure.
import type { Game } from '../game.ts';
import { s } from '../i18n.ts';

/** Player `k`'s one good thing: their longest word (5+ letters), the pictures they spelt, the lines they put right, any
 *  word, else a thank-you. */
export function highlightOf(g: Game, k: number): string {
  const mine = g.made.filter((m) => m.p === k);
  const longest = mine.filter((m) => m.kind === 'word').sort((a, b) => b.text.length - a.text.length)[0];
  const pics = mine.filter((m) => m.kind === 'picture').length, lines = mine.filter((m) => m.kind === 'sentence').length;
  if (longest && longest.text.length >= 5) return s('hlLongest', { w: longest.text });
  if (pics) return s('hlPics', { n: pics });
  if (lines) return s('hlLines', { n: lines });
  if (longest) return s('hlWord', { w: longest.text });
  return s('hlCheer');
}

/** ふりかえり's pairs: the game's things with Japanese, newest first, each English and each Japanese once, up to five. */
export function pairsOf(g: Game): { en: string; ja: string }[] {
  const out: { en: string; ja: string }[] = [];
  for (const m of [...g.made].reverse()) {
    if (out.length >= 5) break;
    if (m.ja && !out.some((x) => x.en === m.text || x.ja === m.ja)) out.push({ en: m.text, ja: m.ja });
  }
  return out;
}
