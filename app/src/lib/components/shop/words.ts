// Where a name in the shop's lists may break (PieceTile's: two lines of a ~100 px cell). WebKit has no
// `word-break: auto-phrase` and the segmenter splits NH's kana names badly (いし|のみずうけ, ラ|グ), so a name's words
// are its runs of one script (katakana, hiragana, the rest): a break where the script changes (ハロウィンな|ランタンセット),
// after a space or a mark (・ &), a particle kept on the word before it (サトウキビの|なえ), never a lone character on a
// line (マット・M, おサカナの); a run too long for a line breaks after a particle in it (まるたの|かべかけどけい) or where
// the segmenter ends a word in it (アイアン|ウォールランプ), only past the small size's line. The tile shows them `keep-all`
// with a <wbr> between. And where the twins' words stand: their balloon in the room (placeOf). Pure.

type Cls = 'K' | 'H' | 'O' | 'P';
const cls = (ch: string): Cls =>
  /[\p{Script=Katakana}ー]/u.test(ch) && ch !== '・' ? 'K' : /\p{Script=Hiragana}/u.test(ch) ? 'H' : /[\s・&＆～〜·.,、。!！?？()（）「」/-]/u.test(ch) ? 'P' : 'O';
/** Particles that end the word before them (NH's 「AのB」「AなB」). */
const PARTICLE = new Set(['の', 'な']);
/** Characters of a tile's line at the list's name size (--fs-s, 13 px, in a ~100 px cell) and at the small one
 *  (--fs-xs, 11 px: a name with a longer word). */
export const LINE = 7, LINE_XS = 9;
/** A word's length, its marks and spaces not counted. */
const len = (w: string): number => [...w].filter((c) => cls(c) !== 'P').length;

let seg: Intl.Segmenter | null = null;
/** A run longer than the small size's line, cut where the segmenter ends a word in it (or after a particle in a
 *  hiragana one): the cut that leaves the longer piece shortest (after a particle first), each piece 2+ long, again
 *  while a piece is still too long. */
function cut(w: string): string[] {
  seg ??= new Intl.Segmenter('ja', { granularity: 'word' });
  const chars = [...w], at = new Set<number>();
  for (const x of seg.segment(w)) at.add([...w.slice(0, x.index)].length);
  if (cls(chars[0]) === 'H') chars.forEach((c, i) => PARTICLE.has(c) && at.add(i + 1));
  const piece = (a: number, b: number) => len(chars.slice(a, b).join(''));
  let best = -1, cost = Infinity;
  for (const i of at) {
    if (piece(0, i) < 2 || piece(i, chars.length) < 2) continue;
    const c = Math.max(piece(0, i), piece(i, chars.length)) - (PARTICLE.has(chars[i - 1]) ? 3 : 0);
    if (c < cost) [best, cost] = [i, c];
  }
  if (best < 0) return [w];
  return [chars.slice(0, best).join(''), chars.slice(best).join('')].flatMap((p) => (len(p) > LINE_XS ? cut(p) : [p]));
}

/** `name`'s words in order (they join to it); one word for a language that breaks at its spaces anyway. */
export function words(name: string, locale = 'ja'): string[] {
  if (locale !== 'ja') return [name];
  // the runs: one script each, a mark or space on the run before it
  const runs: { w: string; c: Cls }[] = [];
  for (const ch of name) {
    const c = cls(ch), last = runs[runs.length - 1];
    if (last && (c === 'P' || (c === last.c && !/[\s・&＆]$/u.test(last.w)))) last.w += ch;
    else runs.push({ w: ch, c: c === 'P' ? 'O' : c });
  }
  // a particle after a word: on its line (the rest, a lone kana: all of it, ハトのす)
  for (let i = 1; i < runs.length; i++) {
    const r = runs[i], prev = runs[i - 1];
    if (r.c !== 'H' || prev.c === 'H' || !PARTICLE.has(r.w[0]) || len(prev.w) + 1 > LINE_XS) continue;
    if (len(r.w) <= 2) {
      prev.w += r.w;
      runs.splice(i--, 1);
    } else {
      prev.w += r.w[0];
      r.w = r.w.slice(1);
    }
  }
  // a lone character: with the word before it (the first, the one after)
  for (let i = 0; i < runs.length && runs.length > 1; i++) {
    if (len(runs[i].w) > 1) continue;
    if (i) runs[i - 1].w += runs[i].w;
    else runs[1].w = runs[0].w + runs[1].w;
    runs.splice(i--, 1);
  }
  // (a run the small size fits stays whole: the segmenter and a particle guess cut some wrongly, オオツノハナム|グリ,
  // たけの|このみずに)
  return runs.flatMap((r) => (r.c !== 'O' && len(r.w) > LINE_XS ? cut(r.w) : [r.w]));
}

/** Whether `name` wants the small size: a word longer than the line. */
export const isLong = (name: string, locale = 'ja'): boolean => words(name, locale).some((w) => len(w) > LINE);
/** The longest word's length (the test's: a word longer than LINE_XS still breaks inside, where it must). */
export const longest = (name: string): number => Math.max(...words(name).map(len));

/** The twins' balloon's half width at its widest: kept this far (and 8 px more) inside the room's sides. */
const SAY_HALF = 110;
export interface Place { x: number; y: number; tail: number }
/** Where the twins' balloon stands (client px, whole): over まめきち's head at `hx, hy`, kept inside the room's
 *  `left`..`right`, its tail off its middle toward him. */
export function placeOf(hx: number, hy: number, left: number, right: number): Place {
  const x = Math.round(Math.min(right - SAY_HALF - 8, Math.max(left + SAY_HALF + 8, hx)));
  return { x, y: Math.round(hy), tail: Math.round(Math.max(-SAY_HALF + 20, Math.min(SAY_HALF - 20, hx - x))) };
}
/** Whether two places (or none) are the same: a frame that moves nothing writes nothing. */
export const samePlace = <T extends { x: number; y: number; tail?: number }>(a: T | null, b: T | null): boolean =>
  a === b || (!!a && !!b && a.x === b.x && a.y === b.y && a.tail === b.tail);
