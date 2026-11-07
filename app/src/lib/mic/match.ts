// What the mic heard against what was to be said (docs/kikimimi-mic.md §3.1). M0 has only the word error rate the probe
// computes on the phone; M3 adds the rest (content-word recall, choice matching, key phrases). Pure.

/** US contractions and reductions, folded to their full forms (both sides go through it: `gonna` = `going to`). */
const FOLD: readonly [RegExp, string][] = [
  [/\bgonna\b/g, 'going to'], [/\bwanna\b/g, 'want to'], [/\bgotta\b/g, 'got to'], [/\bkinda\b/g, 'kind of'],
  [/\bcan't\b/g, 'can not'], [/\bcannot\b/g, 'can not'], [/\bwon't\b/g, 'will not'], [/\bain't\b/g, 'is not'],
  [/n't\b/g, ' not'], [/'re\b/g, ' are'], [/'m\b/g, ' am'], [/'ll\b/g, ' will'], [/'ve\b/g, ' have'], [/'d\b/g, ' would'],
  [/\b(it|that|there|what|he|she|here|who|where|how|let)'s\b/g, '$1 is']
];
const FILLERS = new Set(['um', 'uh', 'er', 'erm', 'ah', 'hmm', 'mm', 'oh']);
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** A whole number under 100 as words (`45` → `forty five`); larger ones stay digits. */
const spell = (n: number): string => (n < 20 ? ONES[n] : n < 100 ? `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}` : String(n));

/** A sentence as words to compare: lower case, curly quotes straight, contractions and reductions folded, numbers under
 *  100 spelled, punctuation and fillers out. */
export function words(s: string): string[] {
  let x = s.toLowerCase().replace(/[‘’]/g, "'");
  for (const [re, to] of FOLD) x = x.replace(re, to);
  x = x.replace(/\d+/g, (d) => spell(Number(d))).replace(/-/g, ' ').replace(/[^a-z0-9' ]+/g, ' ').replace(/'/g, '');
  return x.split(/\s+/).filter((w) => w && !FILLERS.has(w));
}

/** The word error rate of `heard` against `said` (substitutions, deletions and insertions over the said words: 0 is
 *  perfect; it can pass 1). Nothing said: 0 if nothing heard, else 1. */
export function wer(said: string, heard: string): number {
  const a = words(said), b = words(heard);
  if (!a.length) return b.length ? 1 : 0;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length] / a.length;
}
