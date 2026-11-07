// What the mic heard against what was to be said (docs/kikimimi-mic.md §3.1). Pure. Both sides go through the same
// normaliser (words): US contractions and reductions folded both ways (`gonna` = `going to`), numbers, times, money and
// ordinals read as words, the recogniser's tags (`[BLANK_AUDIO]`, `(laughs)`) and fillers out (scripts/tts/tts.py's
// normaliser, made for the clips' whisper gate, is where most of these come from). On top of it:
// - wer: the word error rate (M0's probe);
// - align / recall: which said words were heard, and the content words' hits (くりかえし);
// - choose: a spoken reply against the round's choices, lenient, with a margin (こたえて！: no choice is never ✗);
// - phrases: which key phrases a turn has (ロールプレイ, a bitmask);
// - candidate: which of two words was said (はつおん: whisper's scores, else the transcript).
// Nothing here keeps or logs what was heard.

/** US contractions and reductions, folded to their full forms, in order (the specific before the general). */
const FOLD: readonly [RegExp, string][] = [
  [/\bgonna\b/g, 'going to'], [/\bwanna\b/g, 'want to'], [/\bgotta\b/g, 'got to'], [/\bkinda\b/g, 'kind of'],
  [/\bsorta\b/g, 'sort of'], [/\blotta\b/g, 'lot of'], [/\blemme\b/g, 'let me'], [/\bgimme\b/g, 'give me'],
  [/\bdunno\b/g, 'do not know'], [/\b(should|would|could|must)a\b/g, '$1 have'], [/\bdidja\b/g, 'did you'],
  [/\bwhat'dja\b/g, 'what did you'], [/\bdon'tcha\b/g, 'do not you'], [/\bd'you\b/g, 'do you'], [/\bya\b/g, 'you'],
  [/\by'all\b/g, 'you all'], [/'em\b/g, 'them'], [/\s'n'\s/g, ' and '], [/'cause\b/g, 'because'], [/\bcuz\b/g, 'because'],
  [/\b(\w+)in'(?=\s|$|[,.?!])/g, '$1ing'], [/\blet's\b/g, 'let us'], [/\bain't\b/g, 'is not'],
  [/\bcan't\b/g, 'can not'], [/\bcannot\b/g, 'can not'], [/\bwon't\b/g, 'will not'], [/\bshan't\b/g, 'shall not'],
  [/n't\b/g, ' not'], [/'re\b/g, ' are'], [/'m\b/g, ' am'], [/'ll\b/g, ' will'], [/'ve\b/g, ' have'],
  // 's and 'd before a participle are has and had (he's been, I'd better); else is and would
  [/'s (been|got|gotten|had)\b/g, ' has $1'], [/'d (been|had|better|gotten|already|never|just)\b/g, ' had $1'],
  [/'d\b/g, ' would'], [/\b(it|that|there|what|he|she|here|who|where|how|this|everyone|everything|nothing|something)'s\b/g, '$1 is'],
  [/\bokay\b/g, 'ok'], [/\balright\b/g, 'all right'], [/\bo'clock\b/g, ''], [/\b([ap])\.m\.?/g, '$1m']
];
const FILLERS = new Set(['um', 'umm', 'uh', 'uhh', 'er', 'erm', 'ah', 'hm', 'hmm', 'mm', 'oh']);

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const BIG: readonly [number, string][] = [[1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand'], [100, 'hundred']];
const NUMBER_WORDS = new Set([...ONES, ...TENS.filter(Boolean), ...BIG.map(([, w]) => w)]);
const ORD: Record<string, string> = { one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth' };

/** A whole number as words (`45` → `forty five`, `380000` → `three hundred eighty thousand`). */
export function spell(n: number): string {
  if (!Number.isSafeInteger(n) || n < 0) return String(n);
  if (n < 20) return ONES[n];
  if (n < 100) return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`;
  for (const [v, w] of BIG) if (n >= v) return `${spell(Math.floor(n / v))} ${w}${n % v ? ` ${spell(n % v)}` : ''}`;
  return String(n);
}

/** A year as said (`1990` → `nineteen ninety`, `2005` → `two thousand five`, `2026` → `twenty twenty six`). */
function year(n: number): string {
  if (n >= 2000 && n < 2010) return spell(n);
  const hi = Math.floor(n / 100), lo = n % 100;
  return `${spell(hi)} ${lo === 0 ? 'hundred' : lo < 10 ? `oh ${ONES[lo]}` : spell(lo)}`;
}

/** An ordinal's word (`21` → `twenty first`). */
function ordinal(n: number): string {
  const w = spell(n).split(' '), last = w.pop()!;
  const o = ORD[last] ?? (last.endsWith('y') ? `${last.slice(0, -1)}ieth` : `${last}th`);
  return [...w, o].join(' ');
}

/** Digits in a lower-cased line read as words: money, percents, times, ordinals, decimals, years, plain numbers. */
function numbers(x: string): string {
  return x
    .replace(/(\d),(?=\d{3}\b)/g, '$1')
    .replace(/\$(\d+)(?:\.(\d{2}))?/g, (_, d: string, c?: string) => `${d} dollars${c && c !== '00' ? ` ${Number(c)} cents` : ''}`)
    .replace(/¥(\d+)/g, '$1 yen')
    .replace(/(\d+(?:\.\d+)?)\s*%/g, '$1 percent')
    .replace(/\b(\d{1,2}):(\d{2})\b/g, (_, h: string, m: string) => `${h}${m === '00' ? '' : Number(m) < 10 ? ` oh ${Number(m)}` : ` ${m}`}`)
    .replace(/\b(\d+)(st|nd|rd|th)\b/g, (_, d: string) => ordinal(Number(d)))
    .replace(/(\d)(?=[a-z])/g, '$1 ')
    .replace(/\b(\d+)\.(\d+)\b/g, (_, a: string, b: string) => `${a} point ${[...b].join(' ')}`)
    .replace(/\b(1[1-9]\d\d|20\d\d)\b(?!\s*(dollars|yen|percent))/g, (d: string) => year(Number(d)))
    .replace(/\d+/g, (d) => spell(Number(d)));
}

/** A sentence as words to compare: lower case, curly quotes straight, contractions and reductions folded, numbers as
 *  words, the recogniser's bracketed tags, punctuation and fillers out. */
export function words(s: string): string[] {
  let x = s.toLowerCase().replace(/[‘’ʼ]/g, "'").replace(/[\[(][^\])]*[\])]|♪/g, ' ');
  for (const [re, to] of FOLD) x = x.replace(re, to);
  x = numbers(x).replace(/[-–—/]/g, ' ').replace(/[^a-z' ]+/g, ' ').replace(/'/g, '');
  const w = x.split(/\s+/).filter((t) => t && !FILLERS.has(t));
  // "a hundred" is "one hundred", "one hundred and five" is "one hundred five"
  return w.map((t, i) => (t === 'a' && /^(hundred|thousand|million)$/.test(w[i + 1] ?? '') ? 'one' : t))
    .filter((t, i, a) => !(t === 'and' && /^(hundred|thousand|million)$/.test(a[i - 1] ?? '') && NUMBER_WORDS.has(a[i + 1] ?? '')));
}

// ---- alignment ----------------------------------------------------------------------------------------------------

type Eq = (a: string, b: string) => boolean;
const exact: Eq = (a, b) => a === b;

/** The edit-distance table of `a` against `b` (substitution, deletion, insertion each 1). `free`: `b`'s start and end
 *  cost nothing (where in `b` is `a` best found). */
function table(a: readonly string[], b: readonly string[], eq: Eq, free = false): number[][] {
  const d = [Array.from({ length: b.length + 1 }, (_, j) => (free ? 0 : j))];
  for (let i = 1; i <= a.length; i++) {
    const r = [i];
    for (let j = 1; j <= b.length; j++) r[j] = Math.min(d[i - 1][j] + 1, r[j - 1] + 1, d[i - 1][j - 1] + (eq(a[i - 1], b[j - 1]) ? 0 : 1));
    d.push(r);
  }
  return d;
}

const lev = (a: readonly string[], b: readonly string[], eq: Eq = exact): number => table(a, b, eq)[a.length][b.length];
/** The fewest edits that turn `a` into some stretch of `b`. */
const within = (a: readonly string[], b: readonly string[], eq: Eq): number => Math.min(...table(a, b, eq, true)[a.length]);

/** The word error rate of `heard` against `said` (substitutions, deletions and insertions over the said words: 0 is
 *  perfect; it can pass 1). Nothing said: 0 if nothing heard, else 1. */
export function wer(said: string, heard: string): number {
  const a = words(said), b = words(heard);
  if (!a.length) return b.length ? 1 : 0;
  return lev(a, b) / a.length;
}

/** Function words: what a content-word count leaves out (articles, pronouns, be and the auxiliaries, prepositions,
 *  conjunctions, discourse words). */
const MINOR = new Set(('a an the i me my you your he him his she her it its we us our they them their this that these those '
  + 'is am are was were be been being do does did have has had will would shall should can could may might must not '
  + 'to of in on at by for with from up about into over as than so and or but if then there here just well very really '
  + 'oh yeah ok').split(' '));

/** Whether a word is a content word (not in the function-word list). */
const content = (w: string): boolean => !MINOR.has(w);

export interface Aligned {
  /** Each said word (normalised) and whether it was heard in its place. */
  said: { w: string; ok: boolean }[];
  /** Words heard that weren't said (insertions). */
  extra: number;
}

/** The said words aligned to the heard (Levenshtein's backtrace): which were heard. */
export function align(said: string, heard: string): Aligned {
  const a = words(said), b = words(heard), d = table(a, b, exact);
  const out: { w: string; ok: boolean }[] = [];
  let i = a.length, j = b.length, extra = 0;
  while (i > 0 || j > 0) {
    const same = i > 0 && j > 0 && a[i - 1] === b[j - 1];
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (same ? 0 : 1)) out.push({ w: a[i - 1], ok: same }), i--, j--;
    else if (i > 0 && d[i][j] === d[i - 1][j] + 1) out.push({ w: a[i - 1], ok: false }), i--;
    else j--, extra++;
  }
  return { said: out.reverse(), extra };
}

/** The said sentence's content words heard in their place: `[hit, of]` (くりかえし's answer). No content word: all of
 *  its words count. */
export function recall(said: string, heard: string): [number, number] {
  const s = align(said, heard).said, c = s.filter((x) => content(x.w)), use = c.length ? c : s;
  return [use.filter((x) => x.ok).length, use.length];
}

// ---- lenient matching (replies, key phrases, candidates) ----------------------------------------------------------

const YES = new Set(['yes', 'yeah', 'yep', 'yup', 'sure']), NO = new Set(['no', 'nope', 'nah']);
/** A reply's words, leniently: yes and no however said, function words but `not` and the yes/no words out. */
function gist(s: string): string[] {
  return words(s).map((w) => (YES.has(w) ? 'yes' : NO.has(w) ? 'no' : w)).filter((w) => w === 'not' || w === 'yes' || w === 'no' || content(w));
}

/** Words the same leniently: equal, one a plural or -s form of the other, or (5+ letters) one letter apart. */
export function near(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.replace(/(es|s)$/, '') === b.replace(/(es|s)$/, '')) return true;
  if (Math.min(a.length, b.length) < 5 || Math.abs(a.length - b.length) > 1) return false;
  return lev([...a], [...b]) <= 1;
}

/** How well a heard reply says `choice`, 0–1: its gist against the reply's, whole or found inside it. */
function similar(choice: readonly string[], heard: readonly string[]): number {
  if (!choice.length || !heard.length) return 0;
  const whole = 1 - lev(choice, heard, near) / Math.max(choice.length, heard.length);
  // the choice said inside a longer reply ("yes, I'd love to, thanks"): a little less than said alone
  const inside = 1 - within(choice, heard, near) / choice.length - 0.1;
  // a bare yes or no answers the choice that starts with it ("nope" is "No, I don't.")
  const bare = heard.length === 1 && (heard[0] === 'yes' || heard[0] === 'no') && choice[0] === heard[0] ? 0.7 : 0;
  return Math.max(0, whole, inside, bare);
}

/** A reply is that choice at this similarity or more, and this far ahead of the next. */
const CHOOSE_MIN = 0.6, CHOOSE_MARGIN = 0.15;

/**
 * Which of the round's `choices` a spoken reply says: its index, or -1 when none clearly (the view says 「その 言い方も
 * 通じるかも」 and offers the choices to tap: never ✗). Lenient: contractions and numbers folded, function words, fillers
 * and yes/no wording aside, near-miss words equal; `scores` for each choice (0–1).
 */
export function choose(heard: string, choices: readonly string[]): { i: number; scores: number[] } {
  const h = gist(heard), scores = choices.map((c) => Math.round(similar(gist(c), h) * 1000) / 1000);
  const order = scores.map((s, i) => [s, i] as const).sort((a, b) => b[0] - a[0]);
  const [best, second] = [order[0], order[1]];
  const ok = !!best && best[0] >= CHOOSE_MIN && (!second || best[0] - second[0] >= CHOOSE_MARGIN);
  return { i: ok ? best[1] : -1, scores };
}

/** Whether `phrase` was said in `heard`: its words found in a stretch of the turn, one word in four allowed off. */
function hasPhrase(phrase: readonly string[], heard: readonly string[]): boolean {
  return phrase.length > 0 && within(phrase, heard, near) <= Math.floor(phrase.length / 4);
}

/** The key phrases a turn has, as a bitmask (bit i: `keys[i]`; at most 12 keys, ロールプレイ's answer). */
export function phrases(heard: string, keys: readonly string[]): number {
  const h = words(heard);
  return keys.slice(0, 12).reduce((m, k, i) => (hasPhrase(words(k), h) ? m | (1 << i) : m), 0);
}

/** whisper's candidate scores (mean token log-probabilities) this far apart are a clear pick. */
const CAND_MARGIN = 0.3;

/**
 * Which candidate word was said (はつおん): with whisper's per-candidate scores (`cand`) the higher, sure when it leads
 * by CAND_MARGIN; else from the transcript, sure when exactly one candidate's words are in it. `i` −1: unsure (the view
 * says 「判定が むずかしい ときは 聞いて 選んでね」).
 */
export function candidate(h: { text: string; cand?: readonly number[] }, cands: readonly string[]): { i: number; sure: boolean } {
  if (h.cand && h.cand.length === cands.length && cands.length > 1) {
    const order = h.cand.map((s, i) => [s, i] as const).sort((a, b) => b[0] - a[0]);
    return order[0][0] - order[1][0] >= CAND_MARGIN ? { i: order[0][1], sure: true } : { i: -1, sure: false };
  }
  const w = words(h.text);
  // exact words here: the pair differs by one sound, so a near miss is the other word. Both found: the longer, if one
  // holds the other (`can` is in `can not`)
  const found = cands.map((c, i) => ({ n: words(c).length, i })).filter(({ n, i }) => n > 0 && within(words(cands[i]), w, exact) === 0)
    .sort((a, b) => b.n - a.n);
  return found.length === 1 || (found.length > 1 && found[0].n > found[1].n) ? { i: found[0].i, sure: true } : { i: -1, sure: false };
}
