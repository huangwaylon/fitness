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

export function nameParts(text: string): string[][] {
  return text.split(NAME_AT).map((p) => p.split(NAME_NUM));
}
