// ききみみ クイズ: what the neural TTS is given for an item (docs/kikimimi.md "Audio", docs/curriculum.md §9): its cast
// voice and the text to speak. Used by scripts/kikimimi-audio.ts and the tests only; never by the game (its clips are
// made already), so nothing in the client bundle imports this.
import { ROSTER } from '#lib/villagers/roster.ts';
import type { Accent, CastId, Item } from './bank.ts';
import { CAST } from './bank4.ts';

/** The cast's slots per accent and gender (18 voices, American first: every villager's voice is US; UK and AU only speak
 *  the やま/ほし accent-exposure items, docs/curriculum.md "American English first"). */
export const SLOTS: Readonly<Record<Accent, Readonly<Record<'f' | 'm', number>>>> = {
  us: { f: 6, m: 6 },
  uk: { f: 1, m: 2 },
  au: { f: 1, m: 2 }
};

/** Every cast voice id, in order (scripts/tts/cast.json has one entry each). */
export const CAST_IDS: readonly CastId[] = (Object.keys(SLOTS) as Accent[]).flatMap((a) =>
  (['f', 'm'] as const).flatMap((g) => Array.from({ length: SLOTS[a][g] }, (_, i) => `${a}-${g}${i + 1}` as CastId)));

/** FNV-1a, 32-bit: a stable small hash of a villager id. */
function fnv(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}

/** The cast voice that speaks an item: level 4's `cast`; else the speaker's voice (CAST) when its accent is the item's;
 *  else a voice of the item's accent and the speaker's gender picked by a stable hash of the speaker (so a villager
 *  keeps one voice per accent, and adding items never moves anyone's voice). */
export function castOf(it: Pick<Item, 'speaker' | 'voice' | 'cast'>): CastId {
  if (it.cast) return it.cast;
  const home = CAST[it.speaker];
  if (home && home.startsWith(`${it.voice}-`)) return home;
  const g = ROSTER[it.speaker].gender;
  return `${it.voice}-${g}${(fnv(it.speaker) % SLOTS[it.voice][g]) + 1}` as CastId;
}

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** 0-99 in words ("forty-seven"). */
function under100(n: number): string {
  return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '');
}

/** 0-999 in words; UK and AU say "and" after the hundreds ("one hundred and fifteen"), US doesn't. */
function under1000(n: number, and: boolean): string {
  const h = Math.floor(n / 100), r = n % 100;
  if (!h) return under100(r);
  return `${ONES[h]} hundred` + (r ? `${and ? ' and' : ''} ${under100(r)}` : '');
}

/** A whole number (0-999,999) as said: 1,100-1,900 in round hundreds as "fifteen hundred" (a price, as people say
 *  it), else thousands and hundreds ("nine thousand nine hundred"). */
export function numberWords(n: number, accent: Accent = 'us'): string {
  if (!Number.isInteger(n) || n < 0 || n > 999_999) throw new Error(`kikimimi: can't say ${n}`);
  const and = accent !== 'us';
  if (n > 1000 && n < 2000 && n % 100 === 0) return `${under100(n / 100)} hundred`;
  const th = Math.floor(n / 1000), r = n % 1000;
  if (!th) return under1000(r, and);
  return `${under1000(th, and)} thousand` + (r ? (r < 100 && and ? ` and ${under100(r)}` : ` ${under1000(r, and)}`) : '');
}

const ORD: Readonly<Record<string, string>> = {
  one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth'
};

/** An ordinal in words ("thirteenth", "thirty-first", "twenty-third"). */
export function ordinalWords(n: number, accent: Accent = 'us'): string {
  const w = numberWords(n, accent);
  return w.replace(/([a-z]+)$/, (last) => ORD[last] ?? (last.endsWith('y') ? `${last.slice(0, -1)}ieth` : `${last}th`));
}

/** Digits in a line written out as said (§9: never digits for the engine): ordinals (13th), clock times (2:15 "two
 *  fifteen", 7:05 "seven oh five", 3:00 "three o'clock") and whole numbers with or without thousands commas. Anything
 *  else with a digit (decimals, money signs) throws: write the item a `tts`. */
export function sayNumbers(text: string, accent: Accent = 'us'): string {
  const out = text
    .replace(/\b(\d{1,2}):(\d{2})\b/g, (_, h: string, m: string) =>
      `${numberWords(+h, accent)} ${m === '00' ? "o'clock" : m[0] === '0' ? `oh ${ONES[+m[1]]}` : under100(+m)}`)
    .replace(/\b(\d{1,3}(?:,\d{3})+|\d+)(st|nd|rd|th)\b/g, (_, d: string) => ordinalWords(+d.replace(/,/g, ''), accent))
    .replace(/(?<![\d.])(\d{1,3}(?:,\d{3})+|\d+)(?![\d.,]\d)/g, (d: string) => numberWords(+d.replace(/,/g, ''), accent));
  if (/\d/.test(out)) throw new Error(`kikimimi: can't say the numbers in "${text}": give it a tts`);
  return out;
}

/** What the engine speaks: `tts` (level 4's reductions and numbers, as written), else `en` with its numbers written out. */
export const spokenText = (it: Pick<Item, 'en' | 'tts' | 'voice'>): string => it.tts ?? sayNumbers(it.en, it.voice);
