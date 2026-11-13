// The shop's names break only between words (shop/words.ts): over every name its lists can show (the furniture's, the
// pocket's, the starts'), each break is where the script changes or after a space or mark (never inside a katakana or
// a hiragana run: サトウキ|ビ), no word is a lone character, and a word fits the tile's line at its size.
import { describe, expect, it } from 'vitest';
import { SELL } from '#lib/contract/shopPrices.ts';
import tent from '#lib/i18n/tent.ja.json';
import catchJa from '#lib/i18n/catch.ja.json';
import main from '#lib/i18n/ja.json';
import { bare } from '#lib/world/critters.ts';
import { pocketItem } from './pocket.ts';
import { LINE, LINE_XS, isLong, longest, placeOf, samePlace, words } from './words.ts';

const tentNames: Record<string, string> = tent, catchNames: Record<string, string> = catchJa, mainNames: Record<string, string> = main;
const NAMES = [
  ...Object.entries(tentNames).filter(([k]) => k.startsWith('tent.item.')).map(([, v]) => v),
  ...Object.keys(SELL).flatMap((k) => (pocketItem(k) ? [bare(catchNames[pocketItem(k)!.name] ?? '')] : [])),
  ...Object.entries(mainNames).filter(([k]) => k.startsWith('farm.start.')).map(([, v]) => v)
].filter(Boolean);
const KANA = (c: string) => (/[\p{Script=Katakana}ー]/u.test(c) && c !== '・' ? 'K' : /\p{Script=Hiragana}/u.test(c) ? 'H' : null);
const seg = new Intl.Segmenter('ja', { granularity: 'word' });
/** Where the segmenter ends a word in `s` (character offsets). */
const ends = (s: string) => new Set([...seg.segment(s)].map((x) => [...s.slice(0, x.index + x.segment.length)].length));
/** Whether a break at character i of `s` is inside a word: between two characters of one kana script, not after a
 *  particle, not where the segmenter ends a word. */
const inside = (s: string, i: number) => {
  const c = [...s];
  return !!KANA(c[i - 1]) && KANA(c[i - 1]) === KANA(c[i]) && !/[のな]/.test(c[i - 1]) && !ends(s).has(i);
};
/** A word the segmenter can't cut (one dictionary word: ナポレオンフィッシュ). */
/** What a line can't start with (Japanese line breaking: a long vowel mark, a small kana). */
const NO_START = /^[ーァィゥェォッャュョヮヵヶぁぃぅぇぉっゃゅょゎ]/u;
const oneWord = (w: string) => [...seg.segment(w.replace(/[のな]$/, ''))].length === 1;

describe('shop names: where they break', () => {
  it('by script, a particle on its word, no lone character, a long run cut between its words', () => {
    expect(words('サトウキビのなえ')).toEqual(['サトウキビの', 'なえ']);
    expect(words('サトウキビの苗')).toEqual(['サトウキビの苗']);
    expect(words('サンクスギビングなラグ')).toEqual(['サンクスギビングな', 'ラグ']);
    expect(words('ハロウィンなランタンセット')).toEqual(['ハロウィンな', 'ランタンセット']);
    expect(words('いしのみずうけ～もみじ～')).toEqual(['いしの', 'みずうけ～もみじ～']);
    expect(words('まるたのかべかけどけい')).toEqual(['まるたの', 'かべかけどけい']);
    expect(words('たけのこのみずに')).toEqual(['たけのこのみずに']);
    expect(words('アイアンウォールランプ')).toEqual(['アイアン', 'ウォールランプ']);
    expect(words('ディレクターズチェア')).toEqual(['ディレクターズ', 'チェア']);
    expect(words('サンドウィッチプレート')).toEqual(['サンドウィッチ', 'プレート']);
    expect(words('おサカナのラグ')).toEqual(['おサカナの', 'ラグ']);
    expect(words('ハトのすサブレ')).toEqual(['ハトのす', 'サブレ']);
    expect(words('あおいラウンドマット・M')).toEqual(['あおい', 'ラウンドマット・M']);
    expect(words('ゴライアス オオツノハナムグリ')).toEqual(['ゴライアス ', 'オオツノハナムグリ']);
    expect(words('Plastic bench', 'en')).toEqual(['Plastic bench']);
  });
  it('every name breaks only between words, into words of 2+ characters that fit the line', () => {
    expect(NAMES.length).toBeGreaterThan(2000);
    const bad: string[] = [];
    for (const n of NAMES) {
      const ws = words(n);
      let i = 0;
      const between = ws.slice(0, -1).every((w) => ((i += [...w].length), !inside(n, i)));
      // (and no line starts with a mark that can't, ディレクタ|ーズチェア, nor ends on a small ッ, サンドウィッ|チ)
      const head = ws.slice(1).every((w) => !NO_START.test(w)) && ws.slice(0, -1).every((w) => !/[ッっ]$/u.test(w));
      const noLone = ws.length === 1 || ws.every((w) => [...w].filter((c) => !/[\s・&～]/u.test(c)).length > 1);
      const fits = ws.every((w) => longest(w) <= (isLong(n) ? LINE_XS : LINE) || /^[ -~]+$/.test(w) || oneWord(w));
      if (ws.join('') !== n || !between || !head || !noLone || !fits) bad.push(`${n} → ${ws.join('|')}`);
    }
    expect(bad).toEqual([]);
  });
});

describe('the twins’ balloon (placeOf): over まめきち, kept inside the room, its tail toward him', () => {
  it('stands over his head in whole px; at a side, held 118 px in with its tail (at most 90) pointing out to him', () => {
    expect(placeOf(200.4, 300.6, 0, 393)).toEqual({ x: 200, y: 301, tail: 0 });
    expect(placeOf(380, 300, 0, 393)).toEqual({ x: 275, y: 300, tail: 90 });
    expect(placeOf(20, 300, 0, 393)).toEqual({ x: 118, y: 300, tail: -90 });
  });
  it('a frame that moves nothing writes nothing: the same place (or none twice) is the same', () => {
    expect(samePlace(placeOf(200.2, 300, 0, 393), placeOf(199.8, 300, 0, 393))).toBe(true);
    expect(samePlace(placeOf(200, 300, 0, 393), placeOf(202, 300, 0, 393))).toBe(false);
    expect(samePlace(null, null)).toBe(true);
    expect(samePlace({ x: 1, y: 2 }, null)).toBe(false);
  });
});
