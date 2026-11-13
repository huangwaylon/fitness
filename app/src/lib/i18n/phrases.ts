// Where a line of Japanese may wrap, by phrase (文節), for WebKit, which has no `word-break: auto-phrase`: after
// 、。！？ and after a run of hiragana (a phrase's particle or ending) before anything else. Shown with keep-all and a
// <wbr> between the phrases (ui/Toast.svelte): 「23個を / 5,026かいがらで / 買いました。/ 模様替えに / 入っています」, never
// 「買いまし / た。」 or 「5, / 026」. An opening bracket stays with what follows it, a closing one (and 、。・ー) with what
// precedes it: never 「…買いました（」 / 「9かいがら）」 or 「…植えられます」 / 「）」. Each phrase's numbers come apart (odd
// places) to be kept on one line even when a phrase is wider than the line, an opening bracket before one and a
// closing one after it kept with them.
const AT = /(?<=[、。！？!?])(?![）」』】〕〉》］)\]])|(?<=[ぁ-ゖ])(?=[^ぁ-ゖー、。！？!?・）」』】〕〉》］)\]])/;
const NUM = /([（「『【〔〈《［(\[]*\d(?:[\d,.]*\d)?[）」』】〕〉》］)\]]*)/;

export function phrases(text: string): string[][] {
  return text.split(AT).map((p) => p.split(NUM));
}

/** A name's parts (a food's: 「カップラーメン / （しょうゆ・ / レギュラー）」), the same shape: no particles to go by, so
 *  it breaks only before an opening bracket or ＋ and after ・ or a closing bracket (and at its spaces), never inside
 *  「しょうゆ味」; an opening bracket kept on one line with what follows (odd places, as a number). */
const NAME_AT = /(?<=[^\s（「『【〔〈《［(\[])(?=[（「『【〔〈《［(\[＋])|(?<=[・）」』】〕〉》］)\]])(?=[^\s・）」』】〕〉》］)\]])/;

/** NUM, and an opening bracket with the character after it (WebKit breaks after 「（」 even in keep-all). */
const NAME_NUM = /([（「『【〔〈《［(\[]*\d(?:[\d,.]*\d)?[）」』】〕〉》］)\]]*|[（「『【〔〈《［(\[]+[^\d（「『【〔〈《［(\[])/;

/** A long run of kanji and kana with nothing to break at (「豚骨醤油ラーメンスナック」) comes apart at its words
 *  (Intl.Segmenter: 「豚骨醤油 / ラーメン / スナック」), only where both sides are words, not a dictionary's crumbs: at a
 *  change of script between runs of 2+ (「にんにく / 豚骨」), else between words of 2+ (katakana 3+: never 「ハー / ゲン」).
 *  Without a segmenter: whole, as before. */
const RUN = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々]{8,}/gu;
const KANA = /^[\p{Script=Katakana}ー]+$/u;
const scriptOf = (c: string) => (/\p{Script=Han}|々/u.test(c) ? 'h' : /[\p{Script=Hiragana}]/u.test(c) ? 'k' : 'K');
let seg: Intl.Segmenter | null | undefined;
function words(p: string): string[] {
  seg ??= typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('ja', { granularity: 'word' }) : null;
  if (!seg) return [p];
  const cuts: number[] = [];
  for (const m of p.matchAll(RUN)) {
    const run = m[0], ws = [...seg.segment(run)].map((w) => w.segment);
    // (each character's script, ー taking its neighbour's: a run's length either side of a cut)
    const sc = [...run].map(scriptOf).map((c, i, a) => (run[i] === 'ー' && i ? a[i - 1] : c));
    const same = (i: number, d: 1 | -1) => {
      let n = 0;
      for (let j = d < 0 ? i - 1 : i; j >= 0 && j < sc.length && sc[j] === sc[d < 0 ? i - 1 : i]; j += d) n++;
      return n;
    };
    let at = 0;
    for (let w = 0; w < ws.length - 1; w++) {
      at += ws[w].length;
      const l = ws[w], r = ws[w + 1];
      const ok = sc[at - 1] !== sc[at] ? same(at, -1) >= 2 && same(at, 1) >= 2 : l.length >= 2 && r.length >= 2 && (!(KANA.test(l) && KANA.test(r)) || (l.length >= 3 && r.length >= 3));
      if (ok) cuts.push(m.index + at);
    }
  }
  return cuts.length ? [0, ...cuts].map((c, i, a) => p.slice(c, a[i + 1])) : [p];
}

const named = new Map<string, string[][]>();
export function nameParts(text: string): string[][] {
  let out = named.get(text);
  if (!out) {
    if (named.size > 4000) named.clear();
    named.set(text, (out = text.split(NAME_AT).flatMap(words).map((p) => p.split(NAME_NUM))));
  }
  return out;
}
