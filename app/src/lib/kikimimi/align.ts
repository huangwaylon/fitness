// まるごと 聞く's alignment check (docs/curriculum.md "Long listening"): how far what whisper heard in a line's clip is from
// the line's transcript, as a word error rate over both said the same way (numbers as words, case, punctuation, fillers
// and a word said twice aside: a real speaker's "I, I think" and "um" are in the clip, whisper drops some). The script
// (scripts/kikimimi-real.ts --align) writes each long line's into align.json; content/long.test holds each piece to the
// bounds. Pure.
import { numberWords, sayNumbers } from './speech.ts';

/** A piece's lines, weighted by their words: at most this WER. */
export const ALIGN_PIECE = 0.2;
/** Any one line of 4 words or more: at most this (a short one is whisper's guess at a breath). */
export const ALIGN_LINE = 0.6;

const FILLERS = new Set(['um', 'uh', 'umm', 'uhh', 'mm', 'mmm', 'hmm', 'hm', 'er', 'erm', 'ah', 'oh', 'mhm', 'uhhuh', 'mmhmm']);

/** Numbers as said: whisper's "6.30" and "$4.50" as a time or price is said ("six thirty", "four fifty"), money signs
 *  and percent aside; what sayNumbers can't say, each run of digits on its own. */
function said(s: string): string {
  const t = s.replace(/\$?\b(\d{1,2})\.(\d{2})\b/g, (_, a: string, b: string) => (b === '00' ? a : `${a}:${b}`)).replace(/[$%]/g, ' ');
  try {
    return sayNumbers(t);
  } catch {
    return t.replace(/\d+/g, (d) => (d.length <= 6 ? numberWords(+d) : d.split('').map((x) => numberWords(+x)).join(' ')));
  }
}

/** A text's words as compared: numbers said, lower case, letters and apostrophes, fillers out, a word said twice once. */
export function alignWords(s: string): string[] {
  const ws = said(s.replace(/[’‘]/g, "'")).toLowerCase().replace(/-/g, ' ').replace(/[^a-z'\s]/g, ' ').split(/\s+/).map((w) => w.replace(/^'+|'+$/g, '')).filter((w) => w && !FILLERS.has(w.replace(/'/g, '')));
  return ws.filter((w, i) => w !== ws[i - 1]);
}

/** The word error rate of `heard` against `en` (edits over en's words; en with none: 0). */
export function alignWer(en: string, heard: string): number {
  const a = alignWords(en), b = alignWords(heard);
  if (!a.length) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = row;
  }
  return prev[b.length] / a.length;
}
